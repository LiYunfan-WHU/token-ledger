// Female voice-over via Microsoft neural TTS (edge-tts, installed in promo/.venv).
// Each line in src/vo.json becomes public/audio/vo/<id>.wav with edge silence
// trimmed; fails if a clip overruns its frame slot, so timing stays in sync.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vo = JSON.parse(readFileSync(join(root, "src", "vo.json"), "utf8"));
const python = join(root, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const remotion = join(root, "node_modules", "@remotion", "cli", "remotion-cli.js");
const outDir = join(root, "public", "audio", "vo");
mkdirSync(outDir, { recursive: true });

const FPS = 30;

const wav = (samples) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + samples.byteLength, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(48000, 24);
  header.writeUInt32LE(96000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(samples.byteLength, 40);
  return Buffer.concat([header, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength)]);
};
let overrun = false;
for (const line of vo.lines) {
  const raw = join(outDir, `${line.id}.mp3`);
  const file = join(outDir, `${line.id}.wav`);
  execFileSync(python, [
    "-m", "edge_tts",
    "--voice", vo.voice,
    `--rate=${vo.rate}`,
    `--pitch=${vo.pitch}`,
    "--text", line.text,
    "--write-media", raw,
  ]);
  // Decode to mono 48 kHz s16 WAV, trim edge silence in JS (Remotion's minimal ffmpeg has no silenceremove / raw muxer).
  const decoded = join(outDir, `${line.id}.tmp.wav`);
  execFileSync(process.execPath, [remotion, "ffmpeg", "-v", "error", "-y", "-i", raw, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", decoded]);
  const pcm = readFileSync(decoded);
  rmSync(raw);
  rmSync(decoded);
  const data = pcm.indexOf("data") + 8;
  const samples = new Int16Array(pcm.buffer.slice(pcm.byteOffset + data, pcm.byteOffset + pcm.length - ((pcm.length - data) % 2)));
  const loud = (s) => Math.abs(s) > 300;
  const start = Math.max(0, samples.findIndex(loud) - 480);
  const end = Math.min(samples.length, samples.findLastIndex(loud) + 2400);
  const clip = samples.slice(start, end);
  // Peak-normalize to ~-0.5 dBFS so the voice sits clearly above the ducked score.
  const gain = 31000 / clip.reduce((m, s) => Math.max(m, Math.abs(s)), 1);
  for (let i = 0; i < clip.length; i++) clip[i] = Math.round(clip[i] * gain);
  writeFileSync(file, wav(clip));
  const frames = Math.ceil(((end - start) / 48000) * FPS);
  const ok = frames <= line.slot;
  overrun ||= !ok;
  console.log(`${ok ? "ok  " : "OVER"} ${line.id} ${frames}/${line.slot}f  "${line.text}"`);
}
if (overrun) {
  console.error("voice-over overruns its slot; shorten text, raise rate, or widen slot in src/vo.json");
  process.exit(1);
}
