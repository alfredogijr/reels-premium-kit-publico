# Formato do arquivo de reel (`clients/<cliente>/reels/<id>.json`)

Um reel é **dados**, não código. O `tools/build.py` lê este arquivo e gera tudo o que o Remotion precisa.

## Marcações de tempo

Qualquer campo de tempo aceita:

| Forma | Significa |
|---|---|
| `0`, `120` | frame absoluto do vídeo final |
| `{ "clip": 3 }` | início do trecho 3 (`"end": true` para o fim do trecho) |
| `{ "src": "anuncio", "t": 41.3 }` | o instante 41,3 s da fonte "anuncio", onde quer que ele tenha caído no vídeo final |
| `{ "end": true }` | fim da parte falada (antes do card final) |
| qualquer um + `"offset": -6` | desloca alguns frames |

Dentro de `props` de painéis e textos, as marcações viram frames **relativos ao início do bloco** automaticamente.

## Campos

- `sources`: fontes preparadas por `tools/prep_media.sh` (`file`, `audio`, `words`).
- `clips`: `[fonte, início_s, fim_s, nome, {opções}]` na ordem do vídeo. Opção: `{"fadeOut": 0.5}` (ex.: aplausos que somem devagar).
- `replace`: correções de frases da transcrição, sem diferenciar maiúsculas (`["nome da marka", "Nome da Marca"]`).
- `words`: correções de palavra única (`"": ""` apaga a palavra).
- `drop`: palavras a remover pelo tempo na fonte (`{"src", "t"}`).
- `timings`: palavras a acrescentar com tempo manual (`{"src", "s", "e", "text"}`), quando a transcrição falha.
- `capitalize`: índices de trechos que começam frase (maiúscula na primeira palavra).
- `endSentence`: nomes de trechos que fecham frase (ponto final na última palavra).
- `keywords`: palavras destacadas na legenda.
- `captionsFrom`: a partir de quando há legenda (no gancho, o título faz esse papel).
- `segments`: formato de tela ao longo do tempo:
  - `full`: tela cheia;
  - `split`: painel em cima, vídeo embaixo;
  - `wide`: quadro horizontal inteiro com faixas.
  Opções: `cx`, `cy` (foco de 0 a 1 na imagem de origem), `zoom` `[início, fim]`, `easeOut` (aproximação que desacelera, boa para gancho).
- `panels`: blocos da metade de cima (sempre mudos): `list`, `counter`, `strike`, `stack`, `big`. Ver `src/kit/Panels.tsx`.
- `overlays`: textos sobre o vídeo: `hook`, `topNote`, `wideTitle`, `lowerThird`, `logo`. Ver `src/kit/Overlays.tsx`.
- `end`: card final (`tagline`, `handle` opcional, `duration` em frames).
- `sfx`: `"default"` (impacto no início, ar nas entradas de painel, crescente e impacto no fim) ou lista `{at, file, volume}`.

Textos aceitam `*itálico*` e `\n` para quebrar linha.
