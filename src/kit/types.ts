// Formato gerado por tools/build.py a partir de um arquivo de reel (reels/<id>.json).
// Todos os tempos aqui já estão em frames do vídeo final.

export type Brand = {
  name: string;
  colors: { dark: string; accent: string; light: string; text: string; endBg: string };
  font: { family: string; files: { file: string; weight: string; style?: string }[] };
  logo: string; // caminho em public/
  handle: string;
};

export type Word = { text: string; start: number; end: number; key?: boolean };

export type ClipData = {
  name: string;
  video: string; // public/... (trecho pré-cortado)
  audio: string; // public/... (áudio tratado da fonte inteira)
  audioTrim: number; // frame da fonte onde o trecho começa
  from: number;
  dur: number;
  w: number;
  h: number;
  fadeOut?: number; // volume final (ex.: 0.5 para aplausos)
};

export type Segment = {
  at: number;
  mode: "full" | "split" | "wide";
  cx?: number; // foco horizontal 0..1 na fonte
  cy?: number;
  zoom?: [number, number];
  easeOut?: boolean;
};

export type Block = { from: number; to: number; type: string; props: Record<string, unknown> };

export type ReelData = {
  id: string;
  fps: number;
  width: number;
  height: number;
  mainEnd: number;
  total: number;
  brand: Brand;
  clips: ClipData[];
  segments: Segment[];
  panels: Block[];
  overlays: Block[];
  phrases: Word[][];
  sfx: { at: number; file: string; volume: number }[];
  end: { tagline: string; handle?: string; duration: number };
};
