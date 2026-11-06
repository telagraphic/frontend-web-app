import { existsSync, watch } from "node:fs";
import { sendEvent } from "./events.js";

export function watchProject({ onApp, onViews, onStyles, onConfig }) {
  addWatch("app", onApp, { skip: (name) => name.startsWith("config/") });
  addWatch("views", onViews);
  addWatch("styles", onStyles);
  addWatch("app/config", onConfig);
  addWatch("experiments", onApp);
}

function addWatch(path, handler, { skip } = {}) {
  if (!handler) return;
  if (!existsSync(path)) return;
  const queued = queue(handler);
  const watcher = watch(path, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (skip?.(filename.replaceAll("\\", "/"))) return;
    queued();
  });
  watcher.on("error", (error) => {
    console.error(`${path} watcher`, error);
  });
}

function queue(handler, ms = 60) {
  let timer;
  let running = false;
  let pending = false;

  const run = async () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await handler();
    } catch (error) {
      console.error(error);
      await sendEvent("error", error.message ?? String(error));
    } finally {
      running = false;
      if (pending) {
        pending = false;
        await run();
      }
    }
  };

  return () => {
    clearTimeout(timer);
    timer = setTimeout(run, ms);
  };
}
