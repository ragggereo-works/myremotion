import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";

/*
 * "YOU'VE NEVER WATCHED FOOTBALL — THE WHOLE THING IN 60 SECONDS"
 * 60s / 1800 frames @ 30fps. Flat-vector Kurzgesagt explainer style.
 *
 * Scene frame map (durations from the script @30fps):
 *   S1 Hook ............ 0    - 150   (5s)
 *   S2 Biggest event ... 150  - 420   (9s)
 *   S3 2026 ............ 420  - 660   (8s)
 *   S4 The whole game .. 660  - 990   (11s)
 *   S5 Offside ......... 990  - 1290  (10s)
 *   S6 The feeling ..... 1290 - 1560  (9s)
 *   S7 Outro ........... 1560 - 1800  (8s)
 */

// ---- Palette ---------------------------------------------------------------
const C = {
  bg: "#0A0E27",
  accent: "#FFD166",
  pop: "#FF6B5C",
  cool: "#4ECDC4",
  ink: "#FFFFFF",
  muted: "#8C93B5",
};

const FONT = "Inter, Helvetica, Arial, sans-serif";

// small deterministic rng
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ===========================================================================
// SHARED COMPONENTS
// ===========================================================================

// Persistent twinkling starfield + soft coral glow from the bottom.
const Starfield: React.FC<{ stars?: number }> = ({ stars = 80 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: stars }).map((_, i) => {
        const x = rand(i) * width;
        const y = rand(i + 50) * height;
        const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * 0.05 + i));
        const sz = 1 + rand(i + 7) * 2.2;
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
              background: "#fff",
              opacity: tw * 0.7,
            }}
          />
        );
      })}
      {/* coral glow rising from bottom */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -height * 0.4,
          width: width * 1.4,
          height: height * 0.9,
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse at center, rgba(255,107,92,0.22) 0%, rgba(255,107,92,0) 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Word-by-word kinetic text with bouncy spring entrance.
const KineticLine: React.FC<{
  text: string;
  start: number;
  size: number;
  color?: string;
  weight?: number;
  stagger?: number;
  spaced?: boolean;
}> = ({
  text,
  start,
  size,
  color = C.ink,
  weight = 800,
  stagger = 3,
  spaced = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${size * 0.28}px`,
        lineHeight: 1.1,
        padding: "0 6%",
      }}
    >
      {words.map((w, i) => {
        const local = frame - (start + i * stagger);
        const s = spring({
          frame: local,
          fps,
          config: { damping: 12, stiffness: 180, mass: 0.6 },
        });
        const y = interpolate(s, [0, 1], [size * 0.8, 0]);
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              fontWeight: weight,
              color,
              transform: `translateY(${y}px) scale(${0.7 + s * 0.3})`,
              opacity: interpolate(local, [0, 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              display: "inline-block",
              letterSpacing: spaced ? "0.35em" : "-0.02em",
              textShadow: "0 4px 22px rgba(0,0,0,0.4)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Scene fade in/out wrapper (uses local frame inside its Sequence).
const SceneFade: React.FC<{ dur: number; children: React.ReactNode }> = ({
  dur,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, dur - 14, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// A flat stylized soccer ball.
const Ball: React.FC<{ size: number; spin: number }> = ({ size, spin }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 36% 30%, #ffffff 0%, #e7ecf5 60%, #c3cbe0 100%)`,
      boxShadow: `0 ${size * 0.1}px ${size * 0.22}px rgba(0,0,0,0.45), inset -3px -5px 10px rgba(0,0,0,0.12)`,
      position: "relative",
      transform: `rotate(${spin}deg)`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size * 0.3,
        height: size * 0.3,
        background: C.bg,
        transform: "translate(-50%,-50%) rotate(15deg)",
        clipPath: "polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)",
      }}
    />
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${50 + Math.cos(a) * 42}%`,
            top: `${50 + Math.sin(a) * 42}%`,
            width: size * 0.17,
            height: size * 0.17,
            background: C.bg,
            transform: "translate(-50%,-50%)",
            clipPath: "polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)",
            opacity: 0.85,
          }}
        />
      );
    })}
  </div>
);

// Confetti burst (flat shapes) emanating from a point.
const Confetti: React.FC<{
  startFrame: number;
  originX: number;
  originY: number;
  count?: number;
  spread?: number;
}> = ({ startFrame, originX, originY, count = 36, spread = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (frame < startFrame) return null;
  const p = (frame - startFrame) / 55;
  const colors = [C.accent, C.pop, C.cool, "#fff"];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const ang = (i / count) * Math.PI * 2 + rand(i) * 0.6;
        const dist = p * width * spread * (0.5 + rand(i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: originX + Math.cos(ang) * dist,
              top: originY + Math.sin(ang) * dist + p * height * 0.18,
              width: width * 0.008,
              height: width * 0.013,
              background: colors[i % colors.length],
              transform: `rotate(${i * 47 + frame * 6}deg)`,
              opacity: Math.max(0, 1 - p),
              borderRadius: 2,
            }}
          />
        );
      })}
    </>
  );
};

// Low-res world silhouette (equirectangular). '#' = land, ' ' = water.
// 64 cols (lon -180..180) x 23 rows (lat ~78N..-54S). Rendered as a dot grid.
const WORLD_ROWS = [
  "                    ###                                          ",
  "      ####          ###         #########################       ",
  "     ######        ###     ###############################  ##  ",
  "    #########          ###################################      ",
  "    #########         #####################################     ",
  "     ########         ###  ##############################       ",
  "      #######          ###########   ###############           ",
  "       #####           ####     #######   #######             ",
  "        #####          ###   ######      ######               ",
  "         ####          ### #####          ####                ",
  "          ###          ########          ###                  ",
  "           ##          #######          ## ###                ",
  "           ##          ######            ######               ",
  "          ####         ######             ## ##               ",
  "          #####        #####               ###               ",
  "          #####        #####                                 ",
  "           ####        ####               #####              ",
  "           ####        ###               ########            ",
  "            ###         ##               #######             ",
  "            ###                          #####               ",
  "            ##                             ##                ",
  "            #                                                ",
  "           #                                                 ",
];

// Dotted world map. reveal (0..1) lights dots west→east as it rises.
// highlightNA glows the North-America cells; zoom/focus shift the view.
const WorldMap: React.FC<{
  reveal?: number;
  highlightNA?: boolean;
  zoom?: number;
  focusX?: number;
  focusY?: number;
}> = ({
  reveal = 0,
  highlightNA = false,
  zoom = 1,
  focusX = 0.5,
  focusY = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const COLS = 64;
  const ROWS = WORLD_ROWS.length;
  // map area: 78% of width, centered; keep equirectangular 2:1-ish aspect
  const mapW = width * 0.78;
  const mapH = mapW * (ROWS / COLS) * 1.9;
  const offX = (width - mapW) / 2;
  const offY = (height - mapH) / 2;
  const dotR = mapW / COLS / 2.4;

  const tx = (0.5 - focusX) * width * (zoom - 1);
  const ty = (0.5 - focusY) * height * (zoom - 1);

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const row = WORLD_ROWS[r];
    for (let c = 0; c < COLS; c++) {
      if (row[c] !== "#") continue;
      const isNA = c >= 3 && c <= 20 && r <= 12;
      const cx = offX + (c / (COLS - 1)) * mapW;
      const cy = offY + (r / (ROWS - 1)) * mapH;
      // reveal sweeps west→east (by column) with a little jitter
      const threshold = c / COLS + (rand(r * 64 + c) - 0.5) * 0.08;
      const lit = interpolate(reveal, [threshold, threshold + 0.06], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const naPulse = isNA && highlightNA ? 1 + Math.sin(frame * 0.15) * 0.1 : 1;
      const base =
        isNA && highlightNA ? "rgba(78,205,196,0.55)" : "rgba(78,205,196,0.16)";
      // blend base teal -> muted coral as it lights up (kept dim so text stays on top)
      const color = lit > 0.02 ? "rgba(255,107,92,0.7)" : base;
      const scale = (lit > 0.02 ? 1 + lit * 0.25 : 1) * naPulse;
      const glow =
        lit > 0.02
          ? `0 0 ${dotR * 1.1}px rgba(255,107,92,0.45)`
          : isNA && highlightNA
            ? `0 0 ${dotR * 1.2}px rgba(78,205,196,0.4)`
            : "none";
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: cx,
            top: cy,
            width: dotR * 1.7,
            height: dotR * 1.7,
            borderRadius: "50%",
            background: color,
            transform: `translate(-50%,-50%) scale(${scale})`,
            boxShadow: glow,
          }}
        />,
      );
    }
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
        transformOrigin: "center",
      }}
    >
      {cells}
    </AbsoluteFill>
  );
};

// Simple flat goal-net icon (drawn, no external deps).
const GoalNet: React.FC<{ size: number; flip?: boolean }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size * 0.66,
      border: `${size * 0.05}px solid ${C.ink}`,
      borderBottom: "none",
      borderRadius: 4,
      background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 ${size * 0.06}px, transparent ${size * 0.06}px ${size * 0.12}px),
                   repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 ${size * 0.06}px, transparent ${size * 0.06}px ${size * 0.12}px)`,
      boxShadow: `0 0 ${size * 0.12}px rgba(255,255,255,0.25)`,
    }}
  />
);

