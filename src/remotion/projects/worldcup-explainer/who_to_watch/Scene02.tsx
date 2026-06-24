import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND, FONT_FAMILY } from "../../../../brand";
import { MapBed, PlayerCard, StatStamp, CountUp, SourceChip } from "./shared";

export const SCENE02_DURATION = 864; // ceil((28.480 + 0.3) * 30)
const MAP_FRAMES = 360; // map_argentina.mp4 12.0s @30fps -> freeze last frame after this

// beat frames (synced to VO):
const CHAMP_AT = 216; // "won the one trophy" (~25%)
const BALLON_AT = 432; // "Because he can" (~50%)
const RECORD_AT = 605; // "record sixth World Cup" (~70%)
const REWATCH_AT = 674; // "no outfield player has ever played more" (~78%)
const REWATCH_HOLD = 60; // ~2s screenshot-able hold

// ---------------------------------------------------------------------------
// Rewatch-spike card: held, centred, still — designed to be screenshot/replayed.
// ---------------------------------------------------------------------------
const RewatchCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const enter = spring({
    frame: frame - REWATCH_AT,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.8 },
  });
  const scale = interpolate(enter, [0, 1], [0.9, 1]);
  const op = interpolate(frame, [REWATCH_AT, REWATCH_AT + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* dim everything behind so the card owns the frame */}
      <AbsoluteFill style={{ background: `${BRAND.bg}D9` }} />
      <div
        style={{
          position: "absolute",
          top: height * 0.4,
          left: width * 0.1,
          width: width * 0.8,
          textAlign: "center",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          fontFamily: FONT_FAMILY,
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: BRAND.gold,
            letterSpacing: -1,
            lineHeight: 1.05,
            textShadow: `0 0 44px ${BRAND.gold}55`,
          }}
        >
          NO OUTFIELD PLAYER
          <br />
          HAS PLAYED MORE
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene02: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeOut = interpolate(frame, [SCENE02_DURATION - 10, SCENE02_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // hide the standing card/stamps while the rewatch card holds
  const baseVisible = frame < REWATCH_AT || frame > REWATCH_AT + REWATCH_HOLD;

  return (
    <AbsoluteFill style={{ background: BRAND.bg, fontFamily: FONT_FAMILY, opacity: fadeOut }}>
      <Audio src={staticFile("v3_who_to_watch/Scene02.mp3")} />

      {/* back -> front: map bed -> card -> data -> rewatch -> source chip */}
      <MapBed src="v3_who_to_watch/map_argentina.mp4" opacity={0.35} clipDurationInFrames={MAP_FRAMES} />

      {baseVisible && (
        <>
          <PlayerCard
            name="MESSI"
            country="Argentina"
            age={38}
            position="forward"
            jersey={10}
            accent="gold"
            atFrame={0}
          />
          <StatStamp label="2022 — WORLD CHAMPION" atFrame={CHAMP_AT} accent="gold" index={0} />
          <CountUp to={8} atFrame={BALLON_AT} label="BALLON d'OR" durationFrames={24} />
          <StatStamp label="RECORD 6th WORLD CUP" atFrame={RECORD_AT} accent="teal" index={1} />
        </>
      )}

      <RewatchCard />

      <SourceChip
        text="Messi: 6th WC, 2022 champion, 8 Ballon d'Ors — FIFA/ESPN"
        fadeInAt={20}
      />
    </AbsoluteFill>
  );
};
