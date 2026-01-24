import { SiteConfig } from "../config/SiteConfig.js";
import { Footnotes } from "../components/Footnotes.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { Navigation } from "../components/Navigation.js";
import { AnimationsManager } from "../animations/AnimationsManager.js";

/**
 * Simplified service factory for Multi-Page Application (MPA)
 * Creates only the services needed for page initialization, without SPA routing services
 */
export function createMPAServices() {
  const siteConfig = new SiteConfig();
  const smoothScroll = new SmoothScroll();
  const animationsManager = new AnimationsManager();
  const footnotes = new Footnotes({ smoothScroll });
  
  // Navigation in MPA doesn't need pageRegistry (no dynamic page tracking)
  // We'll pass null for pageRegistry and update Navigation to handle it
  const navigation = new Navigation({ 
    siteConfig, 
    pageRegistry: null, 
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
