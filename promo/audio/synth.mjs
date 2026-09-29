// Deterministic 20 s score: 120 BPM kick/hat pulse, sub drone, risers and
// impacts on every shot cut. Pure synthesis, no samples → no licensing risk.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 48000;
const SECONDS = 20;
const N = SR * SECONDS;
const FPS = 30;
// Mirrors SHOTS in src/theme.ts.
const CUTS = [90, 210, 360, 480].map((f) => f / FPS);
const BEAT = 0.5; // 120 BPM

const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 1337;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

const add = (t0, dur, fn, pan = 0) => {
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR);
    L[s0 + i] += v * (1 - Math.max(0, pan));
    R[s0 + i] += v * (1 + Math.min(0, pan));
  }
};

const kick = (t, gain = 1) =>
  add(t, 0.45, (x) => {
    const f = 42 + 120 * Math.exp(-x * 28);
    return Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 7) * 0.9 * gain;
  });

const hat = (t, gain = 0.12, pan = 0) => add(t, 0.06, (x) => noise() * Math.exp(-x * 90) * gain, pan);

const impact = (t) => {
  // Deep boom + noise burst.
  add(t, 2.2, (x) => Math.sin(2 * Math.PI * (30 + 60 * Math.exp(-x * 6)) * x) * Math.exp(-x * 1.6) * 0.8);
  add(t, 0.8, (x) => noise() * Math.exp(-x * 9) * 0.35, -0.3);
  add(t, 0.8, (x) => noise() * Math.exp(-x * 9) * 0.35, 0.3);
};

const riser = (tEnd, dur) =>
  add(tEnd - dur, dur, (x) => {
    const p = x / dur;
    const f = 200 + 1800 * p * p;
    return (Math.sin(2 * Math.PI * f * x) * 0.08 + noise() * 0.12) * p * p;
  });

// Sub drone with slow filter-ish swell, minor chord root movement per shot.
const ROOTS = [55, 55, 49, 58.27, 55]; // A1, A1, G1, Bb1, A1
const bounds = [0, ...CUTS, SECONDS];
ROOTS.forEach((f, i) => {
  const t0 = bounds[i];
  const dur = bounds[i + 1] - t0;
  add(t0, dur, (x) => {
    const env = Math.min(1, x * 4) * Math.min(1, (dur - x) * 6);
    const saw = [1, 2, 3, 4, 5].reduce((s, h) => s + Math.sin(2 * Math.PI * f * h * x) / h, 0);
    const fifth = Math.sin(2 * Math.PI * f * 1.5 * x) * 0.3;
    return (saw * 0.12 + fifth * 0.1) * env;
  });
});

// Pulse: starts sparse, full groove from shot 2, drops out for the outro tail.
for (let t = 0; t < 18; t += BEAT) {
  const bar = Math.floor(t / BEAT);
  if (t < 3 && bar % 2) continue;
  kick(t, t < 3 ? 0.7 : 1);
  if (t >= 3) {
    hat(t + BEAT / 2, 0.14, 0.4);
    hat(t + BEAT / 4, 0.05, -0.4);
    hat(t + (3 * BEAT) / 4, 0.05, 0.4);
  }
}

// Opening slam + cuts.
impact(0);
CUTS.forEach((c) => {
  riser(c, 0.9);
  impact(c);
});
// Final shimmer on the logo.
add(16.3, 3.7, (x) => [880, 1318.5, 1760].reduce((s, f) => s + Math.sin(2 * Math.PI * f * x), 0) * 0.04 * Math.exp(-x * 0.9) * Math.min(1, x * 20));

// Master: soft clip + fade out, 16-bit stereo WAV.
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.6));
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * 0.9) * fade * 32000), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * 0.9) * fade * 32000), 46 + i * 4);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "score.wav");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log(`wrote ${out}`);
