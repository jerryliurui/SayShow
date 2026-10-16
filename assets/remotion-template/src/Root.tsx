import React from "react";
import { Composition, Still } from "remotion";
import { Main } from "./kit/Main";
import { CoverFourThree } from "./video/CoverFourThree";
import { CoverLandscape } from "./video/CoverLandscape";
import { Cover } from "./video/Cover";
import timeline from "./video/timeline.json";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080} defaultProps={{}} />
    <Still id="CoverFourThree" component={CoverFourThree} width={1440} height={1080} />
    <Still id="CoverLandscape" component={CoverLandscape} width={1920} height={1080} />
    <Still id="Cover" component={Cover} width={1080} height={1440} />
  </>
);
