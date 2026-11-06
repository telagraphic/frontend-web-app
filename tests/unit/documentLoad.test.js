import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";
import { EVENTS } from "../../app/utilities/Constants.js";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.location = happy.location;
globalThis.sessionStorage = happy.sessionStorage;

const { DocumentLoad, COVER_FLAG } =
  await import("../../app/router/DocumentLoad.js");

class FakePage {
  async init() {}
  async show() {}
  async hide() {}
  async destroy() {}
}

describe("DocumentLoad", () => {
  test("cover writes the flag then assigns the destination", async () => {
    document.body.innerHTML = `
      <main id="main" data-route="home" tabindex="-1"></main>
      <div data-transition-host hidden></div>
    `;
    const assigned = [];
    const originalAssign = location.assign.bind(location);
    location.assign = (path) => {
      assigned.push(path);
    };

    const routes = {
      home: { path: "/", title: "Home", page: "Home" },
      "not-found": { path: "/404", title: "Not found", page: "Page" },
    };
    const pages = {
      Home: async () => ({ default: FakePage }),
      Page: async () => ({ default: FakePage }),
    };
    const transitionsService = {
      async run({ hideCurrent, loadNext, commit }, context) {
        await hideCurrent();
        await loadNext();
        await commit();
        return { path: context.path };
      },
      async revealArrival() {},
    };

    const navigation = new DocumentLoad({
      routes,
      pages,
      animationsService: {},
      transitionsService,
      smoothScroll: { stop() {}, start() {} },
    });
    await navigation.init();

    const started = [];
    navigation.addEventListener(EVENTS.NAVIGATION_START, () =>
      started.push(true),
    );

    await navigation.navigate(new URL("/404", "http://localhost/"));

    const flag = JSON.parse(sessionStorage.getItem(COVER_FLAG));
    expect(flag.path).toBe("/404");
    expect(typeof flag.at).toBe("number");
    expect(assigned).toContain("/404");
    expect(started.length).toBeGreaterThan(0);

    location.assign = originalAssign;
  });
});
