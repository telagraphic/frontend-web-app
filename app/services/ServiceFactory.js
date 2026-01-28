import { SiteConfig } from "../config/SiteConfig.js";
import { Footnotes } from "../components/Footnotes.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { Navigation } from "../components/Navigation.js";
import { AnimationsManager } from "../animations/AnimationsManager.js";

/**
 * Simplified service factory for Multi-Page Application (MPA)
 */
export function createServices() {
  const siteConfig = new SiteConfig();
  const smoothScroll = new SmoothScroll();
  const animationsManager = new AnimationsManager();
  const footnotes = new Footnotes({ smoothScroll });
  
  const navigation = new Navigation({ 
    siteConfig, 
    smoothScroll 
  });

  return {
    siteConfig,
    smoothScroll,
    animationsManager,
    footnotes,
    navigation,
  };
}

let servicesInstance = null;

/**
 * Create services once per document (module-level singleton).
 * Avoids `window.*` globals while ensuring all consumers share one instance.
 *
 * @returns {ReturnType<typeof createServices>}
 */
export function createServicesOnce() {
  if (servicesInstance) return servicesInstance;
  servicesInstance = createServices();
  return servicesInstance;
}

/**
 * Reset cached services (primarily for tests/dev).
 */
export function resetServicesForTest() {
  servicesInstance = null;
}
