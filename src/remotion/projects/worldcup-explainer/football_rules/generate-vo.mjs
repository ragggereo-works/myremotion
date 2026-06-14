#!/usr/bin/env node
/*
 * ElevenLabs voiceover generator for the football_rules Short.
 *
 *   node src/remotion/projects/worldcup-explainer/football_rules/generate-vo.mjs Scene01 "<text>"
 *
 * - Reads ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID from the repo-root .env
 * - POSTs to the ElevenLabs TTS endpoint (model eleven_v3, mp3_44100_128)
 * - Saves canonical mp3 next to this project:  football_rules/shorts/SceneNN.mp3
 * - Copies it to public/football_rules/SceneNN.mp3 (staticFile can only serve
 *   from public/; namespaced so the previous project's SceneNN.mp3 stay intact)
 * - Measures exact duration with ffprobe and prints the durationInFrames per
 *   the frame rule: ceil((seconds + 0.3) * 30), or +0.8 for Scene05.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../../..");
const OUT_DIR = path.join(__dirname, "shorts");
const PUBLIC_DIR = path.join(ROOT, "public", "football_rules");
const FPS = 30;

const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

// --- args -------------------------------------------------------------------
const [scene, text] = process.argv.slice(2);
if (!scene || !text) fail('usage: node generate-vo.mjs <SceneNN> "<text>"');
if (!/^Scene\d{2}$/.test(scene))
  fail(`scene must look like Scene01..Scene99, got "${scene}"`);

// --- env --------------------------------------------------------------------
const envPath = path.join(ROOT, ".env");
if (!existsSync(envPath)) fail(".env not found at repo root");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      // keep only the first token — tolerates trailing notes like "key → main"
      const value = l
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
        .split(/[\s→]+/)[0];
      return [l.slice(0, i).trim(), value];
    }),
);
const apiKey = env.ELEVENLABS_API_KEY;
const voiceId = env.ELEVENLABS_VOICE_ID;
if (!apiKey) fail("ELEVENLABS_API_KEY missing from .env");
if (!voiceId) fail("ELEVENLABS_VOICE_ID missing from .env");

// --- ffprobe availability ----------------------------------------------------
try {
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
} catch {
  fail("ffprobe not found on PATH — install ffmpeg (brew install ffmpeg)");
}

// --- TTS request --------------------------------------------------------------
const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    text,
    model_id: "eleven_v3",
    voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.05 },
  }),
});
if (!res.ok) {
  const body = await res.text();
  fail(`ElevenLabs ${res.status}: ${body.slice(0, 400)}`);
}
const audio = Buffer.from(await res.arrayBuffer());

// --- save + copy ---------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(PUBLIC_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, `${scene}.mp3`);
writeFileSync(outFile, audio);
copyFileSync(outFile, path.join(PUBLIC_DIR, `${scene}.mp3`));

// --- measure -------------------------------------------------------------------
const seconds = parseFloat(
  execFileSync("ffprobe", [
    "-v",
    "quiet",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    outFile,
  ])
    .toString()
    .trim(),
);

const pad = scene === "Scene05" ? 0.8 : 0.3;
const frames = Math.ceil((seconds + pad) * FPS);

console.log(`✔ ${scene}.mp3 saved (${(audio.length / 1024).toFixed(0)} KB)`);
console.log(`  canonical : ${path.relative(ROOT, outFile)}`);
console.log(`  staticFile: football_rules/${scene}.mp3`);
console.log(`  duration  : ${seconds.toFixed(3)}s`);
console.log(`  frames    : ${frames}  (= ceil((${seconds.toFixed(3)} + ${pad}) * ${FPS}))`);
