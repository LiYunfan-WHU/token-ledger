import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setCrf(16);
// ThreeCanvas needs WebGL in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");
Config.setConcurrency(4);
