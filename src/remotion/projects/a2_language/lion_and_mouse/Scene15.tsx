import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FONT_FAMILY } from "../../../../brand";
import { CaptionScrim, KaraokeCaptions, useCaptions } from "../shared";

// ===========================================================================
// Scene 15 — closing scene. Full b-roll length (8.08s), NOT the audio length.
//   Phase 1 (0 → ~5.5s): read-along karaoke captions over the b-roll.
//   Phase 2 (~5.5s → 8.08s): captions clear, a goodbye card fades in upper-
//   center, and the whole frame dims to near-black for a movie-style close.
// B-roll is muted so the close is genuinely silent.
// ===========================================================================

const BROLL = "a2_language/lion_and_mouse/scene15/scene15A.mp4";
const AUDIO = "a2_language/lion_and_mouse/scene15/scene15.mp3";
const CAPTIONS = "a2_language/lion_and_mouse/scene15/captions.json";

export const SCENE15_DURATION = 242; // 8.08s — the full b-roll

const PHASE1_END = 165; // captions clear ~5.5s (after "Goodbye!")
const CARD_IN = 165;
const CARD_FULL = 189; // ~0.8s fade
const DIM_START = 200; // begin the slow fade-to-black
const DIM_MAX = 0.92; // near-black by the last frame

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

export const Scene15: React.FC = () => {
  const frame = useCurrentFrame();
  const captions = useCaptions(CAPTIONS);

  // Whole-frame slow dim to near-black over the final stretch.
  const dim = interpolate(frame, [DIM_START, SCENE15_DURATION], [0, DIM_MAX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* B-roll, full brightness, full scene length, muted (silent close). */}
      <OffthreadVideo
        src={staticFile(BROLL)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Phase 1: read-along captions, cleared before the close. */}
      <Sequence from={0} durationInFrames={PHASE1_END}>
        <CaptionScrim />
        {captions ? <KaraokeCaptions captions={captions} /> : null}
      </Sequence>

      {/* Narration plays once, unmodified. */}
      <Audio src={staticFile(AUDIO)} />

      {/* Phase 2: goodbye card (upper-center; lower-right + sides left clear
          for YouTube end-screen elements). */}
      <GoodbyeCard />

      {/* Movie-style fade-to-black over everything. */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: dim }} />
    </AbsoluteFill>
  );
};
