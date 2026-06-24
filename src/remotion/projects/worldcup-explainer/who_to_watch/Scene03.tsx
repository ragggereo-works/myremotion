import React from "react";
import {
  AbsoluteFill,
  Audio,
  Freeze,
  OffthreadVideo,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP, SAFE_BOTTOM } from "../../../../brand";
import { StatStamp, CountUp, SourceChip, seededNoise } from "./shared";

export const SCENE03_DURATION = 686; // ceil((22.560 + 0.3) * 30) — unchanged VO
const MAP_FRAMES = 240; // map_portugal.mov 8.0s @30fps

// beats spread across the whole ~22s, and vertical positions spread across the
// whole safe zone (usable ~200..1620 on a 1920-tall frame) — nothing bunched.
const CARD_AT = 60;
const BALLON_AT = 135;
const COUNT_AT = 210;
const COUNT_DUR = 105;
const TROPHY_AT = 345;
const GLINT_AT = 450;
const FINAL_AT = 570;

// vertical anchors
const NAME_TOP = SAFE_TOP + 70; // ~270
const BALLON_TOP = 560;
const COUNT_TOP = 720;
const TROPHY_TOP = 1010; // trophy unit origin
const FINAL_TOP = 1410;

// ---------------------------------------------------------------------------
// Full-frame map base: glides once, then slow parallax push (never still).
// ---------------------------------------------------------------------------
const MapBase: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, SCENE03_DURATION], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });
  const video = (
    <OffthreadVideo
      src={staticFile("v3_who_to_watch/map_portugal.mov")}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.95) brightness(0.95)" }}
    />
  );
  const freezeAt = MAP_FRAMES - 1;
  return (
    <AbsoluteFill style={{ opacity: fadeIn, transform: `scale(${scale})` }}>
      {frame >= freezeAt ? <Freeze frame={freezeAt}>{video}</Freeze> : video}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Big red "7" motif behind the name — drifts gently the whole time.
// ---------------------------------------------------------------------------
const DriftingSeven: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const dx = Math.sin(frame * 0.02) * 8;
  const dy = Math.cos(frame * 0.017) * 8;
  const op = interpolate(frame, [0, 16], [0, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE_TOP - 20,
        left: 0,
        width,
        textAlign: "center",
        transform: `translate(${dx}px, ${dy}px)`,
        fontFamily: FONT_FAMILY,
        fontSize: 460,
        fontWeight: 900,
        color: BRAND.pop,
        opacity: op,
        lineHeight: 1,
        zIndex: 0,
        userSelect: "none",
      }}
    >
      7
    </div>
  );
};

