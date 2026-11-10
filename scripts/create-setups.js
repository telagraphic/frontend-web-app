import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  freshResults,
  scoreboardDocument,
  skippedTitles,
  skipsMatch,
} from "./setups.js";

const starter = resolve(import.meta.dir, "..");
const setupsRoot = resolve(starter, "..", "setups");

if (!existsSync(resolve(starter, "wizard/create.js"))) {
  throw new Error("Run bun run setups from the starter.");
}

const results = freshResults();
await mkdir(setupsRoot, { recursive: true });
await writeScoreboard();

for (const result of results) {
  const folder = resolve(setupsRoot, result.folder);
  console.log(`\n${result.label}`);
  if (!existsSync(folder) || isEmpty(folder)) {
    const created = await run(starter, [
      "bun",
      "wizard/create.js",
      folder,
      "--transition",
      result.transition,
      "--navigation",
      result.navigation,
      "--renderer",
      result.renderer,
      "--name",
      "Site",
      "--origin",
      "http://127.0.0.1:3000",
    ]);
    if (created.code !== 0) {
      result.note = "create failed";
      result.steps.lint = "fail";
      await writeScoreboard();
      continue;
    }
  }

  const installed = await run(folder, ["bun", "install"]);
  if (installed.code !== 0) {
    result.note = "bun install failed";
    result.steps.lint = "fail";
    await writeScoreboard();
    continue;
  }

  const docsInstalled = await run(folder, ["bun", "install", "--cwd", "docs"]);
  if (docsInstalled.code !== 0) {
    result.note = "docs install failed";
    result.steps.lint = "fail";
    await writeScoreboard();
    continue;
  }

  result.steps.lint = await step(folder, [
    ["bun", "run", "lint"],
    ["bun", "run", "format:check"],
  ]);
  await writeScoreboard();
  if (result.steps.lint === "fail") continue;

  result.steps.unit = await step(folder, [["bun", "test"]]);
  await writeScoreboard();

  result.steps.build = await step(folder, [["bun", "run", "build"]]);
  await writeScoreboard();

  if (!result.browser) continue;

  await freePort(3458);
  const browser = await run(folder, ["bun", "run", "test:browser"]);
  result.sawSkips = skippedTitles(`${browser.stdout}\n${browser.stderr}`);
  const matched = skipsMatch(result.skips, result.sawSkips);
  result.steps.browser = browser.code === 0 && matched ? "pass" : "fail";
  if (browser.code === 0 && !matched) result.note = "skips differ";
  await writeScoreboard();
}

const failed = results.some((result) =>
  Object.values(result.steps).includes("fail"),
);
console.log(failed ? "Setups finished with failures" : "Setups finished");
process.exit(failed ? 1 : 0);

async function step(cwd, commands) {
  for (const cmd of commands) {
    const finished = await run(cwd, cmd);
    if (finished.code !== 0) return "fail";
  }
  return "pass";
}

async function run(cwd, cmd) {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });
  const [stdout, stderr] = await Promise.all([
    tee(proc.stdout, process.stdout),
    tee(proc.stderr, process.stderr),
  ]);
  return { code: await proc.exited, stdout, stderr };
}

async function tee(stream, dest) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const piece = decoder.decode(value, { stream: true });
    text += piece;
    dest.write(piece);
  }
  return text;
}

async function freePort(port) {
  const listed = Bun.spawnSync(["lsof", "-ti", `:${port}`]);
  const pids = listed.stdout.toString().trim();
  if (!pids) return;
  for (const pid of pids.split("\n")) {
    Bun.spawnSync(["kill", pid]);
  }
}

function isEmpty(folder) {
  return Bun.spawnSync(["ls", "-A", folder]).stdout.toString().trim() === "";
}

async function writeScoreboard() {
  await writeFile(
    resolve(setupsRoot, "index.html"),
    scoreboardDocument(results),
  );
}
