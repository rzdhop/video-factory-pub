import React from "react";
import { Composition, staticFile } from "remotion";
import { Episode as EpisodeComp } from "./Episode";
import { CharacterSheet } from "./CharacterSheet";
import { KitSheet } from "./KitSheet";
import type { Episode, EpisodeProps } from "./types";
import "@fontsource/anton";
import "@fontsource/inter/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/jetbrains-mono/500.css";
// extra families a look can name in fontKinetic / fontHud
import "@fontsource/bebas-neue";
import "@fontsource/archivo-black";
import "@fontsource/dm-serif-display";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";

export const Root: React.FC = () => (
  <>
  <Composition id="CharacterSheet" component={CharacterSheet} width={1920} height={1080} fps={30} durationInFrames={1} defaultProps={{ preset: "dark-2d", character: "host" }} />
  <Composition id="KitSheet" component={KitSheet} width={1080} height={1920} fps={30} durationInFrames={150} defaultProps={{ preset: "dark-2d", page: 1 }} />
  <Composition
    id="Episode"
    component={EpisodeComp}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{ episodeId: "ep-000-demo", episode: null, presetOverride: null } as EpisodeProps}
    calculateMetadata={async ({ props }) => {
      const res = await fetch(staticFile(`episodes/${props.episodeId}/episode.json`));
      const episode = (await res.json()) as Episode;
      if (props.presetOverride) episode.preset = props.presetOverride;
      return { props: { ...props, episode }, durationInFrames: Math.ceil(episode.duration * episode.fps), fps: episode.fps };
    }}
  />
  </>
);
