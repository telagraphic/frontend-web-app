import { streamSSE } from "hono/streaming";

const clients = new Set();

export function liveReloadEvents() {
  return (c) =>
    streamSSE(c, async (stream) => {
      clients.add(stream);
      stream.onAbort(() => {
        clients.delete(stream);
      });
      await stream.writeSSE({ event: "hello", data: "ok" });
      while (true) {
        await stream.sleep(8_000);
        await stream.writeSSE({ event: "ping", data: "ok" });
      }
    });
}

export async function sendEvent(event, data = "") {
  for (const stream of clients) {
    try {
      await stream.writeSSE({ event, data });
    } catch {
      clients.delete(stream);
    }
  }
}
