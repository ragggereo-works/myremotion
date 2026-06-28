import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_FAMILY, CAPTION_ACCENT } from "../../../../brand";

// ===========================================================================
// Scene 14 — vocabulary recap card scene (still image, no b-roll).
// Three teaching cards (KIND / HELP / FRIEND) enter on each keyword's onset,
// karaoke-highlight their two lines, then a final KIND · HELP · FRIEND recap
// row holds over the image. Word timings are WhisperX forced-aligned to the
// narration (ms, audio starts at frame 0).
// ===========================================================================

const IMG = "a2_language/lion_and_mouse/scene14/scene14A.png";
const AUDIO = "a2_language/lion_and_mouse/scene14/scene14.mp3";

type Tok = { t: string; s: number; e: number };
type Card = {
  word: string;
  enter: number; // frame the card appears (keyword onset)
  exit: number; // frame the card is gone
  example: Tok[];
  meaning: Tok[];
  pos: "left" | "right" | "center";
};

const CARDS: Card[] = [
  {
    word: "KIND",
    enter: 90, // "Kind." @3.00s
    exit: 297,
    pos: "left",
    example: [
      { t: "The", s: 4244, e: 4364 },
      { t: "lion", s: 4425, e: 4765 },
      { t: "was", s: 4805, e: 4965 },
      { t: "kind.", s: 5045, e: 5526 },
    ],
    meaning: [
      { t: "Good", s: 7007, e: 7308 },
      { t: "and", s: 7428, e: 7528 },
      { t: "gentle", s: 7608, e: 7988 },
      { t: "to", s: 8048, e: 8128 },
      { t: "others.", s: 8248, e: 8589 },
    ],
  },
  {
    word: "HELP",
    enter: 297, // "Help." @9.89s
    exit: 500,
    pos: "right",
    example: [
      { t: "The", s: 11011, e: 11111 },
      { t: "mouse", s: 11151, e: 11432 },
      { t: "wanted", s: 11532, e: 11872 },
      { t: "to", s: 11912, e: 11992 },
      { t: "help.", s: 12052, e: 12313 },
    ],
    meaning: [
      { t: "To", s: 13514, e: 13614 },
      { t: "do", s: 13674, e: 13834 },
      { t: "something", s: 13914, e: 14295 },
      { t: "good", s: 14375, e: 14655 },
      { t: "for", s: 14735, e: 14895 },
      { t: "someone.", s: 14975, e: 15456 },
    ],
  },
  {
    word: "FRIEND",
    enter: 500, // "Friend." @16.68s
    exit: 705,
    pos: "center",
    example: [
      { t: "The", s: 17878, e: 17979 },
      { t: "lion", s: 18039, e: 18419 },
      { t: "and", s: 18499, e: 18599 },
      { t: "the", s: 18639, e: 18719 },
      { t: "mouse", s: 18759, e: 19060 },
      { t: "became", s: 19140, e: 19460 },
      { t: "friends.", s: 19580, e: 20041 },
    ],
    meaning: [
      { t: "Someone", s: 21262, e: 21542 },
      { t: "who", s: 21582, e: 21702 },
      { t: "helps", s: 21782, e: 22043 },
      { t: "you", s: 22103, e: 22283 },
      { t: "and", s: 22423, e: 22523 },
      { t: "cares", s: 22583, e: 22884 },
      { t: "about", s: 22944, e: 23184 },
      { t: "you.", s: 23224, e: 23344 },
    ],
  },
];

const RECAP_ENTER = 705;

// --- Background: darkened still with a very slow zoom. --------------------
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, backgroundColor: "#000" }}>
      <Img
        src={staticFile(IMG)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.55)",
        }}
      />
    </AbsoluteFill>
  );
};

