#!/usr/bin/env node
// ===========================================================================
// transcribe-a2.mjs — build karaoke captions for an A2 story scene.
//
// WHAT IT DOES (per the project brief):
//   1. Resamples the scene's narration mp3 -> 16kHz 16-bit WAV (Whisper needs this).
//   2. Runs Whisper.cpp (token-level timestamps + --dtw) to get WORD TIMINGS.
//   3. Realigns those timings onto the EXACT SCRIPT TEXT (script.txt) so a
//      Whisper mishearing never changes a caption word — Whisper is used for
//      timing only, the wording comes from the script. (Falls back to raw
//      Whisper text, with a loud warning, if no script.txt is present.)
//   4. Writes  captions.json  + manifest.json  into the scene folder.
//   5. Prints the transcript + aligned captions for HUMAN PROOFREADING.
//
// USAGE:
//   node scripts/transcribe-a2.mjs public/a2_language/lion_and_mouse/scene1
//   node scripts/transcribe-a2.mjs public/a2_language/lion_and_mouse   # all sceneN/ subfolders
//
// Each scene folder must contain: one *.mp3 + two video clips (Clip A, Clip B
// in filename order) + optionally script.txt (the exact caption sentence(s)).
// ===========================================================================

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const FPS = 30;
const WHISPER_VERSION = "1.5.5";
const WHISPER_MODEL = "medium.en"; // accurate English; good A2 word boundaries
const TAIL_MS = 400; // small breath after the last word before the scene ends

const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");

const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".m4v"]);

// ---------- helpers --------------------------------------------------------

// Strip ElevenLabs control tags ([br0.6], [pause], [sigh], etc.) and any other
// bracketed directives from the script — these drive the VOICE, not the caption.
const cleanScript = (raw) =>
  raw
    .replace(/\[[^\]]*\]/g, " ") // remove [ ... ] tags
    .replace(/\s+/g, " ")
    .trim();

const norm = (w) =>
  w
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9']/g, "");

