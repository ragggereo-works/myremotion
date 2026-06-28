import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FONT_FAMILY } from "../../../../brand";
import { CaptionScrim, KaraokeCaptions, useCaptions } from "../shared";

// ===========================================================================
// Scene 15 (extended) — closing scene with a long end-screen hold.
//   Phase 1 (0 → ~5.5s): read-along karaoke over the b-roll.
//   Phase 2 (~5.5 → 8.08s): captions clear, goodbye card fades in over live footage.
//   Phase 3 (8.08 → ~11s): b-roll's last frame FREEZES; goodbye card holds —
//     this calm hold is where the YouTube end screen sits.
//   Phase 4 (last ~2s): the whole frame fades to near-black for the close.
// ===========================================================================

const BROLL = "a2_language/lion_and_mouse/scene15/scene15A.mp4";
const FREEZE = "a2_language/lion_and_mouse/scene15/scene15_last.png";
const AUDIO = "a2_language/lion_and_mouse/scene15/scene15.mp3";
const CAPTIONS = "a2_language/lion_and_mouse/scene15/captions.json";

export const SCENE15EXT_DURATION = 392; // ~13.07s (8.08s footage + ~5s hold)

const VIDEO_END = 242; // b-roll plays full, then freezes
const PHASE1_END = 165; // captions clear ~5.5s
const CARD_IN = 165;
const CARD_FULL = 189; // ~0.8s fade
const DIM_START = 332; // fade-to-black only in the last ~2s
const DIM_MAX = 0.92;

const GoodbyeCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [CARD_IN, CARD_FULL], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < CARD_IN) return null;
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "16%",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          textAlign: "center",
          color: "#FFFFFF",
          textShadow: "0 2px 14px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)",
          lineHeight: 1.45,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700 }}>Thank you for listening.</div>
        <div style={{ fontSize: 40, fontWeight: 500, opacity: 0.95 }}>
          Subscribe for a new story soon.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene15Ext: React.FC = () => {
  const frame = useCurrentFrame();
  const captions = useCaptions(CAPTIONS);

  const dim = interpolate(frame, [DIM_START, SCENE15EXT_DURATION], [0, DIM_MAX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* B-roll plays full, full brightness, muted. */}
      <Sequence durationInFrames={VIDEO_END}>
        <OffthreadVideo
          src={staticFile(BROLL)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>
      {/* Then hold on the frozen last frame for the end-screen beat. */}
      <Sequence from={VIDEO_END}>
        <Img
          src={staticFile(FREEZE)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>

      {/* Phase 1: read-along captions, cleared before the hold. */}
      <Sequence from={0} durationInFrames={PHASE1_END}>
        <CaptionScrim />
        {captions ? <KaraokeCaptions captions={captions} /> : null}
      </Sequence>

      {/* Narration plays once, unmodified. */}
      <Audio src={staticFile(AUDIO)} />

      {/* Goodbye card — over live footage, then held through the freeze. */}
      <GoodbyeCard />

      {/* Movie-style fade-to-black, last ~2s only. */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: dim }} />
    </AbsoluteFill>
  );
};
