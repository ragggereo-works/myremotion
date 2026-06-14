import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP } from "../../../../brand";
import { BRollBed, PitchBG, TallyRow } from "./shared";

/*
 * SCENE 1 — The hook: "No idea what's happening?" (221 frames @ 30fps)
 * VO: football_rules/Scene01.mp3 (7.04s) -> ceil((7.04 + 0.3) * 30) = 221.
 *
 * Beats:
 *   0-221  PitchBG + crowd bed (20%, scale 1.0→1.06; clip is 241f, plays through)
 *   20     "?" bubble pops over the lone viewer dot, wobbles
 *   30     "NO IDEA WHAT'S HAPPENING?" stamps in
 *   139    hard cut on the em-dash: gold "60 SECONDS. ALL OF IT." replaces it,
 *          the "?" bubble wipes away at the same moment
 *   201+   TallyRow appears, all six concept glyphs dim/unlit
 */

export const SCENE01_DURATION = 221;

// VO sync: hard-cut card swap on the em-dash (~63% through the audio).
const SWAP_AT = 139;
const BUBBLE_AT = 20;
const TEXT1_AT = 10; // moved up from 30 — card lands earlier; swap stays put
const TALLY_AT = SCENE01_DURATION - 20;

// ---------------------------------------------------------------------------
// Lone viewer dot + wobbling "?" bubble (wipes away on the swap).
// ---------------------------------------------------------------------------
const ViewerDot: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cx = width / 2;
  const cy = height * 0.52;

  // bubble pop with overshoot
  const pop = interpolate(
    frame,
    [BUBBLE_AT, BUBBLE_AT + 8, BUBBLE_AT + 14],
    [0, 1.12, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // gentle wobble while alive
  const wobble = Math.sin(frame * 0.11) * 5;
  const tilt = Math.sin(frame * 0.085 + 1.3) * 3;

  // wipe away at the swap (right edge sweeps left over 8 frames)
  const wipe = interpolate(frame, [SWAP_AT, SWAP_AT + 8], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bubbleR = width * 0.085;

  return (
    <>
      {/* the lone viewer */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: BRAND.ink,
          transform: "translate(-50%,-50%)",
          boxShadow: `0 0 34px rgba(255,255,255,0.25)`,
        }}
      />
      {/* "?" bubble, up-right of the dot */}
      {wipe < 100 && (
        <div
          style={{
            position: "absolute",
            left: cx + width * 0.06,
            top: cy - height * 0.115 + wobble,
            transform: `scale(${pop}) rotate(${tilt}deg)`,
            opacity: pop,
            clipPath: `inset(0 ${wipe}% 0 0)`,
          }}
        >
          <div
            style={{
              width: bubbleR * 2,
              height: bubbleR * 2,
              borderRadius: "50%",
              border: `4px solid ${BRAND.ink}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: FONT_FAMILY,
              fontSize: bubbleR * 1.15,
              fontWeight: 900,
              color: BRAND.ink,
              background: `${BRAND.bg}B3`,
            }}
          >
            ?
          </div>
          {/* bubble tail */}
          <svg
            width={30}
            height={26}
            style={{ position: "absolute", left: 8, bottom: -18 }}
          >
            <path d="M22 0 L4 24 L28 8 Z" fill={BRAND.ink} />
          </svg>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Text card — beat 1 hard-cuts to beat 2 at SWAP_AT.
// ---------------------------------------------------------------------------
const TextCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const stamp = interpolate(frame, [TEXT1_AT, TEXT1_AT + 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // tiny settle on the gold card so the hard cut still lands with energy
  const settle = interpolate(frame, [SWAP_AT, SWAP_AT + 5], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const base: React.CSSProperties = {
    position: "absolute",
    left: width * 0.125,
    right: width * 0.125,
    top: SAFE_TOP + height * 0.075,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
    fontWeight: 900,
    fontSize: 72,
    lineHeight: 1.18,
    letterSpacing: "0.01em",
    textShadow: "0 8px 36px rgba(0,0,0,0.55)",
  };

  if (frame < SWAP_AT) {
    return (
      <div
        style={{
          ...base,
          color: BRAND.ink,
          transform: `scale(${interpolate(stamp, [0, 1], [1.15, 1])})`,
          opacity: stamp,
        }}
      >
        NO IDEA
        <br />
        WHAT&rsquo;S HAPPENING?
      </div>
    );
  }
  return (
    <div
      style={{
        ...base,
        color: BRAND.gold,
        transform: `scale(${settle})`,
        textShadow: `0 0 ${width * 0.03}px rgba(255,209,102,0.35), 0 8px 36px rgba(0,0,0,0.55)`,
      }}
    >
      60 SECONDS.
      <br />
      ALL OF IT.
    </div>
  );
};

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();

  const tallyIn = interpolate(frame, [TALLY_AT, TALLY_AT + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("football_rules/Scene01.mp3")} />

      <PitchBG />
      <BRollBed
        src="15251944_2160_3840_30fps.mp4"
        opacity={0.2}
        scaleFrom={1}
        scaleTo={1.06}
      />

      <ViewerDot />
      <TextCard />

      {/* concept tally — appears at the very end, everything still unlit */}
      <Sequence from={TALLY_AT} layout="none">
        <AbsoluteFill style={{ opacity: tallyIn }}>
          <TallyRow
            items={[
              { glyph: "ball" }, // 11v11
              { glyph: "clock" }, // 45+45
              { glyph: "goal" }, // GOAL
              { glyph: "hand" }, // ✋
              { glyph: "flag" }, // OFFSIDE
              { glyph: "card" }, // CARDS
            ]}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
