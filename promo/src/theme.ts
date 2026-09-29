export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 600;

export const C = {
  bg: "#050507",
  panel: "rgba(18,19,24,0.78)",
  line: "rgba(160,170,200,0.14)",
  text: "#e9ebf2",
  dim: "#8a8fa3",
  blue: "#4d8dff",
  violet: "#9b6bff",
  acid: "#c8ff3d",
  green: "#3fcf8e",
  red: "#ff5c7a",
};

export const FONT = {
  display: "Unbounded Variable",
  ui: "Inter Variable",
  mono: "JetBrains Mono Variable",
};

// Shot boundaries in frames; audio/synth.mjs mirrors these for hits.
export const SHOTS = {
  intro: [0, 90],
  live: [90, 210],
  grid: [210, 360],
  run: [360, 480],
  outro: [480, 600],
} as const;
