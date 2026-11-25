import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";
import { cpus } from "node:os";

// Machine settings come from the environment, so this file is the same on every machine:
//   VF_CHROME       path of the Chrome / Chromium to render with. Unset: the first common path that exists,
//                   else Remotion's own default (it downloads a headless browser on first use).
//   VF_CONCURRENCY  number of frames rendered in parallel. Unset: the number of cores, at most 2.
const CHROME_PATHS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];
const chrome = process.env.VF_CHROME || CHROME_PATHS.find((p) => existsSync(p));
if (chrome) Config.setBrowserExecutable(chrome);

const wanted = Number.parseInt(process.env.VF_CONCURRENCY ?? "", 10);
Config.setConcurrency(Number.isFinite(wanted) && wanted > 0 ? wanted : Math.max(1, Math.min(cpus().length, 2)));

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setChromiumOpenGlRenderer("swangle");
