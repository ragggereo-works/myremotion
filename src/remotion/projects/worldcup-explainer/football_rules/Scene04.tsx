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
import { PitchBG, TallyRow } from "./shared";

/*
 * SCENE 4 — Cards: warning, off, man down. (250 frames @ 30fps)
 * VO: football_rules/Scene04.mp3 (8.00s) -> ceil((8.00 + 0.3) * 30) = 250.
 * Diagrams only.
 *
 * Beats:
 *   12    yellow card flicks in; "WARNING" stamps beside it (~30)
 *   70    second yellow stacks behind with the same flick
 *   105   both flip together (Y-rotation) into one red card; "OFF" pops (~128)
 *   150   mini pitch strip, 11 dots; one flashes red and fades (~170-200)
 *   186   counter ticks "11 v 11" -> "10 v 11" (pop) — synced to "a man down"
 *   220   CARDS glyph lights — ALL 6 LIT; whole row pulses once (~228-246)
 */

export const SCENE04_DURATION = 250;

// VO sync constants
const CARD1_AT = 12;
const WARNING_AT = 30;
const CARD2_AT = 70;
const FLIP_AT = 105; // "one red"
const OFF_AT = 126; //  "you're off"
const STRIP_AT = 150;
const SENT_OFF_AT = 170; // dot flashes red
const TICK_AT = 186; //   "a man down"
const TALLY_LIT_AT = 220;
const PULSE_AT = 228;

const CARD_W = 190;
const CARD_H = 270;

