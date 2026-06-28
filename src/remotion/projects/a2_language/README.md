# A2 English — story video pipeline

Assembly layer for the "Learn English through story (A2)" channel. Horizontal
**1920×1080 @ 30fps**. Remotion assembles finished assets (narration mp3 + AI
b-roll clips) into scenes with synced **karaoke captions**.

## Per-scene workflow

Each scene folder lives at `public/a2_language/<story>/sceneN/` and holds one
narration `.mp3`, the b-roll clip(s), and a `script.txt` (the exact narration —
ElevenLabs control tags like `[br0.6]` are stripped automatically).

1. **Word timings — forced alignment (accurate, recommended):**
   ```bash
   .venv-whisperx/bin/python scripts/transcribe_a2_whisperx.py public/a2_language/<story>/sceneN
   ```
   Force-aligns `script.txt` to the audio with WhisperX (wav2vec2), so caption
   wording is exactly the script and word timing is ~±20–50ms. Writes
   `captions.json` + `manifest.json` (duration, A/B split frame, any clip slowdown).
   One-time env: `uv venv --python 3.12 .venv-whisperx && uv pip install --python .venv-whisperx/bin/python whisperx`.

   _Fallback (no Python):_ `node scripts/transcribe-a2.mjs <sceneN>` uses
   Whisper.cpp ASR timestamps (jittery; needs proofreading).

2. **Proofread** the printed transcript against the script.

3. **Register** the scene in `lion_and_mouse/scenes.ts` with the printed
   `durationInFrames` / `splitFrame` (+ `clipBRate` if the script slowed a clip),
   then render:
   ```bash
   npx remotion render src/remotion/index.ts A2-Lion-SceneNN data/out/.../sceneNN_v1.mp4
   ```

## Components

- `shared.tsx` — the kit: `BrollPair` (Clip A→B, full brightness, optional
  single-clip + per-clip slowdown), `CaptionScrim`, `KaraokeCaptions`
  (sentence-per-page, gold marker-pill on the spoken word), `useCaptions`.
- `Scene.tsx` — the standard parameterized scene (1 mp3 + up to 2 clips +
  captions). Supports `audioLeadFrames` (cold open) and `captionFrames`
  (clear captions for a clean b-roll tail).
- `TwoSegmentScene.tsx` — both clips play whole, narration split into two parts
  placed in time (used when the b-roll, not the voice, sets scene length).
- `Thumbnail.tsx` — reusable 1280×720 still template (props: image, title,
  `titleFont`, side, sizes, badge).

## Conventions

- Lock **30fps** end to end (`timeMs = frame / fps * 1000`).
- B-roll at **full brightness**; readability comes from the caption scrim +
  text shadow, never global darkening.
- The two clips of a scene should together exceed the narration length; if they
  fall short, the pipeline slows the second clip slightly rather than freeze.
- Pin `remotion` / `@remotion/*` to one exact version.
- Media (`*.mp4`, `*.mp3`, scene `*.png`) is kept local, not committed; the
  small text artifacts (`script.txt`, `captions.json`, `manifest.json`) are.
