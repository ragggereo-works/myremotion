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
import {
  BRAND,
  FONT_FAMILY,
  SAFE_BOTTOM,
  SAFE_TOP,
} from "../../../../../brand";
import { MemoryLook, SourceChip } from "./shared";

/*
 * SCENE 3 — The run: Goal of the Century. (459 frames @ 30fps, 1080x1920)
 * VO: Scene03.mp3 from frame 0 (14.6s). Grainy treatment, NO b-roll —
 * the top-down pitch diagram is the star.
 *
 * Beats:
 *   0-40    chalk pitch draws on (real 68:105 geometry, vertical, goals top/bottom)
 *   50-300  gold dot slaloms past five retreating red defenders, glowing trail
 *           stays; radial burst on the "goal" at ~300
 *   310     "GOAL OF THE CENTURY" stamps in, gold, lower half + poll chip
 *   370-459 split card slides up: 51' the cheat / 55' the masterpiece,
 *           teal line with 4-tick progression between them
 */

export const SCENE03_DURATION = 459;

const TITLE_AT = 310;
const BURST_AT = 300;
const CARD_AT = 370;

// ---------------------------------------------------------------------------
// Pitch geometry — real proportions. 105m long, 68m wide; center circle r=9.15m;
// penalty box 40.32m x 16.5m; goal area 18.32m x 5.5m. Vertical orientation.
// ---------------------------------------------------------------------------
const usePitchRect = () => {
  const { width, height } = useVideoConfig();
  const pitchH = height * 0.675;
  const pitchW = pitchH * (68 / 105);
  const x = (width - pitchW) / 2;
  const y = SAFE_TOP + (height - SAFE_TOP - SAFE_BOTTOM - pitchH) / 2;
  const m = pitchH / 105; // pixels per meter
  return { x, y, pitchW, pitchH, m };
};

// helper: stagger draw-on of one chalk element
const useDraw = (from: number, to: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
};

const ChalkPitch: React.FC = () => {
  const { x, y, pitchW, pitchH, m } = usePitchRect();

  const boxW = 40.32 * m;
  const boxD = 16.5 * m;
  const goalW = 18.32 * m;
  const goalD = 5.5 * m;
  const r = 9.15 * m;
  const cx = x + pitchW / 2;
  const cy = y + pitchH / 2;

  const outline = useDraw(0, 26);
  const halfway = useDraw(8, 30);
  const circle = useDraw(14, 36);
  const boxes = useDraw(20, 40);

  const stroke = BRAND.ink;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 3,
    pathLength: 1,
    strokeDasharray: 1,
  } as const;

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", opacity: 0.4 }}
    >
      {/* touchlines + goal lines */}
      <rect
        x={x}
        y={y}
        width={pitchW}
        height={pitchH}
        {...common}
        strokeDashoffset={outline}
      />
      {/* halfway line */}
      <line
        x1={x}
        y1={cy}
        x2={x + pitchW}
        y2={cy}
        {...common}
        strokeDashoffset={halfway}
      />
      {/* center circle + spot */}
      <circle cx={cx} cy={cy} r={r} {...common} strokeDashoffset={circle} />
      <circle cx={cx} cy={cy} r={3.5} fill={stroke} opacity={1 - circle} />
      {/* top penalty box + goal area */}
      <rect
        x={cx - boxW / 2}
        y={y}
        width={boxW}
        height={boxD}
        {...common}
        strokeDashoffset={boxes}
      />
      <rect
        x={cx - goalW / 2}
        y={y}
        width={goalW}
        height={goalD}
        {...common}
        strokeDashoffset={boxes}
      />
      {/* bottom penalty box + goal area */}
      <rect
        x={cx - boxW / 2}
        y={y + pitchH - boxD}
        width={boxW}
        height={boxD}
        {...common}
        strokeDashoffset={boxes}
      />
      <rect
        x={cx - goalW / 2}
        y={y + pitchH - goalD}
        width={goalW}
        height={goalD}
        {...common}
        strokeDashoffset={boxes}
      />
      {/* penalty spots (11m from each goal line) */}
      <circle cx={cx} cy={y + 11 * m} r={3.5} fill={stroke} opacity={1 - boxes} />
      <circle
        cx={cx}
        cy={y + pitchH - 11 * m}
        r={3.5}
        fill={stroke}
        opacity={1 - boxes}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The run — Catmull-Rom path through slalom waypoints, sampled densely.
