import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.Element = happy.Element;
globalThis.requestAnimationFrame ??= (cb) =>
  setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
globalThis.getComputedStyle ??= (el) => happy.getComputedStyle(el);

const { default: Preloader } =
  await import("../../app/components/Preloader.js");

describe("Preloader", () => {
  test("sets inert on chrome while is-loading", async () => {
    document.documentElement.classList.add("is-loading");
    document.body.innerHTML = `
      <a class="skip-link" href="#main">Skip</a>
      <div class="page-transition-overlay" data-transition-host hidden></div>
      <section class="preloader">
        <h1 class="preloader-transition-title">Preloader</h1>
        <p class="preloader-counter" hidden>0%</p>
        <div class="preloader-transition-copy"><h1>Preloader</h1></div>
      </section>
      <nav data-navigation></nav>
      <main id="main" data-route="home" tabindex="-1"></main>
      <footer></footer>
    `;

    const preloader = new Preloader({ maxWait: 10 });
    await preloader.init();

    expect(document.querySelector(".skip-link").hasAttribute("inert")).toBe(
      true,
    );
    expect(
      document.querySelector("[data-navigation]").hasAttribute("inert"),
    ).toBe(true);
    expect(document.querySelector("footer").hasAttribute("inert")).toBe(true);
    expect(document.querySelector("main").hasAttribute("inert")).toBe(true);
    expect(
      document.querySelector("[data-transition-host]").hasAttribute("inert"),
    ).toBe(true);
  });
});
