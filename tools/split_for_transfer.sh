#!/usr/bin/env bash
# Divide um arquivo grande em partes < 19 MB (para ferramentas com limite de tamanho por arquivo).
# O arquivo é compactado antes, para que nenhuma etapa do caminho tente "otimizar" o MP4 e altere os bytes.
# Uso: tools/split_for_transfer.sh out/meu-reel.mp4  -> out/transfer/meu-reel.mp4.gz.partNN + .md5
# Para juntar do outro lado: cat meu-reel.mp4.gz.part* | gunzip > meu-reel.mp4 && md5sum meu-reel.mp4
set -euo pipefail
F="$1"; B=$(basename "$F"); D="$(dirname "$F")/transfer"; mkdir -p "$D"; rm -f "$D/$B".gz.part*
md5sum "$F" | awk '{print $1}' > "$D/$B.md5"
gzip -1 -c "$F" | split -b 19M -d - "$D/$B.gz.part"
ls -la "$D"
