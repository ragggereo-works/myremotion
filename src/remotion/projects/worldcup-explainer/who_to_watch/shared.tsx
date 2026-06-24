import React from "react";
import {
  AbsoluteFill,
  Freeze,
  OffthreadVideo,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND,
  FONT_FAMILY,
  SAFE_TOP,
  SAFE_BOTTOM,
  TEXT_ZONE_PCT,
  SOURCE_CHIP_STYLE,
} from "../../../../brand";

/*
 * Shared kit for Video 3 "Who to Watch" (vertical 1080x1920 @30fps).
 * All motion is frame-driven and deterministic: no Math.random, no Date.now,
 * no CSS transitions. Seeded noise only. Brand tokens only — no hardcoded hex.
 *
 * Layer order (back -> front): SpotlightBG/ParticleBG -> MapBed/B-roll
 *   -> PlayerCard/diagram -> StatStamp/CountUp DATA -> big TEXT -> SourceChip.
 */

// ---------------------------------------------------------------------------
// seeded noise — deterministic pseudo-random in [0,1)
// ---------------------------------------------------------------------------
export const seededNoise = (seed: number, x = 0, y = 0): number => {
  const v = Math.sin(seed * 374761.393 + x * 668.265263 + y * 1274.1281) * 43758.5453;
  return v - Math.floor(v);
};

const ACCENTS = {
  gold: BRAND.gold,
  teal: BRAND.teal,
  pop: BRAND.pop,
  ink: BRAND.ink,
} as const;
export type Accent = keyof typeof ACCENTS;

