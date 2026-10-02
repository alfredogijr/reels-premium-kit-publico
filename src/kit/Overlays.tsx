import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Eyebrow, Rich, SAFE, clamp, ease, fadeUp, useBrand } from "./style";
import { Word } from "./types";
import { WIDE_TOP } from "./VideoLayer";

const TopShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(17,30,46,0.8) 0%, rgba(17,30,46,0.3) 30%, rgba(17,30,46,0) 42%)" }} />
);
const BottomShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(17,30,46,0.7) 0%, rgba(17,30,46,0) 40%)" }} />
);

/* Gancho: visível já no frame 0 (o gancho não pode esperar) */
const Hook: React.FC<{ eyebrow?: string; title: string; titleAt?: number; title2?: string; title2At?: number }> = ({ eyebrow, title, title2, title2At = 0 }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const instant = { opacity: interpolate(frame, [0, 3], [0.85, 1], clamp) };
  const big = { color: b.colors.text, fontWeight: 300, fontSize: 76, lineHeight: 1.12, textShadow: "0 4px 24px rgba(0,0,0,0.45)" } as const;
  return (
    <>
      <TopShade />
      <div style={{ position: "absolute", top: SAFE.top + 40, left: 60, right: 60, textAlign: "center", fontFamily: b.font.family }}>
        {eyebrow && (
          <div style={instant}>
            <Eyebrow text={eyebrow} color={b.colors.light} />
          </div>
        )}
        <div style={{ ...instant, ...big, marginTop: 26 }}>
          <Rich text={title} italicColor="#dce8ff" />
        </div>
        {title2 && (
          <div style={{ ...fadeUp(frame, title2At - 2, 12), ...big }}>
            <Rich text={title2} italicColor="#dce8ff" />
          </div>
        )}
      </div>
    </>
  );
};

/* Nota discreta no topo, sobre o vídeo */
const TopNote: React.FC<{ eyebrow?: string; text: string }> = ({ eyebrow, text }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  return (
    <>
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 10], [0, 1], clamp) }}>
        <TopShade />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: SAFE.top + 40, left: 60, right: 60, textAlign: "center", fontFamily: b.font.family }}>
        {eyebrow && (
          <div style={fadeUp(frame, 0)}>
            <Eyebrow text={eyebrow} color={b.colors.light} />
          </div>
        )}
        <div style={{ ...fadeUp(frame, 6, 18), marginTop: 22, color: b.colors.text, fontWeight: 300, fontSize: 64, lineHeight: 1.15, textShadow: "0 4px 24px rgba(0,0,0,0.45)" }}>
          <Rich text={text} />
        </div>
      </div>
    </>
  );
};

/* Título acima do quadro horizontal (modo "wide") */
const WideTitle: React.FC<{ eyebrow?: string; text: string }> = ({ eyebrow, text }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  return (
    <div style={{ position: "absolute", top: WIDE_TOP - 250, left: 60, right: 60, textAlign: "center", fontFamily: b.font.family }}>
      {eyebrow && (
        <div style={fadeUp(frame, 2)}>
          <Eyebrow text={eyebrow} />
        </div>
      )}
      <div style={{ ...fadeUp(frame, 8, 18), marginTop: 22, color: b.colors.text, fontWeight: 300, fontSize: 64, lineHeight: 1.15 }}>
        <Rich text={text} />
      </div>
    </div>
  );
};

/* Nome e cargo com fio fino */
const LowerThird: React.FC<{ name: string; role: string; y?: number }> = ({ name, role, y = 1160 }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const line = interpolate(frame, [0, 20], [0, 120], { ...clamp, easing: ease });
  return (
    <>
      <BottomShade />
      <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", fontFamily: b.font.family }}>
        <div style={{ ...fadeUp(frame, 6), color: b.colors.text, fontWeight: 500, fontSize: 40, letterSpacing: 2, textShadow: "0 2px 12px rgba(0,0,0,.5)" }}>{name}</div>
        <div style={{ width: line, height: 2, backgroundColor: b.colors.accent, margin: "14px auto" }} />
        <div style={fadeUp(frame, 12)}>
          <Eyebrow text={role} color="rgba(255,255,255,0.85)" style={{ fontSize: 22, letterSpacing: 7 }} />
        </div>
      </div>
    </>
  );
};

