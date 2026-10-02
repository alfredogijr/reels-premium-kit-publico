#!/usr/bin/env bash
# Instala tudo o que o kit precisa (uma vez por máquina/sessão).
#   - dependências do Remotion
#   - fontes Montserrat (do pacote @fontsource/montserrat) em public/fonts
#   - efeitos sonoros discretos gerados com ffmpeg em public/sfx
#   - transcrição local (asr/)
set -euo pipefail
cd "$(dirname "$0")/.."
npm i
mkdir -p public/fonts public/sfx
for f in node_modules/@fontsource/montserrat/files/montserrat-latin-{300,400,500,600,800,900}-normal.woff2 node_modules/@fontsource/montserrat/files/montserrat-latin-{300,400}-italic.woff2; do
  cp "$f" public/fonts/
done
S=public/sfx
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.9" -af "highpass=f=300,lowpass=f=5000,afade=t=in:d=0.28:curve=exp,afade=t=out:st=0.3:d=0.3:curve=exp,volume=0.8" -ar 48000 $S/whoosh.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=55:d=0.7" -f lavfi -i "anoisesrc=d=0.08:c=brown:a=0.8" -filter_complex "[0]afade=t=out:st=0.05:d=0.65:curve=exp,volume=1.4[a];[1]lowpass=f=900,afade=t=out:d=0.08[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9" -ar 48000 $S/impact.wav
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=1.6:c=white:a=0.5" -f lavfi -i "sine=f=220:d=1.6" -filter_complex "[0]bandpass=f=2500:w=2000,afade=t=in:d=1.5:curve=exp[a];[1]vibrato=f=6:d=0.2,afade=t=in:d=1.5:curve=exp,volume=0.4[b];[a][b]amix=inputs=2:normalize=0,afade=t=out:st=1.5:d=0.1" -ar 48000 $S/riser.wav
ffmpeg -y -loglevel error -f lavfi -i "sine=f=1800:d=0.05" -af "afade=t=out:d=0.05,volume=0.35" -ar 48000 $S/tick.wav
(cd asr && npm i --ignore-scripts --silent)
echo "Kit pronto. Coloque a logo de cada cliente em clients/<cliente>/ (veja brand.json)."
