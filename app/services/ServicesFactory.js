import { SiteConfig } from "../config/SiteConfig.js";
import { Footnotes } from "../components/Footnotes.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { Navigation } from "../components/Navigation.js";
import { AnimationsService } from "./AnimationsService.js";
import { TransitionsService } from "./TransitionsService.js";
import { RegistryService } from "./RegistryService.js";
import { Router } from "../router/Router.js";
import { RouterHistory } from "../router/RouterHistory.js";
import { RouterResolver } from "../router/RouterResolver.js";
import { RouterPageLoader } from "../router/RouterPageLoader.js";
import { RouterPageManager } from "../router/RouterPageManager.js";
import { TRANSITION_TYPES } from "../utilities/Constants.js";


export function createServices() {
  // Phase 1: Create all services (circular dependencies can be undefined initially)
  const siteConfig = new SiteConfig();
  const animationsService = new AnimationsService();
  const transitionsService = new TransitionsService({ 
    siteConfig,
    transitionType: TRANSITION_TYPES.CUSTOM // Default to custom for backward compatibility
  });
  const smoothScroll = new SmoothScroll();
  const footnotes = new Footnotes({ smoothScroll });
  const routerPageLoader = new RouterPageLoader({ siteConfig, smoothScroll, animationsManager: animationsService, transitionsManager: transitionsService, footnotes });
  const registryService = new RegistryService({ siteConfig, routerPageLoader });
  const routerPageManager = new RouterPageManager({ siteConfig, routerPageLoader });
  const routerHistory = new RouterHistory({ siteConfig });
  const routerResolver = new RouterResolver({ siteConfig, routerHistory });

  // Phase 2: Wire circular dependencies using setters
  routerPageLoader.setRegistryService(registryService);
  registryService.setRouterPageLoader(routerPageLoader);
  routerHistory.setRouterResolver(routerResolver);
  routerResolver.setRouterHistory(routerHistory);
  routerPageManager.setRouterResolver(routerResolver);

  // Create remaining services that depend on the wired services
  const navigation = new Navigation({ siteConfig, registryService, smoothScroll });
  const router = new Router({ siteConfig, registryService, routerPageLoader, routerPageManager, routerHistory, routerResolver, smoothScroll, animationsService, transitionsService, footnotes, navigation });

  return {
    siteConfig,
    router, 
    smoothScroll,
    animationsService,
    transitionsService,
    footnotes,
    registryService,
    routerPageLoader,
    routerPageManager,
    routerHistory,
    routerResolver,
    navigation,
  };
}