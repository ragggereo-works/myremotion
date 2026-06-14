import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  FONT_FAMILY,
  SAFE_BOTTOM,
  SAFE_TOP,
  SOURCE_CHIP_STYLE,
  TEXT_ZONE_PCT,
} from "../../../../../brand";

/*
 * Shared components for the worldcup-explainer Shorts.
 * Scenes 1-4: warm grainy "memory" look (GrainOverlay + VignetteFlicker).
 * Scene 5: clean modern look (no grain).
 * Everything is deterministic — driven by useCurrentFrame() and seeded noise.
 */

// Seeded deterministic noise of (frame, x, y) — no Math.random() anywhere.
export const seededNoise = (seed: number, x: number, y: number): number => {
  const v = Math.sin(seed * 374761.393 + x * 668.265263 + y * 1274.1281) * 43758.5453;
  return v - Math.floor(v);
};

// ---------------------------------------------------------------------------
// Film grain — regenerates every frame from (seed, frame) via feTurbulence.
// Subtle by default (~8% opacity). Deterministic: same seed+frame = same grain.
// ---------------------------------------------------------------------------
export const GrainOverlay: React.FC<{ seed: number; opacity?: number }> = ({
  seed,
  opacity = 0.08,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const id = `grain-${seed}`;
  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}
    >
      <svg width={width} height={height}>
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={2}
            seed={seed * 9973 + frame}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Slow vignette flicker — sine of frame, warm-tinted edges.
// ---------------------------------------------------------------------------
export const VignetteFlicker: React.FC = () => {
  const frame = useCurrentFrame();
  const strength = 0.55 + Math.sin(frame * 0.07) * 0.06;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(16,8,4,${strength}) 100%)`,
      }}
    />
  );
};

// Warm low-opacity color wash that makes footage/graphics feel like a memory.
export const WarmWash: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `linear-gradient(168deg, ${BRAND.gold}14 0%, rgba(0,0,0,0) 45%, ${BRAND.pop}12 100%)`,
    }}
  />
);

// Composes the full Scenes 1-4 "memory" treatment. Place ABOVE scene content.
export const MemoryLook: React.FC<{ seed: number }> = ({ seed }) => (
  <>
    <WarmWash />
    <VignetteFlicker />
    <GrainOverlay seed={seed} />
  </>
);

// ---------------------------------------------------------------------------
// B-roll bed — always UNDER the graphics at low opacity (15-30%), never the star.
// ---------------------------------------------------------------------------
export const BRollBed: React.FC<{
  src: string;
  opacity?: number;
  startFrom?: number;
  /** slow push: scale interpolates from/to across the full scene */
  scaleFrom?: number;
  scaleTo?: number;
  /** slow horizontal pan in px across the full scene (overscan via scale) */
  panFromX?: number;
  panToX?: number;
  /** stretch/shrink playback so short clips can cover a longer scene */
  playbackRate?: number;
}> = ({
  src,
  opacity = 0.22,
  startFrom = 0,
  scaleFrom = 1,
  scaleTo = 1,
  panFromX = 0,
  panToX = 0,
  playbackRate = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [scaleFrom, scaleTo],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const panX = interpolate(frame, [0, durationInFrames], [panFromX, panToX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        startFrom={startFrom}
        playbackRate={playbackRate}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateX(${panX}px) scale(${scale})`,
          filter: "saturate(0.6) contrast(1.05) brightness(0.8)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Source chip — bottom of the safe zone, 11px at 60% opacity.
// ---------------------------------------------------------------------------
export const SourceChip: React.FC<{ text: string; fadeInAt?: number }> = ({
  text,
  fadeInAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [fadeInAt, fadeInAt + 24],
    [0, SOURCE_CHIP_STYLE.opacity],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <div
      style={{
        position: "absolute",
        left: (width * (1 - TEXT_ZONE_PCT)) / 2,
        bottom: SAFE_BOTTOM + height * 0.012,
        fontFamily: FONT_FAMILY,
        fontSize: SOURCE_CHIP_STYLE.fontSize,
        fontWeight: 500,
        letterSpacing: "0.08em",
        color: BRAND.ink,
        opacity,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Safe-area wrapper — keeps content out of the Shorts UI zones and inside
// the middle 75% horizontally. Wrap text/graphic groups in this.
// ---------------------------------------------------------------------------
export const SafeArea: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        top: SAFE_TOP,
        bottom: SAFE_BOTTOM,
        left: (width * (1 - TEXT_ZONE_PCT)) / 2,
        right: (width * (1 - TEXT_ZONE_PCT)) / 2,
        width: "auto",
        height: "auto",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
