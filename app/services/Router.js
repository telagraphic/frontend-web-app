/**
 * Page Transition Class for MPA
 *
 * This class is responsible for routing and navigation coordination in a Multi-Page Application.
 * Delegates image/transition data management to TransitionsManager and animations to PageTransition.
 */
import { ImageService } from "../utilities/ImageService.js";
import { Preloader } from "../components/Preloader.js";
import { PageTransition } from "../animations/PageTransition.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";
import {
  SELECTORS,
  ATTRIBUTES,
  EVENTS,
  STORAGE_KEYS,
  NAVIGATION_STATUS,
  BLOCKED_LINK_PREFIXES,
} from "../utilities/Constants.js";

export class Router {
  constructor({ siteConfig, transitionsManager }) {
    this.sessionStorage = window.sessionStorage;
    this.isPageNavigating = false;
    this.blocklistLinks = BLOCKED_LINK_PREFIXES;
    this.elements = {};
    this.imageService = new ImageService();
    this.siteConfig = siteConfig;
    this.transitionsManager = transitionsManager;
    this.pageTransition = new PageTransition();
  }

  /**
   * Initialize the Router
   * Sets up DOM element references and handles either navigation restoration
   * or initial page load flow
   */
  async initialize() {
    if (!this.initializeElements()) {
      return;
    }

    this.isPageNavigating =
      this.sessionStorage.getItem(STORAGE_KEYS.PAGE_TRANSITION) === "true";

    this.setupListeners();

    if (this.isPageNavigating) {
      await this.handlePageNavigation();
    } else {
      await this.handleInitialLoad();
    }
  }

