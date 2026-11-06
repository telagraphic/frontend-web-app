import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.location = happy.location;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.Element = happy.Element;
globalThis.requestAnimationFrame ??= (cb) =>
  setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
globalThis.getComputedStyle ??= (el) => happy.getComputedStyle(el);

const { default: Navigation } =
  await import("../../app/components/Navigation.js");

describe("Navigation", () => {
  test("open sets aria-expanded, inert on main, and stop(); close undoes them", async () => {
    document.body.innerHTML = `
      <nav data-navigation data-navigation-status="not-active">
        <button type="button" data-navigation-toggle aria-expanded="false">Menu</button>
        <div data-navigation-panel>
          <a class="internal-link" href="/">Home</a>
        </div>
      </nav>
      <main id="main" data-route="home" tabindex="-1"></main>
    `;

    const stopped = [];
    const nav = new Navigation({
      router: new EventTarget(),
      smoothScroll: {
        stop() {
          stopped.push("stop");
        },
        start() {
          stopped.push("start");
        },
      },
    });
    await nav.init();
    nav.open();

    expect(nav.root.getAttribute("data-navigation-status")).toBe("active");
    expect(nav.toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector("main").hasAttribute("inert")).toBe(true);
    expect(stopped).toEqual(["stop"]);

    nav.close();
    expect(nav.root.getAttribute("data-navigation-status")).toBe("not-active");
    expect(nav.toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("main").hasAttribute("inert")).toBe(false);
    expect(stopped).toEqual(["stop", "start"]);
  });
});
