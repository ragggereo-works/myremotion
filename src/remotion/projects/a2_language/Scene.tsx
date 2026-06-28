import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import {
  BrollPair,
  CaptionScrim,
  KaraokeCaptions,
  useCaptions,
  Audio,
} from "./shared";

// ===========================================================================
// One A2 story scene = 1 narration mp3 + 2 b-roll clips + karaoke captions.
// The SAME component renders every scene; only the SceneConfig data changes.
// ===========================================================================

export type SceneConfig = {
  /** Public-relative path to the narration mp3, e.g. "a2_language/lion_and_mouse/scene1/voice.mp3". */
  audio: string;
  /** Public-relative path to Clip A (plays first). */
  clipA: string;
  /** Public-relative path to Clip B (plays second). Omit for a single-clip scene. */
  clipB?: string;
  /** Public-relative path to the captions JSON (written by scripts/transcribe-a2.mjs). */
  captions: string;
  /** Total scene length in frames @30fps (from the transcribe manifest). */
  durationInFrames: number;
  /** Frame at which Clip A cuts to Clip B (a natural pause; default ~halfway). */
  splitFrame: number;
  /** B-roll ambient/sfx level under the narration (0–1). Defaults to 0.20. */
  brollVolume?: number;
  /** Per-clip playback rate (<1 slows a clip to fill its slot; never freeze). */
  clipARate?: number;
  clipBRate?: number;
  /** Delay before narration + captions start (frames). Lets b-roll open cold. */
  audioLeadFrames?: number;
  /** Spoken length of the narration (frames). If set, captions clear after it
   *  (+ a short tail) so the b-roll plays clean at the end. */
  captionFrames?: number;
};

const CAPTION_TAIL = 18;

export const Scene: React.FC<SceneConfig> = ({
  audio,
  clipA,
  clipB,
  captions,
  durationInFrames,
  splitFrame,
  brollVolume,
  clipARate,
  clipBRate,
  audioLeadFrames = 0,
  captionFrames,
}) => {
  const captionData = useCaptions(captions);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 1. B-roll bed at full brightness (A then B). */}
      <BrollPair
        clipA={clipA}
        clipB={clipB}
        splitFrame={splitFrame}
        durationInFrames={durationInFrames}
        volume={brollVolume}
        clipARate={clipARate}
        clipBRate={clipBRate}
      />

      {/* 2. Localized scrim behind the caption band only. */}
      <CaptionScrim />

      {/* 3. Karaoke caption strip (whole sentence; active word in gold).
            Offset by the lead-in; optionally bounded so it clears for a clean
            b-roll tail. */}
      <Sequence
        from={audioLeadFrames}
        durationInFrames={captionFrames ? captionFrames + CAPTION_TAIL : undefined}
      >
        {captionData ? <KaraokeCaptions captions={captionData} /> : null}
      </Sequence>

      {/* 4. Narration on top, unmodified — starts after the lead-in. */}
      <Sequence from={audioLeadFrames}>
        <Audio src={staticFile(audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};
