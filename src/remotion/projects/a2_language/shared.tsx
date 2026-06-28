import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
  cancelRender,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { FONT_FAMILY, CAPTION_ACCENT } from "../../../brand";

// ===========================================================================
// A2 English — horizontal "big story" shared kit (1920x1080, 30fps).
//
// Layering per the project brief:
//   b-roll bed (FULL brightness, A then B) → localized caption scrim →
//   karaoke caption strip → narration audio (unmodified).
// Readability lives on the caption layer (scrim + text shadow), NEVER by
// darkening the footage globally.
// ===========================================================================

// Default b-roll audio level (ambient/sfx — e.g. a lion's roar later), sitting
// under the narration. Overridable per scene via SceneConfig.brollVolume.
// Scene 1 was finalized at 0.12; scenes 2+ default to 0.20.
export const DEFAULT_BROLL_VOLUME = 0.2;

// --- B-roll pair -----------------------------------------------------------
// Clip A plays first, Clip B second; the cut lands on `splitFrame` (a natural
// pause in the narration; default: halfway through the scene). Both clips fill
// the frame at full brightness. A slow Ken-Burns push keeps it alive without
// fast camera motion.
export const BrollPair: React.FC<{
  clipA: string;
  clipB?: string; // omit for a single-clip scene (clipA fills the whole scene)
  splitFrame: number;
  durationInFrames: number;
  volume?: number;
  // Playback rate per clip. <1 slows a clip down to fill its slot so it never
  // freezes when the footage is slightly shorter than the narration. Keep these
  // close to 1 (never speed up — that reads as a fast camera move).
  clipARate?: number;
  clipBRate?: number;
}> = ({
  clipA,
  clipB,
  splitFrame,
  durationInFrames,
  volume = DEFAULT_BROLL_VOLUME,
  clipARate = 1,
  clipBRate = 1,
}) => {
  const frame = useCurrentFrame();
  // Continuous slow push across the whole scene (1.0 -> 1.06), so the A/B cut
  // doesn't visibly "reset" the zoom.
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });
  const clipStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
  // Single-clip scene: clipA spans the whole scene (slowed via clipARate to fill).
  if (!clipB) {
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={staticFile(clipA)}
          volume={volume}
          playbackRate={clipARate}
          style={clipStyle}
        />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <Sequence durationInFrames={splitFrame}>
        <OffthreadVideo
          src={staticFile(clipA)}
          volume={volume}
          playbackRate={clipARate}
          style={clipStyle}
        />
      </Sequence>
      <Sequence from={splitFrame}>
        <OffthreadVideo
          src={staticFile(clipB)}
          volume={volume}
          playbackRate={clipBRate}
          style={clipStyle}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// --- Caption scrim ---------------------------------------------------------
// A soft, localized dark gradient ONLY behind the lower caption band — this is
// what makes the white text readable, not darkening the video.
export const CaptionScrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.42) 12%, rgba(0,0,0,0) 30%)",
    }}
  />
);

// --- Karaoke caption strip -------------------------------------------------
// Whole sentence visible at once (one "page"), sitting in the lower band
// (~78% down). The active spoken word brightens to gold; the rest stay white.
// NOT giant word-by-word text — sized so the full line reads comfortably on a
// 16:9 screen without dominating the picture.

// A page = one full sentence. Each token carries its narration window plus the
// moment the NEXT word begins (activeUntilMs) — the highlight holds on a word
// through the micro-gap after it until the next word starts, so the pill never
// blinks off mid-speech and stays locked to the voice.
type SentenceToken = {
  text: string;
  fromMs: number;
  toMs: number;
  activeUntilMs: number;
};
type SentencePage = { startMs: number; endMs: number; tokens: SentenceToken[] };

