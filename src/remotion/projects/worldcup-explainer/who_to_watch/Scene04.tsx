import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP, SAFE_BOTTOM } from "../../../../brand";
import { SpotlightBG, seededNoise } from "./shared";

export const SCENE04_DURATION = 363; // ceil((11.280 + 0.8) * 30) — Part 1 closer

const FLIP_AT = 200; // card flips to "NEXT → THE HEIR" (~55%)
const FOLLOW_AT = 254; // follow button pops (~70%)

// ---------------------------------------------------------------------------
// The gold "10" and red "7" from Scene01 settle in, a LIVING gold spark rises
// between them (the 'next gen' hint).
// ---------------------------------------------------------------------------
const DuelEcho: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const settle = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120, mass: 1 } });
  const lOp = interpolate(settle(6), [0, 1], [0, 0.85]);
  const rOp = interpolate(settle(10), [0, 1], [0, 0.85]);
  const cy = height * 0.34;

  const numStyle = (color: string, op: number): React.CSSProperties => ({
    fontSize: 200,
    fontWeight: 900,
    color,
    opacity: op,
    lineHeight: 1,
    letterSpacing: -6,
    textShadow: `0 0 40px ${color}44`,
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <div style={{ position: "absolute", top: cy - 100, left: 0, width: width / 2, textAlign: "center" }}>
        <div style={numStyle(BRAND.gold, lOp)}>10</div>
      </div>
      <div style={{ position: "absolute", top: cy - 100, left: width / 2, width: width / 2, textAlign: "center" }}>
        <div style={numStyle(BRAND.pop, rOp)}>7</div>
      </div>
      {/* LIVING gold spark rising between them */}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const ph = seededNoise(31, i, 1) * Math.PI * 2;
          const sx = width / 2 + Math.sin(frame * 0.04 + ph) * (18 + i);
          const riseSpan = height * 0.18;
          const prog = ((frame * (0.6 + seededNoise(31, i, 2)) + i * 9) % 90) / 90;
          const sy = cy + 60 - prog * riseSpan;
          const op = Math.sin(prog * Math.PI) * 0.8;
          const r = 2 + seededNoise(31, i, 3) * 3;
          return <circle key={i} cx={sx} cy={sy} r={r} fill={BRAND.gold} opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Flip card: "TWO LEGENDS. ONE LAST DANCE." -> "NEXT → THE HEIR"
// ---------------------------------------------------------------------------
const FlipCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // front stamps in early
  const frontScale = interpolate(frame, [12, 22], [1.12, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const frontOp = interpolate(frame, [12, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Y-flip around FLIP_AT
  const flip = spring({
    frame: frame - FLIP_AT,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
  });
  const angle = interpolate(flip, [0, 1], [0, 180]);
  const showBack = angle > 90;

  return (
    <div
      style={{
        position: "absolute",
        top: height * 0.56,
        left: width * 0.1,
        width: width * 0.8,
        textAlign: "center",
        fontFamily: FONT_FAMILY,
        perspective: 1200,
      }}
    >
      <div style={{ transform: `rotateY(${angle}deg)`, transformStyle: "preserve-3d" }}>
        {!showBack ? (
          <div style={{ opacity: frontOp, transform: `scale(${frontScale})` }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: BRAND.ink, letterSpacing: -1, lineHeight: 1.08 }}>
              TWO LEGENDS.
              <br />
              ONE LAST DANCE.
            </div>
          </div>
        ) : (
          <div style={{ transform: "rotateY(180deg)" }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: BRAND.teal, letterSpacing: 4 }}>
              NEXT →
            </div>
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: BRAND.gold,
                letterSpacing: -1,
                marginTop: 8,
                textShadow: `0 0 44px ${BRAND.gold}55`,
              }}
            >
              THE HEIR
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FollowButton: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pop = spring({
    frame: frame - FOLLOW_AT,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.5 },
  });
  const scale = interpolate(pop, [0, 1], [0.55, 1]);
  const op = interpolate(frame, [FOLLOW_AT, FOLLOW_AT + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: height * 0.74,
        left: 0,
        width,
        display: "flex",
        justifyContent: "center",
        opacity: op,
        transform: `scale(${scale})`,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          padding: "20px 54px",
          borderRadius: 999,
          background: BRAND.pop,
          color: BRAND.ink,
          fontSize: 44,
          fontWeight: 900,
          letterSpacing: 1,
          boxShadow: `0 0 36px ${BRAND.pop}66`,
        }}
      >
        + FOLLOW
      </div>
    </div>
  );
};

// PART 1 pip that ticks to "1 ✓"
const PartPipTick: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const op = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ticked = frame >= FOLLOW_AT;
  return (
    <div
      style={{
        position: "absolute",
        bottom: SAFE_BOTTOM + 70,
        left: width * 0.125,
        opacity: op,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          padding: "8px 18px",
          borderRadius: 999,
          background: `${BRAND.bgAlt}E6`,
          border: `2px solid ${BRAND.teal}`,
          color: BRAND.teal,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        {ticked ? "1 ✓" : "PART 1"}
      </div>
    </div>
  );
};

export const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const fadeOut = interpolate(frame, [SCENE04_DURATION - 12, SCENE04_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY, opacity: fadeOut }}>
      <Audio src={staticFile("v3_who_to_watch/Scene04.mp3")} />

      <SpotlightBG accent="gold" />
      <DuelEcho />
      <FlipCard />
      <FollowButton />
      <PartPipTick />

      {/* kicker hint at very top */}
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP - 10,
          left: width * 0.125,
          width: width * 0.75,
          textAlign: "center",
          fontSize: 30,
          fontWeight: 500,
          color: BRAND.ink,
          opacity: 0.55,
          letterSpacing: 2,
        }}
      >
        THE LAST DANCE · PART 1
      </div>
    </AbsoluteFill>
  );
};
