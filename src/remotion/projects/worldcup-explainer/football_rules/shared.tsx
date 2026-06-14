import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP, TEXT_ZONE_PCT } from "../../../../brand";

/*
 * Shared components for the football_rules Short.
 * All motion is frame-driven and deterministic.
 */

// ---------------------------------------------------------------------------
// <PitchBG> — scrolling mowing-stripe gradient (two navy tones) with faint
// chalk lines that draw themselves on a slow ping-pong loop.
// ---------------------------------------------------------------------------
const CHALK_LOOP = 360; // frames per draw/undraw cycle

export const PitchBG: React.FC<{ chalkOpacity?: number }> = ({
  chalkOpacity = 0.12,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // stripes scroll slowly downward, wrapping seamlessly
  const STRIPE = 180;
  const scroll = (frame * 0.6) % (STRIPE * 2);

  // chalk draw progress: triangle wave — draws on, then wipes off, repeat
  const cyc = (frame % CHALK_LOOP) / CHALK_LOOP;
  const tri = cyc < 0.5 ? cyc * 2 : (1 - cyc) * 2;
  const draw = interpolate(tri, [0, 0.85], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.28;

  const chalk = {
    fill: "none",
    stroke: BRAND.ink,
    strokeWidth: 2.5,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: draw,
  } as const;

  return (
    <AbsoluteFill style={{ background: BRAND.bg }}>
      {/* mowing stripes */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          top: -STRIPE * 2,
          height: height + STRIPE * 4,
          background: `repeating-linear-gradient(180deg, ${BRAND.bgAlt} 0px, ${BRAND.bgAlt} ${STRIPE}px, ${BRAND.bg} ${STRIPE}px, ${BRAND.bg} ${STRIPE * 2}px)`,
          transform: `translateY(${scroll}px)`,
        }}
      />
      {/* faint chalk geometry, drawing on a slow loop */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", opacity: chalkOpacity }}
      >
        <line x1={0} y1={cy} x2={width} y2={cy} {...chalk} />
        <circle cx={cx} cy={cy} r={r} {...chalk} />
        <circle cx={cx} cy={cy} r={5} fill={BRAND.ink} opacity={1 - draw} />
        {/* corner arc hints */}
        <path
          d={`M 0 ${height * 0.12} Q ${width * 0.06} ${height * 0.12} ${width * 0.06} ${height * 0.155}`}
          {...chalk}
        />
        <path
          d={`M ${width} ${height * 0.88} Q ${width * 0.94} ${height * 0.88} ${width * 0.94} ${height * 0.845}`}
          {...chalk}
        />
      </svg>
      {/* corner vignette to keep edges calm */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// <TallyRow> — small concept glyphs pinned at the top of the safe zone.
// Each glyph lights up (teal, pop-scale) at its `litAt` frame; unlit glyphs
// stay as faint ink outlines. Scenes choose the glyph list + lit frames.
// ---------------------------------------------------------------------------
export type GlyphName =
  | "ball"
  | "goal"
  | "card"
  | "whistle"
  | "flag"
  | "clock"
  | "trophy"
  | "hand";

export interface TallyItem {
  glyph: GlyphName;
  /** frame at which this concept lights up; omit to keep it unlit */
  litAt?: number;
}

export const GlyphArt: React.FC<{ name: GlyphName; color: string }> = ({
  name,
  color,
}) => {
  switch (name) {
    case "ball":
      return (
        <g>
          <circle cx={22} cy={22} r={16} fill="none" stroke={color} strokeWidth={3} />
          <path
            d="M22 14 L29 19 L26.5 27 L17.5 27 L15 19 Z"
            fill={color}
          />
        </g>
      );
    case "goal":
      return (
        <g stroke={color} strokeWidth={3} fill="none">
          <path d="M8 34 V12 H36 V34" />
          <path d="M12 16 H32 M12 22 H32 M12 28 H32" strokeWidth={1.5} />
          <path d="M16 12 V34 M22 12 V34 M28 12 V34" strokeWidth={1.5} />
        </g>
      );
    case "card":
      return (
        <rect x={13} y={8} width={18} height={26} rx={3} fill={color} />
      );
    case "whistle":
      return (
        <g fill={color}>
          <circle cx={18} cy={26} r={10} />
          <path d="M18 16 L36 16 L36 23 L26 25 Z" />
          <circle cx={18} cy={26} r={3.5} fill={BRAND.bg} />
        </g>
      );
    case "flag":
      return (
        <g>
          <line x1={14} y1={6} x2={14} y2={38} stroke={color} strokeWidth={3} />
          <path d="M14 8 L34 13 L14 20 Z" fill={color} />
        </g>
      );
    case "clock":
      return (
        <g stroke={color} strokeWidth={3} fill="none">
          <circle cx={22} cy={22} r={15} />
          <path d="M22 13 V22 L29 26" strokeLinecap="round" />
        </g>
      );
    case "trophy":
      return (
        <g fill={color}>
          <path d="M13 8 H31 L29.5 19 Q27.5 26 22 27.5 Q16.5 26 14.5 19 Z" />
          <rect x={20} y={27} width={4} height={5} />
          <rect x={15} y={32} width={14} height={3.5} rx={1.5} />
        </g>
      );
    case "hand":
      return (
        <g fill={color}>
          {/* four fingers */}
          <rect x={14} y={9} width={3.6} height={16} rx={1.8} />
          <rect x={19} y={6} width={3.6} height={19} rx={1.8} />
          <rect x={24} y={7} width={3.6} height={18} rx={1.8} />
          <rect x={29} y={10} width={3.6} height={15} rx={1.8} />
          {/* palm */}
          <path d="M14 22 H33 V30 Q33 37 24 37 Q14 37 14 29 Z" />
          {/* thumb */}
          <rect
            x={9}
            y={21}
            width={3.6}
            height={11}
            rx={1.8}
            transform="rotate(-28 11 22)"
          />
        </g>
      );
  }
};

// ---------------------------------------------------------------------------
// <BRollBed> — footage UNDER the graphics at a stated low opacity.
// ---------------------------------------------------------------------------
export const BRollBed: React.FC<{
  src: string;
  opacity?: number;
  scaleFrom?: number;
  scaleTo?: number;
  playbackRate?: number;
}> = ({ src, opacity = 0.2, scaleFrom = 1, scaleTo = 1, playbackRate = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [scaleFrom, scaleTo],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        playbackRate={playbackRate}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "saturate(0.6) contrast(1.05) brightness(0.8)",
        }}
      />
    </AbsoluteFill>
  );
};

export const TallyRow: React.FC<{ items: TallyItem[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const size = 44;
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE_TOP + 14,
        left: (width * (1 - TEXT_ZONE_PCT)) / 2,
        right: (width * (1 - TEXT_ZONE_PCT)) / 2,
        display: "flex",
        justifyContent: "center",
        gap: 26,
        fontFamily: FONT_FAMILY,
      }}
    >
      {items.map((item, i) => {
        const lit = item.litAt !== undefined && frame >= item.litAt;
        const pop =
          item.litAt === undefined
            ? 0
            : interpolate(frame, [item.litAt, item.litAt + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        const scale = lit ? 1 + (1 - pop) * 0.45 : 1;
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              transform: `scale(${scale})`,
              opacity: lit ? 1 : 0.25,
              filter: lit
                ? `drop-shadow(0 0 8px ${BRAND.teal}99)`
                : "none",
            }}
          >
            <svg width={size} height={size} viewBox="0 0 44 44">
              <GlyphArt name={item.glyph} color={lit ? BRAND.teal : BRAND.ink} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
