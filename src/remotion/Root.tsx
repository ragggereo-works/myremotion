import React from "react";
import { Composition, Folder } from "remotion";
import { DynamicComp } from "./DynamicComp";
import { MyAnimation } from "./MyAnimation";
import { Intro } from "./Intro";
import { CountriesNotClubs } from "./CountriesNotClubs";
import { FPS, SHORT_HEIGHT, SHORT_WIDTH, VIDEO_WIDTH, VIDEO_HEIGHT } from "../brand";
import { Scene as A2Scene } from "./projects/a2_language/Scene";
import { TwoSegmentScene } from "./projects/a2_language/TwoSegmentScene";
import {
  LION_AND_MOUSE_SCENES,
  LION_AND_MOUSE_TWO_SEGMENT,
} from "./projects/a2_language/lion_and_mouse/scenes";
import {
  Scene14 as A2Scene14,
  SCENE14_DURATION,
} from "./projects/a2_language/lion_and_mouse/Scene14";
import {
  Scene15 as A2Scene15,
  SCENE15_DURATION,
} from "./projects/a2_language/lion_and_mouse/Scene15";
import {
  Scene15Ext as A2Scene15Ext,
  SCENE15EXT_DURATION,
} from "./projects/a2_language/lion_and_mouse/Scene15Ext";
import {
  Thumbnail as A2Thumbnail,
  thumbnailDefaultProps,
} from "./projects/a2_language/Thumbnail";
import { Scene01 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene01";
import { Scene02 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene02";
import { Scene03 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene03";
import { Scene04 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene04";
import { Scene05 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene05";
import { Scene01 as RulesScene01 } from "./projects/worldcup-explainer/football_rules/Scene01";
import { Scene02 as RulesScene02 } from "./projects/worldcup-explainer/football_rules/Scene02";
import { Scene03 as RulesScene03 } from "./projects/worldcup-explainer/football_rules/Scene03";
import { Scene04 as RulesScene04 } from "./projects/worldcup-explainer/football_rules/Scene04";
import { Scene05 as RulesScene05 } from "./projects/worldcup-explainer/football_rules/Scene05";
import {
  FullShort,
  FULL_SHORT_DURATION,
} from "./projects/worldcup-explainer/football_rules/FullShort";
import {
  Scene01 as WatchScene01,
  SCENE01_DURATION as WATCH_SCENE01_DURATION,
} from "./projects/worldcup-explainer/who_to_watch/Scene01";
import {
  Scene02 as WatchScene02,
  SCENE02_DURATION as WATCH_SCENE02_DURATION,
} from "./projects/worldcup-explainer/who_to_watch/Scene02";
import {
  Scene03 as WatchScene03,
  SCENE03_DURATION as WATCH_SCENE03_DURATION,
} from "./projects/worldcup-explainer/who_to_watch/Scene03";
import {
  Scene04 as WatchScene04,
  SCENE04_DURATION as WATCH_SCENE04_DURATION,
} from "./projects/worldcup-explainer/who_to_watch/Scene04";

// who_to_watch flagship (vertical 1080x1920) — Watch-SceneNN + WatchFull.
// Durations from generate-vo.mjs: ceil((vo seconds + 0.3) * 30); final +0.8.
const WATCH_SCENES = [
  { id: "Watch-Scene01", component: WatchScene01, durationInFrames: WATCH_SCENE01_DURATION },
  { id: "Watch-Scene02", component: WatchScene02, durationInFrames: WATCH_SCENE02_DURATION },
  { id: "Watch-Scene03", component: WatchScene03, durationInFrames: WATCH_SCENE03_DURATION },
  { id: "Watch-Scene04", component: WatchScene04, durationInFrames: WATCH_SCENE04_DURATION },
] as const;

const SHORT_SCENES = [
  { id: "Short-Scene01", component: Scene01, durationInFrames: 309 },
  { id: "Short-Scene02", component: Scene02, durationInFrames: 459 },
  { id: "Short-Scene03", component: Scene03, durationInFrames: 459 },
  { id: "Short-Scene04", component: Scene04, durationInFrames: 369 },
  { id: "Short-Scene05", component: Scene05, durationInFrames: 354 },
] as const;

// football_rules Short — durations match each scene's generated VO
// (frame rule: ceil((vo seconds + 0.3) * 30); Scene05 uses +0.8).
const RULES_SCENES = [
  { id: "Rules-Scene01", component: RulesScene01, durationInFrames: 221 },
  { id: "Rules-Scene02", component: RulesScene02, durationInFrames: 382 },
  { id: "Rules-Scene03", component: RulesScene03, durationInFrames: 468 },
  { id: "Rules-Scene04", component: RulesScene04, durationInFrames: 250 },
  { id: "Rules-Scene05", component: RulesScene05, durationInFrames: 281 },
] as const;

const defaultCode = `import { AbsoluteFill } from "remotion";
export const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;`;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="a2-lion-and-mouse">
        {LION_AND_MOUSE_SCENES.map((s) => (
          <Composition
            key={s.id}
            id={s.id}
            component={A2Scene}
            durationInFrames={s.durationInFrames}
            fps={FPS}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            defaultProps={{
              audio: s.audio,
              clipA: s.clipA,
              clipB: s.clipB,
              captions: s.captions,
              durationInFrames: s.durationInFrames,
              splitFrame: s.splitFrame,
              brollVolume: s.brollVolume,
              clipARate: s.clipARate,
              clipBRate: s.clipBRate,
              audioLeadFrames: s.audioLeadFrames,
              captionFrames: s.captionFrames,
            }}
          />
        ))}
        <Composition
          id="A2-Lion-Scene14"
          component={A2Scene14}
          durationInFrames={SCENE14_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
        />
        <Composition
          id="A2-Lion-Scene15"
          component={A2Scene15}
          durationInFrames={SCENE15_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
        />
        <Composition
          id="A2-Lion-Scene15-Ext"
          component={A2Scene15Ext}
          durationInFrames={SCENE15EXT_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
        />
        <Composition
          id="A2-Thumbnail"
          component={A2Thumbnail}
          durationInFrames={1}
          fps={FPS}
          width={1280}
          height={720}
          defaultProps={thumbnailDefaultProps}
        />
        {LION_AND_MOUSE_TWO_SEGMENT.map((s) => (
          <Composition
            key={s.id}
            id={s.id}
            component={TwoSegmentScene}
            durationInFrames={s.durationInFrames}
            fps={FPS}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            defaultProps={{
              clipA: s.clipA,
              clipB: s.clipB,
              clipAFrames: s.clipAFrames,
              clipBFrames: s.clipBFrames,
              seg1Audio: s.seg1Audio,
              seg1Captions: s.seg1Captions,
              seg2Audio: s.seg2Audio,
              seg2Captions: s.seg2Captions,
              seg2LeadFrames: s.seg2LeadFrames,
              seg1Frames: s.seg1Frames,
              seg2Frames: s.seg2Frames,
            }}
          />
        ))}
      </Folder>
      <Folder name="worldcup-explainer-shorts">
        {SHORT_SCENES.map((s) => (
          <Composition
            key={s.id}
            id={s.id}
            component={s.component}
            durationInFrames={s.durationInFrames}
            fps={FPS}
            width={SHORT_WIDTH}
            height={SHORT_HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="football-rules-short">
        <Composition
          id="FullShort"
          component={FullShort}
          durationInFrames={FULL_SHORT_DURATION}
          fps={FPS}
          width={SHORT_WIDTH}
          height={SHORT_HEIGHT}
        />
        {RULES_SCENES.map((s) => (
          <Composition
            key={s.id}
            id={s.id}
            component={s.component}
            durationInFrames={s.durationInFrames}
            fps={FPS}
            width={SHORT_WIDTH}
            height={SHORT_HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="who-to-watch">
        {WATCH_SCENES.map((s) => (
          <Composition
            key={s.id}
            id={s.id}
            component={s.component}
            durationInFrames={s.durationInFrames}
            fps={FPS}
            width={SHORT_WIDTH}
            height={SHORT_HEIGHT}
          />
        ))}
      </Folder>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={510}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CountriesNotClubs"
        component={CountriesNotClubs}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MyAnimation"
        component={MyAnimation}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DynamicComp"
        component={DynamicComp}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ code: defaultCode }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.durationInFrames as number,
          fps: props.fps as number,
        })}
      />
    </>
  );
};
