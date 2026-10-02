import React from "react";
import { Composition } from "remotion";
import { Reel } from "./kit/Reel";
import { REELS } from "./generated";

// Cada reel gerado por tools/build.py vira uma composição com o mesmo id.
export const RemotionRoot: React.FC = () => (
  <>
    {REELS.map((d) => (
      <Composition key={d.id} id={d.id} component={Reel} defaultProps={{ data: d }} durationInFrames={d.total} fps={d.fps} width={d.width} height={d.height} />
    ))}
  </>
);
