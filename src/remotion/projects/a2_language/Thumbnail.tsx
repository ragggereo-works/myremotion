import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadBaloo2 } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadDMSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { FONT_FAMILY, CAPTION_ACCENT } from "../../../brand";

// ===========================================================================
// Reusable YouTube thumbnail template (still, 1280x720). Swap `image` + `title`
// for future story thumbnails; tune side / size / badge / titleFont via props.
//
// Two-font system: a warm storybook DISPLAY font for the title (swappable),
// and plain bold Inter for the badge (boring on purpose, reads instantly).
// ===========================================================================

// Storybook title fonts, each loaded at a heavy weight so they don't fall back.
const baloo2 = loadBaloo2("normal", { weights: ["800"], subsets: ["latin"] });
const fredoka = loadFredoka("normal", { weights: ["600"], subsets: ["latin"] });
const playfair = loadPlayfair("normal", { weights: ["900"], subsets: ["latin"] });
const dmSerif = loadDMSerif("normal", { weights: ["400"], subsets: ["latin"] });

export const TITLE_FONTS = {
  // Soft rounded, warmest + most legible small — the default.
  Baloo2: { family: baloo2.fontFamily, weight: 800 },
  Fredoka: { family: fredoka.fontFamily, weight: 600 },
  // Bold storybook serifs.
  PlayfairDisplay: { family: playfair.fontFamily, weight: 900 },
  DMSerifDisplay: { family: dmSerif.fontFamily, weight: 400 },
} as const;

export type TitleFontKey = keyof typeof TITLE_FONTS;

export type ThumbnailProps = {
  /** Public-relative background image path. */
  image: string;
  /** Title text. Use "\n" to force line breaks; otherwise it wraps. */
  title: string;
  /** Small secondary badge text. */
  badge: string;
  /** Which side the text block sits on (away from the subject). */
  textSide: "left" | "right";
  /** Title font size in px. */
  titleFontSize: number;
  /** Which storybook display font the title uses (swappable per video). */
  titleFont: TitleFontKey;
  /** Width of the text column as a fraction of the frame (0–1). */
  textWidth: number;
  /** Soft dark scrim over the text side only (keeps the subject untouched). */
  scrim: boolean;
  /** Badge / accent colour. */
  accent: string;
};

export const thumbnailDefaultProps: ThumbnailProps = {
  image: "a2_language/lion_and_mouse/thumbnail/lion_and_mouse_thumbnail.png",
  title: "THE LION & THE MOUSE",
  badge: "A2 · LEARN ENGLISH",
  textSide: "left",
  titleFontSize: 104,
  titleFont: "Baloo2",
  textWidth: 0.52,
  scrim: true,
  accent: CAPTION_ACCENT,
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
  image,
  title,
  badge,
  textSide,
  titleFontSize,
  titleFont,
  textWidth,
  scrim,
  accent,
}) => {
  const isLeft = textSide === "left";
  const titleTypeface = TITLE_FONTS[titleFont] ?? TITLE_FONTS.Baloo2;
  const align = isLeft ? "flex-start" : "flex-end";
  const textAlign = isLeft ? "left" : "right";

  const scrimBg = isLeft
    ? "linear-gradient(to right, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.5) 28%, rgba(0,0,0,0) 58%)"
    : "linear-gradient(to left, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.5) 28%, rgba(0,0,0,0) 58%)";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img
        src={staticFile(image)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {scrim ? <AbsoluteFill style={{ background: scrimBg }} /> : null}

      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: align,
          padding: "0 5%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: align,
            gap: 22,
            width: `${textWidth * 100}%`,
          }}
        >
          {/* Badge — gold pill, secondary to the title. */}
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#3A2A06",
              background: accent,
              padding: "7px 18px",
              borderRadius: 999,
              boxShadow: "0 3px 12px rgba(0,0,0,0.45)",
            }}
          >
            {badge}
          </div>

          {/* Title — heavy, warm cream, dark outline + shadow for legibility. */}
          <div
            style={{
              fontFamily: titleTypeface.family,
              fontSize: titleFontSize,
              fontWeight: titleTypeface.weight,
              lineHeight: 1.0,
              letterSpacing: 1,
              color: "#FFF6E6",
              textAlign,
              WebkitTextStroke: "2px rgba(0,0,0,0.5)",
              textShadow: "0 5px 22px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.7)",
              whiteSpace: "pre-line",
            }}
          >
            {title}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