// horizontal safe-zone bounds (middle 75%)
export const ZONE_LEFT_PCT = (1 - TEXT_ZONE_PCT) / 2; // 0.125
// ---------------------------------------------------------------------------
// <SpotlightBG> — navy fill + soft elliptical spotlight that sweeps
// horizontally on a slow sine. Stadium-lights-tracking feel. Deterministic.
// ---------------------------------------------------------------------------
export const SpotlightBG: React.FC<{ accent?: Accent }> = ({ accent = "teal" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // centre sweeps across the middle 60% of width on a ~9s sine
  const cx = 0.5 + Math.sin(frame * 0.018) * 0.22;
  const cy = 0.42 + Math.sin(frame * 0.011 + 1.3) * 0.06;
  const glow = ACCENTS[accent];
  return (
    <AbsoluteFill style={{ background: BRAND.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at ${cx * width}px ${cy * height}px, ${glow}22 0%, ${glow}0D 38%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 120%, ${BRAND.bgAlt} 0%, transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// <ParticleBG> — channel particle field (brand bookend). ~120 seeded dots
// drifting on frame-driven sine. pull=true eases them toward centre.
// ---------------------------------------------------------------------------
const PARTICLE_COUNT = 120;
export const ParticleBG: React.FC<{ seed?: number; pull?: boolean; pullAt?: number }> = ({
  seed = 7,
  pull = false,
  pullAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pullT = pull
    ? interpolate(frame, [pullAt, pullAt + 60], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  return (
    <AbsoluteFill style={{ background: BRAND.bg }}>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
          const bx = seededNoise(seed, i, 1) * width;
          const by = seededNoise(seed, i, 2) * height;
          const fx = 0.3 + seededNoise(seed, i, 3) * 0.7;
          const ph = seededNoise(seed, i, 4) * Math.PI * 2;
          const driftX = bx + Math.sin(frame * 0.01 * fx + ph) * 26;
          const driftY = by + Math.cos(frame * 0.009 * fx + ph) * 26;
          const cxp = driftX + (width / 2 - driftX) * pullT;
          const cyp = driftY + (height * 0.42 - driftY) * pullT;
          const r = 1.5 + seededNoise(seed, i, 5) * 2.5;
          const op = 0.18 + (Math.sin(frame * 0.05 + ph) * 0.5 + 0.5) * 0.4;
          return <circle key={i} cx={cxp} cy={cyp} r={r} fill={BRAND.teal} opacity={op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// <MapBed> — map/B-roll clip under graphics. Opacity ramps 0->{opacity} over
// 15f, plays ONCE at natural rate, then FREEZES its last frame (no loop).
// Caller passes clipDurationInFrames (the clip's own length @30fps) so we
// know where to clamp.
// ---------------------------------------------------------------------------
export const MapBed: React.FC<{
  src: string;
  opacity?: number;
  clipDurationInFrames?: number;
}> = ({ src, opacity = 0.35, clipDurationInFrames }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, opacity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "saturate(0.85) brightness(0.9)",
      }}
    />
  );
  // Play once at natural rate; once past the clip's own length, FREEZE its
  // last frame for the rest of the comp (no loop, no disappear).
  const freezeAt = clipDurationInFrames ? clipDurationInFrames - 1 : undefined;
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {freezeAt !== undefined && frame >= freezeAt ? (
        <Freeze frame={freezeAt}>{video}</Freeze>
      ) : (
        video
      )}
    </AbsoluteFill>
  );
};
// ---------------------------------------------------------------------------
// <PlayerCard> — trading card. NO photo / NO likeness. Large faint jersey
// NUMBER motif behind the text. Card springs in (scale 0.92->1.0 overshoot),
// identity/stat lines stagger in beneath (+3f each). Upper-middle of safe zone.
// ---------------------------------------------------------------------------
export const PlayerCard: React.FC<{
  name: string;
  country: string;
  age?: string | number;
  position: string;
  jersey?: string | number;
  subline?: string;
  accent?: Accent;
  atFrame?: number;
}> = ({ name, country, age, position, jersey, subline, accent = "gold", atFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const glow = ACCENTS[accent];

  const enter = spring({
    frame: frame - atFrame,
    fps,
    config: { damping: 12, stiffness: 140, mass: 0.7 },
  });
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const cardOp = interpolate(frame, [atFrame, atFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // identity line + stat lines stagger in
  const lines: string[] = [
    [country, age !== undefined ? `${age}` : null, position].filter(Boolean).join("  ·  "),
  ];
  if (subline) lines.push(subline);

  const cardW = width * TEXT_ZONE_PCT;
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE_TOP + 120,
        left: (width - cardW) / 2,
        width: cardW,
        opacity: cardOp,
        transform: `scale(${scale})`,
        transformOrigin: "center top",
        fontFamily: FONT_FAMILY,
        textAlign: "center",
      }}
    >
      {/* faint jersey-number motif behind */}
      {jersey !== undefined && (
        <div
          style={{
            position: "absolute",
            top: -40,
            left: 0,
            width: "100%",
            textAlign: "center",
            fontSize: 360,
            fontWeight: 900,
            color: glow,
            opacity: 0.1,
            lineHeight: 1,
            zIndex: 0,
            userSelect: "none",
          }}
        >
          {jersey}
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: BRAND.ink,
            letterSpacing: -2,
            textShadow: `0 0 30px ${glow}55`,
          }}
        >
          {name}
        </div>
        {lines.map((ln, i) => {
          const lineIn = interpolate(
            frame,
            [atFrame + 10 + i * 3, atFrame + 18 + i * 3],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <div
              key={i}
              style={{
                fontSize: i === 0 ? 40 : 34,
                fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? glow : BRAND.ink,
                opacity: lineIn * (i === 0 ? 1 : 0.82),
                marginTop: i === 0 ? 18 : 10,
                letterSpacing: 1,
              }}
            >
              {ln}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// <StatStamp> — small DATA chip; springs in at atFrame (scale overshoot ~6f)
// and holds. Stack multiple via `index` so they don't collide vertically.
// ---------------------------------------------------------------------------
export const StatStamp: React.FC<{
  label: string;
  atFrame: number;
  accent?: Accent;
  index?: number;
  top?: number;
}> = ({ label, atFrame, accent = "ink", index = 0, top }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const glow = ACCENTS[accent];
  const enter = spring({
    frame: frame - atFrame,
    fps,
    config: { damping: 11, stiffness: 170, mass: 0.6 },
  });
  const scale = interpolate(enter, [0, 1], [0.4, 1]);
  const op = interpolate(frame, [atFrame, atFrame + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: (top ?? height * 0.56) + index * 84,
        left: width * ZONE_LEFT_PCT,
        width: width * TEXT_ZONE_PCT,
        display: "flex",
        justifyContent: "center",
        opacity: op,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          padding: "14px 28px",
          borderRadius: 14,
          background: `${BRAND.bgAlt}E6`,
          border: `2px solid ${glow}`,
          color: BRAND.ink,
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: 0.5,
          boxShadow: `0 0 24px ${glow}33`,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};
// ---------------------------------------------------------------------------
// <CountUp> — big gold figure interpolating 0->{to} over durationFrames
// starting at atFrame, with a small label beneath.
// ---------------------------------------------------------------------------
export const CountUp: React.FC<{
  to: number;
  atFrame: number;
  label: string;
  durationFrames?: number;
  accent?: Accent;
  top?: number;
  suffix?: string;
}> = ({ to, atFrame, label, durationFrames = 20, accent = "gold", top, suffix = "" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const glow = ACCENTS[accent];
  const value = Math.round(
    interpolate(frame, [atFrame, atFrame + durationFrames], [0, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const op = interpolate(frame, [atFrame, atFrame + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // gentle pop while ticking, settle after
  const pop = interpolate(
    frame,
    [atFrame, atFrame + durationFrames, atFrame + durationFrames + 8],
    [0.85, 1.06, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div
      style={{
        position: "absolute",
        top: top ?? height * 0.62,
        left: 0,
        width,
        textAlign: "center",
        opacity: op,
        transform: `scale(${pop})`,
        transformOrigin: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          fontSize: 180,
          fontWeight: 900,
          color: glow,
          lineHeight: 1,
          textShadow: `0 0 40px ${glow}66`,
        }}
      >
        {value}
        {suffix}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: BRAND.ink, opacity: 0.85, marginTop: 8 }}>
        {label}
      </div>
    </div>
  );
};
// ---------------------------------------------------------------------------
// <MiniCard> — compact card (name + country only) for Scene 7 rapid-fire.
// Springs in at atFrame, holds holdFrames, springs out.
// ---------------------------------------------------------------------------
export const MiniCard: React.FC<{
  name: string;
  country: string;
  atFrame: number;
  holdFrames?: number;
  accent?: Accent;
}> = ({ name, country, atFrame, holdFrames = 90, accent = "teal" }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const glow = ACCENTS[accent];
  const local = frame - atFrame;
  const enter = spring({ frame: local, fps, config: { damping: 13, stiffness: 150, mass: 0.7 } });
  const exit = spring({
    frame: local - holdFrames,
    fps,
    config: { damping: 13, stiffness: 150, mass: 0.7 },
  });
  const scale = interpolate(enter, [0, 1], [0.85, 1]) - interpolate(exit, [0, 1], [0, 0.15]);
  const op =
    interpolate(local, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(local, [holdFrames, holdFrames + 10], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <div
      style={{
        position: "absolute",
        top: height * 0.4,
        left: width * ZONE_LEFT_PCT,
        width: width * TEXT_ZONE_PCT,
        textAlign: "center",
        opacity: op,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ fontSize: 78, fontWeight: 900, color: BRAND.ink, letterSpacing: -1 }}>
        {name}
      </div>
      <div style={{ fontSize: 40, fontWeight: 700, color: glow, marginTop: 10, letterSpacing: 1 }}>
        {country}
      </div>
    </div>
  );
};
// ---------------------------------------------------------------------------
// <TrophyOutline> — thin trophy outline that draws in. filled=false stays
// EMPTY (Ronaldo's visual point: the one prize never won).
// ---------------------------------------------------------------------------
export const TrophyOutline: React.FC<{
  filled?: boolean;
  atFrame: number;
  label?: string;
  accent?: Accent;
  top?: number;
}> = ({ filled = false, atFrame, label = "WORLD CUP", accent = "gold", top }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const glow = ACCENTS[accent];
  const draw = interpolate(frame, [atFrame, atFrame + 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fillOp = filled
    ? interpolate(frame, [atFrame + 30, atFrame + 50], [0, 0.85], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const labelOp = interpolate(frame, [atFrame + 20, atFrame + 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: top ?? height * 0.58,
        left: 0,
        width,
        textAlign: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <svg width={160} height={180} viewBox="0 0 160 180" style={{ overflow: "visible" }}>
        <path
          d="M50 20 H110 V60 Q110 95 80 100 Q50 95 50 60 Z M50 35 Q22 35 22 55 Q22 78 50 78 M110 35 Q138 35 138 55 Q138 78 110 78 M80 100 V130 M55 130 H105 M48 150 H112 L105 130 H55 Z"
          fill={glow}
          fillOpacity={fillOp}
          stroke={glow}
          strokeWidth={3}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={draw}
        />
      </svg>
      {label && (
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: filled ? glow : BRAND.ink,
            opacity: labelOp * (filled ? 1 : 0.7),
            letterSpacing: 2,
            marginTop: 6,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// <SourceChip> — 11px, 60% opacity, bottom of safe zone (above 300px margin).
// ---------------------------------------------------------------------------
export const SourceChip: React.FC<{ text: string; fadeInAt?: number }> = ({
  text,
  fadeInAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const op = interpolate(frame, [fadeInAt, fadeInAt + 24], [0, SOURCE_CHIP_STYLE.opacity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: SAFE_BOTTOM - 40,
        left: width * ZONE_LEFT_PCT,
        width: width * TEXT_ZONE_PCT,
        textAlign: "center",
        fontFamily: FONT_FAMILY,
        fontSize: SOURCE_CHIP_STYLE.fontSize,
        color: BRAND.ink,
        opacity: op,
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
  );
};

