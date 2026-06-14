import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";
import { WORLD_DOTS } from "./worldDots";

/*
 * "COUNTRIES, NOT CLUBS" — 25s / 750 frames @ 30fps, 1920x1080.
 * Flat-explainer style continuing the Intro: midnight navy, deep teal, Inter.
 *
 * Timeline:
 *   0   - 390 : Beat 1 — club badge ✕ → waving generic flag ✓, label on top
 *   375 - 750 : Beat 2 — three stat cards spring in (3 / 48 / FIRST EVER)
 *   throughout: pulsing real-geometry world dot-map background
 */

const C = {
  navy: "#0A1224",
  navyDeep: "#070C1A",
  card: "#101C36",
  teal: "#1FB6B6",
  tealDeep: "#0E6E73",
  ink: "#EAF6F6",
  muted: "#7E93A8",
  gold: "#E0B95B",
  red: "#FF5C68",
  green: "#4FD98B",
};

const FONT = "Inter, Helvetica, Arial, sans-serif";

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Pulsing world dot-map (real country geometry, rasterized from GeoJSON).
// Each dot breathes in scale/opacity on its own slow sine offset.
// ---------------------------------------------------------------------------
const DotWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const ROWS = WORLD_DOTS.length;
  const COLS = WORLD_DOTS[0].length;
  const mapW = width * 0.86;
  const mapH = mapW * (ROWS / COLS) * 1.18; // mild vertical stretch for 16:9 fit
  const offX = (width - mapW) / 2;
  const offY = (height - mapH) / 2;
  const dotR = (mapW / COLS) * 0.3;

  const circles: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const row = WORLD_DOTS[r];
    for (let c = 0; c < COLS; c++) {
      if (row[c] !== "#") continue;
      const i = r * COLS + c;
      const phase = rand(i) * Math.PI * 2;
      const breathe = Math.sin(frame * (0.025 + rand(i + 7) * 0.02) + phase);
      const opacity = 0.1 + (breathe * 0.5 + 0.5) * 0.16;
      const scale = 0.85 + (breathe * 0.5 + 0.5) * 0.45;
      circles.push(
        <circle
          key={i}
          cx={offX + (c / (COLS - 1)) * mapW}
          cy={offY + (r / (ROWS - 1)) * mapH}
          r={dotR * scale}
          fill={C.teal}
          opacity={opacity}
        />,
      );
    }
  }

  const fadeIn = interpolate(frame, [0, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <svg width={width} height={height}>
        {circles}
      </svg>
    </AbsoluteFill>
  );
};

// Soft dark backing to keep foreground readable over the map.
const Backing: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: w,
      height: h,
      transform: "translate(-50%,-50%)",
      background: `radial-gradient(ellipse at center, rgba(7,12,26,0.85) 0%, rgba(7,12,26,0.45) 55%, rgba(7,12,26,0) 78%)`,
    }}
  />
);

// ---------------------------------------------------------------------------
// Invented flat club badge (abstract shield — resembles no real club).
// ---------------------------------------------------------------------------
const ClubBadge: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 200 240">
    <path
      d="M100 8 L182 40 V120 C182 180 100 230 100 230 C100 230 18 180 18 120 V40 Z"
      fill={C.card}
      stroke="#2C4A6A"
      strokeWidth={6}
    />
    {/* abstract diagonal band */}
    <path
      d="M18 96 L182 40 V86 L18 142 Z"
      fill={C.teal}
      opacity={0.3}
    />
    {/* abstract ring + dot */}
    <circle cx={100} cy={138} r={34} fill="none" stroke={C.gold} strokeWidth={7} opacity={0.85} />
    <circle cx={100} cy={138} r={10} fill={C.gold} opacity={0.85} />
  </svg>
);

