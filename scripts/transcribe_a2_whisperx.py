#!/usr/bin/env python3
"""
transcribe_a2_whisperx.py — accurate karaoke timings via FORCED ALIGNMENT.

Unlike Whisper ASR (which guesses the words and emits timestamps as a byproduct,
giving jittery word boundaries), this force-aligns the KNOWN script text to the
audio with WhisperX's wav2vec2 aligner. Word boundaries land ~±20-50ms instead
of ±100-300ms.

Same contract as scripts/transcribe-a2.mjs:
  - reads one *.mp3 + script.txt (+ two video clips) from a scene folder
  - strips ElevenLabs control tags ([br0.7] etc.) from the script
  - script.txt is the SOURCE OF TRUTH for wording; alignment only supplies timing
  - writes captions.json + manifest.json into the scene folder
  - prints the alignment for proofreading

USAGE (via the venv):
  .venv-whisperx/bin/python scripts/transcribe_a2_whisperx.py \
      public/a2_language/lion_and_mouse/scene2
"""

import sys
import os
import re
import json
import math
import subprocess

FPS = 30
TAIL_MS = 400
VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v"}


def clean_script(raw: str) -> str:
    # Strip [br0.7] / [pause] / any [ ... ] voice directives.
    s = re.sub(r"\[[^\]]*\]", " ", raw)
    return re.sub(r"\s+", " ", s).strip()


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def ffprobe_ms(path: str):
    try:
        out = subprocess.check_output(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=nw=1:nk=1", path,
            ]
        ).decode().strip()
        return round(float(out) * 1000)
    except Exception:
        return None


def lcs_map(a_words, b_words):
    """Map each script word (a) to an aligned word index (b) or -1."""
    a = [norm(w) for w in a_words]
    b = [norm(w) for w in b_words]
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            dp[i][j] = (dp[i + 1][j + 1] + 1) if a[i] == b[j] else max(dp[i + 1][j], dp[i][j + 1])
    res = [-1] * n
    i = j = 0
    while i < n and j < m:
        if a[i] == b[j]:
            res[i] = j
            i += 1
            j += 1
        elif dp[i + 1][j] >= dp[i][j + 1]:
            i += 1
        else:
            j += 1
    return res


def build_captions(script_words, aligned):
    """aligned: list of dicts {word,start,end} (seconds). Returns Caption[]."""
    amap = lcs_map(script_words, [a["word"] for a in aligned])
    caps = [{"text": w, "startMs": None, "endMs": None} for w in script_words]
    for k, wi in enumerate(amap):
        if wi >= 0 and aligned[wi].get("start") is not None and aligned[wi].get("end") is not None:
            caps[k]["startMs"] = round(aligned[wi]["start"] * 1000)
            caps[k]["endMs"] = round(aligned[wi]["end"] * 1000)

    known_start = next((c["startMs"] for c in caps if c["startMs"] is not None), 0)
    known_end = next((c["endMs"] for c in reversed(caps) if c["endMs"] is not None), 0)

    # Interpolate words the aligner missed, sharing the gap span evenly.
    for k in range(len(caps)):
        if caps[k]["startMs"] is not None:
            continue
        prev_end = known_start
        for p in range(k - 1, -1, -1):
            if caps[p]["endMs"] is not None:
                prev_end = caps[p]["endMs"]
                break
        next_start = known_end
        next_idx = len(caps)
        for q in range(k + 1, len(caps)):
            if caps[q]["startMs"] is not None:
                next_start = caps[q]["startMs"]
                next_idx = q
                break
        gap_start = k
        while gap_start > 0 and caps[gap_start - 1]["startMs"] is None:
            gap_start -= 1
        gap_count = next_idx - gap_start
        span = max(0, next_start - prev_end)
        slice_ = span / gap_count if gap_count else 0
        local = k - gap_start
        caps[k]["startMs"] = round(prev_end + slice_ * local)
        caps[k]["endMs"] = round(prev_end + slice_ * (local + 1))

    return [
        {
            "text": c["text"],
            "startMs": c["startMs"] or 0,
            "endMs": c["endMs"] or ((c["startMs"] or 0) + 200),
            "timestampMs": round(((c["startMs"] or 0) + (c["endMs"] or 0)) / 2),
            "confidence": None,
        }
        for c in caps
    ]


def pick_pause_frame(aligned, duration_frames):
    """The ideal cut: largest word-gap (a real pause) near the midpoint."""
    half = round(duration_frames / 2)
    if len(aligned) < 2:
        return half
    total_ms = duration_frames / FPS * 1000
    lo, hi = total_ms / 3, total_ms * 2 / 3
    best_gap, best_mid = -1, None
    for k in range(1, len(aligned)):
        gs = aligned[k - 1]["end"] * 1000
        ge = aligned[k]["start"] * 1000
        mid = (gs + ge) / 2
        if mid < lo or mid > hi:
            continue
        gap = ge - gs
        if gap > best_gap:
            best_gap, best_mid = gap, mid
    if best_mid is None or best_gap < 120:
        return half
    return round(best_mid / 1000 * FPS)


