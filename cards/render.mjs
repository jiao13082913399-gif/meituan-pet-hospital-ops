import { spawn } from "node:child_process";
import { existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.join(__dirname, "output-revised");
const indexUrl = pathToFileURL(path.join(__dirname, "index.html")).href;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function render(id, name) {
  const output = path.join(outDir, name);
  if (existsSync(output)) unlinkSync(output);
  const child = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1080,1440",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-crash-reporter",
    "--disable-breakpad",
    "--run-all-compositor-stages-before-draw",
    "--timeout=3000",
    `--user-data-dir=/private/tmp/guizang-social-card-chrome-${process.pid}-${id}`,
    `--screenshot=${output}`,
    `${indexUrl}?target=${id}`,
  ], { stdio: "ignore" });

  for (let i = 0; i < 80; i += 1) {
    if (existsSync(output) && statSync(output).size > 0) {
      await wait(300);
      child.kill("SIGTERM");
      await wait(500);
      if (!child.killed) child.kill("SIGKILL");
      console.log(`${name}`);
      return;
    }
    await wait(250);
  }

  child.kill("SIGKILL");
  throw new Error(`Timed out rendering ${id}`);
}

mkdirSync(outDir, { recursive: true });

for (let i = 1; i <= 7; i += 1) {
  const id = `xhs-${String(i).padStart(2, "0")}`;
  const name = i === 1 ? `${id}-cover.png` : `${id}-page.png`;
  await render(id, name);
}