// Simple flat bell icon (drawn SVG).
const Bell: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z"
      fill={color}
    />
    <path d="M10 21a2 2 0 0 0 4 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

// ===========================================================================
// SCENES
// ===========================================================================

// SCENE 1 — Hook
const Scene1: React.FC = () => {
  const { width } = useVideoConfig();
  return (
    <SceneFade dur={150}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: width * 0.02 }}>
            <KineticLine
              text="FOR PEOPLE WHO'VE NEVER WATCHED"
              start={4}
              size={width * 0.016}
              color={C.cool}
              weight={700}
              stagger={1}
              spaced
            />
          </div>
          <KineticLine
            text="You've never watched football."
            start={10}
            size={width * 0.052}
          />
          <div style={{ height: width * 0.02 }} />
          <KineticLine
            text="Let's fix that."
            start={36}
            size={width * 0.05}
            color={C.accent}
          />
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// SCENE 2 — Biggest event on the planet (counter + map)
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const prog = interpolate(frame, [14, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const val = (prog * 1.5).toFixed(1);
  const pulse = 1 + Math.sin(frame * 0.25) * 0.02;
  return (
    <SceneFade dur={270}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <WorldMap reveal={prog} />
        {/* soft dark backing so the counter stays readable over the map */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: width * 0.72,
            height: width * 0.26,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(ellipse at center, rgba(10,14,39,0.85) 0%, rgba(10,14,39,0.5) 45%, rgba(10,14,39,0) 75%)`,
          }}
        />
        <div style={{ textAlign: "center", position: "relative" }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: width * 0.11,
              fontWeight: 900,
              color: C.accent,
              textShadow: `0 0 ${width * 0.03}px ${C.accent}`,
              transform: `scale(${pulse})`,
              lineHeight: 1,
            }}
          >
            {val} BILLION
          </div>
          <div
            style={{
              marginTop: width * 0.012,
              fontFamily: FONT,
              fontSize: width * 0.024,
              fontWeight: 600,
              color: C.muted,
              opacity: interpolate(frame, [150, 175], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            watched the last final — at the same second
          </div>
          <div
            style={{
              marginTop: width * 0.018,
              fontFamily: FONT,
              fontSize: width * 0.013,
              letterSpacing: "0.25em",
              color: C.muted,
              opacity: interpolate(frame, [180, 205], [0, 0.7], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            SOURCE: FIFA, 2022
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// SCENE 3 — 2026 gets bigger (zoom to North America)
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = useVideoConfig();
  const zoom = interpolate(frame, [0, 120], [1, 1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const numS = spring({ frame: frame - 30, fps, config: { damping: 10, stiffness: 140 } });
  return (
    <SceneFade dur={240}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <WorldMap highlightNA zoom={zoom} focusX={0.22} focusY={0.36} reveal={0} />
        {/* dark backing for legibility */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: width * 0.6,
            height: width * 0.28,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(ellipse at center, rgba(10,14,39,0.82) 0%, rgba(10,14,39,0.45) 50%, rgba(10,14,39,0) 78%)`,
          }}
        />
        <div style={{ textAlign: "center", position: "relative" }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: width * 0.14,
              fontWeight: 900,
              color: C.accent,
              textShadow: `0 0 ${width * 0.035}px ${C.accent}`,
              transform: `scale(${interpolate(numS, [0, 1], [0.3, 1])})`,
              lineHeight: 1,
            }}
          >
            2026
          </div>
          <div style={{ height: width * 0.012 }} />
          <KineticLine
            text="48 TEAMS · 3 COUNTRIES"
            start={48}
            size={width * 0.03}
            stagger={2}
            spaced
          />
        </div>
        <Confetti startFrame={32} originX={width * 0.5} originY={height * 0.42} />
      </AbsoluteFill>
    </SceneFade>
  );
};

