import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { ClipData, Segment } from "./types";
import { GRADE, clamp, useBrand } from "./style";

export const WIDE_TOP = 640;

/* Posiciona a fonte cobrindo uma janela W×H com o ponto de foco (cx, cy) o mais ao centro possível */
const cover = (W: number, H: number, w: number, h: number, cx: number, cy: number, zoom: number) => {
  const s = Math.max(W / w, H / h) * zoom;
  const ws = w * s;
  const hs = h * s;
  const left = Math.min(0, Math.max(W - ws, W / 2 - cx * ws));
  const top = Math.min(0, Math.max(H - hs, H / 2 - cy * hs));
  return { left, top, width: ws, height: hs };
};

export const segmentAt = (segments: Segment[], f: number, mainEnd: number) => {
  let s = segments[0];
  let end = mainEnd;
  segments.forEach((x, i) => {
    if (f >= x.at) {
      s = x;
      end = segments[i + 1]?.at ?? mainEnd;
    }
  });
  return { ...s, end };
};

/* Um trecho de vídeo (sempre mudo: o áudio entra separado, uma fonte por vez) */
export const ClipVideo: React.FC<{ clip: ClipData; segments: Segment[]; mainEnd: number }> = ({ clip, segments, mainEnd }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const g = clip.from + frame;
  const seg = segmentAt(segments, g, mainEnd);
  const t = interpolate(g, [seg.at, seg.end], [0, 1], clamp);
  const [z0, z1] = seg.zoom ?? [1, 1.05];
  const z = interpolate(t, [0, 1], [z0, z1], { ...clamp, easing: seg.easeOut ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.linear });
  const cx = seg.cx ?? 0.5;
  const cy = seg.cy ?? 0.4;

  const video = (W: number, H: number, zoom: number, fx: number, fy: number) => {
    const r = cover(W, H, clip.w, clip.h, fx, fy, zoom);
    return (
      <div style={{ position: "absolute", ...r, filter: GRADE }}>
        <Video src={staticFile(clip.video)} muted style={{ width: "100%", height: "100%" }} />
      </div>
    );
  };

  if (seg.mode === "split") {
    return (
      <div style={{ position: "absolute", left: 0, top: 960, width: 1080, height: 960, overflow: "hidden", backgroundColor: b.colors.dark }}>
        {video(1080, 960, z, cx, cy)}
      </div>
    );
  }
  if (seg.mode === "wide") {
    const H = Math.round((1080 * clip.h) / clip.w) > 1100 ? 760 : Math.round((1080 * clip.h) / clip.w);
    return (
      <AbsoluteFill style={{ backgroundColor: "#101c2b" }}>
        <div style={{ position: "absolute", top: WIDE_TOP, left: 0, width: 1080, height: H, overflow: "hidden" }}>{video(1080, H, z, cx, cy)}</div>
        <div style={{ position: "absolute", top: WIDE_TOP - 1, left: 0, width: 1080, height: 1, backgroundColor: b.colors.light, opacity: 0.5 }} />
        <div style={{ position: "absolute", top: WIDE_TOP + H, left: 0, width: 1080, height: 1, backgroundColor: b.colors.light, opacity: 0.5 }} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ overflow: "hidden", backgroundColor: b.colors.dark }}>{video(1080, 1920, z, cx, cy)}</AbsoluteFill>;
};