/* Logo oficial em cartão branco */
const LogoCard: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const op = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: 18, padding: "8px 22px", boxShadow: "0 12px 30px rgba(0,0,0,0.22)", opacity: op }}>
        <Img src={staticFile(b.logo)} style={{ width: 300, display: "block" }} />
      </div>
    </div>
  );
};

const REGISTRY: Record<string, React.FC<any>> = { hook: Hook, topNote: TopNote, wideTitle: WideTitle, lowerThird: LowerThird, logo: LogoCard };

export const Overlay: React.FC<{ type: string; props: Record<string, unknown>; duration: number }> = ({ type, props, duration }) => {
  const O = REGISTRY[type];
  if (!O) throw new Error(`Sobreposição desconhecida: ${type}`);
  return <O {...props} duration={duration} />;
};

/* Legenda por frase: caixa normal, tamanho contido, palavra dita acende */
export const PhraseCaptions: React.FC<{ pages: Word[][]; y: number }> = ({ pages, y }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const page = pages.find((p) => frame >= p[0].start - 2 && frame < p[p.length - 1].end + 6);
  if (!page) return null;
  const start = page[0].start - 2;
  const end = page[page.length - 1].end + 6;
  const op = interpolate(frame, [start, start + 5, end - 5, end], [0, 1, 1, 0], clamp);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: -60,
          right: -60,
          top: y - 150,
          height: 300,
          opacity: op,
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(10,18,28,0.62) 0%, rgba(10,18,28,0.35) 45%, rgba(10,18,28,0) 75%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: y,
          translate: "0 -50%",
          textAlign: "center",
          fontFamily: b.font.family,
          fontWeight: 500,
          fontSize: 46,
          lineHeight: 1.3,
          letterSpacing: 0.3,
          opacity: op,
          textShadow: "0 2px 14px rgba(0,0,0,0.55)",
        }}
      >
        {page.map((w, i) => (
          <span key={i} style={{ color: w.key ? b.colors.light : b.colors.text, opacity: frame >= w.start ? 1 : 0.6 }}>
            {w.text}
            {i < page.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </>
  );
};

/* Card final */
export const EndCard: React.FC<{ tagline: string; handle: string }> = ({ tagline, handle }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  return (
    <AbsoluteFill style={{ backgroundColor: b.colors.endBg, alignItems: "center", justifyContent: "center", fontFamily: b.font.family }}>
      <div style={{ ...fadeUp(frame, 4, 22, 20), marginTop: -120 }}>
        <Img src={staticFile(b.logo)} style={{ width: 620, display: "block" }} />
      </div>
      <div style={{ ...fadeUp(frame, 22, 20), marginTop: 36, textAlign: "center" }}>
        <div style={{ color: b.colors.dark, fontWeight: 300, fontStyle: "italic", fontSize: 50, lineHeight: 1.25 }}>
          <Rich text={tagline} italicColor={b.colors.dark} />
        </div>
        <div style={{ width: 60, height: 2, backgroundColor: b.colors.accent, margin: "30px auto" }} />
        <Eyebrow text={handle} color={b.colors.dark} style={{ fontSize: 26, letterSpacing: 8, textTransform: "none" }} />
      </div>
    </AbsoluteFill>
  );
};

/* Vinheta e granulação leve */
export const Cinematic: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(10,18,28,0.45) 100%)" }} />
      <svg width="1080" height="1920" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 12} />
        </filter>
        <rect width="1080" height="1920" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
