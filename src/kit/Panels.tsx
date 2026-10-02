import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Eyebrow, Rich, clamp, ease, fadeUp, useBrand } from "./style";

/*
  Painéis da metade de cima (tela dividida). Nunca têm áudio.
  Todos os "at" são frames relativos ao início do painel.
  Itens aparecem apagados logo no início e acendem quando são falados (o painel nunca fica vazio).
*/

const Bg: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const b = useBrand();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 55%, ${b.colors.dark}ee 0%, ${b.colors.dark} 70%, #0d1622 100%)`,
        fontFamily: b.font.family,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 110,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const lightUp = (frame: number, i: number, at: number) =>
  interpolate(frame, [6 + i * 4, 20 + i * 4, at - 2, at + 10], [0, 0.3, 0.3, 1], clamp);

type Item = { label: string; at: number; italic?: boolean };

/* Lista numerada com fios finos */
const ListPanel: React.FC<{ eyebrow?: string; items: Item[]; numbered?: boolean }> = ({ eyebrow, items, numbered = true }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  return (
    <Bg>
      {eyebrow && (
        <div style={{ ...fadeUp(frame, 4), marginBottom: 34 }}>
          <Eyebrow text={eyebrow} />
        </div>
      )}
      <div style={{ width: 720 }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              opacity: lightUp(frame, i, it.at),
              display: "flex",
              alignItems: "baseline",
              gap: 28,
              padding: "16px 0",
              borderBottom: i === items.length - 1 ? "none" : `1px solid ${b.colors.light}47`,
            }}
          >
            {numbered && <div style={{ color: b.colors.accent, fontWeight: 400, fontSize: 24, letterSpacing: 3, width: 40 }}>{String(i + 1).padStart(2, "0")}</div>}
            <div style={{ color: it.italic ? b.colors.light : b.colors.text, fontStyle: it.italic ? "italic" : "normal", fontWeight: 300, fontSize: 50, lineHeight: 1.15 }}>
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </Bg>
  );
};

/* Número grande com contagem */
const CounterPanel: React.FC<{ eyebrow?: string; prefix?: string; value: number; numAt: number; label?: string; note?: string; noteAt?: number }> = ({
  eyebrow,
  prefix,
  value,
  numAt,
  label,
  note,
  noteAt = 9999,
}) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const n = Math.round(interpolate(frame, [8, numAt + 10], [0, value], { ...clamp, easing: ease }));
  return (
    <Bg>
      {eyebrow && (
        <div style={fadeUp(frame, 4)}>
          <Eyebrow text={eyebrow} />
        </div>
      )}
      <div style={{ ...fadeUp(frame, 8, 16), display: "flex", alignItems: "flex-start", marginTop: 10 }}>
        {prefix && <span style={{ color: b.colors.light, fontWeight: 300, fontSize: 80, marginTop: 30, marginRight: 8 }}>{prefix}</span>}
        <span style={{ color: b.colors.text, fontWeight: 300, fontSize: 200, letterSpacing: 6, fontVariantNumeric: "tabular-nums" }}>{n}</span>
      </div>
      {label && (
        <div style={{ ...fadeUp(frame, 16, 16), color: b.colors.text, fontWeight: 300, fontSize: 46, textAlign: "center" }}>
          <Rich text={label} />
        </div>
      )}
      {note && (
        <div style={{ ...fadeUp(frame, noteAt, 18), marginTop: 30, color: "rgba(255,255,255,0.85)", fontWeight: 300, fontSize: 38, textAlign: "center", lineHeight: 1.3 }}>
          <Rich text={note} />
        </div>
      )}
    </Bg>
  );
};

/* Algo riscado dando lugar a outra coisa */
const StrikePanel: React.FC<{ eyebrow?: string; title?: string; old: string; next: string; strikeAt: number; revealAt: number }> = ({
  eyebrow,
  title,
  old,
  next,
  strikeAt,
  revealAt,
}) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const strike = interpolate(frame, [strikeAt, strikeAt + 12], [0, 1], { ...clamp, easing: ease });
  return (
    <Bg>
      {eyebrow && (
        <div style={fadeUp(frame, 4)}>
          <Eyebrow text={eyebrow} />
        </div>
      )}
      {title && (
        <div style={{ ...fadeUp(frame, 10, 18), marginTop: 20, color: b.colors.text, fontWeight: 300, fontSize: 60, textAlign: "center", lineHeight: 1.2 }}>
          <Rich text={title} />
        </div>
      )}
      <div style={{ position: "relative", marginTop: 34, ...fadeUp(frame, Math.min(strikeAt - 6, 12), 14) }}>
        <div style={{ color: b.colors.text, fontWeight: 300, fontSize: title ? 50 : 96, letterSpacing: 2, opacity: interpolate(strike, [0, 1], [1, 0.4]) }}>{old}</div>
        <div style={{ position: "absolute", left: -10, right: -10, top: "54%", height: 3, backgroundColor: b.colors.light, scale: `${strike} 1`, transformOrigin: "left" }} />
      </div>
      <div style={{ ...fadeUp(frame, revealAt - 2, 16, 20), marginTop: 12, color: b.colors.light, fontWeight: 300, fontStyle: "italic", fontSize: title ? 84 : 104 }}>{next}</div>
    </Bg>
  );
};