def compute_split_and_rates(aligned, duration_frames, clipA_s, clipB_s):
    """
    Pick a freeze-free A/B cut given the real clip lengths, preferring a natural
    pause. Returns (split_frame, clipARate, clipBRate). Clips never speed up
    (that reads as a fast camera move); a clip too short for its slot is slowed
    just enough to fill it.
    """
    N = duration_frames
    s_pause = pick_pause_frame(aligned, N)
    # Frames each clip can cover at normal speed.
    a_max = int(clipA_s * FPS)  # clip A covers [0, a_max] at rate 1
    b_cap = int(clipB_s * FPS)  # clip B covers b_cap frames at rate 1
    s_min = N - b_cap           # below this, clip B can't reach the end
    s_max = a_max               # above this, clip A would freeze
    if s_min <= s_max:
        # A feasible window exists with NO slowdown — snap the pause into it.
        s = max(s_min, min(s_pause, s_max))
        s = max(1, min(N - 1, s))
        return s, 1.0, 1.0
    # Clips together are shorter than the scene: cut at clip A's natural length
    # and slow clip B to fill the remainder.
    s = max(1, min(N - 1, s_max))
    spanB_s = (N - s) / FPS
    rateB = round(clipB_s / spanB_s, 4) if spanB_s > 0 else 1.0
    rateB = min(1.0, rateB)
    return s, 1.0, rateB


def process(scene_dir):
    import whisperx  # imported here so --help works without the heavy deps

    scene_dir = os.path.abspath(scene_dir)
    files = os.listdir(scene_dir)
    mp3 = next((f for f in files if f.lower().endswith(".mp3")), None)
    if not mp3:
        print(f"! {scene_dir}: no .mp3 — skipping.")
        return
    videos = sorted(f for f in files if os.path.splitext(f)[1].lower() in VIDEO_EXT)
    script_path = os.path.join(scene_dir, "script.txt")
    if not os.path.exists(script_path):
        print(f"! {scene_dir}: no script.txt — WhisperX forced alignment needs it. Skipping.")
        return

    mp3_path = os.path.join(scene_dir, mp3)
    script = clean_script(open(script_path, encoding="utf-8").read())
    script_words = [w for w in script.split(" ") if w]

    print(f"\n=== {scene_dir} ===")
    print(f"  audio : {mp3}")
    print(f"  script: {script}")

    device = "cpu"
    audio = whisperx.load_audio(mp3_path)
    dur_s = len(audio) / 16000.0
    model_a, metadata = whisperx.load_align_model(language_code="en", device=device)
    # One segment spanning the whole clip, carrying the full known text ->
    # wav2vec2 force-aligns every word against the audio.
    segments = [{"start": 0.0, "end": dur_s, "text": script}]
    result = whisperx.align(
        segments, model_a, metadata, audio, device, return_char_alignments=False
    )
    aligned = [
        {"word": w["word"], "start": w.get("start"), "end": w.get("end")}
        for w in result["word_segments"]
    ]

    captions = build_captions(script_words, aligned)

    audio_ms = ffprobe_ms(mp3_path)
    last_end = captions[-1]["endMs"] if captions else 0
    scene_ms = (audio_ms if audio_ms else last_end) + TAIL_MS
    duration_frames = math.ceil(scene_ms / 1000 * FPS)
    aligned_valid = [a for a in aligned if a.get("start") is not None and a.get("end") is not None]

    clipA_ms = ffprobe_ms(os.path.join(scene_dir, videos[0])) if len(videos) > 0 else None
    clipB_ms = ffprobe_ms(os.path.join(scene_dir, videos[1])) if len(videos) > 1 else None
    clipA_s = (clipA_ms or scene_ms) / 1000.0
    clipB_s = (clipB_ms or scene_ms) / 1000.0
    split_frame, clipA_rate, clipB_rate = compute_split_and_rates(
        aligned_valid, duration_frames, clipA_s, clipB_s
    )
    clips_total_s = clipA_s + clipB_s
    if clips_total_s + 0.05 < scene_ms / 1000.0:
        print(f"  ! clips total {clips_total_s:.2f}s < narration {scene_ms/1000:.2f}s "
              f"— clip B slowed to {clipB_rate} to avoid a freeze. For best results "
              f"give clips that together exceed the narration length.")

    with open(os.path.join(scene_dir, "captions.json"), "w") as f:
        json.dump(captions, f, indent=2)
    manifest = {
        "audio": mp3,
        "clipA": videos[0] if len(videos) > 0 else None,
        "clipB": videos[1] if len(videos) > 1 else None,
        "durationInFrames": duration_frames,
        "splitFrame": split_frame,
        "clipARate": clipA_rate,
        "clipBRate": clipB_rate,
        "audioDurationMs": audio_ms,
        "source": "whisperx forced alignment (script.txt)",
    }
    with open(os.path.join(scene_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    # Proofreading printout: word | start-end (ms)
    print("  aligned words (script text @ forced-aligned ms):")
    for c in captions:
        print(f"    {c['startMs']:>6}-{c['endMs']:<6}  {c['text']}")
    print(f"  -> durationInFrames={duration_frames}  splitFrame={split_frame}  "
          f"clipARate={clipA_rate}  clipBRate={clipB_rate}  "
          f"(clipA={manifest['clipA']}, clipB={manifest['clipB']})")
    print("  wrote captions.json + manifest.json")


def main():
    if len(sys.argv) < 2:
        print("Usage: transcribe_a2_whisperx.py <sceneDir | storyDir>")
        sys.exit(1)
    target = os.path.abspath(sys.argv[1])
    if not os.path.exists(target):
        print(f"Path not found: {target}")
        sys.exit(1)
    entries = os.listdir(target)
    has_mp3 = any(e.lower().endswith(".mp3") for e in entries)
    if has_mp3:
        process(target)
    else:
        for d in sorted(entries):
            full = os.path.join(target, d)
            if os.path.isdir(full):
                process(full)
    print("\nDone. Update scenes.ts with the printed durationInFrames/splitFrame, then render.")


if __name__ == "__main__":
    main()