  /**
   * Handle page navigation restoration flow
   *
   * This method is called when the page loads after a navigation transition.
   * It restores the transition image data from sessionStorage and ensures
   * the image is fully loaded and painted before hiding the overlay.
   *
   * Flow:
   * 1. Restore transition data from sessionStorage (image URL, alt text)
   * 2. Wait for image to load if not already complete
   * 3. Force browser paint to ensure image is visible before animation
   * 4. Remove sessionStorage flag and hide transition overlay
   *
   * @private
   */
  async handlePageNavigation() {
    await this.transitionsManager.restoreTransitionData();

    const imageAfterRestore = this.elements.transitionOverlay?.querySelector(
      SELECTORS.TRANSITION_IMAGE,
    );

    if (imageAfterRestore && imageAfterRestore.src) {
      imageAfterRestore.crossOrigin = "anonymous";

      if (
        !imageAfterRestore.complete ||
        imageAfterRestore.naturalHeight === 0
      ) {
        await this.imageService.waitForImageLoad(imageAfterRestore);
      }

      // Force browser to paint the image before overlay animation
      // Even with CSS opacity: 1 by default, we need to ensure image is painted
      // to prevent blank image flash when overlay is visible
      void imageAfterRestore.offsetHeight;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    this.sessionStorage.removeItem(STORAGE_KEYS.PAGE_TRANSITION);
    await this.hideTransition();
  }

  /**
   * Handle initial page load flow
   *
   * This method is called on the first page load (not after navigation).
   * It hides the transition overlay immediately and loads page images
   * if the preloader didn't run.
   *
   * Flow:
   * 1. Hide overlay immediately (CSS has opacity: 1 by default)
   * 2. Set crossOrigin on image element for future use
   * 3. Load page images if preloader didn't run (e.g., on page reload)
   *
   * @private
   */
  async handleInitialLoad() {
    // Hide overlay immediately on initial page load (non-navigating case)
    // CSS has opacity: 1 by default to prevent race condition, so we must hide it here
    if (window.gsap) {
      window.gsap.set(this.elements.transitionOverlay, {
        opacity: 0,
      });
    }

    const imageElement = this.elements.transitionOverlay?.querySelector(
      SELECTORS.TRANSITION_IMAGE,
    );

    // Ensure crossorigin is set for future use
    if (imageElement && imageElement.src) {
      imageElement.crossOrigin = "anonymous";
    }

    // If preloader didn't run, load page images now
    // Preloader only runs on first visit (when 'preloaderShown' doesn't exist)
    // On reload, preloader doesn't run, so we need to load images here
    if (!Preloader.shouldShow()) {
      await this.loadPageImages();
    }
  }

  /**
   * Initialize DOM element references
   * @returns {boolean} True if elements were successfully initialized, false otherwise
   * @private
   */
  initializeElements() {
    this.elements = {
      transitionOverlay: document.querySelector(SELECTORS.TRANSITION_OVERLAY),
      menuToggleBtn: document.querySelector(SELECTORS.NAV_TOGGLE),
    };

    // Check if transition overlay element exists
    if (!this.elements.transitionOverlay) {
      const error = createError(ERROR_CODES.ELEMENT_NOT_FOUND, {
        element: SELECTORS.TRANSITION_OVERLAY,
      });
      console.warn(error.message);
      return false;
    }
    return true;
  }

  /**
   * Load all page images including navigation overlay background
   * Uses ImageService to load all images with data-src attribute
   * Note: Kept in Router as it loads all page images, not just transition images
   * @returns {Promise<void>} Resolves when all images are loaded
   */
  async loadPageImages() {
    try {
      await this.imageService.preloadImages({
        images: SELECTORS.LAZY_IMAGES,
        excludePreloader: true,
        useDecode: true,
      });
    } catch (error) {
      const loadError = createError(ERROR_CODES.IMAGE_LOAD_ERROR, {
        message: "Failed to load page images",
        originalError: error,
      });
      console.warn(loadError.message, loadError);
      // Continue even if image loading fails
    }
  }

  /**
   * Check if a link should be blocked (external, mailto, tel, etc.)
   * @param {string} href - Link href to check
   * @returns {boolean} True if link should be blocked
   * @private
   */
  isBlockedLink(href) {
    if (!href) return false;
    return this.blocklistLinks.some((blockedLink) =>
      href.startsWith(blockedLink),
    );
  }

  /**
   * Check if link is an internal link
   * Internal links have the 'internal-link' class
   * @param {HTMLElement} link - Link element to check
   * @returns {boolean} True if link is internal
   * @private
   */
  isInternalLink(link) {
    return link && link.classList.contains("internal-link");
  }

  /**
   * Handle navigation to a new page
   *
   * This method orchestrates the complete page transition flow:
   * 1. Normalizes the href to a route key using SiteConfig
   * 2. Updates the transition overlay with the target page's transition image
   * 3. Stores transition data in sessionStorage for restoration on next page
   * 4. Ensures overlay is ready and visible
   * 5. Shows the transition animation
   * 6. Navigates to the new page
   *
   * If any step fails, it falls back to direct navigation without transition.
   *
   * @param {string} href - Target URL to navigate to
   * @private
   */
  async handleNavigation(href) {
    // Ensure overlay element is available
    if (!this.elements.transitionOverlay) {
      this.elements.transitionOverlay = document.querySelector(
        SELECTORS.TRANSITION_OVERLAY,
      );
      if (!this.elements.transitionOverlay) {
        const error = createError(ERROR_CODES.ELEMENT_NOT_FOUND, {
          element: SELECTORS.TRANSITION_OVERLAY,
        });
        console.warn(error.message);
        window.location.href = href;
        return;
      }
    }

    try {
      // 1. Normalize href to route key
      const route = this.normalizeHrefToRoute(href);

      if (route && this.siteConfig) {
        // 2. Update overlay with transition data via TransitionsManager
        // This ensures the image is preloaded and ready before animation
        await this.transitionsManager.updateTransitionOverlayFromRoute(route);

        // 3. Store transition data in sessionStorage via TransitionsManager
        const routeConfig = this.siteConfig.get(route);
        if (routeConfig && routeConfig.transition) {
          this.transitionsManager.storeTransitionData(routeConfig.transition);
        }
      }

      // Ensure overlay is visible before animation to prevent white flash
      // The overlay element should be covering the page (position: fixed, inset: 0)
      // We just need to ensure it's not transparent
      if (this.elements.transitionOverlay && window.gsap) {
        // Force a reflow to ensure overlay is in the DOM and ready
        void this.elements.transitionOverlay.offsetHeight;
      }

      await this.showTransition();

      // 4. Navigate to new page
      this.sessionStorage.setItem(STORAGE_KEYS.PAGE_TRANSITION, "true");
      window.location.href = href;
    } catch (error) {
      const transitionError = createError(ERROR_CODES.NETWORK_ERROR, {
        message: "Page transition failed",
        originalError: error,
      });
      console.error(transitionError.message, transitionError);
      // Fallback: navigate without transition
      window.location.href = href;
    }
  }

  /**
   * Setup click event listeners for navigation
   *
   * Handles internal link clicks and manages page transitions.
   * Only processes links with 'internal-link' class to avoid handling external links,
   * mailto links, tel links, and other non-navigation links.
   *
   * Flow:
   * 1. Check if clicked element is an internal link
   * 2. Skip blocked links (external, mailto, tel)
   * 3. Prevent same-page navigation
   * 4. Handle navigation with transition animation
   */
  setupListeners() {
    document.addEventListener(EVENTS.CLICK, async (event) => {
      const target = event.target;
      if (!target) return;

      const link = target.closest("a");
      if (!link) return;

      // Only handle internal links
      if (!this.isInternalLink(link)) {
        return;
      }

      const href = link.getAttribute(ATTRIBUTES.HREF);

      // Skip blocked links (external, mailto, tel)
      if (this.isBlockedLink(href)) {
        return;
      }

      // Prevent same page navigation
      if (this.isSamePage(href)) {
        event.preventDefault();
        // this.closeMenuIfOpen();
        return;
      }

      // Animate transition to new page
      if (!href) return;
      event.preventDefault();

      await this.handleNavigation(href);
    });
  }

  async showTransition() {
    if (!this.elements.transitionOverlay) {
      return Promise.resolve();
    }

    // Delegate to PageTransition for animation
    return this.pageTransition.showPageTransition(
      this.elements.transitionOverlay,
    );
  }

  async hideTransition() {
    await this.loadPageImages();

    if (!this.elements.transitionOverlay) {
      return Promise.resolve();
    }

    // Delegate to PageTransition for animation
    return this.pageTransition.hidePageTransition(
      this.elements.transitionOverlay,
    );
  }

  /**
   * Normalize href to SiteConfig route key
   * Converts various href formats to consistent route keys
   * @param {string} href - Link href (e.g., "/", "/introduction", "introduction", "/index.html")
   * @returns {string|null} - Normalized route key or null if not found
   */
  normalizeHrefToRoute(href) {
    if (!href || href === "#" || href === "") return null;

    // Remove query string and hash
    const cleanHref = href.split("?")[0].split("#")[0];

    // Handle home page variations
    if (
      cleanHref === "/" ||
      cleanHref === "/index.html" ||
      cleanHref === "index.html" ||
      cleanHref === "./index.html"
    ) {
      return "/";
    }

    // Ensure leading slash for consistency
    let normalized = cleanHref.startsWith("/") ? cleanHref : "/" + cleanHref;

    // Remove trailing slash (except for root)
    if (normalized !== "/" && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    // Check if route exists in SiteConfig
    if (this.siteConfig && this.siteConfig.has(normalized)) {
      return normalized;
    }

    // Fallback: try without leading slash for backward compatibility
    const withoutSlash = normalized.slice(1);
    if (this.siteConfig && this.siteConfig.has(withoutSlash)) {
      return "/" + withoutSlash;
    }

    return null;
  }

  isSamePage(href) {
    if (!href || href === "#" || href === "") return true;
    const currentPath = window.location.pathname;
    if (href === currentPath) return true;

    if (
      (currentPath === "/" || currentPath === "/index.html") &&
      (href === "/" ||
        href === "/index.html" ||
        href === "index.html" ||
        href === "./index.html")
    ) {
      return true;
    }

    const currentFileName = currentPath.split("/").pop() || "index.html";
    const hrefFileName = href.split("/").pop();
    if (currentFileName === hrefFileName) return true;

    return false;
  }

  /**
   * Close navigation menu if it's currently open
   * Checks navigation status and clicks toggle button if menu is active
   */
  closeMenuIfOpen() {
    const nav = document.querySelector(SELECTORS.NAV);
    if (
      nav &&
      nav.getAttribute(ATTRIBUTES.DATA_NAVIGATION_STATUS) ===
        NAVIGATION_STATUS.ACTIVE &&
      this.elements.menuToggleBtn
    ) {
      // Click the toggle button to close the menu
      this.elements.menuToggleBtn.click();
    }
  }
}
