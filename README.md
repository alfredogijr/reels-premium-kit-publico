# Reels Premium Kit

Kit para editar reels verticais (9:16) em padrão premium, a partir de gravações brutas: fala do porta-voz, vídeos de equipe e imagens de apoio. Funciona com o Claude, em qualquer sessão ou conta, e também roda sozinho com Node e ffmpeg.

Cada reel é um arquivo **JSON** que descreve:

- os trechos de vídeo;
- os formatos de tela;
- os painéis e textos;
- o card final.

O código em `src/kit/` desenha tudo no estilo aprovado:

- legendas por frase;
- tipografia leve;
- tela dividida com painéis editoriais;
- gancho no primeiro frame;
- uma voz por vez.

## Como usar com o Claude

1. Clone ou abra este repositório na sessão (Claude Code, Cowork ou outra conta).
2. Peça: "Leia o `SKILL.md` e edite um reel para o cliente X com estes vídeos".
3. Para um cliente novo, copie `clients/_modelo` para `clients/<cliente>` e coloque a logo, as cores e o @ no `brand.json`.

Para que o Claude use o kit automaticamente, instale o `SKILL.md` como skill na sua conta. No Claude, peça "salve este SKILL.md como skill", ou use as configurações de skills.

## Como usar sem o Claude

```bash
bash tools/setup.sh                          # dependências, fontes, efeitos sonoros e transcrição
bash tools/prep_media.sh bruto1.mp4 fala          # vídeo + áudio tratado + transcrição
# escreva clients/<cliente>/reels/<id>.json  (veja docs/formato-do-reel.md)
python3 tools/check_cuts.py clients/<cliente>/reels/<id>.json
python3 tools/build.py clients/<cliente>/reels/<id>.json
npx remotion studio                          # prévia interativa
bash tools/render.sh <id>                         # out/<id>.mp4 (entrega) e out/<id>-chat.mp4
```

Requisitos: Node 18+, Python 3, ffmpeg.

## Estrutura

```
SKILL.md                 instruções para o Claude
docs/                    estilo aprovado e formato do arquivo de reel
src/kit/                 motor: vídeo, painéis, textos, legendas, card final
tools/                   preparar mídia, conferir cortes, montar, renderizar, dividir arquivos
asr/                     transcrição local (Whisper small via npm)
clients/<cliente>/       brand.json, logo, NOTAS.md e reels/*.json
public/fonts, public/sfx gerados pelo tools/setup.sh
media/, transcripts/     material de trabalho (não vai para o Git)
```

As gravações brutas, os vídeos renderizados e as logos dos clientes **não** vão para o repositório (veja o `.gitignore`); a logo fica em `clients/<cliente>/` só na sua máquina, e o restante fica na pasta do cliente.

## Licenças

- **Fontes e efeitos sonoros:** baixados ou gerados pelo `tools/setup.sh` (Montserrat, licença SIL OFL).
- **Remotion:** gratuito para pessoa física e empresas de até 3 pessoas; acima disso, é preciso a licença da empresa (https://www.remotion.pro).
