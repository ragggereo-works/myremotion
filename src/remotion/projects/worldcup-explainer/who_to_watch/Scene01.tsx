import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY, SAFE_TOP, SAFE_BOTTOM } from "../../../../brand";
import { SpotlightBG } from "./shared";

export const SCENE01_DURATION = 389; // ceil((12.640 + 0.3) * 30)
// broll_spotlight.mp4 ~10.05s; slowed to fill the full scene (never frozen):
// playbackRate = 10.054 / (389/30) ≈ 0.775
const BROLL_RATE = 0.775;

// ---------------------------------------------------------------------------
// B-roll bed — slowed to fill the scene, UNDER everything at 25% opacity.
// ---------------------------------------------------------------------------
const BRollBed: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, SCENE01_DURATION], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: 0.25, transform: `scale(${scale})` }}>
      <OffthreadVideo
        src={staticFile("v3_who_to_watch/broll_spotlight.mp4")}
        muted
        playbackRate={BROLL_RATE}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(0.8) brightness(0.85)",
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// <NumberDuel> — jersey NUMBER motifs only (NO photos, NO avatar icons).
// 10 slams in from left + 7 from right (~10–26, spring), VS badge + divider
// snap in (~26–36), names stamp under (~36–46).
// ---------------------------------------------------------------------------
const NumberDuel: React.FC<{
  leftNum: string;
  leftName: string;
  leftCountry: string;
  rightNum: string;
  rightName: string;
  rightCountry: string;
}> = ({ leftNum, leftName, leftCountry, rightNum, rightName, rightCountry }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const slam = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 150, mass: 0.9 } });

  const leftIn = slam(10);
  const rightIn = slam(14);
  const leftX = interpolate(leftIn, [0, 1], [-width * 0.5, 0]);
  const rightX = interpolate(rightIn, [0, 1], [width * 0.5, 0]);

  const badgeIn = spring({
    frame: frame - 26,
    fps,
    config: { damping: 11, stiffness: 180, mass: 0.6 },
  });
  const badgeScale = interpolate(badgeIn, [0, 1], [0.3, 1]);
  const divDraw = interpolate(frame, [26, 36], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const cy = height * 0.5;
  const numStyle = (color: string): React.CSSProperties => ({
    fontSize: 300,
    fontWeight: 900,
    color,
    lineHeight: 1,
    letterSpacing: -8,
    textShadow: `0 0 50px ${color}44`,
  });

  const nameBlock = (name: string, country: string, delay: number) => {
    const op = interpolate(frame, [delay, delay + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const sc = interpolate(frame, [delay, delay + 8], [1.12, 1.0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    return (
      <div style={{ opacity: op, transform: `scale(${sc})`, transformOrigin: "center top" }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: BRAND.ink, letterSpacing: 1 }}>
          {name}
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: BRAND.teal, marginTop: 6 }}>
          {country}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      {/* divider */}
      <svg width={width} height={height} style={{ position: "absolute" }}>
        <line
          x1={width / 2}
          y1={height * 0.32}
          x2={width / 2}
          y2={height * 0.68}
          stroke={BRAND.teal}
          strokeWidth={4}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={divDraw}
          opacity={0.8}
        />
      </svg>

      {/* left number + name */}
      <div
        style={{
          position: "absolute",
          top: cy - 200,
          left: 0,
          width: width / 2,
          textAlign: "center",
          transform: `translateX(${leftX}px)`,
        }}
      >
        <div style={numStyle(BRAND.gold)}>{leftNum}</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: cy + 130,
          left: 0,
          width: width / 2,
          textAlign: "center",
        }}
      >
        {nameBlock(leftName, leftCountry, 36)}
      </div>

      {/* right number + name */}
      <div
        style={{
          position: "absolute",
          top: cy - 200,
          left: width / 2,
          width: width / 2,
          textAlign: "center",
          transform: `translateX(${rightX}px)`,
        }}
      >
        <div style={numStyle(BRAND.pop)}>{rightNum}</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: cy + 130,
          left: width / 2,
          width: width / 2,
          textAlign: "center",
        }}
      >
        {nameBlock(rightName, rightCountry, 40)}
      </div>

      {/* VS badge */}
      <div
        style={{
          position: "absolute",
          top: cy - 60,
          left: width / 2 - 70,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: BRAND.bgAlt,
          border: `4px solid ${BRAND.teal}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${badgeScale})`,
          boxShadow: `0 0 30px ${BRAND.teal}55`,
        }}
      >
        <span style={{ fontSize: 60, fontWeight: 900, color: BRAND.ink }}>VS</span>
      </div>
    </AbsoluteFill>
  );
};

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // hook title — LAND BY FRAME 10
  const titleScale = interpolate(frame, [2, 10], [1.12, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const titleOp = interpolate(frame, [2, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // kicker holds to the end
  const kickerOp = interpolate(frame, [48, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [SCENE01_DURATION - 10, SCENE01_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY, opacity: fadeOut }}>
      <Audio src={staticFile("v3_who_to_watch/Scene01.mp3")} />

      {/* back -> front */}
      <SpotlightBG accent="gold" />
      <BRollBed />

      <NumberDuel
        leftNum="10"
        leftName="MESSI"
        leftCountry="Argentina"
        rightNum="7"
        rightName="RONALDO"
        rightCountry="Portugal"
      />

      {/* hook title, top of safe zone */}
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP + 40,
          left: width * 0.125,
          width: width * 0.75,
          textAlign: "center",
          opacity: titleOp,
          transform: `scale(${titleScale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: BRAND.gold,
            letterSpacing: -2,
            lineHeight: 1.02,
            textShadow: `0 0 44px ${BRAND.gold}55`,
          }}
        >
          THE LAST DANCE
        </div>
      </div>

      {/* kicker, bottom of safe zone */}
      <div
        style={{
          position: "absolute",
          bottom: SAFE_BOTTOM + 20,
          left: width * 0.125,
          width: width * 0.75,
          textAlign: "center",
          opacity: kickerOp,
          fontSize: 38,
          fontWeight: 500,
          color: BRAND.ink,
          letterSpacing: 1,
        }}
      >
        their last World Cup, ever
      </div>
    </AbsoluteFill>
  );
};
