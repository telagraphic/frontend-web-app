import { siteRoutes } from "../config/siteRoutes.js";
import { pages } from "../config/pages.js";
import { scrollPresets } from "../config/scrollPresets.js";
import { transitions } from "../config/transitions.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { AnimationsService } from "./AnimationsService.js";
import { GsapTransitions } from "./GsapTransitions.js";
import { Router } from "../router/Router.js";
import FadeTransition from "../transitions/fade/FadeTransition.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

export function createServices() {
  for (const [key, route] of Object.entries(siteRoutes)) {
    if (!pages[route.page]) {
      throw createError(ERROR_CODES.CLASS_NOT_FOUND, {
        className: `${route.page} (route: ${key})`,
      });
    }
  }

  const smoothScroll = new SmoothScroll(scrollPresets.default);
  const animationsService = new AnimationsService({ smoothScroll });
  const transitionsService = new GsapTransitions({
    animationsService,
    defaultTransition: FadeTransition,
    transitions,
  });
  const router = new Router({
    routes: siteRoutes,
    pages,
    animationsService,
    transitionsService,
    smoothScroll,
  });

  return { router, animationsService, transitionsService, smoothScroll };
}
