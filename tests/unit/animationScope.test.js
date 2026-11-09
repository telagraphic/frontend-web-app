import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.Element = happy.Element;
globalThis.Node = happy.Node;
globalThis.Document = happy.Document;
globalThis.matchMedia = happy.matchMedia.bind(happy);
globalThis.requestAnimationFrame ??= (cb) =>
  setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
globalThis.getComputedStyle ??= (el) => happy.getComputedStyle(el);

const { ScrollTrigger } = await import("../../app/animations/gsap/gsap.js");
const { AnimationsService } =
  await import("../../app/services/AnimationsService.js");

const smoothScroll = {
  useTicker() {},
  addEventListener() {},
  removeEventListener() {},
  refresh() {},
};

describe("animation scope", () => {
  test("destroy drops ScrollTriggers whose trigger has left the document", () => {
    for (const trigger of ScrollTrigger.getAll()) trigger.kill();

    document.body.innerHTML = `
      <main id="main" data-route="home">
        <div data-card></div>
      </main>
    `;
    const root = document.querySelector("main");
    const card = document.querySelector("[data-card]");
    const service = new AnimationsService({ smoothScroll });
    const scope = service.createScope(root);

    scope.add(() => {
      ScrollTrigger.create({
        trigger: card,
        start: "top bottom",
        end: "bottom top",
      });
    });

    expect(
      ScrollTrigger.getAll().some((trigger) => trigger.trigger === card),
    ).toBe(true);

    card.remove();
    scope.destroy();

    const leftovers = ScrollTrigger.getAll().filter(
      (trigger) => trigger.trigger && !trigger.trigger.isConnected,
    );
    expect(leftovers).toEqual([]);
  });
});
