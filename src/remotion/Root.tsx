import React from "react";
import { Composition, Folder } from "remotion";
import { DynamicComp } from "./DynamicComp";
import { MyAnimation } from "./MyAnimation";
import { Intro } from "./Intro";
import { CountriesNotClubs } from "./CountriesNotClubs";
import { FPS, SHORT_HEIGHT, SHORT_WIDTH } from "../brand";
import { Scene01 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene01";
import { Scene02 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene02";
import { Scene03 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene03";
import { Scene04 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene04";
import { Scene05 } from "./projects/worldcup-explainer/Estadio_Azteca/shorts/Scene05";

const SHORT_SCENES = [
  { id: "Short-Scene01", component: Scene01, durationInFrames: 309 },
  { id: "Short-Scene02", component: Scene02, durationInFrames: 459 },
  { id: "Short-Scene03", component: Scene03, durationInFrames: 459 },
  { id: "Short-Scene04", component: Scene04, durationInFrames: 369 },
  { id: "Short-Scene05", component: Scene05, durationInFrames: 354 },
] as const;

const defaultCode = `import { AbsoluteFill } from "remotion";
export const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;`;

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
