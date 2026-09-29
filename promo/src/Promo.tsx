import "@fontsource-variable/unbounded/wght.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile } from "remotion";
import { C, FONT, SHOTS } from "./theme";
import vo from "./vo.json";
import { Intro } from "./scenes/Intro";
import { Live } from "./scenes/Live";
import { Grid } from "./scenes/Grid";
import { Run } from "./scenes/Run";
import { Outro } from "./scenes/Outro";
import { Overlay } from "./scenes/Overlay";

/** Music gain: ~-10 dB under each voice line, with 6-frame ramps so ducking is smooth. */
const musicVolume = (f: number) => {
  const duck = Math.max(
    0,
    ...vo.lines.map((l) => interpolate(f, [l.from - 6, l.from, l.from + l.slot - 10, l.from + l.slot - 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  return 1 - duck * 0.7;
};

export const Promo = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(Object.values(FONT).map((f) => document.fonts.load(`700 48px "${f}"`, "Every token $0.9")))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle));
  }, [handle]);

  const shots = [
    [SHOTS.intro, <Intro />],
    [SHOTS.live, <Live />],
    [SHOTS.grid, <Grid />],
    [SHOTS.run, <Run />],
    [SHOTS.outro, <Outro />],
  ] as const;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {shots.map(([[from, to], node], i) => (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          {node}
        </Sequence>
      ))}
      <Overlay />
      <Audio src={staticFile("audio/score.wav")} volume={musicVolume} />
      {vo.lines.map((l) => (
        <Sequence key={l.id} from={l.from} durationInFrames={l.slot}>
          <Audio src={staticFile(`audio/vo/${l.id}.wav`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