/* Itens empilhados com um conector (+, ·) */
const StackPanel: React.FC<{ eyebrow?: string; items: Item[]; joiner?: string; note?: string; noteAt?: number; upper?: boolean }> = ({
  eyebrow,
  items,
  joiner = "+",
  note,
  noteAt = 9999,
  upper = false,
}) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  return (
    <Bg>
      {eyebrow && (
        <div style={fadeUp(frame, 2)}>
          <Eyebrow text={eyebrow} />
        </div>
      )}
      <div style={{ marginTop: 26, textAlign: "center" }}>
        {items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ opacity: lightUp(frame, i, it.at - 4), color: b.colors.accent, fontWeight: 300, fontSize: 40, margin: "4px 0" }}>{joiner}</div>}
            <div
              style={{
                opacity: lightUp(frame, i, it.at),
                color: it.italic ? b.colors.light : b.colors.text,
                fontStyle: it.italic ? "italic" : "normal",
                fontWeight: 300,
                fontSize: it.italic ? 66 : 56,
                letterSpacing: upper ? 6 : 2,
                textTransform: upper && !it.italic ? "uppercase" : "none",
              }}
            >
              {it.label}
            </div>
          </React.Fragment>
        ))}
      </div>
      {note && (
        <div style={{ ...fadeUp(frame, noteAt, 18), marginTop: 36, color: "rgba(255,255,255,0.85)", fontWeight: 300, fontSize: 36, textAlign: "center", lineHeight: 1.3 }}>
          <Rich text={note} />
        </div>
      )}
    </Bg>
  );
};

/* Uma palavra ou número grande (ex.: um ano) com fio */
const BigPanel: React.FC<{ eyebrow?: string; text: string; at?: number; sub?: string; subAt?: number }> = ({ eyebrow, text, at = 8, sub, subAt = 9999 }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const line = interpolate(frame, [at, at + 24], [0, 1], { ...clamp, easing: ease });
  return (
    <Bg>
      {eyebrow && (
        <div style={fadeUp(frame, 2)}>
          <Eyebrow text={eyebrow} />
        </div>
      )}
      <div style={{ ...fadeUp(frame, 8, 20, 26), color: b.colors.text, fontWeight: 300, fontSize: 200, letterSpacing: 14, marginTop: 10 }}>{text}</div>
      <div style={{ width: 360, height: 2, backgroundColor: b.colors.light, scale: `${line} 1` }} />
      {sub && (
        <div style={{ ...fadeUp(frame, subAt, 16), marginTop: 30, color: b.colors.text, fontWeight: 300, fontSize: 48, textAlign: "center" }}>
          <Rich text={sub} />
        </div>
      )}
    </Bg>
  );
};

const REGISTRY: Record<string, React.FC<any>> = {
  list: ListPanel,
  counter: CounterPanel,
  strike: StrikePanel,
  stack: StackPanel,
  big: BigPanel,
};

/* Moldura do painel: entra com fade e leve recuo, com fio na divisória */
export const PanelFrame: React.FC<{ type: string; props: Record<string, unknown>; first: boolean }> = ({ type, props, first }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const P = REGISTRY[type];
  if (!P) throw new Error(`Painel desconhecido: ${type}`);
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 960, overflow: "hidden", opacity: interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: ease }) }}>
        <AbsoluteFill style={{ scale: String(interpolate(frame, [0, 24], [1.04, 1], { ...clamp, easing: ease })) }}>
          <P {...props} />
        </AbsoluteFill>
      </div>
      {(
        <div
          style={{
            position: "absolute",
            top: 959,
            left: 0,
            width: 1080,
            height: 2,
            backgroundColor: b.colors.light,
            opacity: 0.8,
            scale: `${first ? interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) }) : 1} 1`,
          }}
        />
      )}
    </>
  );
};
