import React, { createContext, useContext } from "react";
import { Easing, interpolate } from "remotion";
import { Brand } from "./types";

/* Linguagem visual premium: tipografia leve, espaçamento largo, movimentos lentos, pouca cor. */

export const SAFE = { top: 220, bottom: 420, side: 80 }; // zonas seguras do Instagram (1080x1920)
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const GRADE = "contrast(1.06) saturate(0.86) brightness(0.98) sepia(0.06)";

export const BrandCtx = createContext<Brand | null>(null);
export const useBrand = () => {
  const b = useContext(BrandCtx);
  if (!b) throw new Error("Brand não definida");
  return b;
};

export const fadeUp = (frame: number, at: number, len = 14, dist = 18) => ({
  opacity: interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: ease }),
  translate: `0 ${interpolate(frame, [at, at + len], [dist, 0], { ...clamp, easing: ease })}px`,
});

/* Rótulo em caixa alta, pequeno e espaçado */
export const Eyebrow: React.FC<{ text: string; color?: string; style?: React.CSSProperties }> = ({ text, color, style }) => {
  const b = useBrand();
  return (
    <div
      style={{
        fontFamily: b.font.family,
        fontWeight: 500,
        fontSize: 24,
        letterSpacing: 9,
        textTransform: "uppercase",
        color: color ?? b.colors.accent,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/* Texto com trechos em itálico marcados com *asteriscos* */
export const Rich: React.FC<{ text: string; italicColor?: string }> = ({ text, italicColor }) => {
  const b = useBrand();
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") ? (
          <span key={i} style={{ fontStyle: "italic", color: italicColor ?? b.colors.light }}>
            {p.slice(1, -1)}
          </span>
        ) : (
          <React.Fragment key={i}>{p.split("\n").map((l, j) => (j ? [<br key={j} />, l] : l))}</React.Fragment>
        ),
      )}
    </>
  );
};
