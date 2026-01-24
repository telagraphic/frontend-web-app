import { SiteConfig } from "../config/SiteConfig.js";
import { Footnotes } from "../components/Footnotes.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { Navigation } from "../components/Navigation.js";
import { AnimationsManager } from "../animations/AnimationsManager.js";
import { TransitionsManager } from "../animations/TransitionsManager.js";


export function createServices() {
  const siteConfig = new SiteConfig();
  const animationsManager = new AnimationsManager();
  const transitionsManager = new TransitionsManager({ siteConfig });
  const smoothScroll = new SmoothScroll();
  const footnotes = new Footnotes({ smoothScroll });
  const navigation = new Navigation({ siteConfig, smoothScroll });
  return { siteConfig, smoothScroll, animationsManager, transitionsManager, footnotes, navigation };
}