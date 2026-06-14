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
 * SCENE 5 — Outro: that's football. (281 frames @ 30fps)
 * VO: football_rules/Scene05.mp3 (8.56s) -> ceil((8.56 + 0.8) * 30) = 281.
 * VO ends ~257; everything HOLDS to 281 (loop point into Scene 1).
 *
 * Beats:
 *   0-30    pitch lines fade out; channel particle field fades in
 *   15-90   floodlights b-roll window at 18%, fading at both edges
 *   18      "THAT'S IT." stamps; 45: "THAT'S FOOTBALL." stamps, larger, gold
 *   90-130  the all-lit TallyRow drifts down to sit above the button (diploma)
 *   192     teal FOLLOW button pops (synced to "Follow"); pip fades beneath
 *   257-281 hold
 */

export const SCENE05_DURATION = 281;

// VO sync constants
const STAMP1_AT = 18;
const STAMP2_AT = 45;
const DRIFT_AT = 90; //  "Congratulations…"
const FOLLOW_AT = 192; // "Follow"

// deterministic per-index rand (no Math.random)
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Channel particle field — ~120 teal/ink dots, sine-drifting, deterministic.
// ---------------------------------------------------------------------------
const ParticleField: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {Array.from({ length: 120 }).map((_, i) => {
        const baseX = rand(i) * width;
        const baseY = rand(i + 200) * height;
        const fx = 0.012 + rand(i + 400) * 0.014;
        const fy = 0.009 + rand(i + 600) * 0.012;
        const ph = rand(i + 800) * Math.PI * 2;
        const x = baseX + Math.sin(frame * fx + ph) * 26;
        const y = baseY + Math.cos(frame * fy + ph) * 20;
        const sz = 2 + rand(i + 1000) * 3.5;
        const teal = rand(i + 1200) > 0.4;
        const tw = 0.5 + 0.5 * Math.sin(frame * 0.05 + ph);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: sz,
              height: sz,
              borderRadius: "50%",
              background: teal ? BRAND.teal : BRAND.ink,
              opacity: 0.1 + tw * 0.3,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// hard stamp helper
const useStamp = (at: number) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [at, at + 7], [1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [at, at + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { scale, opacity, visible: frame >= at };
};

export const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // pitch background fades out as the particle field takes over
  const pitchOut = interpolate(frame, [0, 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // b-roll window fade
  const brollFade = interpolate(frame, [15, 30, 75, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const s1 = useStamp(STAMP1_AT);
  const s2 = useStamp(STAMP2_AT);

  // tally drifts down from the top of the safe zone to above the button
  const drift = interpolate(frame, [DRIFT_AT, DRIFT_AT + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const rowYNow = SAFE_TOP + 36; // glyph row center at rest
  const rowYTarget = height * 0.565;
  const driftY = (rowYTarget - rowYNow) * drift;

  // follow button pop
  const followScale = interpolate(
    frame,
    [FOLLOW_AT, FOLLOW_AT + 9, FOLLOW_AT + 16],
    [0.55, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const followOp = interpolate(frame, [FOLLOW_AT, FOLLOW_AT + 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pipIn = interpolate(frame, [FOLLOW_AT + 14, FOLLOW_AT + 32], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("football_rules/Scene05.mp3")} />

      {/* pitch eases out; particles ease in */}
      {pitchOut > 0 && (
        <AbsoluteFill style={{ opacity: pitchOut }}>
          <PitchBG />
        </AbsoluteFill>
      )}
      <ParticleField />

      {/* floodlights window */}
      <Sequence from={15} durationInFrames={75}>
        <AbsoluteFill style={{ opacity: brollFade }}>
          <BRollBed src="stadium_aerial_night_v.mp4" opacity={0.18} />
        </AbsoluteFill>
      </Sequence>

      {/* the two hard beats */}
      {s1.visible && (
        <div
          style={{
            position: "absolute",
            left: width * 0.125,
            right: width * 0.125,
            top: height * 0.33,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 62,
            fontWeight: 900,
            color: BRAND.ink,
            transform: `scale(${s1.scale})`,
            opacity: s1.opacity,
            textShadow: "0 8px 36px rgba(0,0,0,0.55)",
          }}
        >
          THAT&rsquo;S IT.
        </div>
      )}
      {s2.visible && (
        <div
          style={{
            position: "absolute",
            left: width * 0.125,
            right: width * 0.125,
            top: height * 0.39,
            textAlign: "center",
            fontFamily: FONT_FAMILY,
            fontSize: 88,
            fontWeight: 900,
            color: BRAND.gold,
            transform: `scale(${s2.scale})`,
            opacity: s2.opacity,
            textShadow: `0 0 ${width * 0.03}px rgba(255,209,102,0.35), 0 8px 36px rgba(0,0,0,0.55)`,
          }}
        >
          THAT&rsquo;S FOOTBALL.
        </div>
      )}

      {/* follow prompt */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * 0.63,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: "0.22em",
            color: BRAND.bg,
            background: BRAND.teal,
            padding: "26px 74px",
            borderRadius: 999,
            transform: `scale(${followScale})`,
            opacity: followOp,
            boxShadow: `0 0 ${width * 0.05}px ${BRAND.teal}59, 0 14px 40px rgba(0,0,0,0.45)`,
          }}
        >
          FOLLOW
        </div>
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: BRAND.ink,
            opacity: pipIn,
          }}
        >
          World Cup for newcomers — Part 2
        </div>
      </div>

      {/* the diploma: all-lit tally drifts down to sit above the button */}
      <AbsoluteFill style={{ transform: `translateY(${driftY}px)` }}>
        <TallyRow
          items={[
            { glyph: "ball", litAt: 0 },
            { glyph: "clock", litAt: 0 },
            { glyph: "goal", litAt: 0 },
            { glyph: "hand", litAt: 0 },
            { glyph: "flag", litAt: 0 },
            { glyph: "card", litAt: 0 },
          ]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
