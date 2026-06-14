// Project-wide design tokens — import everything from here, no hardcoded hex.
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

export const BRAND = {
  bg: "#0A0E27",
  bgAlt: "#0E1433", // second navy tone (PitchBG mowing stripes)
  teal: "#2DD4BF",
  gold: "#FFD166",
  pop: "#FF6B5C",
  ink: "#FFFFFF",
} as const;

export const FONT_FAMILY = `${fontFamily}, Helvetica, Arial, sans-serif`;

export const FPS = 30;
export const SAFE_MARGIN = 96;

// Vertical Shorts format
export const SHORT_WIDTH = 1080;
export const SHORT_HEIGHT = 1920;

// Vertical safe zones: nothing in top 200px / bottom 300px (Shorts UI);
// all text inside the middle 75% horizontally.
export const SAFE_TOP = 200;
export const SAFE_BOTTOM = 300;
export const TEXT_ZONE_PCT = 0.75;

export const SOURCE_CHIP_STYLE = {
  fontSize: 11,
  opacity: 0.6,
} as const;
