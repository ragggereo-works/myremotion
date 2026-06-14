import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP } from "../../../../../brand";
import { BRollBed, MemoryLook, SourceChip } from "./shared";

/*
 * SCENE 4 — One stadium, three eras: Estadio Azteca. (369 frames @ 30fps)
 * VO: Scene04.mp3 from frame 0 (11.65s). Grainy treatment.
 * terraces_golden_v.mp4 is 361 frames -> played at 0.97x to cover 369.
 *
 * Beats:
 *   0-60   glowing teal timeline draws downward (center-left)
 *   70     node 1: "1970 · Pelé" ignites, left trophy silhouette fades in
 *   130    node 2: "1986 · Maradona" ignites, right trophy silhouette fades in
 *   200    node 3: "2026 · ?" ignites in gold, gently pulsing
 *   220    name card: "ESTADIO AZTECA / MEXICO CITY" — holds to end
 */

export const SCENE04_DURATION = 369;

// VO sync: the stadium name lands ~220. Adjust here.
const AZTECA_AT = 220;

const NODES = [
  { at: 70, label: "1970 · Pelé", gold: false, yPct: 0.22 },
  { at: 130, label: "1986 · Maradona", gold: false, yPct: 0.4 },
  { at: 200, label: "2026 · ?", gold: true, yPct: 0.57 },
] as const;

const LINE_X_PCT = 0.3; // center-left of the safe zone
const LINE_TOP_PCT = 0.165;
const LINE_BOTTOM_PCT = 0.63;