// --- One karaoke line (pill on the active word; no reflow). ---------------
const Line: React.FC<{
  tokens: Tok[];
  fontSize: number;
  italic?: boolean;
  align: "flex-start" | "flex-end" | "center";
  nowMs: number;
}> = ({ tokens, fontSize, italic, align, nowMs }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: align,
      columnGap: 2,
      rowGap: 4,
      fontFamily: FONT_FAMILY,
      fontSize,
      fontWeight: 700,
      fontStyle: italic ? "italic" : "normal",
    }}
  >
    {tokens.map((tok, i) => {
      const next = tokens[i + 1];
      // Active from onset until the next word starts, capped so the pill clears
      // during the long gaps between lines.
      const until = Math.min(next ? next.s : tok.e + 400, tok.e + 400);
      const active = tok.s <= nowMs && nowMs < until;
      return (
        <span
          key={`${tok.s}-${tok.t}`}
          style={{
            padding: "2px 9px",
            borderRadius: 10,
            color: active ? "#3A2A06" : "#FFFFFF",
            background: active ? CAPTION_ACCENT : "transparent",
            textShadow: active
              ? "none"
              : "0 2px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
          }}
        >
          {tok.t}
        </span>
      );
    })}
  </div>
);

// --- A teaching card. -----------------------------------------------------
const WordCard: React.FC<{ card: Card; nowMs: number }> = ({ card, nowMs }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [card.enter, card.enter + 8, card.exit - 8, card.exit],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  if (opacity <= 0) return null;

  const align =
    card.pos === "left" ? "flex-start" : card.pos === "right" ? "flex-end" : "center";
  const posStyle: React.CSSProperties =
    card.pos === "left"
      ? { left: "8%", alignItems: "flex-start", textAlign: "left" }
      : card.pos === "right"
        ? { right: "8%", alignItems: "flex-end", textAlign: "right" }
        : { left: 0, right: 0, alignItems: "center", textAlign: "center" };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "15%",
        opacity,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        maxWidth: "60%",
        ...posStyle,
        ...(card.pos === "center" ? { margin: "0 auto", maxWidth: "82%" } : {}),
      }}
    >
      {/* soft scrim panel behind the block */}
      <div
        style={{
          position: "absolute",
          inset: "-22px -32px",
          background: "rgba(0,0,0,0.34)",
          borderRadius: 28,
          zIndex: -1,
        }}
      />
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 112,
          fontWeight: 900,
          color: CAPTION_ACCENT,
          lineHeight: 1,
          letterSpacing: 2,
          textShadow: "0 4px 18px rgba(0,0,0,0.8)",
        }}
      >
        {card.word}
      </div>
      <Line tokens={card.example} fontSize={46} align={align} nowMs={nowMs} />
      <Line tokens={card.meaning} fontSize={32} italic align={align} nowMs={nowMs} />
    </div>
  );
};

// --- Intro title + final recap row. ---------------------------------------
const IntroTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [10, 22, 78, 88], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 52,
          fontWeight: 500,
          color: "#FFFFFF",
          letterSpacing: 6,
          textShadow: "0 2px 12px rgba(0,0,0,0.9)",
        }}
      >
        Three words
      </div>
    </AbsoluteFill>
  );
};

const RecapRow: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [RECAP_ENTER, RECAP_ENTER + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < RECAP_ENTER) return null;
  const words = ["KIND", "HELP", "FRIEND"];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {words.map((w, i) => (
          <React.Fragment key={w}>
            {i > 0 ? (
              <span style={{ color: "#FFFFFF", opacity: 0.5, fontSize: 56 }}>·</span>
            ) : null}
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: 78,
                fontWeight: 900,
                color: CAPTION_ACCENT,
                letterSpacing: 3,
                textShadow: "0 4px 18px rgba(0,0,0,0.8)",
              }}
            >
              {w}
            </span>
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Scene14: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Background />
      <IntroTitle />
      {CARDS.map((card) => (
        <WordCard key={card.word} card={card} nowMs={nowMs} />
      ))}
      <RecapRow />
      <Audio src={staticFile(AUDIO)} />
    </AbsoluteFill>
  );
};

export const SCENE14_DURATION = 780; // ~26.0s (narration 23.7s + ~2.5s recap)
