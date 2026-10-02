import { Config } from "@remotion/cli/config";
import fs from "fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Em ambientes sem download do Chrome (ex.: sandbox do Claude), use o navegador local:
const candidates = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].filter(Boolean) as string[];
const found = candidates.find((p) => fs.existsSync(p));
if (found) Config.setBrowserExecutable(found);
