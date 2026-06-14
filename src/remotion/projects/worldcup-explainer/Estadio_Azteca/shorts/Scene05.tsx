import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY } from "../../../../../brand";
import { BRollBed, MemoryLook, seededNoise } from "./shared";

/*
 * SCENE 5 — THE TRANSITION: past snaps to present. (354 frames @ 30fps)
 * VO: Scene05.mp3 from frame 0 (10.9s). CLEAN modern look — the memory
 * treatment dissolves away in the first 15 frames and never returns.
 *
 * Beats:
 *   0-15    grain + warm tint dissolve to zero, revealing the clean look
 *   20-110  floodlights b-roll window at ~20%, fading at both edges
 *   ~40     "2026 STARTS HERE" pops in centered (overshoot)
 *   200-330 FOLLOW button pops + pip "World Cup for newcomers — Part 1"
 *   330-354 end-card hold (clean loop point back into Scene 1's dark open)
 */

export const SCENE05_DURATION = 354;

const TITLE_AT = 40;
const FOLLOW_AT = 200;

// ---------------------------------------------------------------------------
// Clean-look particle field — ~120 teal/ink dots drifting on sine offsets.
// Deterministic; never static.
// ---------------------------------------------------------------------------
const ParticleField: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const N = 120;
  return (
    <AbsoluteFill>
      {Array.from({ length: N }).map((_, i) => {
        const baseX = seededNoise(51, i, 0) * width;
        const baseY = seededNoise(52, i, 1) * height;
        const fx = 0.012 + seededNoise(53, i, 2) * 0.014;
        const fy = 0.009 + seededNoise(54, i, 3) * 0.012;
        const ph = seededNoise(55, i, 4) * Math.PI * 2;
        const x = baseX + Math.sin(frame * fx + ph) * 26;
        const y = baseY + Math.cos(frame * fy + ph) * 20;
        const sz = 2 + seededNoise(56, i, 5) * 3.5;
        const teal = seededNoise(57, i, 6) > 0.4;
        const tw = 0.5 + 0.5 * Math.sin(frame * 0.05 + ph);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: sz,
              height: sz,
              borderRadius: "50%",
              background: teal ? BRAND.teal : BRAND.ink,
              opacity: 0.1 + tw * 0.3,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// "2026 STARTS HERE" — pop with overshoot at ~40.
// ---------------------------------------------------------------------------
const TitlePop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = interpolate(
    frame,
    [TITLE_AT, TITLE_AT + 7, TITLE_AT + 12],
    [0.82, 1.12, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = interpolate(frame, [TITLE_AT, TITLE_AT + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.125,
        right: width * 0.125,
        top: height * 0.4,
        textAlign: "center",
        fontFamily: FONT_FAMILY,
        fontSize: width * 0.075,
        fontWeight: 900,
        letterSpacing: "0.03em",
        color: BRAND.ink,
        transform: `scale(${scale})`,
        opacity,
        textShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ color: BRAND.gold }}>2026</span> STARTS HERE
    </div>
  );
};

// ---------------------------------------------------------------------------
// FOLLOW button + pip — pops at ~200, holds to end.
// ---------------------------------------------------------------------------
const FollowPrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = interpolate(
    frame,
    [FOLLOW_AT, FOLLOW_AT + 9, FOLLOW_AT + 16],
    [0.55, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = interpolate(frame, [FOLLOW_AT, FOLLOW_AT + 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pipIn = interpolate(frame, [FOLLOW_AT + 14, FOLLOW_AT + 32], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: height * 0.55,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 44,
          fontWeight: 900,
          letterSpacing: "0.22em",
          color: BRAND.bg,
          background: BRAND.teal,
          padding: "26px 74px",
          borderRadius: 999,
          transform: `scale(${scale})`,
          opacity,
          boxShadow: `0 0 ${width * 0.05}px ${BRAND.teal}59, 0 14px 40px rgba(0,0,0,0.45)`,
        }}
      >
        FOLLOW
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: BRAND.ink,
          opacity: pipIn,
        }}
      >
        World Cup for newcomers — Part 1
      </div>
    </div>
  );
};

export const Scene05: React.FC = () => {
  const frame = useCurrentFrame();

  // the memory treatment dissolves away over the first 15 frames
  const memoryDissolve = interpolate(frame, [0, 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // b-roll window fades at both edges (local to its Sequence)
  const brollFade = interpolate(frame, [20, 38, 92, 110], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("Scene05.mp3")} />

      <ParticleField />

      {/* floodlights window, frames 20-110 only */}
      <Sequence from={20} durationInFrames={90}>
        <AbsoluteFill style={{ opacity: brollFade }}>
          <BRollBed src="floodlights_dusk_v.mp4" opacity={0.2} />
        </AbsoluteFill>
      </Sequence>

      <TitlePop />
      <FollowPrompt />

      {/* the past, dissolving: grain + warm tint exit over frames 0-15 */}
      {memoryDissolve > 0 && (
        <AbsoluteFill style={{ opacity: memoryDissolve }}>
          <MemoryLook seed={5} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
