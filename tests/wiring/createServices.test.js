import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";
import { ERROR_CODES } from "../../app/utilities/ErrorRegistry.js";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.requestAnimationFrame ??= (cb) =>
  setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
globalThis.getComputedStyle ??= (el) => happy.getComputedStyle(el);

const { createServices } =
  await import("../../app/services/ServicesFactory.js");
const { Router } = await import("../../app/router/Router.js");

describe("createServices", () => {
  test("returns the four boot services", () => {
    const services = createServices();
    expect(services.router).toBeDefined();
    expect(services.animationsService).toBeDefined();
    expect(services.transitionsService).toBeDefined();
    expect(services.smoothScroll).toBeDefined();
    expect(services.navigation).toBeUndefined();
    expect(services.registryService).toBeUndefined();
    expect(services.siteConfig).toBeUndefined();
  });

  test("Router throws MISSING_DEPENDENCY when a constructor argument is omitted", () => {
    let error;
    try {
      new Router({
        routes: {},
        pages: {},
        animationsService: {},
        transitionsService: {},
      });
    } catch (caught) {
      error = caught;
    }
    expect(error?.code).toBe(ERROR_CODES.MISSING_DEPENDENCY);
    expect(error?.context?.dependency).toBe("smoothScroll");
  });
});