// Red ✕ stamp
const CrossStamp: React.FC<{ size: number; progress: number }> = ({
  size,
  progress,
}) => {
  const scale = interpolate(progress, [0, 1], [2.2, 1]);
  const rot = interpolate(progress, [0, 1], [-24, -8]);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%,-50%) scale(${scale}) rotate(${rot}deg)`,
        opacity: Math.min(1, progress * 1.6),
        filter: `drop-shadow(0 0 ${size * 0.12}px ${C.red}99)`,
      }}
    >
      {[45, -45].map((a) => (
        <div
          key={a}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: size,
            height: size * 0.16,
            borderRadius: size,
            background: C.red,
            transform: `translate(-50%,-50%) rotate(${a}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// Green ✓ stamp
const CheckStamp: React.FC<{ size: number; progress: number }> = ({
  size,
  progress,
}) => {
  const scale = interpolate(progress, [0, 1], [2.2, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%,-50%) scale(${scale}) rotate(${interpolate(progress, [0, 1], [14, 4])}deg)`,
        opacity: Math.min(1, progress * 1.6),
        filter: `drop-shadow(0 0 ${size * 0.12}px ${C.green}99)`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polyline
          points="18,54 42,78 84,26"
          fill="none"
          stroke={C.green}
          strokeWidth={15}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// Gently waving generic tricolor flag (abstract colors, no real nation).
const WavingFlag: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const frame = useCurrentFrame();
  const SLICES = 28;
  const bands = [C.teal, C.ink, C.gold];
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {Array.from({ length: SLICES }).map((_, i) => {
        const t = i / (SLICES - 1);
        // anchored left, free right edge waves more
        const amp = h * 0.045 * (0.25 + 0.75 * t);
        const y = Math.sin(frame * 0.13 + i * 0.42) * amp;
        const shade = 1 + Math.sin(frame * 0.13 + i * 0.42 + 1.2) * 0.07;
        const band = bands[Math.min(2, Math.floor(t * 3))];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i / SLICES) * w,
              top: y,
              width: w / SLICES + 1,
              height: h,
              background: band,
              filter: `brightness(${shade})`,
            }}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// BEAT 1 — badge ✕ → flag ✓, "COUNTRIES, NOT CLUBS" label.
// Local frames 0..390.
// ---------------------------------------------------------------------------
const BEAT1_DUR = 390;

const Beat1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const fadeOut = interpolate(frame, [BEAT1_DUR - 35, BEAT1_DUR - 5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // label
  const labelIn = interpolate(frame, [12, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // badge entrance
  const badgeS = spring({
    frame: frame - 22,
    fps,
    config: { damping: 10, stiffness: 160, mass: 0.7 },
  });

  // red ✕ stamp
  const xS = spring({
    frame: frame - 85,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.6 },
  });

  // cross-fade badge -> flag (frames 150-195)
  const swap = interpolate(frame, [150, 195], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // green ✓ stamp
  const vS = spring({
    frame: frame - 245,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.6 },
  });

  const iconSize = width * 0.13;

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Backing w={width * 0.55} h={width * 0.38} />

      {/* label */}
      <div
        style={{
          position: "absolute",
          top: "27%",
          width: "100%",
          textAlign: "center",
          fontFamily: FONT,
          fontSize: width * 0.018,
          fontWeight: 700,
          letterSpacing: "0.45em",
          color: C.teal,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 14}px)`,
        }}
      >
        COUNTRIES, NOT CLUBS
      </div>

      {/* badge + ✕ (fades out on swap) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "54%",
          transform: `translate(-50%,-50%) scale(${interpolate(badgeS, [0, 1], [0.3, 1])})`,
          opacity: Math.min(badgeS * 1.4, 1) * (1 - swap),
        }}
      >
        <ClubBadge size={iconSize} />
        {frame >= 85 && <CrossStamp size={iconSize * 1.25} progress={xS} />}
      </div>

      {/* flag + ✓ (fades in on swap) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "54%",
          transform: `translate(-50%,-50%) scale(${0.92 + swap * 0.08})`,
          opacity: swap,
        }}
      >
        <WavingFlag w={iconSize * 1.7} h={iconSize * 1.1} />
        {frame >= 245 && <CheckStamp size={iconSize * 0.95} progress={vS} />}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// BEAT 2 — three stat cards, staggered springs, counters, source chip.
// Local frames 0..375 (global 375..750).
// ---------------------------------------------------------------------------
const StatCard: React.FC<{
  delay: number;
  children: React.ReactNode;
}> = ({ delay, children }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 130, mass: 0.8 },
  });
  return (
    <div
      style={{
        width: width * 0.21,
        padding: `${width * 0.024}px ${width * 0.012}px`,
        borderRadius: 22,
        background: `linear-gradient(180deg, ${C.card} 0%, #0B1429 100%)`,
        border: `1.5px solid rgba(31,182,182,0.35)`,
        boxShadow: `0 18px 50px rgba(0,0,0,0.45), inset 0 0 40px rgba(31,182,182,0.06)`,
        textAlign: "center",
        transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
        opacity: Math.min(1, s * 1.5),
      }}
    >
      {children}
    </div>
  );
};

const BigNumber: React.FC<{ value: string }> = ({ value }) => {
  const { width } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: width * 0.052,
        fontWeight: 900,
        color: C.teal,
        lineHeight: 1,
        textShadow: `0 0 ${width * 0.018}px rgba(31,182,182,0.55)`,
      }}
    >
      {value}
    </div>
  );
};

const CardLabel: React.FC<{ text: string }> = ({ text }) => {
  const { width } = useVideoConfig();
  return (
    <div
      style={{
        marginTop: width * 0.008,
        fontFamily: FONT,
        fontSize: width * 0.0125,
        fontWeight: 700,
        letterSpacing: "0.3em",
        color: C.ink,
        opacity: 0.85,
      }}
    >
      {text}
    </div>
  );
};

const Beat2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const count3 = Math.round(
    interpolate(frame, [14, 60], [0, 3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const count48 = Math.round(
    interpolate(frame, [40, 105], [0, 48], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );

  // "FIRST EVER" words stamp with spring overshoot
  const firstS = spring({
    frame: frame - 72,
    fps,
    config: { damping: 9, stiffness: 170, mass: 0.7 },
  });
  const everS = spring({
    frame: frame - 86,
    fps,
    config: { damping: 9, stiffness: 170, mass: 0.7 },
  });

  const chipIn = interpolate(frame, [70, 100], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backing w={width * 0.85} h={width * 0.3} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: width * 0.028 }}>
          <StatCard delay={10}>
            <BigNumber value={String(count3)} />
            <CardLabel text="HOST NATIONS" />
          </StatCard>
          <StatCard delay={35}>
            <BigNumber value={String(count48)} />
            <CardLabel text="TEAMS" />
          </StatCard>
          <StatCard delay={60}>
            <div
              style={{
                fontFamily: FONT,
                fontSize: width * 0.034,
                fontWeight: 900,
                color: C.teal,
                lineHeight: 1.05,
                textShadow: `0 0 ${width * 0.016}px rgba(31,182,182,0.55)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: `scale(${interpolate(firstS, [0, 1], [0.2, 1])})`,
                  opacity: Math.min(1, firstS * 1.5),
                }}
              >
                FIRST
              </span>
              <span
                style={{
                  display: "inline-block",
                  transform: `scale(${interpolate(everS, [0, 1], [0.2, 1])})`,
                  opacity: Math.min(1, everS * 1.5),
                }}
              >
                EVER
              </span>
            </div>
            <CardLabel text="THIS FORMAT" />
          </StatCard>
        </div>
      </AbsoluteFill>

      {/* source chip bottom-left */}
      <div
        style={{
          position: "absolute",
          left: width * 0.025,
          bottom: height * 0.045,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: C.ink,
          opacity: chipIn,
        }}
      >
        Hosts &amp; 48-team field: FIFA · 2026
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------------
export const CountriesNotClubs: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // scene-level fade in/out for clean assembly cuts
  const sceneOpacity = interpolate(
    frame,
    [0, 12, durationInFrames - 22, durationInFrames - 2],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: C.navy, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <DotWorld />
        <Sequence from={0} durationInFrames={BEAT1_DUR} layout="none">
          <Beat1 />
        </Sequence>
        <Sequence from={375} layout="none">
          <Beat2 />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