// SCENE 4 — The whole game (bouncing ball + staggered text + goals)
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const size = width * 0.07;

  // Horizontal: constant roll across the screen.
  const ballX = interpolate(frame, [0, 150], [width * 0.14, width * 0.86], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Vertical: real gravity. Each bounce is a parabolic arc (fast fall, slow apex)
  // with amplitude decaying per bounce. groundY = where the ball rests.
  const groundY = height * 0.46;
  const PERIOD = 32; // frames per bounce
  const MAX_H = height * 0.34; // first bounce height
  const n = Math.floor(frame / PERIOD); // bounce index
  const phase = (frame % PERIOD) / PERIOD; // 0..1 within a bounce
  const amp = MAX_H * Math.pow(0.62, n); // decaying height
  const h = amp * (1 - Math.pow(2 * phase - 1, 2)); // parabolic arc, 0 at ground
  const ballY = groundY - h;

  // Squash ONLY on ground contact: wide + short. Bigger bounces squash more.
  const contact = Math.max(0, (Math.abs(2 * phase - 1) - 0.78) / 0.22); // ~1 near ground
  const squashAmt = contact * 0.22 * (amp / MAX_H + 0.15);
  const scaleX = 1 + squashAmt;
  const scaleY = 1 - squashAmt;

  const goalL = spring({ frame: frame - 10, fps, config: { damping: 11, stiffness: 150 } });
  const goalR = spring({ frame: frame - 18, fps, config: { damping: 11, stiffness: 150 } });
  const gSize = width * 0.13;

  return (
    <SceneFade dur={330}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* goal nets framing the sides */}
        <div
          style={{
            position: "absolute",
            left: width * 0.06,
            top: height * 0.5,
            transform: `translateY(-50%) scale(${goalL})`,
          }}
        >
          <GoalNet size={gSize} />
        </div>
        <div
          style={{
            position: "absolute",
            right: width * 0.06,
            top: height * 0.5,
            transform: `translateY(-50%) scale(${goalR})`,
          }}
        >
          <GoalNet size={gSize} flip />
        </div>

        {/* ground shadow (shrinks + fades as the ball rises) */}
        <div
          style={{
            position: "absolute",
            left: ballX,
            top: groundY + size * 0.5,
            width: size * (1.1 - (h / MAX_H) * 0.55),
            height: size * 0.16,
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.4)",
            filter: "blur(5px)",
            borderRadius: "50%",
            opacity: 0.45 - (h / MAX_H) * 0.3,
          }}
        />
        {/* bouncing ball */}
        <div
          style={{
            position: "absolute",
            left: ballX,
            top: ballY,
            transform: `translate(-50%,-50%) scale(${scaleX}, ${scaleY})`,
          }}
        >
          <Ball size={size} spin={ballX * 0.6} />
        </div>

        {/* staggered text */}
        <div
          style={{
            position: "absolute",
            top: height * 0.52,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: width * 0.012,
            alignItems: "center",
          }}
        >
          <KineticLine text="22 players" start={40} size={width * 0.06} />
          <KineticLine text="1 ball" start={60} size={width * 0.06} color={C.accent} />
          <KineticLine text="2 goals" start={80} size={width * 0.06} color={C.pop} />
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// SCENE 5 — Offside explained
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pitchY = height * 0.5;
  const dot = width * 0.022;

  // defenders (teal) at fixed x; attacker (coral) creeps forward
  const defenders = [0.42, 0.55, 0.68];
  const lastDefX = 0.42; // leftmost = last defender (defending to the left)
  const attackerX = interpolate(frame, [10, 90], [0.5, 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // offside line sweeps in and snaps to last defender
  const lineX = interpolate(frame, [20, 70], [0.95, lastDefX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const caught = attackerX < lineX;
  const flash = caught
    ? 0.4 + 0.4 * Math.abs(Math.sin(frame * 0.4))
    : 0;

  return (
    <SceneFade dur={300}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* green pitch strip */}
        <div
          style={{
            position: "absolute",
            top: pitchY - height * 0.14,
            left: 0,
            width: "100%",
            height: height * 0.28,
            background: "linear-gradient(180deg, #1f8a4c 0%, #176b3b 100%)",
            opacity: 0.9,
          }}
        />
        {/* offside line */}
        <div
          style={{
            position: "absolute",
            left: lineX * width,
            top: pitchY - height * 0.16,
            width: width * 0.004,
            height: height * 0.32,
            background: C.pop,
            boxShadow: `0 0 ${width * 0.02}px ${C.pop}`,
            opacity: 0.6 + flash,
          }}
        />
        {/* defenders */}
        {defenders.map((dx, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: dx * width,
              top: pitchY,
              width: dot,
              height: dot,
              borderRadius: "50%",
              background: C.cool,
              transform: "translate(-50%,-50%)",
              boxShadow: `0 0 ${dot}px ${C.cool}`,
            }}
          />
        ))}
        {/* attacker */}
        <div
          style={{
            position: "absolute",
            left: attackerX * width,
            top: pitchY - height * 0.05,
            width: dot,
            height: dot,
            borderRadius: "50%",
            background: C.pop,
            transform: "translate(-50%,-50%)",
            boxShadow: `0 0 ${dot * (caught ? 2 : 1)}px ${C.pop}`,
          }}
        />
        {/* labels */}
        <div
          style={{
            position: "absolute",
            top: height * 0.16,
            width: "100%",
            textAlign: "center",
          }}
        >
          <KineticLine text="OFFSIDE" start={70} size={width * 0.06} color={C.pop} spaced />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: height * 0.16,
            width: "100%",
            textAlign: "center",
            fontFamily: FONT,
            fontSize: width * 0.022,
            color: C.ink,
            fontWeight: 600,
            opacity: interpolate(frame, [95, 120], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          be level with the last defender
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// SCENE 6 — The feeling (held breath)
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const halo = 1 + Math.sin(frame * 0.12) * 0.06;
  return (
    <SceneFade dur={270}>
      <AbsoluteFill>
        {/* warm spotlight */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "30%",
            width: width * 0.9,
            height: width * 0.9,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(circle, rgba(255,209,102,0.18) 0%, rgba(255,209,102,0) 60%)`,
          }}
        />
        {/* crowd silhouette */}
        {Array.from({ length: 40 }).map((_, i) => {
          const cw = width * (0.02 + rand(i) * 0.015);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i / 40) * width + rand(i) * 10,
                bottom: 0,
                width: cw,
                height: height * (0.08 + rand(i + 9) * 0.06),
                background: "#05070f",
                borderRadius: `${cw}px ${cw}px 0 0`,
                opacity: 0.9,
              }}
            />
          );
        })}
        {/* held ball with pulsing halo */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "36%",
            transform: `translate(-50%,-50%) scale(${halo})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: width * 0.14,
              height: width * 0.14,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,209,102,0.4) 0%, rgba(255,209,102,0) 70%)`,
            }}
          />
          <Ball size={width * 0.06} spin={frame * 1.5} />
        </div>
        {/* text slow fade */}
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
          <div
            style={{
              marginBottom: height * 0.22,
              fontFamily: FONT,
              fontSize: width * 0.04,
              fontWeight: 800,
              color: C.ink,
              textAlign: "center",
              padding: "0 8%",
              opacity: interpolate(frame, [20, 70], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              textShadow: "0 4px 22px rgba(0,0,0,0.5)",
            }}
          >
            One kick. A whole country holds its breath.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneFade>
  );
};

// SCENE 7 — Outro (sweep + subscribe)
const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const sweep = interpolate(frame, [0, 35], [-1.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const bellS = spring({ frame: frame - 70, fps, config: { damping: 9, stiffness: 160 } });
  return (
    <SceneFade dur={240}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* yellow accent sweep */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            transform: `translateX(${sweep * 100}%)`,
            background: `linear-gradient(120deg, ${C.accent} 0%, #ffb703 100%)`,
            opacity: 0.16,
          }}
        />
        <Confetti startFrame={6} originX={width * 0.5} originY={height * 0.3} />
        <div style={{ textAlign: "center" }}>
          <KineticLine text="Stick around." start={20} size={width * 0.07} color={C.accent} />
          <div style={{ height: width * 0.018 }} />
          <KineticLine
            text="We explain it like you're brand new."
            start={44}
            size={width * 0.03}
            color={C.ink}
            weight={600}
          />
          <div
            style={{
              marginTop: width * 0.03,
              display: "flex",
              justifyContent: "center",
              transform: `scale(${interpolate(bellS, [0, 1], [0.2, 1])})`,
              filter: `drop-shadow(0 0 ${width * 0.02}px ${C.accent})`,
            }}
          >
            <Bell size={width * 0.06} color={C.accent} />
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// ===========================================================================
// ROOT COMPOSITION — stitches all scenes on the timeline
// ===========================================================================
export const MyAnimation: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      {/* persistent starfield behind everything */}
      <Starfield />

      <Sequence from={0} durationInFrames={150} layout="none">
        <Scene1 />
      </Sequence>
      <Sequence from={150} durationInFrames={270} layout="none">
        <Scene2 />
      </Sequence>
      <Sequence from={420} durationInFrames={240} layout="none">
        <Scene3 />
      </Sequence>
      <Sequence from={660} durationInFrames={330} layout="none">
        <Scene4 />
      </Sequence>
      <Sequence from={990} durationInFrames={300} layout="none">
        <Scene5 />
      </Sequence>
      <Sequence from={1290} durationInFrames={270} layout="none">
        <Scene6 />
      </Sequence>
      <Sequence from={1560} durationInFrames={240} layout="none">
        <Scene7 />
      </Sequence>
    </AbsoluteFill>
  );
};
