import React from "react";
import { Series } from "remotion";
import { Scene01, SCENE01_DURATION } from "./Scene01";
import { Scene02, SCENE02_DURATION } from "./Scene02";
import { Scene03, SCENE03_DURATION } from "./Scene03";
import { Scene04, SCENE04_DURATION } from "./Scene04";
import { Scene05, SCENE05_DURATION } from "./Scene05";

/*
 * FullShort — all five football_rules scenes back to back.
 * Each scene's <Audio> plays from its own frame 0 via the Series offsets.
 */

export const FULL_SHORT_DURATION =
  SCENE01_DURATION +
  SCENE02_DURATION +
  SCENE03_DURATION +
  SCENE04_DURATION +
  SCENE05_DURATION; // 221 + 382 + 468 + 250 + 281 = 1602

export const FullShort: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SCENE01_DURATION}>
        <Scene01 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE02_DURATION}>
        <Scene02 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE03_DURATION}>
        <Scene03 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE04_DURATION}>
        <Scene04 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE05_DURATION}>
        <Scene05 />
      </Series.Sequence>
    </Series>
  );
};