// Group word-level captions into SENTENCE pages. A word whose text ends in
// sentence-final punctuation (. ! ? …) closes the current page. This guarantees
// the WHOLE sentence is on screen at once (the brief's rule), regardless of how
// slow the narration is — time-windowing (createTikTokStyleCaptions) breaks slow
// A2 sentences mid-line, so we don't use it here.
const buildSentencePages = (captions: Caption[]): SentencePage[] => {
  const pages: SentencePage[] = [];
  let current: SentenceToken[] = [];
  // A real sentence end is . ! ? (optionally + closing quote). An ellipsis
  // ("..." or "…") is a mid-sentence VOICE pause, NOT a page break — keep the
  // sentence together.
  const ELLIPSIS = /(\.\.\.|…)["')\]]?\s*$/;
  const TERMINAL = /[.!?]["')\]]?\s*$/;
  // Hold each word lit until the next word starts; the last word of a sentence
  // stays lit until its page unmounts (the next sentence appears).
  const closePage = (tokens: SentenceToken[]) => {
    for (let i = 0; i < tokens.length; i++) {
      tokens[i].activeUntilMs =
        i < tokens.length - 1
          ? tokens[i + 1].fromMs
          : Number.POSITIVE_INFINITY;
    }
    pages.push({
      startMs: tokens[0].fromMs,
      endMs: tokens[tokens.length - 1].toMs,
      tokens,
    });
  };
  for (const c of captions) {
    current.push({
      text: c.text,
      fromMs: c.startMs,
      toMs: c.endMs,
      activeUntilMs: c.endMs,
    });
    if (TERMINAL.test(c.text) && !ELLIPSIS.test(c.text)) {
      closePage(current);
      current = [];
    }
  }
  if (current.length) {
    closePage(current);
  }
  return pages;
};

const KaraokePage: React.FC<{ page: SentencePage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Absolute narration time (page Sequence starts at the page's startMs).
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        // Lower band: caption sits ~78% down, clear of the bottom edge.
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: "16%",
        paddingLeft: "10%",
        paddingRight: "10%",
      }}
    >
      {/* Marker-pill karaoke: a gold pill slides under the spoken word. Every
          word carries the SAME constant padding, so toggling the background
          never shifts the layout (no reflow as the highlight travels). Words
          wrap as flex items; line breaks are stable. */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          columnGap: 2,
          rowGap: 8,
          fontFamily: FONT_FAMILY,
          fontSize: 56,
          fontWeight: 700,
          maxWidth: "100%",
        }}
      >
        {page.tokens.map((token) => {
          const isActive =
            token.fromMs <= absoluteTimeMs &&
            absoluteTimeMs < token.activeUntilMs;
          return (
            <span
              key={`${token.fromMs}-${token.text}`}
              style={{
                padding: "3px 11px",
                borderRadius: 12,
                lineHeight: 1.12,
                // Constant box; only color + background change.
                color: isActive ? "#3A2A06" : "#FFFFFF",
                background: isActive ? CAPTION_ACCENT : "transparent",
                // Shadow carries readability for the white (inactive) words;
                // on the gold pill the dark text needs none.
                textShadow: isActive
                  ? "none"
                  : "0 2px 10px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)",
              }}
            >
              {token.text.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const KaraokeCaptions: React.FC<{ captions: Caption[] }> = ({
  captions,
}) => {
  const { fps, durationInFrames: sceneDuration } = useVideoConfig();
  const pages = useMemo(() => buildSentencePages(captions), [captions]);

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        // Hold each sentence until the next one begins (or the scene ends), so
        // there's never a blank gap mid-story.
        const endFrame = nextPage
          ? Math.round((nextPage.startMs / 1000) * fps)
          : sceneDuration;
        const durationInFrames = Math.max(1, endFrame - startFrame);
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <KaraokePage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// --- Captions loader hook --------------------------------------------------
// Fetches a scene's captions JSON from public/ and holds the render until it
// is loaded. Returns null while loading.
export const useCaptions = (jsonPath: string): Caption[] | null => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender(`captions:${jsonPath}`));

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile(jsonPath));
      const data = (await response.json()) as Caption[];
      setCaptions(data);
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [jsonPath, handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  return captions;
};

// Re-export the narration audio component so scenes import everything from the
// kit. Audio plays on top, unmodified.
export { Audio };
