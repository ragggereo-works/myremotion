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
import { BRollBed, MemoryLook } from "./shared";

/*
 * SCENE 1 — "SAME STADIUM. / 40 YEARS APART." (309 frames @ 30fps, 1080x1920)
 * VO: Scene01.mp3 from frame 0 (10.37s — matches scene length).
 * Memory treatment. B-roll bed at 0.78x so its 8.06s covers the 10.3s scene.
 *
 * Layers back→front: bg → crowd b-roll bed → stadium bowl outline (draw-on)
 * → text beats → MemoryLook (wash/vignette/grain).
 */

export const SCENE01_DURATION = 309;

// Generic elliptical stadium bowl — concentric tiers, NOT any real stadium.
const StadiumBowl: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cx = width / 2;
  const cy = height * 0.55;
  // outer rim is widest + highest; inner tiers shrink and sit lower
  const tiers = [
    { rx: width * 0.43, ryRatio: 0.34, drop: 0 },
    { rx: width * 0.355, ryRatio: 0.33, drop: height * 0.022 },
    { rx: width * 0.28, ryRatio: 0.32, drop: height * 0.042 },
    { rx: width * 0.2, ryRatio: 0.3, drop: height * 0.058 }, // pitch line
  ];

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", opacity: 0.35 }}
    >
      {tiers.map((t, i) => {
        // staggered draw-on across frames 0-45
        const draw = interpolate(frame, [i * 6, 45], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy + t.drop}
            rx={t.rx}
            ry={t.rx * t.ryRatio}
            fill="none"
            stroke={BRAND.teal}
            strokeWidth={i === 0 ? 5 : 3.5}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={draw}
          />
        );
      })}
    </svg>
  );
};

// Stamp-in text: scale 1.15→1.0, opacity 0→1 over 8 frames; hold; fade out.
const StampText: React.FC<{
  text: string;
  color: string;
  stampAt: number;
  fontSize: number;
}> = ({ text, color, stampAt, fontSize }) => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [stampAt, stampAt + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut = interpolate(frame, [285, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize,
        fontWeight: 900,
        color,
        textAlign: "center",
        letterSpacing: "0.02em",
        transform: `scale(${interpolate(stamp, [0, 1], [1.15, 1])})`,
        opacity: stamp * fadeOut,
        textShadow: "0 6px 30px rgba(0,0,0,0.55)",
      }}
    >
      {text}
    </div>
  );
};

export const Scene01: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY }}>
      <Audio src={staticFile("Scene01.mp3")} />

      {/* b-roll bed: ~25%, slow push 1.0→1.08, slowed to cover full scene */}
      <BRollBed
        src="crowd_silhouette_v.mp4"
        opacity={0.25}
        scaleFrom={1}
        scaleTo={1.08}
        playbackRate={0.78}
      />

      {/* stadium bowl outline — the visual anchor */}
      <StadiumBowl />

      {/* text beats — top third of the safe zone, middle 75% horizontally */}
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP + height * 0.09,
          left: width * 0.125,
          right: width * 0.125,
          display: "flex",
          flexDirection: "column",
          gap: height * 0.018,
        }}
      >
        <StampText
          text="SAME STADIUM."
          color={BRAND.ink}
          stampAt={60}
          fontSize={width * 0.082}
        />
        <StampText
          text="40 YEARS APART."
          color={BRAND.gold}
          stampAt={90}
          fontSize={width * 0.072}
        />
      </div>

      <MemoryLook seed={1} />
    </AbsoluteFill>
  );
};
