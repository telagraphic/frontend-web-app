import { SiteConfig } from "../config/SiteConfig.js";
import { Footnotes } from "../components/Footnotes.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { Router } from "./Router.js";
import { Navigation } from "../components/Navigation.js";
import { AnimationsManager } from "../animations/AnimationsManager.js";
import { TransitionsManager } from "../animations/TransitionsManager.js";
import { PageRegistry } from "./PageRegistry.js";
import { PageLoader } from "./PageLoader.js";
import { PageManager } from "./PageManager.js";
import { RouterHistory } from "./RouterHistory.js";
import { RouterResolver } from "./RouterResolver.js";


export function createServices() {
  // Phase 1: Create all services (circular dependencies can be undefined initially)
  const siteConfig = new SiteConfig();
  const animationsManager = new AnimationsManager();
  const transitionsManager = new TransitionsManager({ siteConfig });
  const smoothScroll = new SmoothScroll();
  const footnotes = new Footnotes({ smoothScroll });
  const pageLoader = new PageLoader({ siteConfig, smoothScroll, animationsManager, transitionsManager, footnotes });
  const pageRegistry = new PageRegistry({ siteConfig, pageLoader });
  const pageManager = new PageManager({ siteConfig, pageLoader });
  const routerHistory = new RouterHistory({ siteConfig });
  const routerResolver = new RouterResolver({ siteConfig, routerHistory });

  // Phase 2: Wire circular dependencies using setters
  pageLoader.setPageRegistry(pageRegistry);
  pageRegistry.setPageLoader(pageLoader);
  routerHistory.setRouterResolver(routerResolver);
  routerResolver.setRouterHistory(routerHistory);
  pageManager.setRouterResolver(routerResolver);

  // Create remaining services that depend on the wired services
  const navigation = new Navigation({ siteConfig, pageRegistry, smoothScroll });
  const router = new Router({ siteConfig, pageRegistry, pageLoader, pageManager, routerHistory, routerResolver, smoothScroll, animationsManager, transitionsManager, footnotes, navigation });

  return {
    siteConfig,
    router, 
    smoothScroll,
    animationsManager,
    transitionsManager,
    footnotes,
    pageRegistry,
    pageLoader,
    pageManager,
    routerHistory,
    routerResolver,
    navigation,
  };
}