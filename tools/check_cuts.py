#!/usr/bin/env python3
"""
Confere as emendas de um reel: junta o áudio de todos os trechos na ordem do vídeo e transcreve de novo.
Se aparecer sílaba cortada ou palavra a mais, ajuste os tempos em "clips".
Uso: python3 tools/check_cuts.py clients/<cliente>/reels/<id>.json
"""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = json.load(open(sys.argv[1]))
parts = []
for i, c in enumerate(spec["clips"]):
    src = spec["sources"][c[0]]["audio"]
    out = f"/tmp/chk_{i}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(c[1]), "-to", str(c[2]), "-i", os.path.join(ROOT, src), "-ac", "1", "-ar", "16000", out], check=True)
    parts.append(out)
lst = "/tmp/chk_list.txt"
open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "/tmp/chk_all.wav"], check=True)
subprocess.run(["node", os.path.join(ROOT, "asr", "transcribe.mjs"), "/tmp/chk_all.wav", "/tmp/chk_all.json", "--seg"], check=True)
