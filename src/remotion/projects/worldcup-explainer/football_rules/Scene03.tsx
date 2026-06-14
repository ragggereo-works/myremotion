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
import { BRAND, FONT_FAMILY, SAFE_BOTTOM } from "../../../../brand";
import { TallyRow } from "./shared";

/*
 * SCENE 3 — Offside, the argument-starter. (468 frames @ 30fps)
 * VO: football_rules/Scene03.mp3 (15.28s) -> ceil((15.28 + 0.3) * 30) = 468.
 * 100% diagram — full-screen top-down pitch, goal at top, real proportions.
 *
 * Beats:
 *   0-40    chalk pitch draws; actors fade in
 *   70-140  CASE 1: attacker drifts ABOVE the teal last-defender line
 *   170-200 the pass animates; FREEZE on arrival
 *   200-290 desaturate all but the attacker; "OFFSIDE" stamps w/ shake;
 *           linesman flag raises at the side
 *   300-345 CASE 2: reset, attacker level/below the line, same pass replays
 *   350     teal "FINE" stamps calmly
 *   370-440 flag pulses; arrow links it back to the red case (ghost marker)
 *   452     TallyRow: OFFSIDE flag glyph lights -> 5 of 6 lit
 */

export const SCENE03_DURATION = 468;

// --- VO sync constants -------------------------------------------------------
const PASS1_AT = 170; // "passes you the ball"
const FREEZE_AT = 200;
const OFFSIDE_AT = 245; // "can't already be behind the last defender"
const FLAG_UP_AT = 258;
const RESET_AT = 295; // "No goal-hanging" -> case 2
const PASS2_AT = 318;
const FINE_AT = 352;
const FLAG_BEAT_AT = 370; // "That flag you keep seeing?"
const TALLY_LIT_AT = 452;

// --- pitch mapping (real proportions, 68m wide x 105m long, goal at top) -----
const usePitch = () => {
  const { width, height } = useVideoConfig();
  const pitchW = width; // full-bleed width
  const pitchH = (width * 105) / 68;
  const offY = (height - pitchH) / 2;
  const P = (nx: number, ny: number): [number, number] => [
    nx * pitchW,
    offY + ny * pitchH,
  ];
  const m = pitchH / 105;
  return { pitchW, pitchH, offY, P, m };
};

// actor positions (normalized pitch coords; y measured from the TOP goal)
const LINE_Y = 0.18; // last outfield defender's line
const KEEPER = [0.52, 0.045] as const;
const DEFENDER = [0.42, LINE_Y] as const;
const MATE = [0.3, 0.46] as const;
const ATT_X = 0.66;
const ATT_OFFSIDE_Y = 0.115; // above the line (case 1)
const ATT_ONSIDE_Y = 0.215; // below the line (case 2)