// Coordinates are (fraction of pitch width, fraction of pitch length from top).
// Starts in own half (bottom), finishes in the top box.
// ---------------------------------------------------------------------------
const WAYPOINTS: Array<[number, number]> = [
  [0.58, 0.72], // own half, right of center
  [0.66, 0.6],
  [0.46, 0.5],
  [0.62, 0.4],
  [0.44, 0.3],
  [0.55, 0.2],
  [0.5, 0.09], // top penalty box
  [0.5, 0.035], // goal mouth
];

// defenders sit near the slalom kinks (slightly offset, beaten as dot passes)
const DEFENDERS: Array<[number, number]> = [
  [0.58, 0.585],
  [0.54, 0.495],
  [0.54, 0.41],
  [0.52, 0.305],
  [0.47, 0.185],
];

const catmullRom = (
  pts: Array<[number, number]>,
  samples: number,
): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  const get = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let s = 0; s < samples; s++) {
    const t = (s / (samples - 1)) * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(t));
    const u = t - i;
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const blend = (a: number, b: number, c: number, d: number) =>
      0.5 *
      (2 * b +
        (-a + c) * u +
        (2 * a - 5 * b + 4 * c - d) * u * u +
        (-a + 3 * b - 3 * c + d) * u * u * u);
    out.push([
      blend(p0[0], p1[0], p2[0], p3[0]),
      blend(p0[1], p1[1], p2[1], p3[1]),
    ]);
  }
  return out;
};

const SAMPLES = 240;

