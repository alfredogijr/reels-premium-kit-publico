// Transcreve um .wav com tempos por palavra.
// Uso: node asr/transcribe.mjs entrada.wav saida.json [--seg]
// O modelo vem do pacote npm sts-whisper-small (funciona mesmo sem acesso ao Hugging Face).
import { pipeline, env } from "@huggingface/transformers";
import wavefile from "wavefile";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
env.localModelPath = path.join(here, "node_modules/sts-whisper-small/models/");
env.allowRemoteModels = false;

const [, , input, output, flag] = process.argv;
if (!input || !output) {
  console.error("Uso: node asr/transcribe.mjs entrada.(wav|mp4) saida.json [--seg]");
  process.exit(1);
}
// converte para wav mono 16 kHz
const tmp = output + ".16k.wav";
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", input, "-vn", "-ac", "1", "-ar", "16000", tmp]);
const wav = new wavefile.WaveFile(fs.readFileSync(tmp));
wav.toBitDepth("32f");
let samples = wav.getSamples();
if (Array.isArray(samples)) samples = samples[0];
fs.unlinkSync(tmp);

const asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-small", { dtype: "q8" });
const r = await asr(samples, {
  language: "portuguese",
  task: "transcribe",
  chunk_length_s: 30,
  stride_length_s: 5,
  return_timestamps: flag === "--seg" ? true : "word",
});
fs.writeFileSync(output, JSON.stringify(r, null, 1));
console.log(r.text);
