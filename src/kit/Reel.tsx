import React from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { ReelData } from "./types";
import { BrandCtx, clamp } from "./style";
import { ClipVideo, WIDE_TOP, segmentAt } from "./VideoLayer";
import { PanelFrame } from "./Panels";
import { Cinematic, EndCard, Overlay, PhraseCaptions } from "./Overlays";

const loaded = new Set<string>();
const useFonts = (data: ReelData) => {
  const key = data.brand.font.family;
  if (loaded.has(key)) return;
  loaded.add(key);
  const h = delayRender("fontes");
  Promise.all(
    data.brand.font.files.map((f) => loadFont({ family: data.brand.font.family, url: staticFile(f.file), weight: f.weight, style: f.style ?? "normal" })),
  ).then(() => continueRender(h));
};

/*
  Reel genérico. Regras fixas:
  - vídeos sempre mudos; a fala entra por <Audio> por trecho, UMA fonte por vez;
  - painéis da metade de cima nunca têm áudio;
  - efeitos sonoros discretos.
*/
export const Reel: React.FC<{ data: ReelData }> = ({ data }) => {
  useFonts(data);
  const { clips, segments, mainEnd } = data;
  const modeOf = (f: number) => segmentAt(segments, f, mainEnd).mode;
  const wideClip = clips.find((c) => segments.some((s) => s.mode === "wide" && s.at >= c.from && s.at < c.from + c.dur));
  const wideH = wideClip ? Math.min(760, Math.round((1080 * wideClip.h) / wideClip.w)) : 608;
  const caps = {
    full: data.phrases.filter((p) => modeOf(p[0].start) === "full"),
    split: data.phrases.filter((p) => modeOf(p[0].start) === "split"),
    wide: data.phrases.filter((p) => modeOf(p[0].start) === "wide"),
  };
  // blocos de painéis contíguos: só o primeiro anima a divisória
  const panelFirst = data.panels.map((p, i) => i === 0 || data.panels[i - 1].to !== p.from);

  return (
    <BrandCtx.Provider value={data.brand}>
      <AbsoluteFill style={{ backgroundColor: data.brand.colors.dark }}>
        {clips.map((c) => (
          <Sequence key={"v" + c.name} from={c.from} durationInFrames={c.dur} name={"vídeo " + c.name}>
            <ClipVideo clip={c} segments={segments} mainEnd={mainEnd} />
          </Sequence>
        ))}

        {data.panels.map((p, i) => (
          <Sequence key={"p" + i} from={p.from} durationInFrames={p.to - p.from} name={"painel " + p.type}>
            <PanelFrame type={p.type} props={p.props} first={panelFirst[i]} />
          </Sequence>
        ))}

        <Sequence durationInFrames={mainEnd} name="Acabamento">
          <Cinematic />
        </Sequence>

        {data.overlays.map((o, i) => (
          <Sequence key={"o" + i} from={o.from} durationInFrames={o.to - o.from} name={"texto " + o.type}>
            <Overlay type={o.type} props={o.props} duration={o.to - o.from} />
          </Sequence>
        ))}

        <PhraseCaptions pages={caps.full} y={1420} />
        <PhraseCaptions pages={caps.split} y={1035} />
        <PhraseCaptions pages={caps.wide} y={WIDE_TOP + wideH + 150} />

        <Sequence from={mainEnd} durationInFrames={data.end.duration} name="Card final">
          <EndCard tagline={data.end.tagline} handle={data.end.handle ?? data.brand.handle} />
        </Sequence>

        {/* Fala: uma fonte por vez */}
        {clips.map((c) => (
          <Sequence key={"a" + c.name} from={c.from} durationInFrames={c.dur} name={"áudio " + c.name}>
            <Audio
              src={staticFile(c.audio)}
              trimBefore={c.audioTrim}
              volume={(f) => interpolate(f, [0, 2, c.dur - 3, c.dur], [0, 1, 1, c.fadeOut ?? 0], clamp)}
            />
          </Sequence>
        ))}
        {data.sfx.map((s, i) => (
          <Sequence key={"s" + i} from={Math.max(0, s.at)} durationInFrames={60} name={"som " + s.file}>
            <Audio src={staticFile(s.file)} volume={s.volume} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </BrandCtx.Provider>
  );
};
