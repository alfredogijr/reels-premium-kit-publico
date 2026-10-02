#!/usr/bin/env bash
# Prepara uma gravação bruta: vídeo 30 fps H.264 (corrige rotação de celular) + áudio de fala tratado + transcrição.
# Uso: tools/prep_media.sh caminho/do/bruto.mp4 nome_curto
#   gera media/<nome>.mp4, media/<nome>.wav e transcripts/<nome>.json
set -euo pipefail
IN="$1"; NAME="$2"
cd "$(dirname "$0")/.."
mkdir -p media transcripts
ffmpeg -y -loglevel error -i "$IN" -vf "fps=30" -c:v libx264 -preset fast -crf 19 -g 15 -an -movflags +faststart "media/$NAME.mp4"
ffmpeg -y -loglevel error -i "$IN" -vn \
  -af "highpass=f=80,afftdn=nr=10:nf=-40,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=9" \
  -ar 48000 -ac 2 "media/$NAME.wav"
if [ ! -d asr/node_modules ]; then (cd asr && npm i --ignore-scripts --silent); fi
node asr/transcribe.mjs "media/$NAME.wav" "transcripts/$NAME.json" > "transcripts/$NAME.txt"
echo "ok: media/$NAME.mp4, media/$NAME.wav, transcripts/$NAME.json"
cat "transcripts/$NAME.txt"
