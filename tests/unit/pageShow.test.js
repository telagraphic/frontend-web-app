import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.location = happy.location;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.Element = happy.Element;
globalThis.Node = happy.Node;
globalThis.Document = happy.Document;
globalThis.requestAnimationFrame ??= (cb) =>
  setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
globalThis.getComputedStyle ??= (el) => happy.getComputedStyle(el);

const { default: BasePage } = await import("../../app/pages/BasePage.js");

describe("page show", () => {
  test("show marks is-animating while entrance tweens are created", async () => {
    document.body.innerHTML = `
      <main id="main" data-route="home" tabindex="-1">
        <h1 data-animation="title">Home</h1>
      </main>
    `;
    let hiddenWhileCreating = false;
    const page = new BasePage({
      animationsService: {
        createScope() {
          return { init() {}, destroy() {} };
        },
        addTypes() {
          hiddenWhileCreating =
            document.documentElement.classList.contains("is-animating");
        },
        refresh() {},
      },
      smoothScroll: { refresh() {} },
    });

    await page.init();
    await page.show();

    expect(hiddenWhileCreating).toBe(true);
    expect(document.documentElement.classList.contains("is-animating")).toBe(
      false,
    );
  });
});
