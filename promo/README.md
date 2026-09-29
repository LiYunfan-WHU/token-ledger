# TokenLedger promo video

Source for the 20-second TokenLedger promo (1920×1080, 30 fps). Built with [Remotion](https://www.remotion.dev/) and React Three Fiber. Every frame is derived from the frame number, so renders are deterministic. The UI shown is an animated mock with illustrative numbers, not a screen capture.

Remotion has its own [license](https://www.remotion.dev/license): free for individuals and small teams, while larger companies need a company license.

## Render

```bash
npm ci
npm run audio     # music (audio/synth.mjs) + voice-over (audio/voice.mjs)
npm run render    # → out/token-ledger-promo.mp4
npm run studio    # interactive preview
```

- The music is fully synthesized; there are no samples.
- The female voice-over uses Microsoft neural TTS through [`edge-tts`](https://github.com/rany2/edge-tts), which must be installed in a local venv:
  - Create it: `python -m venv .venv`
  - Install it: `.venv/Scripts/python -m pip install edge-tts==7.2.3` (`.venv/bin/python` on macOS/Linux).
- Voice lines, timing and voice selection live in `src/vo.json`. `voice.mjs` fails if a line overruns its slot.
- Shot boundaries are `SHOTS` in `src/theme.ts`. `audio/synth.mjs` places its impacts on the same frames; keep the two in sync.

Fonts (Unbounded, Inter, JetBrains Mono, all OFL) come from `@fontsource-variable/*` packages.
