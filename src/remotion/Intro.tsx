import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  spring,
  Sequence,
  OffthreadVideo,
  staticFile,
} from "remotion";

/*
 * INTRO — "YOU. START. HERE."
 * 17s / 510 frames @ 30fps. Dark flat-explainer style.
 *   - Living gradient-mesh background (midnight navy <-> deep teal), breathing.
 *   - ~120-dot particle field arranged on a slowly rotating curved globe.
 *   - Word-by-word title with spring scale-overshoot, dissolving near the end.
 *   - [B-roll stadium crowd goes here later — omitted in this code test.]
 */

const C = {
  navy: "#0A1224",
  navyDeep: "#070C1A",
  teal: "#1FB6B6",
  tealDeep: "#0E6E73",
  ink: "#EAF6F6",
};

const FONT = "Inter, Helvetica, Arial, sans-serif";

// ---------------------------------------------------------------------------
// Living gradient-mesh background — never static; driven by low-freq sines.
// ---------------------------------------------------------------------------
const LivingMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // three slow-drifting radial blobs that breathe between navy and teal
  const blobs = [
    {
      hue: C.tealDeep,
      bx: 0.3,
      by: 0.35,
      fx: 0.011,
      fy: 0.008,
      amp: 0.12,
      size: 0.9,
      ph: 0,
    },
    {
      hue: C.teal,
      bx: 0.72,
      by: 0.6,
      fx: 0.009,
      fy: 0.013,
      amp: 0.1,
      size: 0.7,
      ph: 2.1,
    },
    {
      hue: C.navyDeep,
      bx: 0.55,
      by: 0.3,
      fx: 0.007,
      fy: 0.01,
      amp: 0.14,
      size: 1.1,
      ph: 4.2,
    },
  ];

  return (
    <AbsoluteFill style={{ background: C.navy }}>
      {blobs.map((b, i) => {
        const x = (b.bx + Math.sin(frame * b.fx + b.ph) * b.amp) * width;
        const y = (b.by + Math.cos(frame * b.fy + b.ph) * b.amp) * height;
        const breathe = 1 + Math.sin(frame * 0.02 + b.ph) * 0.08;
        const r = width * b.size * breathe;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r,
              height: r,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${b.hue}55 0%, ${b.hue}00 60%)`,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
      {/* subtle vignette to keep edges dark */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Particle globe — ~120 dots on a fibonacci sphere, slowly rotating + breathing.
// ---------------------------------------------------------------------------
const ParticleGlobe: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const N = 120;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const cx = width / 2;
  const cy = height / 2;
  const breathe = 1 + Math.sin(frame * 0.018) * 0.04;
  const R = height * 0.46 * breathe;
  const ang = frame * 0.006; // slow rotation around Y
  const cosA = Math.cos(ang);
  const sinA = Math.sin(ang);

  const dots: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2; // -1..1
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    // slow per-dot migration drift
    const theta = i * GOLDEN + Math.sin(frame * 0.01 + i) * 0.06;
    const x0 = Math.cos(theta) * rad;
    const z0 = Math.sin(theta) * rad;
    // rotate around Y axis
    const x = x0 * cosA - z0 * sinA;
    const z = x0 * sinA + z0 * cosA;

    // orthographic projection (slightly squashed Y for a "curved globe" feel)
    const sx = cx + x * R;
    const sy = cy + y * R * 0.92;

    // depth: front dots brighter/larger
    const depth = (z + 1) / 2; // 0 (back) .. 1 (front)
    const size = (1.4 + depth * 3.2) * (width / 1920);
    const opacity = 0.12 + depth * 0.55;

    dots.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: sx,
          top: sy,
          width: size,
          height: size,
          borderRadius: "50%",
          background: C.teal,
          transform: "translate(-50%,-50%)",
          opacity,
          boxShadow: depth > 0.6 ? `0 0 ${size * 2}px ${C.teal}88` : "none",
        }}
      />,
    );
  }

  // gentle overall fade-in of the globe
  const globeOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <AbsoluteFill style={{ opacity: globeOpacity }}>{dots}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Stadium crowd b-roll — graded into the navy/teal palette, slow drift zoom.
// Runs frames 150-510 (12s, matching the 12.5s source clip).
// ---------------------------------------------------------------------------
const BROLL_START = 150;
const BROLL_DUR = 360;

const CrowdBroll: React.FC = () => {
  const frame = useCurrentFrame(); // local to the Sequence

  // fade in, hold, fade out with the end of the scene
  const opacity = interpolate(
    frame,
    [0, 35, BROLL_DUR - 55, BROLL_DUR - 5],
    [0, 0.85, 0.85, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // slow push-in so the footage never feels frozen
  const scale = interpolate(frame, [0, BROLL_DUR], [1.05, 1.14]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        muted
        src={staticFile("crowd.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "saturate(0.55) contrast(1.08) brightness(0.62)",
        }}
      />
      {/* navy/teal grade so the footage sits in the explainer palette */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, ${C.navy}B3 0%, ${C.tealDeep}59 55%, ${C.navyDeep}CC 100%)`,
          mixBlendMode: "multiply",
        }}
      />
      {/* keep the center clear-ish for the title, darken edges */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(7,12,26,0.7) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Title — "YOU. START. HERE." stamps word-by-word with spring overshoot.
// ---------------------------------------------------------------------------
const StampTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const words = ["YOU.", "START.", "HERE."];
  const START = 30;
  const GAP = 34;

  // dissolve everything near the end
  const dissolve = interpolate(frame, [450, 505], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: dissolve,
      }}
    >
      <div style={{ display: "flex", gap: width * 0.025 }}>
        {words.map((w, i) => {
          const local = frame - (START + i * GAP);
          // spring with overshoot (low damping) for a stamp-in pop
          const s = spring({
            frame: local,
            fps,
            config: { damping: 9, stiffness: 170, mass: 0.7 },
          });
          const scale = interpolate(s, [0, 1], [0.2, 1]);
          const opacity = interpolate(local, [0, 5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: width * 0.075,
                fontWeight: 900,
                color: i === 1 ? C.teal : C.ink,
                letterSpacing: "-0.01em",
                transform: `scale(${scale})`,
                opacity,
                textShadow: `0 6px 30px rgba(0,0,0,0.45), 0 0 ${width * 0.02}px ${C.teal}33`,
                display: "inline-block",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Composition root
// ---------------------------------------------------------------------------
export const Intro: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.navy, fontFamily: FONT }}>
      <LivingMesh />
      <ParticleGlobe />
      <Sequence from={BROLL_START} durationInFrames={BROLL_DUR} layout="none">
        <CrowdBroll />
      </Sequence>
      <StampTitle />
    </AbsoluteFill>
  );
};
