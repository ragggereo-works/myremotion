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
import { BRAND, FONT_FAMILY, SAFE_TOP } from "../../../../brand";
import { GlyphArt, PitchBG, TallyRow } from "./shared";

/*
 * SCENE 2 — The basics, rapid-fire. (382 frames @ 30fps)
 * VO: football_rules/Scene02.mp3 (12.40s) -> ceil((12.40 + 0.3) * 30) = 382.
 * NO b-roll — diagrams only.
 *
 * Each beat springs in center, holds ~2s, then shrinks up into its TallyRow
 * slot, which lights teal as it docks:
 *   beat 1 @ 8    "11 v 11" + player dots fanning      -> slot 0 (ball)
 *   beat 2 @ 70   "45 + 45" + sweeping clock arc        -> slot 1 (clock)
 *   beat 3 @ 150  goal-line diagram: 99% = NO, 100% = GOAL -> slot 2 (goal)
 *   beat 4 @ 262  ✋✕ no-hands, keeper-in-box ✓ exception -> slot 3 (hand)
 * End state: first 4 glyphs lit; OFFSIDE + CARDS dim.
 */

export const SCENE02_DURATION = 382;

// VO sync constants (adjust if a phrase lands differently)
const B1_AT = 8; //   "Eleven players"
const B2_AT = 70; //  "Two halves"
const B3_AT = 150; // "a goal only counts…" (GOAL flash ≈ "whole ball crosses")
const B4_AT = 262; // "No hands"

const B1_DOCK = 68;
const B2_DOCK = 132;
const B3_DOCK = 252;
const B4_DOCK = 348;

const DOCK_LEN = 16;
const SLOT_SPACING = 70; // TallyRow: 44px glyph + 26px gap