// ---------------------------------------------------------------------------
// Timeline — glowing teal line draws downward, nodes ignite in sequence.
// ---------------------------------------------------------------------------
const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const x = width * LINE_X_PCT;
  const yTop = height * LINE_TOP_PCT;
  const yBottom = height * LINE_BOTTOM_PCT;

  const draw = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const lineEnd = yTop + (yBottom - yTop) * draw;

  return (
    <>
      <svg width="100%" height="100%" style={{ position: "absolute" }}>
        {/* glow underlay + crisp line */}
        <line
          x1={x}
          y1={yTop}
          x2={x}
          y2={lineEnd}
          stroke={BRAND.teal}
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.3}
          style={{ filter: "blur(6px)" }}
        />
        <line
          x1={x}
          y1={yTop}
          x2={x}
          y2={lineEnd}
          stroke={BRAND.teal}
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={0.9}
        />
        {NODES.map((n, i) => {
          const y = height * n.yPct;
          const pop = interpolate(frame, [n.at, n.at + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          // 2026 node pulses gently forever after igniting
          const pulse = n.gold
            ? 0.7 + (Math.sin(frame * 0.09) * 0.5 + 0.5) * 0.3
            : 1;
          const color = n.gold ? BRAND.gold : BRAND.teal;
          return (
            <g key={i} opacity={pop * pulse}>
              <circle
                cx={x}
                cy={y}
                r={22}
                fill={color}
                opacity={0.25}
                style={{ filter: "blur(5px)" }}
              />
              <circle
                cx={x}
                cy={y}
                r={11 * (0.4 + pop * 0.6)}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
      {/* node labels (HTML for clean type) */}
      {NODES.map((n, i) => {
        const y = height * n.yPct;
        const pop = interpolate(frame, [n.at + 2, n.at + 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        const pulse = n.gold
          ? 0.7 + (Math.sin(frame * 0.09) * 0.5 + 0.5) * 0.3
          : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + 34,
              top: y,
              transform: `translateY(-50%) translateX(${(1 - pop) * 16}px)`,
              fontFamily: FONT_FAMILY,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: n.gold ? BRAND.gold : BRAND.ink,
              opacity: pop * pulse,
              textShadow: "0 4px 24px rgba(0,0,0,0.55)",
            }}
          >
            {n.label}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Generic trophy-lift silhouette — stylized figure, no real likeness.
// ---------------------------------------------------------------------------
const TrophyLift: React.FC<{ igniteAt: number; x: number; y: number; flip?: boolean }> = ({
  igniteAt,
  x,
  y,
  flip = false,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const fadeIn = interpolate(frame, [igniteAt, igniteAt + 24], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // dim once the name card lands so it never fights the type
  const dim = interpolate(frame, [AZTECA_AT, AZTECA_AT + 20], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const figW = width * 0.21;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: fadeIn * dim,
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <svg width={figW} height={figW * 1.3} viewBox="0 0 200 260">
        {/* trophy: bowl + handles + stem + base */}
        <path
          d="M72 22 L128 22 L124 52 Q118 72 100 76 Q82 72 76 52 Z"
          fill={BRAND.ink}
        />
        <path
          d="M70 26 Q52 30 58 46 Q62 58 78 56"
          fill="none"
          stroke={BRAND.ink}
          strokeWidth={7}
        />
        <path
          d="M130 26 Q148 30 142 46 Q138 58 122 56"
          fill="none"
          stroke={BRAND.ink}
          strokeWidth={7}
        />
        <rect x={93} y={76} width={14} height={16} fill={BRAND.ink} />
        <rect x={78} y={92} width={44} height={10} rx={3} fill={BRAND.ink} />
        {/* figure: head, torso, raised arms to the trophy, legs */}
        <circle cx={100} cy={132} r={17} fill={BRAND.ink} />
        <path
          d="M86 152 Q100 144 114 152 L118 212 Q100 222 82 212 Z"
          fill={BRAND.ink}
        />
        <path
          d="M88 156 L80 104"
          stroke={BRAND.ink}
          strokeWidth={13}
          strokeLinecap="round"
        />
        <path
          d="M112 156 L120 104"
          stroke={BRAND.ink}
          strokeWidth={13}
          strokeLinecap="round"
        />
        <path
          d="M90 218 L84 256"
          stroke={BRAND.ink}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d="M110 218 L116 256"
          stroke={BRAND.ink}
          strokeWidth={14}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Name card — "ESTADIO AZTECA / MEXICO CITY", lands at ~220, holds to end.
// ---------------------------------------------------------------------------
const NameCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const inOpacity = interpolate(frame, [AZTECA_AT, AZTECA_AT + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(
    frame,
    [AZTECA_AT, durationInFrames - 8],
    [0.97, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.125,
        right: width * 0.125,
        top: height * 0.68,
        textAlign: "center",
        opacity: inOpacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 90,
          fontWeight: 900,
          letterSpacing: "0.14em",
          lineHeight: 1.12,
          color: BRAND.gold,
          textShadow: `0 0 ${width * 0.035}px rgba(255,209,102,0.35), 0 8px 40px rgba(0,0,0,0.6)`,
        }}
      >
        ESTADIO
        <br />
        AZTECA
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: FONT_FAMILY,
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "0.32em",
          color: BRAND.ink,
          opacity: 0.9,
        }}
      >
        MEXICO CITY
      </div>
    </div>
  );
};

export const Scene04: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("Scene04.mp3")} />

      {/* terraces bed: ~22%, slow horizontal pan, slight overscan */}
      <BRollBed
        src="terraces_golden_v.mp4"
        opacity={0.22}
        scaleFrom={1.12}
        scaleTo={1.12}
        panFromX={-30}
        panToX={30}
        playbackRate={0.97}
      />

      <Timeline />

      {/* trophy lifts: 1970 left of the line, 1986 right */}
      <TrophyLift
        igniteAt={70}
        x={width * 0.06}
        y={height * 0.245}
      />
      <TrophyLift
        igniteAt={130}
        x={width * 0.66}
        y={height * 0.42}
        flip
      />

      <NameCard />

      <SourceChip text="1970 & 1986 finals, Azteca · FIFA" fadeInAt={40} />

      <MemoryLook seed={4} />
    </AbsoluteFill>
  );
};
