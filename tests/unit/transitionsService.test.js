import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";
import { EVENTS } from "../../app/utilities/Constants.js";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.Element = happy.Element;

const { GsapTransitions } =
  await import("../../app/services/GsapTransitions.js");

let order = [];

class FakeTransition {
  init() {}
  destroy() {}
  async prepare() {
    order.push("prepare");
  }
  async cover() {
    order.push("cover");
  }
  async reveal() {
    order.push("reveal");
  }
}

describe("GsapTransitions.run", () => {
  test("sequences prepare, hide, load, cover, commit, reveal, and events", async () => {
    order = [];
    document.body.innerHTML = `<div class="page-transition-overlay" data-transition-host hidden></div>`;

    const service = new GsapTransitions({
      defaultTransition: FakeTransition,
    });
    await service.init();

    service.addEventListener(EVENTS.TRANSITION_START, () =>
      order.push("start"),
    );
    service.addEventListener(EVENTS.TRANSITION_COVERED, () =>
      order.push("covered"),
    );
    service.addEventListener(EVENTS.TRANSITION_END, () => order.push("end"));

    const next = await service.run(
      {
        hideCurrent: async () => {
          order.push("hide");
        },
        loadNext: async () => {
          order.push("load");
          return { html: true };
        },
        commit: async () => {
          order.push("commit");
        },
      },
      { to: { pageTransition: { copy: "Next" } } },
    );

    expect(next).toEqual({ html: true });
    expect(order[0]).toBe("start");
    expect(order.at(-1)).toBe("end");
    expect(order.indexOf("prepare")).toBeLessThan(order.indexOf("cover"));
    expect(order.indexOf("cover")).toBeLessThan(order.indexOf("covered"));
    expect(order.indexOf("hide")).toBeLessThan(order.indexOf("covered"));
    expect(order.indexOf("load")).toBeLessThan(order.indexOf("covered"));
    expect(order.indexOf("covered")).toBeLessThan(order.indexOf("commit"));
    expect(order.indexOf("commit")).toBeLessThan(order.indexOf("reveal"));
    expect(
      document.querySelector("[data-transition-host]").style.pointerEvents,
    ).toBe("");
  });

  test("unknown effect uses the default plug-in", async () => {
    order = [];
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (message) => warnings.push(message);

    const service = new GsapTransitions({
      defaultTransition: FakeTransition,
    });
    await service.init();

    await service.run(
      {
        hideCurrent: async () => {},
        loadNext: async () => ({ html: true }),
        commit: async () => {},
      },
      { to: { pageTransition: "missing-effect" } },
    );

    console.warn = originalWarn;
    expect(warnings.some((message) => message.includes("missing-effect"))).toBe(
      true,
    );
    expect(order).toContain("prepare");
  });

  test("document-load skips reveal after commit", async () => {
    order = [];
    document.body.innerHTML = `<div class="page-transition-overlay" data-transition-host hidden></div>`;
    const service = new GsapTransitions({
      defaultTransition: FakeTransition,
    });
    await service.init();

    await service.run(
      {
        hideCurrent: async () => {},
        loadNext: async () => ({ path: "/about" }),
        commit: async () => {
          order.push("commit");
        },
      },
      { family: "document-load", to: {} },
    );

    expect(order).toContain("commit");
    expect(order).not.toContain("reveal");
  });
});