// ---------------------------------------------------------------------------
// Beat wrapper — spring-in center, hold, shrink up into TallyRow slot.
// ---------------------------------------------------------------------------
const Beat: React.FC<{
  enterAt: number;
  dockAt: number;
  slot: number;
  children: React.ReactNode;
}> = ({ enterAt, dockAt, slot, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (frame < enterAt || frame > dockAt + DOCK_LEN) return null;

  const enterScale = interpolate(
    frame,
    [enterAt, enterAt + 8, enterAt + 13],
    [0.3, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const enterOp = interpolate(frame, [enterAt, enterAt + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dockP = interpolate(frame, [dockAt, dockAt + DOCK_LEN], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const cx = width / 2;
  const cy = height * 0.47;
  const slotX = width / 2 + (slot - 2.5) * SLOT_SPACING;
  const slotY = SAFE_TOP + 36;

  const x = interpolate(dockP, [0, 1], [cx, slotX]);
  const y = interpolate(dockP, [0, 1], [cy, slotY]);
  const scale = enterScale * interpolate(dockP, [0, 1], [1, 0.1]);
  const opacity =
    enterOp *
    interpolate(dockP, [0.82, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — "11 v 11" with two rows of player dots fanning out.
// ---------------------------------------------------------------------------
const Beat1: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - B1_AT;
  const row = (color: string, yOff: number) => (
    <div style={{ position: "relative", height: 30 }}>
      {Array.from({ length: 11 }).map((_, i) => {
        const spread = interpolate(
          local,
          [6 + Math.abs(i - 5) * 2, 16 + Math.abs(i - 5) * 2],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${(i - 5) * 52 * spread}px)`,
              top: yOff,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: color,
              transform: "translateX(-50%)",
              opacity: 0.3 + spread * 0.7,
            }}
          />
        );
      })}
    </div>
  );
  return (
    <div style={{ textAlign: "center", width: 640 }}>
      {row(BRAND.teal, 0)}
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 130,
          fontWeight: 900,
          color: BRAND.ink,
          lineHeight: 1.15,
          textShadow: "0 8px 36px rgba(0,0,0,0.55)",
        }}
      >
        11 v 11
      </div>
      {row(BRAND.pop, 8)}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — "45 + 45" with a sweeping clock arc.
// ---------------------------------------------------------------------------
const Beat2: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - B2_AT;
  const sweep = interpolate(local, [8, 52], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 38,
        width: 640,
        justifyContent: "center",
      }}
    >
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle
          cx={65}
          cy={65}
          r={54}
          fill="none"
          stroke={BRAND.ink}
          strokeWidth={5}
          opacity={0.35}
        />
        <circle
          cx={65}
          cy={65}
          r={54}
          fill="none"
          stroke={BRAND.teal}
          strokeWidth={6}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={sweep}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
        />
        <circle cx={65} cy={65} r={5} fill={BRAND.ink} />
        <line
          x1={65}
          y1={65}
          x2={65 + Math.sin((1 - sweep) * Math.PI * 2) * 38}
          y2={65 - Math.cos((1 - sweep) * Math.PI * 2) * 38}
          stroke={BRAND.ink}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 120,
          fontWeight: 900,
          color: BRAND.ink,
          textShadow: "0 8px 36px rgba(0,0,0,0.55)",
        }}
      >
        45 + 45
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — goal-line micro diagram (side view, geometry accurate).
// The line has width; the WHOLE ball must cross its far edge.
// ---------------------------------------------------------------------------
const LINE_X = 380; // near edge of the goal line band
const LINE_W = 16; // the line itself
const BALL_R = 44;

const Beat3: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - B3_AT;

  // phase A: slide to 99%-over (trailing edge still above the line band)
  const xA = LINE_X + LINE_W + BALL_R - 6; // trailing edge 6px inside the band
  // phase B: fully across (trailing edge past the far edge)
  const xB = LINE_X + LINE_W + BALL_R + 38;

  const ballX = interpolate(local, [4, 26, 58, 68], [160, xA, xA, xB], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  const noStamp = interpolate(local, [28, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const noGone = local >= 64;
  const goalFlash = interpolate(local, [70, 76, 88], [0, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const groundY = 250;

  return (
    <div style={{ position: "relative", width: 660, height: 330 }}>
      <svg width={660} height={330}>
        {/* ground */}
        <line
          x1={20}
          y1={groundY}
          x2={640}
          y2={groundY}
          stroke={BRAND.ink}
          strokeWidth={4}
          opacity={0.5}
        />
        {/* the goal line (has real width) */}
        <rect
          x={LINE_X}
          y={groundY - 4}
          width={LINE_W}
          height={8}
          fill={BRAND.ink}
        />
        {/* dashed vertical plane at the FAR edge — what the ball must clear */}
        <line
          x1={LINE_X + LINE_W}
          y1={70}
          x2={LINE_X + LINE_W}
          y2={groundY + 30}
          stroke={BRAND.ink}
          strokeWidth={2.5}
          strokeDasharray="10 8"
          opacity={0.55}
        />
        {/* the ball */}
        <circle
          cx={ballX}
          cy={groundY - BALL_R}
          r={BALL_R}
          fill="none"
          stroke={BRAND.ink}
          strokeWidth={5}
        />
        <circle
          cx={ballX}
          cy={groundY - BALL_R}
          r={BALL_R * 0.3}
          fill={BRAND.ink}
          opacity={0.7}
        />
        {/* GOAL burst */}
        {goalFlash > 0 &&
          Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={ballX + Math.cos(a) * (BALL_R + 12)}
                y1={groundY - BALL_R + Math.sin(a) * (BALL_R + 12)}
                x2={ballX + Math.cos(a) * (BALL_R + 30)}
                y2={groundY - BALL_R + Math.sin(a) * (BALL_R + 30)}
                stroke={BRAND.teal}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={goalFlash}
              />
            );
          })}
      </svg>
      {/* NO — 99% is not enough */}
      {!noGone && noStamp > 0 && (
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 18,
            fontFamily: FONT_FAMILY,
            fontSize: 76,
            fontWeight: 900,
            color: BRAND.pop,
            transform: `scale(${interpolate(noStamp, [0, 1], [1.4, 1])}) rotate(-6deg)`,
            opacity: noStamp,
            textShadow: `0 0 24px ${BRAND.pop}66`,
          }}
        >
          NO
        </div>
      )}
      {/* GOAL — the whole ball is over */}
      {goalFlash > 0 && (
        <div
          style={{
            position: "absolute",
            left: 420,
            top: 10,
            fontFamily: FONT_FAMILY,
            fontSize: 80,
            fontWeight: 900,
            color: BRAND.teal,
            transform: `scale(${0.7 + goalFlash * 0.3})`,
            opacity: goalFlash,
            textShadow: `0 0 30px ${BRAND.teal}88`,
          }}
        >
          GOAL
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beat 4 — ✋✕ no-hands, then the keeper-in-box exception gets a ✓.
// ---------------------------------------------------------------------------
const Beat4: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - B4_AT;

  const xStamp = interpolate(local, [10, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const boxDraw = interpolate(local, [34, 56], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const keeperIn = interpolate(local, [44, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const checkStamp = interpolate(local, [58, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 60,
        width: 680,
        justifyContent: "center",
      }}
    >
      {/* big hand + pop ✕ */}
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width={200} height={200} viewBox="0 0 44 44">
          <GlyphArt name="hand" color={BRAND.ink} />
        </svg>
        {xStamp > 0 && (
          <svg
            width={200}
            height={200}
            viewBox="0 0 100 100"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `scale(${interpolate(xStamp, [0, 1], [1.6, 1])})`,
              opacity: xStamp,
            }}
          >
            <line
              x1={20}
              y1={20}
              x2={80}
              y2={80}
              stroke={BRAND.pop}
              strokeWidth={11}
              strokeLinecap="round"
            />
            <line
              x1={80}
              y1={20}
              x2={20}
              y2={80}
              stroke={BRAND.pop}
              strokeWidth={11}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* the exception: keeper inside a drawn box, teal ✓ */}
      <div style={{ position: "relative", width: 280, height: 210 }}>
        <svg width={280} height={210}>
          {/* penalty box outline draws on */}
          <rect
            x={8}
            y={8}
            width={264}
            height={194}
            rx={6}
            fill="none"
            stroke={BRAND.ink}
            strokeWidth={4}
            opacity={0.8}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={boxDraw}
          />
          {/* keeper: arms up */}
          <g opacity={keeperIn} fill={BRAND.ink} stroke={BRAND.ink}>
            <circle cx={140} cy={72} r={16} stroke="none" />
            <path
              d="M140 88 L140 138"
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M140 100 L112 64 M140 100 L168 64"
              strokeWidth={9}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M140 138 L124 172 M140 138 L156 172"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {/* teal ✓ */}
          {checkStamp > 0 && (
            <g
              transform={`translate(196 28) scale(${interpolate(checkStamp, [0, 1], [1.7, 1])})`}
              opacity={checkStamp}
            >
              <polyline
                points="0,18 14,32 40,0"
                fill="none"
                stroke={BRAND.teal}
                strokeWidth={11}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export const Scene02: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("football_rules/Scene02.mp3")} />

      <PitchBG />

      <Beat enterAt={B1_AT} dockAt={B1_DOCK} slot={0}>
        <Beat1 />
      </Beat>
      <Beat enterAt={B2_AT} dockAt={B2_DOCK} slot={1}>
        <Beat2 />
      </Beat>
      <Beat enterAt={B3_AT} dockAt={B3_DOCK} slot={2}>
        <Beat3 />
      </Beat>
      <Beat enterAt={B4_AT} dockAt={B4_DOCK} slot={3}>
        <Beat4 />
      </Beat>

      {/* tally — slots light as their beat docks; flag + card stay dim */}
      <TallyRow
        items={[
          { glyph: "ball", litAt: B1_DOCK + DOCK_LEN - 2 },
          { glyph: "clock", litAt: B2_DOCK + DOCK_LEN - 2 },
          { glyph: "goal", litAt: B3_DOCK + DOCK_LEN - 2 },
          { glyph: "hand", litAt: B4_DOCK + DOCK_LEN - 2 },
          { glyph: "flag" },
          { glyph: "card" },
        ]}
      />
    </AbsoluteFill>
  );
};
