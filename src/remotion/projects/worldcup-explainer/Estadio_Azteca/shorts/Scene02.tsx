import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Loop,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP } from "../../../../../brand";
import { BRollBed, MemoryLook, SourceChip, seededNoise } from "./shared";

/*
 * SCENE 2 — 1986: The Hand of God. (459 frames @ 30fps, 1080x1920)
 * VO: Scene02.mp3 from frame 0 (15.0s).
 * Memory treatment. vintage_ball_v.mp4 is 361 frames -> looped.
 *
 * Beats:
 *   0-40    giant "1986" stamps in with decaying film jitter
 *   20-80   "ARGENTINA v ENGLAND · QUARTER-FINAL" types on
 *   150-280 jumping silhouette rises, freezes at apex (~200), pop circle
 *           draws around the fist, ✋ flashes 2 frames on the punch word
 *   ~340+   everything dips to 15%; "THE HAND OF GOD" lands alone, gold
 */

export const SCENE02_DURATION = 459;
const BALL_CLIP_FRAMES = 361;

// VO sync: the pause before "The Hand of God" lands ~11-12s. Adjust here.
const HAND_OF_GOD_AT = 340;
const DIP_START = HAND_OF_GOD_AT - 10;

// punch-word moment inside the silhouette beat (global frame)
const PUNCH_AT = 210;

// ---------------------------------------------------------------------------
// Giant year with deterministic film-frame jitter, decaying to zero by frame 60.
// ---------------------------------------------------------------------------
const YearStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const jitterAmp = interpolate(frame, [0, 60], [2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const jx = (seededNoise(21, frame, 0) - 0.5) * 2 * jitterAmp;
  const jy = (seededNoise(22, frame, 1) - 0.5) * 2 * jitterAmp;
  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 200,
        fontWeight: 900,
        color: BRAND.ink,
        textAlign: "center",
        lineHeight: 1,
        transform: `translate(${jx}px, ${jy}px) scale(${interpolate(stamp, [0, 1], [1.2, 1])})`,
        opacity: stamp,
        textShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}
    >
      1986
    </div>
  );
};

// ---------------------------------------------------------------------------
// Character-by-character typewriter, frames 20-80.
// ---------------------------------------------------------------------------
const TYPED_TEXT = "ARGENTINA v ENGLAND · QUARTER-FINAL";

const TypeOn: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.floor(
    interpolate(frame, [20, 80], [0, TYPED_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: "0.22em",
        color: BRAND.ink,
        opacity: 0.7,
        textAlign: "center",
        minHeight: 34,
      }}
    >
      {TYPED_TEXT.slice(0, chars)}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Generic jumping-player silhouette (stylized SVG figure — no real likeness).
// Local frames: rises 0-50, frozen at apex from 50; circle draws from ~55.
// ---------------------------------------------------------------------------
const SilhouetteBeat: React.FC = () => {
  const frame = useCurrentFrame(); // local to Sequence (from=150)
  const { width, height } = useVideoConfig();

  const figW = width * 0.46;
  const figH = figW * 1.5;

  // rise from below the frame, freeze at apex at local 50 (global 200)
  const top = interpolate(frame, [0, 50], [height, height * 0.33], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // pop circle around the fist draws on after the freeze
  const circleDraw = interpolate(frame, [55, 85], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // ✋ flashes for exactly 2 frames at the punch word
  const punchLocal = PUNCH_AT - 150;
  const handVisible = frame === punchLocal || frame === punchLocal + 1;

  // beat fades out at the end of its window
  const fade = interpolate(frame, [115, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        transform: "translateX(-50%)",
        opacity: fade,
      }}
    >
      <svg width={figW} height={figH} viewBox="0 0 200 300">
        {/* head */}
        <circle cx={100} cy={42} r={21} fill={BRAND.ink} />
        {/* torso */}
        <path
          d="M84 68 Q100 58 116 68 L120 152 Q100 166 80 152 Z"
          fill={BRAND.ink}
        />
        {/* raised punching arm */}
        <path
          d="M112 76 L152 30"
          stroke={BRAND.ink}
          strokeWidth={16}
          strokeLinecap="round"
        />
        <circle cx={156} cy={25} r={13} fill={BRAND.ink} />
        {/* trailing arm */}
        <path
          d="M88 80 L56 124"
          stroke={BRAND.ink}
          strokeWidth={15}
          strokeLinecap="round"
        />
        {/* legs mid-jump */}
        <path
          d="M92 158 L68 214 L82 252"
          stroke={BRAND.ink}
          strokeWidth={17}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M108 158 L132 204 L120 254"
          stroke={BRAND.ink}
          strokeWidth={17}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* pop circle around the fist area */}
        <circle
          cx={156}
          cy={25}
          r={36}
          fill="none"
          stroke={BRAND.pop}
          strokeWidth={6}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={circleDraw}
        />
      </svg>
      {/* hand glyph flash */}
      {handVisible && (
        <div
          style={{
            position: "absolute",
            left: figW * 0.78,
            top: figH * 0.02,
            fontSize: figW * 0.18,
            transform: "translate(-50%,-50%)",
          }}
        >
          ✋
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// "THE HAND OF GOD" — lands alone, gold, slow scale 0.96→1.0, hold to end.
// ---------------------------------------------------------------------------
const HandOfGodTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const inOpacity = interpolate(
    frame,
    [HAND_OF_GOD_AT, HAND_OF_GOD_AT + 22],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(
    frame,
    [HAND_OF_GOD_AT, durationInFrames - 10],
    [0.96, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: width * 0.054,
          fontWeight: 900,
          letterSpacing: "0.22em",
          textAlign: "center",
          color: BRAND.gold,
          opacity: inOpacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 ${width * 0.04}px rgba(255,209,102,0.35), 0 8px 40px rgba(0,0,0,0.6)`,
        }}
      >
        THE HAND OF GOD
      </div>
    </AbsoluteFill>
  );
};

export const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // everything except the title (and chip) dips to 15% for the title beat
  const dip = interpolate(frame, [DIP_START, DIP_START + 20], [1, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("Scene02.mp3")} />

      <AbsoluteFill style={{ opacity: dip }}>
        {/* looped vintage ball bed at ~20% */}
        <Loop durationInFrames={BALL_CLIP_FRAMES}>
          <BRollBed src="vintage_ball_v.mp4" opacity={0.2} />
        </Loop>

        {/* year + typed matchup — top of safe zone */}
        <div
          style={{
            position: "absolute",
            top: SAFE_TOP + height * 0.04,
            left: width * 0.125,
            right: width * 0.125,
            display: "flex",
            flexDirection: "column",
            gap: height * 0.014,
          }}
        >
          <YearStamp />
          <TypeOn />
        </div>

        {/* silhouette beat */}
        <Sequence from={150} durationInFrames={130} layout="none">
          <SilhouetteBeat />
        </Sequence>
      </AbsoluteFill>

      <HandOfGodTitle />

      <SourceChip
        text="1986 QF · Argentina 2-1 England · ESPN/FIFA"
        fadeInAt={30}
      />

      <MemoryLook seed={2} />
    </AbsoluteFill>
  );
};
