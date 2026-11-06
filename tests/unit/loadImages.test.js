import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;

const { loadImages } = await import("../../app/utilities/images.js");

describe("loadImages", () => {
  test("resolves immediately when there are no elements", async () => {
    await loadImages([]);
  });

  test("treats an error as finished", async () => {
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { value: false });
    const pending = loadImages([image], { maxWait: 2000 });
    image.dispatchEvent(new happy.Event("error"));
    await pending;
  });
});