export const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { P, m, offY, pitchH } = usePitch();

  // --- chalk draw-on ---------------------------------------------------------
  const draw = (from: number, to: number) =>
    interpolate(frame, [from, to], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  const actorsIn = interpolate(frame, [38, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- attacker movement -------------------------------------------------------
  // case 1: drift above the line; case 2: step back level/below
  const attY = interpolate(
    frame,
    [70, 140, RESET_AT, RESET_AT + 22],
    [ATT_ONSIDE_Y, ATT_OFFSIDE_Y, ATT_OFFSIDE_Y, ATT_ONSIDE_Y],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) },
  );
  const [attPx, attPy] = P(ATT_X, attY);

  // --- the pass (both cases use the same animation, one variable changed) -----
  const passProgress = (start: number) =>
    interpolate(frame, [start, start + 28], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    });
  const p1 = passProgress(PASS1_AT);
  const p2 = passProgress(PASS2_AT);
  const inCase2 = frame >= RESET_AT + 10;
  const passT = inCase2 ? p2 : p1;
  const [mateX, mateY] = P(MATE[0], MATE[1]);
  const ballX = interpolate(passT, [0, 1], [mateX + 26, attPx - 8]);
  const ballYBase = interpolate(passT, [0, 1], [mateY + 10, attPy + 6]);
  // slight arc on the ball
  const ballY = ballYBase - Math.sin(passT * Math.PI) * 60;

  // --- freeze + desaturate (case 1 only) --------------------------------------
  const dim = interpolate(
    frame,
    [FREEZE_AT, FREEZE_AT + 12, RESET_AT - 8, RESET_AT + 4],
    [1, 0.3, 0.3, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // --- stamps -----------------------------------------------------------------
  const offsideIn = interpolate(frame, [OFFSIDE_AT, OFFSIDE_AT + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offsideGone = interpolate(frame, [RESET_AT - 10, RESET_AT], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeAmp =
    Math.max(0, 1 - (frame - OFFSIDE_AT) / 14) * 6 * (frame >= OFFSIDE_AT ? 1 : 0);
  const shake = Math.sin(frame * 2.7) * shakeAmp;

  const fineIn = interpolate(frame, [FINE_AT, FINE_AT + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- linesman flag -----------------------------------------------------------
  const flagUp = interpolate(frame, [FLAG_UP_AT, FLAG_UP_AT + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const flagPulse =
    frame >= FLAG_BEAT_AT ? 1 + Math.sin((frame - FLAG_BEAT_AT) * 0.22) * 0.09 : 1;
  const flagRot = interpolate(flagUp, [0, 1], [-50, 0]);
  const [lineLX, lineLY] = P(0.5, LINE_Y);

  // --- arrow from flag to the red-case ghost ----------------------------------
  const arrowDraw = interpolate(frame, [FLAG_BEAT_AT + 6, FLAG_BEAT_AT + 26], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const ghostIn = interpolate(frame, [FLAG_BEAT_AT + 4, FLAG_BEAT_AT + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const [ghostX, ghostY] = P(ATT_X, ATT_OFFSIDE_Y);
  const flagTipX = width * 0.915;
  const flagTipY = lineLY + 38;

  // --- chip --------------------------------------------------------------------
  const chipIn = interpolate(frame, [80, 104], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // pitch geometry (meters -> px)
  const boxW = 40.32 * (width / 68);
  const boxD = 16.5 * m;
  const goalAreaW = 18.32 * (width / 68);
  const goalAreaD = 5.5 * m;
  const circleR = 9.15 * m;
  const chalk = {
    fill: "none",
    stroke: BRAND.ink,
    strokeWidth: 3,
    pathLength: 1,
    strokeDasharray: 1,
  } as const;

  const dot = (
    [x, y]: readonly [number, number],
    color: string,
    r: number,
    opacity = 1,
    glow = false,
  ) => (
    <circle
      cx={P(x, y)[0]}
      cy={P(x, y)[1]}
      r={r}
      fill={color}
      opacity={opacity}
      style={glow ? { filter: `drop-shadow(0 0 14px ${color})` } : undefined}
    />
  );

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("football_rules/Scene03.mp3")} />

      {/* ------------------------------------------------ pitch + actors ----- */}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {/* chalk pitch, dimmable during the freeze */}
        <g opacity={0.45 * dim}>
          <rect
            x={3}
            y={offY}
            width={width - 6}
            height={pitchH}
            {...chalk}
            strokeDashoffset={draw(0, 24)}
          />
          <line
            x1={0}
            y1={offY + pitchH / 2}
            x2={width}
            y2={offY + pitchH / 2}
            {...chalk}
            strokeDashoffset={draw(6, 28)}
          />
          <circle
            cx={width / 2}
            cy={offY + pitchH / 2}
            r={circleR}
            {...chalk}
            strokeDashoffset={draw(10, 34)}
          />
          <rect
            x={(width - boxW) / 2}
            y={offY}
            width={boxW}
            height={boxD}
            {...chalk}
            strokeDashoffset={draw(14, 38)}
          />
          <rect
            x={(width - goalAreaW) / 2}
            y={offY}
            width={goalAreaW}
            height={goalAreaD}
            {...chalk}
            strokeDashoffset={draw(16, 40)}
          />
          {/* goal mouth */}
          <rect
            x={(width - 7.32 * (width / 68)) / 2}
            y={offY - 26}
            width={7.32 * (width / 68)}
            height={26}
            {...chalk}
            strokeWidth={4}
            strokeDashoffset={draw(18, 40)}
          />
          <circle cx={width / 2} cy={offY + 11 * m} r={4} fill={BRAND.ink} />
        </g>

        {/* teal last-defender line */}
        <g opacity={dim}>
          <line
            x1={0}
            y1={lineLY}
            x2={width}
            y2={lineLY}
            stroke={BRAND.teal}
            strokeWidth={3.5}
            strokeDasharray="14 10"
            opacity={0.85 * actorsIn}
          />
        </g>

        {/* defenders + teammate + ball (dim during freeze) */}
        <g opacity={actorsIn * dim}>
          {dot(KEEPER, BRAND.pop, 17)}
          {dot(DEFENDER, BRAND.pop, 17)}
          {dot(MATE, BRAND.gold, 16, 0.75)}
          {/* the ball */}
          <circle
            cx={ballX}
            cy={ballY}
            r={11}
            fill={BRAND.ink}
            style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }}
          />
        </g>

        {/* the attacker — never dims; glows during the freeze */}
        <circle
          cx={attPx}
          cy={attPy}
          r={19}
          fill={BRAND.gold}
          opacity={actorsIn}
          style={{
            filter:
              dim < 0.9
                ? `drop-shadow(0 0 18px ${BRAND.gold})`
                : `drop-shadow(0 0 8px ${BRAND.gold}66)`,
          }}
        />

        {/* ghost marker + arrow for the flag beat */}
        {ghostIn > 0 && (
          <g opacity={ghostIn}>
            <circle
              cx={ghostX}
              cy={ghostY}
              r={16}
              fill="none"
              stroke={BRAND.pop}
              strokeWidth={4}
            />
            <path
              d={`M ${flagTipX} ${flagTipY} Q ${(flagTipX + ghostX) / 2 + 60} ${ghostY - 90} ${ghostX + 28} ${ghostY}`}
              fill="none"
              stroke={BRAND.pop}
              strokeWidth={4}
              strokeDasharray={1}
              pathLength={1}
              strokeDashoffset={arrowDraw}
            />
            {arrowDraw < 0.08 && (
              <path
                d={`M ${ghostX + 44} ${ghostY - 14} L ${ghostX + 24} ${ghostY} L ${ghostX + 48} ${ghostY + 8} Z`}
                fill={BRAND.pop}
              />
            )}
          </g>
        )}
      </svg>

      {/* ------------------------------------------------ labels / stamps ---- */}
      {/* LAST DEFENDER label */}
      <div
        style={{
          position: "absolute",
          left: width * 0.13,
          top: lineLY - 40,
          fontFamily: FONT_FAMILY,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "0.28em",
          color: BRAND.teal,
          opacity: actorsIn * dim,
        }}
      >
        LAST DEFENDER
      </div>

      {/* OFFSIDE stamp (case 1, with shake) */}
      {frame >= OFFSIDE_AT && offsideGone > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: height * 0.355,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: "0.05em",
            color: BRAND.pop,
            transform: `translateX(${shake}px) scale(${interpolate(offsideIn, [0, 1], [1.5, 1])}) rotate(-4deg)`,
            opacity: offsideIn * offsideGone,
            textShadow: `0 0 40px ${BRAND.pop}77, 0 8px 36px rgba(0,0,0,0.6)`,
          }}
        >
          OFFSIDE
        </div>
      )}

      {/* FINE stamp (case 2, calm) */}
      {frame >= FINE_AT && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: height * 0.355,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 100,
            fontWeight: 900,
            letterSpacing: "0.08em",
            color: BRAND.teal,
            transform: `scale(${interpolate(fineIn, [0, 1], [0.94, 1])})`,
            opacity: fineIn,
            textShadow: `0 0 36px ${BRAND.teal}66, 0 8px 36px rgba(0,0,0,0.6)`,
          }}
        >
          FINE
        </div>
      )}

      {/* linesman flag — raises at the right side, pulses on the flag beat */}
      {frame >= FLAG_UP_AT && (
        <div
          style={{
            position: "absolute",
            left: width * 0.885,
            top: lineLY - 10,
            transform: `rotate(${flagRot}deg) scale(${flagPulse})`,
            transformOrigin: "20% 95%",
            opacity: flagUp,
            filter:
              frame >= FLAG_BEAT_AT
                ? `drop-shadow(0 0 12px ${BRAND.pop}aa)`
                : undefined,
          }}
        >
          <svg width={90} height={120} viewBox="0 0 90 120">
            <line
              x1={18}
              y1={10}
              x2={18}
              y2={112}
              stroke={BRAND.ink}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <path d="M21 10 L78 22 L21 40 Z" fill={BRAND.pop} />
          </svg>
        </div>
      )}

      {/* plain-language chip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: SAFE_BOTTOM + 24,
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: BRAND.ink,
          opacity: chipIn,
        }}
      >
        no camping behind the last defender
      </div>

      {/* tally — first four lit from Scene 2; flag lights at the end */}
      <TallyRow
        items={[
          { glyph: "ball", litAt: 0 },
          { glyph: "clock", litAt: 0 },
          { glyph: "goal", litAt: 0 },
          { glyph: "hand", litAt: 0 },
          { glyph: "flag", litAt: TALLY_LIT_AT },
          { glyph: "card" },
        ]}
      />
    </AbsoluteFill>
  );
};
