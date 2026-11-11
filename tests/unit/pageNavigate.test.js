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

const { Router } = await import("../../app/router/Router.js");

describe("page navigate", () => {
  test("navigate shows the next page before the cover reveals", async () => {
    document.body.innerHTML = `
      <main id="main" data-route="home" tabindex="-1">
        <h1 data-animation="title">Home</h1>
      </main>
    `;
    const order = [];
    const nextPage = {
      async init() {
        order.push("init");
      },
      async show() {
        order.push("show");
      },
      async destroy() {},
    };
    const transitionsService = {
      async run({ hideCurrent, loadNext, commit }) {
        await hideCurrent();
        const next = await loadNext();
        await commit(next);
        order.push("reveal");
        return next;
      },
    };
    const router = new Router({
      routes: {
        home: { path: "/", page: "Home", title: "Home" },
        about: { path: "/about", page: "About", title: "About" },
      },
      pages: {
        Home: async () => ({ default: class {} }),
        About: async () => ({ default: class {} }),
      },
      animationsService: { checkLeaks() {} },
      transitionsService,
      smoothScroll: {
        stop() {},
        start() {},
        refresh() {},
        scrollTo() {},
        getScroll() {
          return 0;
        },
      },
    });
    router.currentPage = {
      async hide() {
        order.push("hide");
      },
      async destroy() {
        order.push("destroy");
      },
    };
    router.routerPageLoader.getPage = async () => nextPage;
    router.routerPageManager.load = async () => {
      const main = document.createElement("main");
      main.innerHTML = `<h1 data-animation="title">About</h1>`;
      return {
        main,
        document: document.implementation.createHTMLDocument("About"),
      };
    };

    await router.navigate("/about");

    expect(order).toEqual(["hide", "destroy", "init", "show", "reveal"]);
  });
});