const TheRun: React.FC = () => {
  const frame = useCurrentFrame();
  const { x, y, pitchW, pitchH } = usePitchRect();

  const toPx = (p: [number, number]): [number, number] => [
    x + p[0] * pitchW,
    y + p[1] * pitchH,
  ];
  const path = catmullRom(WAYPOINTS, SAMPLES).map(toPx);

  // run progress, frames 50-295
  const t = interpolate(frame, [50, 295], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const idx = Math.max(1, Math.floor(t * (SAMPLES - 1)));
  const dot = path[idx];
  const trailPts = path
    .slice(0, idx + 1)
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");

  // defenders fade in 42-60, then drift "retreating" toward their own goal (up)
  // ...they defend the TOP goal, so they back up (y decreases) as the dot nears.
  const defIn = (i: number) =>
    interpolate(frame, [42 + i * 4, 58 + i * 4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const retreat = interpolate(frame, [50, 295], [0, -14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // goal burst at ~300
  const burst = interpolate(frame, [BURST_AT, BURST_AT + 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const goalPt = path[SAMPLES - 1];

  return (
    <svg width="100%" height="100%" style={{ position: "absolute" }}>
      {/* glowing trail — blurred underlay + crisp line. STAYS on screen. */}
      {idx > 1 && (
        <>
          <polyline
            points={trailPts}
            fill="none"
            stroke={BRAND.gold}
            strokeWidth={13}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            style={{ filter: "blur(7px)" }}
          />
          <polyline
            points={trailPts}
            fill="none"
            stroke={BRAND.gold}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        </>
      )}

      {/* five beaten defenders */}
      {DEFENDERS.map((d, i) => {
        const [dx, dy] = toPx(d);
        return (
          <circle
            key={i}
            cx={dx}
            cy={dy + retreat}
            r={13}
            fill={BRAND.pop}
            opacity={defIn(i) * 0.9}
          />
        );
      })}

      {/* the gold dot (halo + core) */}
      {frame >= 50 && (
        <>
          <circle
            cx={dot[0]}
            cy={dot[1]}
            r={26}
            fill={BRAND.gold}
            opacity={0.25}
            style={{ filter: "blur(6px)" }}
          />
          <circle cx={dot[0]} cy={dot[1]} r={13} fill={BRAND.gold} />
        </>
      )}

      {/* radial burst on the goal */}
      {frame >= BURST_AT &&
        Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const r0 = 18 + burst * 52;
          const r1 = r0 + 26 * (1 - burst);
          return (
            <line
              key={i}
              x1={goalPt[0] + Math.cos(a) * r0}
              y1={goalPt[1] + Math.sin(a) * r0}
              x2={goalPt[0] + Math.cos(a) * r1}
              y2={goalPt[1] + Math.sin(a) * r1}
              stroke={BRAND.gold}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={(1 - burst) * 0.9}
            />
          );
        })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title + poll chip, stamps at ~310 over the lower half.
// ---------------------------------------------------------------------------
const CenturyTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const stamp = interpolate(frame, [TITLE_AT, TITLE_AT + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: height * 0.6,
        left: width * 0.125,
        right: width * 0.125,
        textAlign: "center",
        transform: `scale(${interpolate(stamp, [0, 1], [1.15, 1])})`,
        opacity: stamp,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: width * 0.058,
          fontWeight: 900,
          letterSpacing: "0.04em",
          color: BRAND.gold,
          textShadow: `0 0 ${width * 0.035}px rgba(255,209,102,0.4), 0 8px 36px rgba(0,0,0,0.6)`,
        }}
      >
        GOAL OF THE CENTURY
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT_FAMILY,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "0.12em",
          color: BRAND.ink,
          opacity: 0.7,
        }}
      >
        official FIFA poll, 2002
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Split card — 51' the cheat / 55' the masterpiece, 4-tick teal progression.
// Slides up from the bottom of the safe zone at ~370.
// ---------------------------------------------------------------------------
const SplitCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const slide = interpolate(frame, [CARD_AT, CARD_AT + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const halfStyle: React.CSSProperties = {
    flex: 1,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.125,
        right: width * 0.125,
        bottom: SAFE_BOTTOM + height * 0.035,
        borderRadius: 20,
        padding: "30px 22px 26px",
        background: `${BRAND.bg}E6`,
        border: `1.5px solid ${BRAND.teal}4D`,
        boxShadow: `0 18px 50px rgba(0,0,0,0.5)`,
        transform: `translateY(${(1 - slide) * 220}px)`,
        opacity: slide,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={halfStyle}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: BRAND.pop,
              lineHeight: 1.1,
            }}
          >
            51&prime;
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: BRAND.ink,
              opacity: 0.85,
              marginTop: 6,
            }}
          >
            THE CHEAT
          </div>
        </div>
        <div style={halfStyle}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: BRAND.gold,
              lineHeight: 1.1,
            }}
          >
            55&prime;
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: BRAND.ink,
              opacity: 0.85,
              marginTop: 6,
            }}
          >
            THE MASTERPIECE
          </div>
        </div>
      </div>

      {/* thin teal line with 4-tick progression (one tick per minute, 51→55) */}
      <div
        style={{
          position: "relative",
          height: 2,
          background: `${BRAND.teal}59`,
          margin: "22px 8% 4px",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const tickIn = interpolate(
            frame,
            [CARD_AT + 28 + i * 9, CARD_AT + 36 + i * 9],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(i / 3) * 100}%`,
                top: -7,
                width: 3,
                height: 16,
                background: BRAND.teal,
                transform: `translateX(-50%) scaleY(${tickIn})`,
                opacity: tickIn,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const Scene03: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("Scene03.mp3")} />

      <ChalkPitch />
      <TheRun />
      <CenturyTitle />
      <SplitCard />

      <SourceChip text="FIFA poll, 2002" fadeInAt={40} />

      <MemoryLook seed={3} />
    </AbsoluteFill>
  );
};
