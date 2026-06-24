#!/usr/bin/env node
/**
 * generate-vo.mjs — Late to the Game VO helper
 *
 * Generates one scene's voiceover via the ElevenLabs API, saves it to
 * public/SceneNN.mp3, then measures the exact duration with ffprobe and prints
 * the duration + the Remotion frame count.
 *
 * Usage:
 *   node scripts/generate-vo.mjs Scene01 "The narration text, verbatim."
 *   node scripts/generate-vo.mjs Scene05 "Last scene text." --end   # uses 0.8s tail
 *
 * Requires in .env:
 *   ELEVENLABS_API_KEY=...
 *   ELEVENLABS_VOICE_ID=...
 * Requires ffprobe (part of ffmpeg) on PATH.
 *
 * Budget note: each run = one ElevenLabs API call and spends character quota.
 * Do NOT loop this or auto-retry without asking the human.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// --- tiny .env loader (no dependency) ---
// Tolerates trailing notes after a value (e.g. `KEY=sk_xxx → main account`):
// only the first whitespace/arrow-delimited token is kept.
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].replace(/^["']|["']$/g, "").split(/[\s→]+/)[0];
    if (val && !process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnv();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const FPS = 30;

const [, , sceneId, text, ...flags] = process.argv;
const isEnd = flags.includes("--end");
const tail = isEnd ? 0.8 : 0.3;

if (!API_KEY || !VOICE_ID) {
  console.error("Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env");
  process.exit(1);
}
if (!sceneId || !text) {
  console.error('Usage: node scripts/generate-vo.mjs Scene01 "narration text" [--end]');
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${sceneId}.mp3`);

console.log(`[generate-vo] ${sceneId}: ${text.length} chars (this spends ElevenLabs quota)`);

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_v3",
      voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true },
    }),
  }
);

if (!res.ok) {
  console.error(`[generate-vo] API error ${res.status}: ${await res.text()}`);
  console.error("Stopping. Do not auto-retry — check the key/voice/quota and ask the human.");
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(outPath, buf);

// measure
let seconds;
try {
  seconds = parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outPath}"`
    ).toString().trim()
  );
} catch (e) {
  console.error("[generate-vo] ffprobe failed — is ffmpeg installed?", e.message);
  process.exit(1);
}

const frames = Math.ceil((seconds + tail) * FPS);
console.log(`[generate-vo] saved ${outPath}`);
console.log(`[generate-vo] measured: ${seconds.toFixed(3)}s  | tail ${tail}s  | durationInFrames = ${frames} @${FPS}fps`);
console.log(`\nUse in Remotion:  <Composition id="${sceneId}" durationInFrames={${frames}} fps={${FPS}} .../>`);
