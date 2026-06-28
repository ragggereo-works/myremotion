import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  CaptionScrim,
  KaraokeCaptions,
  useCaptions,
  DEFAULT_BROLL_VOLUME,
} from "./shared";

// ===========================================================================
// A scene where BOTH b-roll clips play in FULL (no trimming, no slowdown) and
// the narration is split into two parts positioned in time:
//   - Clip A plays start->end; segment 1 narration+captions ride over it from 0.
//   - Clip B plays right after; segment 2 narration+captions start `seg2LeadSec`
//     seconds into Clip B.
// Used when the b-roll, not the voice, sets the scene length.
// ===========================================================================

export type TwoSegmentConfig = {
  clipA: string;
  clipB: string;
  clipAFrames: number;
  clipBFrames: number;
  seg1Audio: string;
  seg1Captions: string;
  seg2Audio: string;
  seg2Captions: string;
  seg2LeadFrames: number; // gap after Clip B starts before segment 2 narration
  seg1Frames: number; // spoken length of segment 1 (frames) — caption clears after
  seg2Frames: number; // spoken length of segment 2 (frames)
  brollVolume?: number;
};

// Captions linger this many frames past the last spoken word, then clear so the
// b-roll plays clean.
const CAPTION_TAIL = 18;

const PushClip: React.FC<{
  src: string;
  durationInFrames: number;
  volume: number;
}> = ({ src, durationInFrames, volume }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <OffthreadVideo
        src={staticFile(src)}
        volume={volume}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

export const TwoSegmentScene: React.FC<TwoSegmentConfig> = ({
  clipA,
  clipB,
  clipAFrames,
  clipBFrames,
  seg1Audio,
  seg1Captions,
  seg2Audio,
  seg2Captions,
  seg2LeadFrames,
  seg1Frames,
  seg2Frames,
  brollVolume = DEFAULT_BROLL_VOLUME,
}) => {
  const cap1 = useCaptions(seg1Captions);
  const cap2 = useCaptions(seg2Captions);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Both clips, full length, full brightness. */}
      <Sequence durationInFrames={clipAFrames}>
        <PushClip src={clipA} durationInFrames={clipAFrames} volume={brollVolume} />
      </Sequence>
      <Sequence from={clipAFrames} durationInFrames={clipBFrames}>
        <PushClip src={clipB} durationInFrames={clipBFrames} volume={brollVolume} />
      </Sequence>

      <CaptionScrim />

      {/* Segment 1 narration over Clip A; caption clears after it's spoken so
          the rest of Clip A plays clean. */}
      <Sequence from={0} durationInFrames={clipAFrames}>
        <Audio src={staticFile(seg1Audio)} />
      </Sequence>
      <Sequence from={0} durationInFrames={seg1Frames + CAPTION_TAIL}>
        {cap1 ? <KaraokeCaptions captions={cap1} /> : null}
      </Sequence>

      {/* Segment 2 narration starts seg2LeadFrames into Clip B; caption clears
          after it's spoken. */}
      <Sequence from={clipAFrames + seg2LeadFrames} durationInFrames={clipBFrames - seg2LeadFrames}>
        <Audio src={staticFile(seg2Audio)} />
      </Sequence>
      <Sequence from={clipAFrames + seg2LeadFrames} durationInFrames={seg2Frames + CAPTION_TAIL}>
        {cap2 ? <KaraokeCaptions captions={cap2} /> : null}
      </Sequence>
    </AbsoluteFill>
  );
};