function ffprobeDurationMs(file) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 ${JSON.stringify(
        file,
      )}`,
    )
      .toString()
      .trim();
    const sec = parseFloat(out);
    return Number.isFinite(sec) ? Math.round(sec * 1000) : null;
  } catch {
    return null;
  }
}

// LCS alignment: map each SCRIPT word to a whisper token index (or -1 if the
// script word has no matching whisper token). Whisper timings then drive the
// script words; unmatched script words get interpolated timing.
function alignScriptToWhisper(scriptWords, whisperWords) {
  const a = scriptWords.map((w) => norm(w));
  const b = whisperWords.map((w) => norm(w.text));
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const map = new Array(n).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      map[i] = j;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return map;
}

// Build Caption[] using script wording + whisper timings.
function buildAlignedCaptions(scriptWords, whisperWords) {
  const map = alignScriptToWhisper(scriptWords, whisperWords);
  const captions = scriptWords.map((word) => ({
    text: word,
    startMs: null,
    endMs: null,
  }));

  // Fill matched timings.
  for (let k = 0; k < scriptWords.length; k++) {
    const wi = map[k];
    if (wi >= 0) {
      captions[k].startMs = whisperWords[wi].startMs;
      captions[k].endMs = whisperWords[wi].endMs;
    }
  }

  // Interpolate gaps (script words Whisper missed) and clamp the edges.
  const firstKnown = captions.find((c) => c.startMs != null);
  const lastKnown = [...captions].reverse().find((c) => c.endMs != null);
  const fallbackStart = firstKnown ? firstKnown.startMs : 0;
  const fallbackEnd = lastKnown ? lastKnown.endMs : 0;

  for (let k = 0; k < captions.length; k++) {
    if (captions[k].startMs != null) continue;
    // find previous known end and next known start
    let prevEnd = fallbackStart;
    for (let p = k - 1; p >= 0; p--) {
      if (captions[p].endMs != null) {
        prevEnd = captions[p].endMs;
        break;
      }
    }
    let nextStart = fallbackEnd;
    let nextIdx = captions.length;
    for (let q = k + 1; q < captions.length; q++) {
      if (captions[q].startMs != null) {
        nextStart = captions[q].startMs;
        nextIdx = q;
        break;
      }
    }
    // count consecutive unknowns in this gap to share the span evenly
    let gapStart = k;
    while (gapStart > 0 && captions[gapStart - 1].startMs == null) gapStart--;
    const gapCount = nextIdx - gapStart;
    const span = Math.max(0, nextStart - prevEnd);
    const slice = gapCount > 0 ? span / gapCount : 0;
    const localIdx = k - gapStart;
    captions[k].startMs = Math.round(prevEnd + slice * localIdx);
    captions[k].endMs = Math.round(prevEnd + slice * (localIdx + 1));
  }

  return captions.map((c) => ({
    text: c.text,
    startMs: c.startMs ?? 0,
    endMs: c.endMs ?? (c.startMs ?? 0) + 200,
    timestampMs: Math.round(((c.startMs ?? 0) + (c.endMs ?? 0)) / 2),
    confidence: null,
  }));
}

// Pick the A/B cut frame: the largest inter-word silence in the middle third
// of the narration (a natural pause). Fallback: halfway.
function pickSplitFrame(whisperWords, durationInFrames) {
  const half = Math.round(durationInFrames / 2);
  if (whisperWords.length < 2) return half;
  const totalMs = (durationInFrames / FPS) * 1000;
  const lo = totalMs / 3;
  const hi = (totalMs * 2) / 3;
  let bestGap = -1;
  let bestMidMs = null;
  for (let k = 1; k < whisperWords.length; k++) {
    const gapStart = whisperWords[k - 1].endMs;
    const gapEnd = whisperWords[k].startMs;
    const mid = (gapStart + gapEnd) / 2;
    if (mid < lo || mid > hi) continue;
    const gap = gapEnd - gapStart;
    if (gap > bestGap) {
      bestGap = gap;
      bestMidMs = mid;
    }
  }
  if (bestMidMs == null || bestGap < 120) return half; // no clear beat
  return Math.round((bestMidMs / 1000) * FPS);
}

// ---------- per-scene processing ------------------------------------------

async function processScene(sceneDirInput) {
  // Whisper is spawned with a different cwd, so all paths handed to it must be
  // absolute.
  const sceneDir = path.resolve(sceneDirInput);
  const files = fs.readdirSync(sceneDir);
  const mp3 = files.find((f) => f.toLowerCase().endsWith(".mp3"));
  if (!mp3) {
    console.warn(`! ${sceneDir}: no .mp3 found — skipping.`);
    return;
  }
  const videos = files
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .sort();
  if (videos.length < 2) {
    console.warn(
      `! ${sceneDir}: found ${videos.length} video clip(s), expected 2 (Clip A, Clip B). Captions will still build.`,
    );
  }

  const mp3Path = path.join(sceneDir, mp3);
  const wavPath = path.join(sceneDir, "_whisper16k.wav");

  console.log(`\n=== ${sceneDir} ===`);
  console.log(`  audio: ${mp3}`);

  // 1. Resample to 16kHz 16-bit mono WAV.
  execSync(
    `ffmpeg -y -i ${JSON.stringify(mp3Path)} -ar 16000 -ac 1 -c:a pcm_s16le ${JSON.stringify(
      wavPath,
    )}`,
    { stdio: "ignore" },
  );

  // 2. Whisper transcribe (token-level timestamps + DTW for tight word times).
  const whisperCppOutput = await transcribe({
    model: WHISPER_MODEL,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    inputPath: wavPath,
    tokenLevelTimestamps: true,
    onProgress: () => {},
  });

  const { captions: whisperCaptions } = toCaptions({ whisperCppOutput });
  const whisperWords = whisperCaptions.map((c) => ({
    text: c.text.trim(),
    startMs: c.startMs,
    endMs: c.endMs,
  }));
  const whisperTranscript = whisperWords.map((w) => w.text).join(" ");

  // 3. Realign onto script text if present.
  const scriptPath = path.join(sceneDir, "script.txt");
  let captions;
  let usedScript = false;
  if (fs.existsSync(scriptPath)) {
    const scriptRaw = cleanScript(fs.readFileSync(scriptPath, "utf8"));
    // whitespace-sensitive: each word carries a leading space (see shared.tsx)
    const scriptWords = scriptRaw
      .split(/\s+/)
      .filter(Boolean)
      .map((w, idx) => (idx === 0 ? w : " " + w));
    captions = buildAlignedCaptions(scriptWords, whisperWords);
    usedScript = true;
  } else {
    console.warn(
      `  ! no script.txt — using RAW Whisper text. PROOFREAD against the script before rendering.`,
    );
    captions = whisperCaptions.map((c) => ({ ...c, confidence: c.confidence ?? null }));
  }

  // 4. Durations.
  const audioMs = ffprobeDurationMs(mp3Path);
  const lastEnd = captions.length ? captions[captions.length - 1].endMs : 0;
  const sceneMs = (audioMs ?? lastEnd) + TAIL_MS;
  const durationInFrames = Math.ceil((sceneMs / 1000) * FPS);
  const splitFrame = pickSplitFrame(whisperWords, durationInFrames);

  // 5. Write outputs.
  fs.writeFileSync(
    path.join(sceneDir, "captions.json"),
    JSON.stringify(captions, null, 2),
  );
  const manifest = {
    audio: mp3,
    clipA: videos[0] ?? null,
    clipB: videos[1] ?? null,
    durationInFrames,
    splitFrame,
    audioDurationMs: audioMs,
    source: usedScript ? "script.txt (aligned to whisper timing)" : "raw whisper",
    model: WHISPER_MODEL,
  };
  fs.writeFileSync(
    path.join(sceneDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // cleanup temp wav
  fs.rmSync(wavPath, { force: true });

  // 6. Proofreading printout.
  console.log(`  whisper heard : ${whisperTranscript}`);
  if (usedScript) {
    console.log(`  caption text  : ${captions.map((c) => c.text).join("")}`);
  }
  console.log(
    `  -> durationInFrames=${durationInFrames}  splitFrame=${splitFrame}  (clipA=${manifest.clipA}, clipB=${manifest.clipB})`,
  );
  console.log(`  wrote captions.json + manifest.json`);
}

// ---------- entry ----------------------------------------------------------

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error(
      "Usage: node scripts/transcribe-a2.mjs <sceneDir | storyDir>",
    );
    process.exit(1);
  }
  if (!fs.existsSync(target)) {
    console.error(`Path not found: ${target}`);
    process.exit(1);
  }

  // One-time Whisper install + model download.
  console.log("Installing Whisper.cpp (one-time) ...");
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR });

  // Decide: single scene dir (has an mp3) or a story dir (has sceneN/ subdirs).
  const entries = fs.readdirSync(target, { withFileTypes: true });
  const hasMp3Here = entries.some(
    (e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3"),
  );
  if (hasMp3Here) {
    await processScene(target);
  } else {
    const sceneDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => path.join(target, e.name))
      .sort();
    if (!sceneDirs.length) {
      console.error(`No mp3 and no scene subfolders in ${target}.`);
      process.exit(1);
    }
    for (const dir of sceneDirs) {
      await processScene(dir);
    }
  }

  console.log("\nDone. Paste durationInFrames/splitFrame into scenes.ts (or wire the manifest), then preview in Studio.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
