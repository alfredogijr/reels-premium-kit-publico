#!/usr/bin/env python3
"""
Monta um reel a partir de um arquivo de definição (clients/<cliente>/reels/<id>.json).

O que faz:
  1. corta cada trecho de vídeo (re-encode, 30 fps) em public/media/<id>/c<k>.mp4 (render rápido);
  2. copia o áudio tratado das fontes e a logo/fontes do cliente para public/;
  3. mapeia as palavras transcritas para o tempo do vídeo final, aplica correções e agrupa em frases;
  4. resolve todas as marcações de tempo (clip, fonte+segundo) para frames;
  5. grava src/generated/<id>.json e atualiza src/generated/index.ts.

Uso:  python3 tools/build.py clients/_modelo/reels/exemplo.json [--no-video]
"""
import json, os, re, shutil, subprocess, sys

FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def die(msg):
    sys.exit(f"ERRO: {msg}")


def norm(t):
    return re.sub(r"[^\wà-úÀ-Ú]", "", t.lower())


def main():
    if len(sys.argv) < 2:
        die(__doc__)
    spec_path = os.path.abspath(sys.argv[1])
    no_video = "--no-video" in sys.argv
    spec = json.load(open(spec_path))
    rid = spec["id"]
    client_dir = os.path.dirname(os.path.dirname(spec_path))
    client = os.path.basename(client_dir)
    brand = json.load(open(os.path.join(client_dir, "brand.json")))

    pub = os.path.join(ROOT, "public")
    media_dir = os.path.join(pub, "media", rid)
    os.makedirs(media_dir, exist_ok=True)
    os.makedirs(os.path.join(pub, "clients", client), exist_ok=True)
    shutil.copy(os.path.join(client_dir, brand["logo"]), os.path.join(pub, "clients", client, os.path.basename(brand["logo"])))
    brand_out = dict(brand)
    brand_out["logo"] = f"clients/{client}/{os.path.basename(brand['logo'])}"

    # ---------- fontes ----------
    sources = spec["sources"]
    for name, s in sources.items():
        for k in ("file", "audio", "words"):
            p = os.path.join(ROOT, s[k])
            if not os.path.exists(p):
                die(f"fonte '{name}': arquivo não encontrado: {s[k]}")
        dst = os.path.join(media_dir, f"{name}.wav")
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(os.path.join(ROOT, s["audio"])):
            shutil.copy(os.path.join(ROOT, s["audio"]), dst)

    # ---------- trechos ----------
    clips = []
    f = 0
    for k, c in enumerate(spec["clips"]):
        src, start, end = c[0], float(c[1]), float(c[2])
        name = c[3] if len(c) > 3 else f"c{k}"
        opts = c[4] if len(c) > 4 else {}
        if src not in sources:
            die(f"trecho {k}: fonte desconhecida '{src}'")
        dur = round((end - start) * FPS)
        out = os.path.join(media_dir, f"c{k}.mp4")
        if not no_video:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{start:.4f}", "-i", os.path.join(ROOT, sources[src]["file"]),
                            "-frames:v", str(dur + 2), "-vf", "fps=30", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-g", "10",
                            "-an", "-movflags", "+faststart", out], check=True)
        w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", out],
                                       capture_output=True, text=True).stdout.strip().split(","))
        clips.append(dict(name=name, src=src, srcStart=start, srcEnd=end, video=f"media/{rid}/c{k}.mp4", audio=f"media/{rid}/{src}.wav",
                          audioTrim=round(start * FPS), **{"from": f}, dur=dur, w=w, h=h, **({"fadeOut": opts["fadeOut"]} if "fadeOut" in opts else {})))
        f += dur
    main_end = f

    def to_out(src, t, strict=False):
        for c in clips:
            if c["src"] == src and c["srcStart"] - 0.02 <= t <= c["srcEnd"] + (0 if strict else 0.05):
                return c["from"] + round((t - c["srcStart"]) * FPS)
        return None

    def ref(v, base=0):
        """Resolve uma marcação de tempo para frame (relativo a 'base')."""
        if isinstance(v, (int, float)):
            return int(v) - base
        if isinstance(v, dict):
            off = int(v.get("offset", 0))
            if "clip" in v:
                c = clips[v["clip"]]
                return c["from"] + (c["dur"] if v.get("end") else 0) + off - base
            if "src" in v:
                o = to_out(v["src"], float(v["t"]))
                if o is None:
                    die(f"marcação fora dos trechos: {v}")
                return o + off - base
            if v.get("end"):
                return main_end + off - base
        die(f"marcação inválida: {v}")

    def resolve_props(obj, base):
        if isinstance(obj, dict):
            if ("clip" in obj or "src" in obj or obj.get("end") is True) and set(obj) <= {"clip", "src", "t", "end", "offset"}:
                return ref(obj, base)
            return {k: resolve_props(v, base) for k, v in obj.items()}
        if isinstance(obj, list):
            return [resolve_props(x, base) for x in obj]
        return obj

    # ---------- palavras ----------
    raw = []
    for name, s in sources.items():
        for ch in json.load(open(os.path.join(ROOT, s["words"])))["chunks"]:
            st = ch["timestamp"][0]
            en = ch["timestamp"][1] or st + 0.3
            raw.append(dict(src=name, t=ch["text"].strip(), s=st, e=en))
    for d in spec.get("timings", []):  # correções manuais de tempo/texto: {"src","s","e","text"}
        raw.append(dict(src=d["src"], t=d["text"], s=d["s"], e=d["e"]))
    drops = [(d["src"], d["t"]) for d in spec.get("drop", [])]
    raw = [w for w in raw if not any(w["src"] == ds and abs(w["s"] - dt) < 0.12 for ds, dt in drops)]
    raw.sort(key=lambda w: (w["src"], w["s"]))

    # substituições de frases (ex.: "nome da marka" -> "Nome da Marca"), mantendo a pontuação final
    reps = [([norm(x) for x in a.split()], b) for a, b in spec.get("replace", [])]
    reps.sort(key=lambda r: -len(r[0]))
    merged = []
    i = 0
    while i < len(raw):
        hit = None
        for pat, rep in reps:
            seq = raw[i:i + len(pat)]
            if len(seq) == len(pat) and all(norm(w["t"]) == p for w, p in zip(seq, pat)) and len({w["src"] for w in seq}) == 1:
                hit = (pat, rep, seq)
                break
        if hit:
            pat, rep, seq = hit
            punct = re.findall(r"[.,?!:;]+$", seq[-1]["t"])
            merged.append(dict(src=seq[0]["src"], t=rep + (punct[0] if punct and not rep.endswith(punct[0]) else ""), s=seq[0]["s"], e=seq[-1]["e"]))
            i += len(pat)
        else:
            merged.append(raw[i])
            i += 1
    wmap = spec.get("words", {})
    words = []
    for w in merged:
        t = wmap.get(w["t"], w["t"])
        if t == "":
            continue
        a = to_out(w["src"], w["s"], strict=True)
        if a is None:
            continue
        b = to_out(w["src"], w["e"])
        words.append(dict(text=t, start=a, end=max(b if b is not None else a + 8, a + 3)))
    words.sort(key=lambda w: w["start"])

    # pontuação final de cada trecho que fecha frase
    for c in clips:
        last = [w for w in words if c["from"] <= w["start"] < c["from"] + c["dur"]]
        if last and c["name"] in spec.get("endSentence", []):
            if not re.search(r"[.?!]$", last[-1]["text"]):
                last[-1]["text"] = re.sub(r"[,;:]$", "", last[-1]["text"]) + "."
    # maiúscula no início de frase e no início dos trechos indicados
    cap_first = set()
    for k in set(spec.get("capitalize", [])) | {0}:
        c = clips[k]
        inside = [j for j, w in enumerate(words) if c["from"] <= w["start"] < c["from"] + c["dur"]]
        if inside:
            cap_first.add(inside[0])
    for j, w in enumerate(words):
        starts = j == 0 or re.search(r"[.?!]$", words[j - 1]["text"]) or j in cap_first
        if starts and w["text"][:1].islower():
            w["text"] = w["text"][0].upper() + w["text"][1:]
    keys = {norm(k) for k in spec.get("keywords", [])}
    for w in words:
        w["key"] = norm(w["text"]) in keys or any(norm(p) in keys for p in w["text"].split())
    for j in range(len(words) - 1):
        if words[j + 1]["start"] - words[j]["end"] < 6:
            words[j]["end"] = words[j + 1]["start"]

    # ---------- formatos de tela ----------
    segments = []
    for s in spec["segments"]:
        d = {k: v for k, v in s.items() if k != "at"}
        d["at"] = ref(s["at"])
        segments.append(d)
    segments.sort(key=lambda s: s["at"])

    # ---------- frases de legenda ----------
    hide_until = ref(spec["captionsFrom"]) if "captionsFrom" in spec else 0
    bounds = sorted({s["at"] for s in segments} | {c["from"] for c in clips})
    max_chars = spec.get("captionChars", 34)
    pages, cur = [], []
    for w in words:
        if w["start"] < hide_until:
            continue
        ln = sum(len(x["text"]) + 1 for x in cur) + len(w["text"])
        crosses = cur and any(cur[0]["start"] < b <= w["start"] for b in bounds)
        if cur and (crosses or ln > max_chars or w["start"] - cur[-1]["end"] > 10):
            pages.append(cur)
            cur = []
        cur.append(w)
        if re.search(r"[.?!]$", w["text"]) or (w["text"].endswith(",") and sum(len(x["text"]) + 1 for x in cur) > 18):
            pages.append(cur)
            cur = []
    if cur:
        pages.append(cur)
    for i in range(len(pages) - 1):
        last = pages[i][-1]
        nxt = pages[i + 1][0]["start"]
        if last["end"] + 6 > nxt - 2:
            last["end"] = max(last["start"] + 2, nxt - 8)

    # ---------- painéis e textos ----------
    def blocks(lst):
        out = []
        for b in lst:
            fr = ref(b["from"])
            to = ref(b["to"])
            out.append(dict(from_=fr, to=to, type=b["type"], props=resolve_props(b.get("props", {}), fr)))
        return [{"from": x["from_"], "to": x["to"], "type": x["type"], "props": x["props"]} for x in out]

    panels = blocks(spec.get("panels", []))
    overlays = blocks(spec.get("overlays", []))

    end = spec.get("end", {})
    end_dur = int(end.get("duration", 120))
    sfx = spec.get("sfx", "default")
    if sfx == "default":
        sfx = [dict(at=0, file="sfx/impact.wav", volume=0.3)]
        prev_to = None
        for p in panels:
            if p["from"] != prev_to:
                sfx.append(dict(at=p["from"] - 6, file="sfx/whoosh.wav", volume=0.12))
            prev_to = p["to"]
        sfx += [dict(at=main_end - 48, file="sfx/riser.wav", volume=0.12), dict(at=main_end + 4, file="sfx/impact.wav", volume=0.3)]

    data = dict(id=rid, fps=FPS, width=1080, height=1920, mainEnd=main_end, total=main_end + end_dur, brand=brand_out,
                clips=[{k: v for k, v in c.items() if k not in ("src", "srcStart", "srcEnd")} for c in clips],
                segments=segments, panels=panels, overlays=overlays, phrases=pages, sfx=sfx,
                end=dict(tagline=end.get("tagline", ""), handle=end.get("handle", brand.get("handle", "")), duration=end_dur))
    gen = os.path.join(ROOT, "src", "generated")
    os.makedirs(gen, exist_ok=True)
    json.dump(data, open(os.path.join(gen, f"{rid}.json"), "w"), ensure_ascii=False, indent=1)
    ids = sorted(x[:-5] for x in os.listdir(gen) if x.endswith(".json"))
    idx = "// Gerado por tools/build.py. Não editar.\nimport { ReelData } from \"../kit/types\";\n"
    idx += "".join(f'import r{i} from "./{x}.json";\n' for i, x in enumerate(ids))
    idx += "export const REELS: ReelData[] = [" + ", ".join(f"r{i} as unknown as ReelData" for i in range(len(ids))) + "];\n"
    open(os.path.join(gen, "index.ts"), "w").write(idx)

    print(f"{rid}: {main_end / FPS:.1f}s + card final ({data['total'] / FPS:.1f}s no total), {len(clips)} trechos, {len(pages)} frases")
    for p in pages:
        print(f"  [{p[0]['start']:5d}] " + " ".join(w["text"] for w in p))


if __name__ == "__main__":
    main()
