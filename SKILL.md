---
name: reels-premium-kit
description: Edita reels 9:16 em padrão premium a partir de gravações brutas (fala + imagens), usando o kit Remotion deste repositório: transcrição, cortes, legendas por frase, tela dividida, painéis editoriais, gancho forte e áudio limpo. Use para qualquer cliente.
---

# Reels premium (kit)

Este repositório é um kit completo. Cada reel é um arquivo JSON em `clients/<cliente>/reels/<id>.json`; o código em `src/kit/` desenha tudo. Leia `docs/estilo.md` e `docs/formato-do-reel.md` antes de começar.

## Regras que nunca mudam

1. **Áudio é o mais importante.** Uma fonte de fala por vez. Vídeos sempre mudos; a fala entra por trecho. Painéis nunca têm som.
2. **Gancho = 70% do resultado.** Abrir na frase mais forte, título visível no frame 0, movimento desde o início.
3. **História completa.** Quem assiste pela primeira vez precisa entender quem fala, do que se trata e por que importa. Pode ir até 1min30.
4. **Sem repetição entre reels da mesma rodada.** Manter um mapa de takes (o que já foi usado de cada bruto) e variar imagens de apoio.
5. **Nada inventado na tela.** Dados, datas, nomes e cargos só se forem ditos ou confirmados. Na dúvida, perguntar.
6. **Marca do cliente:** logo oficial (nunca recriar), cores e fonte em `clients/<cliente>/brand.json`, regras em `clients/<cliente>/NOTAS.md`.

## Fluxo

1. **Instalar** (uma vez): `bash tools/setup.sh` (dependências, fontes, efeitos sonoros e transcrição). A logo do cliente vai em `clients/<cliente>/` e não entra no Git. O modelo de transcrição vem do pacote npm `sts-whisper-small`, então funciona mesmo sem acesso ao Hugging Face. Em sandbox sem download do Chrome, o `remotion.config.ts` usa `/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell` ou a variável `REMOTION_BROWSER`.
2. **Preparar cada bruto:** `bash tools/prep_media.sh bruto.mp4 nome`. Isso gera `media/nome.mp4` (30 fps, rotação corrigida), `media/nome.wav` (fala tratada a -14 LUFS) e `transcripts/nome.json` (palavras com tempo).
3. **Ler as transcrições** e desenhar o roteiro: gancho, desenvolvimento, fechamento. Identificar público (B2C, B2B, institucional) e ângulo. Marcar trechos a evitar (falsas largadas, conversas de bastidor, posicionamentos que o cliente não quer).
4. **Escrever o reel** em `clients/<cliente>/reels/<id>.json`. Use `clients/_modelo/reels/exemplo.json` como exemplo completo.
   - Cortes: cortar em silêncios (`ffmpeg -af silencedetect=noise=-36dB:d=0.18`) e conferir a energia do áudio quando o tempo da palavra for duvidoso.
   - Corrigir a transcrição com `replace`, `words`, `drop`, `timings`, `capitalize` e `endSentence`.
5. **Conferir as emendas:** `python3 tools/check_cuts.py clients/.../reels/<id>.json`. A transcrição do áudio montado não pode ter sílaba cortada nem palavra sobrando.
6. **Montar:** `python3 tools/build.py clients/.../reels/<id>.json`. Mostra as frases de legenda e corta os trechos de vídeo.
7. **Revisar visualmente:** `npx remotion still <id> out/f.png --frame=N --scale=0.3` em 10 a 15 momentos. Procurar:
   - texto ilegível;
   - rosto coberto;
   - painel vazio;
   - zonas seguras desrespeitadas (220 px no topo, 420 px embaixo).
8. **Renderizar:** `bash tools/render.sh <id>`. Gera `-hq`, a entrega (até 8 Mbps) e `-chat` (< 30 MB). Conferir:
   - loudness próximo de -14 LUFS;
   - transcrição do arquivo final.
9. **Entregar** no chat e na pasta do cliente. Se uma ferramenta limitar o tamanho por arquivo, use `bash tools/split_for_transfer.sh` (compacta antes de dividir; juntar com `cat … | gunzip` e conferir o md5).
10. **Organizar:**
    - material reaproveitável vai para `00 assets` do cliente;
    - sobras e duplicados vão para `_lixeira` (o usuário esvazia);
    - atualizar o mapa de takes.

## Erros comuns já resolvidos

- O render trava em fontes longas: o `build.py` já pré-corta cada trecho em um arquivo próprio.
- `<Img>` com `width: auto` em posição absoluta encolhe: use largura explícita.
- O Remotion não baixa o Chrome no sandbox: veja o `remotion.config.ts`.
- MP4 dividido em partes chegou corrompido: compactar antes de dividir (`split_for_transfer.sh`).
- Transcrição que inventa palavras no fim: confirmar pela energia do áudio e cortar antes.

## Licenças

- **Remotion:** gratuito para pessoa física e empresas de até 3 pessoas; acima disso, é preciso a licença da empresa (remotion.pro).
- **Montserrat:** fonte sob licença SIL OFL.
- **Efeitos sonoros:** em `public/sfx`, gerados para o kit, sem direitos de terceiros.