// ---------------------------------------------------------------------------
// Faint gold dust rising around the trophy — runs throughout.
// ---------------------------------------------------------------------------
const GoldDust: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const baseY = TROPHY_TOP + 200;
  return (
    <svg width={width} height={1920} style={{ position: "absolute" }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const ph = seededNoise(73, i, 1) * Math.PI * 2;
        const x = width / 2 + (seededNoise(73, i, 2) - 0.5) * 360 + Math.sin(frame * 0.03 + ph) * 14;
        const span = 240;
        const prog = ((frame * (0.4 + seededNoise(73, i, 3) * 0.5) + i * 7) % 120) / 120;
        const y = baseY - prog * span;
        const op = Math.sin(prog * Math.PI) * 0.5;
        const r = 1.5 + seededNoise(73, i, 4) * 2.5;
        return <circle key={i} cx={x} cy={y} r={r} fill={BRAND.gold} opacity={op} />;
      })}
    </svg>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 13, stiffness: 150, mass: 0.9 } });
  const y = interpolate(slam, [0, 1], [-60, 0]);
  const op = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineOp = interpolate(frame, [CARD_AT, CARD_AT + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineY = interpolate(frame, [CARD_AT, CARD_AT + 12], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: NAME_TOP,
        left: width * 0.1,
        width: width * 0.8,
        textAlign: "center",
        fontFamily: FONT_FAMILY,
        opacity: op,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ fontSize: 110, fontWeight: 900, color: BRAND.ink, letterSpacing: -2, textShadow: `0 0 30px ${BRAND.pop}55` }}>
        RONALDO
      </div>
      <div style={{ fontSize: 40, fontWeight: 700, color: BRAND.pop, marginTop: 14, letterSpacing: 1, opacity: lineOp, transform: `translateY(${lineY}px)` }}>
        Portugal · 41 · forward
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Self-contained EMPTY trophy: bowl draws in, "NEVER WON" sits INSIDE the bowl,
// WORLD CUP label sits BELOW (not behind), pulse + cold glint after GLINT_AT.
// Everything locked to one origin so nothing overlaps.
// ---------------------------------------------------------------------------
const EmptyTrophy: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const draw = interpolate(frame, [TROPHY_AT, TROPHY_AT + 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const appear = interpolate(frame, [TROPHY_AT, TROPHY_AT + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const neverOp = interpolate(frame, [TROPHY_AT + 26, TROPHY_AT + 42], [0, 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelOp = interpolate(frame, [TROPHY_AT + 16, TROPHY_AT + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const pulse = frame >= GLINT_AT ? 0.97 + (Math.sin((frame - GLINT_AT) * 0.1) * 0.5 + 0.5) * 0.06 : 1;
  const glintProg = frame >= GLINT_AT ? (((frame - GLINT_AT) % 90) / 90) : -1;
  const glintY = 30 + glintProg * 150;
  const glintOp = glintProg >= 0 ? Math.sin(glintProg * Math.PI) * 0.6 : 0;

  const TROPHY_W = 220;
  return (
    <div
      style={{
        position: "absolute",
        top: TROPHY_TOP,
        left: width / 2 - TROPHY_W / 2,
        width: TROPHY_W,
        opacity: appear,
        transform: `scale(${pulse})`,
        transformOrigin: "center top",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ position: "relative", width: TROPHY_W, height: 240 }}>
        <svg width={TROPHY_W} height={240} viewBox="0 0 220 240" style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
          <path
            d="M70 28 H150 V84 Q150 132 110 140 Q70 132 70 84 Z M70 44 Q30 44 30 72 Q30 104 70 108 M150 44 Q190 44 190 72 Q190 104 150 108 M110 140 V182 M78 182 H142 M64 210 H156 L146 182 H74 Z"
            fill="none"
            stroke={BRAND.gold}
            strokeWidth={4}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={draw}
          />
          {/* cold glint sweeping down the bowl */}
          {glintOp > 0 && (
            <line x1={50} y1={glintY} x2={170} y2={glintY - 24} stroke={BRAND.ink} strokeWidth={5} opacity={glintOp} />
          )}
        </svg>
        {/* NEVER WON inside the bowl */}
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 0,
            width: "100%",
            textAlign: "center",
            fontSize: 30,
            fontWeight: 800,
            color: BRAND.ink,
            opacity: neverOp,
            letterSpacing: 2,
            lineHeight: 1.05,
          }}
        >
          NEVER
          <br />
          WON
        </div>
      </div>
      {/* WORLD CUP label BELOW the trophy */}
      <div style={{ textAlign: "center", fontSize: 34, fontWeight: 700, color: BRAND.gold, opacity: labelOp, letterSpacing: 3, marginTop: 12 }}>
        WORLD CUP
      </div>
    </div>
  );
};

const PartPip: React.FC<{ n: number }> = ({ n }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 160, mass: 0.6 } });
  const scale = interpolate(enter, [0, 1], [0.4, 1]);
  const op = interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: SAFE_BOTTOM + 70, left: width * 0.125, opacity: op, transform: `scale(${scale})`, transformOrigin: "left center", fontFamily: FONT_FAMILY }}>
      <div style={{ padding: "8px 18px", borderRadius: 999, background: `${BRAND.bgAlt}E6`, border: `2px solid ${BRAND.teal}`, color: BRAND.teal, fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>
        PART {n}
      </div>
    </div>
  );
};

const FinalStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const enter = spring({ frame: frame - FINAL_AT, fps, config: { damping: 12, stiffness: 150, mass: 0.7 } });
  const scale = interpolate(enter, [0, 1], [1.18, 1]);
  const op = interpolate(frame, [FINAL_AT, FINAL_AT + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: FINAL_TOP, left: width * 0.1, width: width * 0.8, textAlign: "center", opacity: op, transform: `scale(${scale})`, transformOrigin: "center", fontFamily: FONT_FAMILY }}>
      <div style={{ fontSize: 78, fontWeight: 900, color: BRAND.gold, letterSpacing: -1, textShadow: `0 0 40px ${BRAND.gold}55` }}>
        HIS FINAL SHOT
      </div>
    </div>
  );
};

export const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [SCENE03_DURATION - 10, SCENE03_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY, opacity: fadeOut }}>
      <Audio src={staticFile("v3_who_to_watch/Scene03.mp3")} />

      {/* CONTINUOUS / AMBIENT */}
      <MapBase />
      <DriftingSeven />
      <GoldDust />

      {/* spread top -> bottom across the full safe zone */}
      <Hook />
      <StatStamp label="5 BALLON d'ORS" atFrame={BALLON_AT} accent="gold" top={BALLON_TOP} />
      <CountUp to={950} suffix="+" atFrame={COUNT_AT} label="CAREER GOALS" durationFrames={COUNT_DUR} top={COUNT_TOP} />
      <EmptyTrophy />
      <FinalStamp />

      <PartPip n={1} />
      <SourceChip text="Ronaldo: 41, 6th WC, 5 Ballon d'Ors, ~950 goals, never won — FIFA/ESPN" fadeInAt={20} />
    </AbsoluteFill>
  );
};
