import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";
import { EVENTS } from "../../app/utilities/Constants.js";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;

const { ViewTransitions } =
  await import("../../app/services/ViewTransitions.js");
const ViewTransition =
  (await import("../../app/transitions/view/ViewTransition.js")).default;

describe("ViewTransitions.run", () => {
  test("hides, loads, then wrapCommit around commit", async () => {
    const order = [];
    const plugin = new ViewTransition();
    const original = document.startViewTransition;
    document.startViewTransition = (update) => {
      order.push("wrap");
      const finished = Promise.resolve(update());
      return { finished };
    };

    const service = new ViewTransitions({ plugin });
    service.addEventListener(EVENTS.TRANSITION_START, () =>
      order.push("start"),
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
      { family: "page-swap" },
    );

    document.startViewTransition = original;
    expect(next).toEqual({ html: true });
    expect(order).toEqual(["start", "hide", "load", "wrap", "commit", "end"]);
  });

  test("falls back to commit when startViewTransition is missing", async () => {
    const order = [];
    const original = document.startViewTransition;
    document.startViewTransition = undefined;
    const service = new ViewTransitions({ plugin: new ViewTransition() });

    await service.run(
      {
        hideCurrent: async () => order.push("hide"),
        loadNext: async () => ({ html: true }),
        commit: async () => order.push("commit"),
      },
      {},
    );

    document.startViewTransition = original;
    expect(order).toEqual(["hide", "commit"]);
  });
});