// referee-flick entrance: fast slide + sharp tilt with a snap-back
const useFlick = (at: number) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [at, at + 10], [-340, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const y = interpolate(frame, [at, at + 10], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rot = interpolate(frame, [at, at + 8, at + 14], [-34, -3, -9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [at, at + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { x, y, rot, op };
};

const CardFace: React.FC<{ color: string; w?: number; h?: number }> = ({
  color,
  w = CARD_W,
  h = CARD_H,
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 20,
      background: `linear-gradient(160deg, ${color} 0%, ${color}CC 100%)`,
      boxShadow: `0 18px 50px rgba(0,0,0,0.5), 0 0 40px ${color}44`,
    }}
  />
);

// ---------------------------------------------------------------------------
// The card stack: two yellow flicks, then a joint Y-flip into one red card.
// ---------------------------------------------------------------------------
const Cards: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const f1 = useFlick(CARD1_AT);
  const f2 = useFlick(CARD2_AT);

  // joint flip: 0 -> 180 degrees
  const flip = interpolate(frame, [FLIP_AT, FLIP_AT + 22], [0, 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const showRed = flip >= 90;

  const warningIn = interpolate(frame, [WARNING_AT, WARNING_AT + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offIn = interpolate(frame, [OFF_AT, OFF_AT + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: width / 2 - CARD_W / 2,
        top: height * 0.295,
        transform: `perspective(1100px) rotateY(${flip}deg)`,
      }}
    >
      {!showRed ? (
        <>
          {/* second yellow stacks BEHIND */}
          {frame >= CARD2_AT && (
            <div
              style={{
                position: "absolute",
                left: f2.x + 30,
                top: f2.y - 22,
                transform: `rotate(${f2.rot - 8}deg)`,
                opacity: f2.op,
              }}
            >
              <CardFace color={BRAND.gold} />
            </div>
          )}
          {/* first yellow */}
          <div
            style={{
              position: "absolute",
              left: f1.x,
              top: f1.y,
              transform: `rotate(${f1.rot}deg)`,
              opacity: f1.op,
            }}
          >
            <CardFace color={BRAND.gold} />
          </div>
        </>
      ) : (
        // one red card (counter-rotated so it isn't mirrored)
        <div style={{ transform: "rotateY(180deg) rotate(-7deg)" }}>
          <CardFace color={BRAND.pop} w={CARD_W * 1.08} h={CARD_H * 1.08} />
        </div>
      )}

      {/* labels beside the stack */}
      {!showRed && warningIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: CARD_W + 46,
            top: CARD_H * 0.38,
            fontFamily: FONT_FAMILY,
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: BRAND.gold,
            transform: `scale(${interpolate(warningIn, [0, 1], [1.4, 1])})`,
            opacity: warningIn,
            textShadow: `0 0 24px ${BRAND.gold}55`,
          }}
        >
          WARNING
        </div>
      )}
      {showRed && (
        <div
          style={{
            position: "absolute",
            left: -CARD_W - 10,
            top: CARD_H * 0.38,
            fontFamily: FONT_FAMILY,
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: BRAND.pop,
            // inside the flipped container: counter-mirror the label too
            transform: `rotateY(180deg) scale(${interpolate(offIn, [0, 1], [1.5, 1])})`,
            opacity: offIn,
            textShadow: `0 0 28px ${BRAND.pop}66`,
          }}
        >
          OFF
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Mini pitch strip: 11 dots, one sent off; counter ticks 11v11 -> 10v11.
// ---------------------------------------------------------------------------
const ManDown: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const stripIn = interpolate(frame, [STRIP_AT, STRIP_AT + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const SENT_IDX = 7;
  // red flash then fade-out for the sent-off dot
  const flash =
    frame >= SENT_OFF_AT
      ? 0.5 + 0.5 * Math.sin((frame - SENT_OFF_AT) * 0.9)
      : 0;
  const sentOp = interpolate(frame, [SENT_OFF_AT + 14, SENT_OFF_AT + 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ticked = frame >= TICK_AT;
  const tickPop = interpolate(frame, [TICK_AT, TICK_AT + 7], [1.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stripW = width * 0.75;
  const stripH = 110;

  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.125,
        top: height * 0.6,
        width: stripW,
        opacity: stripIn,
        transform: `translateY(${(1 - stripIn) * 60}px)`,
      }}
    >
      {/* the strip */}
      <div
        style={{
          position: "relative",
          width: stripW,
          height: stripH,
          border: `2.5px solid ${BRAND.ink}55`,
          borderRadius: 14,
        }}
      >
        {/* halfway tick */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            background: `${BRAND.ink}33`,
          }}
        />
        {Array.from({ length: 11 }).map((_, i) => {
          const isSent = i === SENT_IDX;
          const x = (stripW / 12) * (i + 1);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: "50%",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: isSent && frame >= SENT_OFF_AT ? BRAND.pop : BRAND.teal,
                transform: `translate(-50%,-50%) scale(${isSent && frame >= SENT_OFF_AT ? 1 + flash * 0.3 : 1})`,
                opacity: isSent ? sentOp : 0.95,
                boxShadow:
                  isSent && frame >= SENT_OFF_AT
                    ? `0 0 ${14 + flash * 10}px ${BRAND.pop}`
                    : "none",
              }}
            />
          );
        })}
      </div>
      {/* counter */}
      <div
        style={{
          marginTop: 26,
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: "0.06em",
          color: BRAND.ink,
        }}
      >
        <span
          style={{
            color: ticked ? BRAND.pop : BRAND.ink,
            display: "inline-block",
            transform: `scale(${ticked ? tickPop : 1})`,
            textShadow: ticked ? `0 0 24px ${BRAND.pop}66` : undefined,
          }}
        >
          {ticked ? "10" : "11"}
        </span>
        {" v 11"}
      </div>
    </div>
  );
};

export const Scene04: React.FC = () => {
  const frame = useCurrentFrame();

  // single subtle full-row pulse once everything is lit
  const pulseP = interpolate(frame, [PULSE_AT, PULSE_AT + 9, PULSE_AT + 18], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("football_rules/Scene04.mp3")} />

      <PitchBG />

      <Cards />
      <ManDown />

      <AbsoluteFill
        style={{
          transform: `scale(${1 + pulseP * 0.1})`,
          transformOrigin: `50% ${SAFE_TOP + 36}px`,
        }}
      >
        <TallyRow
          items={[
            { glyph: "ball", litAt: 0 },
            { glyph: "clock", litAt: 0 },
            { glyph: "goal", litAt: 0 },
            { glyph: "hand", litAt: 0 },
            { glyph: "flag", litAt: 0 },
            { glyph: "card", litAt: TALLY_LIT_AT },
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
