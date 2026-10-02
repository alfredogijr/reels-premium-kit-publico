#!/usr/bin/env bash
# Renderiza um reel já montado (tools/build.py) e gera as versões de entrega.
# Uso: tools/render.sh <id>
#   out/<id>-hq.mp4        qualidade máxima (CRF 18)
#   out/<id>.mp4           entrega (CRF 20, até 8 Mbps)  -> pasta do cliente / Instagram
#   out/<id>-chat.mp4      prévia leve (< 30 MB)          -> para mandar no chat
set -euo pipefail
ID="$1"
cd "$(dirname "$0")/.."
mkdir -p out
CORES=$(nproc); CONC=$(( CORES > 2 ? 2 : 1 ))
npx remotion render "$ID" "out/$ID-hq.mp4" --concurrency=$CONC --crf=18 --timeout=120000
ffmpeg -y -loglevel error -i "out/$ID-hq.mp4" -c:v libx264 -preset slow -crf 20 -maxrate 8M -bufsize 16M -c:a aac -b:a 192k -movflags +faststart "out/$ID.mp4"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$ID-hq.mp4")
VB=$(python3 -c "print(int(min(3500, (27*8*1024)/float($DUR) - 170)))")
ffmpeg -y -loglevel error -i "out/$ID-hq.mp4" -c:v libx264 -preset slow -b:v ${VB}k -pass 1 -passlogfile /tmp/$ID -an -f null /dev/null
ffmpeg -y -loglevel error -i "out/$ID-hq.mp4" -c:v libx264 -preset slow -b:v ${VB}k -pass 2 -passlogfile /tmp/$ID -c:a aac -b:a 160k -movflags +faststart "out/$ID-chat.mp4"
echo "Loudness (alvo -14 LUFS):"; ffmpeg -i "out/$ID.mp4" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
ls -la out/$ID*.mp4
