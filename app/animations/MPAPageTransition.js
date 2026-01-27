/**
 * Page Transition Class for MPA
 *
 * @description: This class is responsible for the page transition animation in a Multi-Page Application.
 * @author: CodeGrid
 * @version: 1.0.0
 * @since: 2026-01-21
 */
import { ImageService } from '../utilities/ImageService.js';
import { Preloader } from '../components/Preloader.js';

export class MPAPageTransition {
  constructor({ siteConfig, transitionsManager }) {
    this.gsap = window.gsap;
    this.sessionStorage = window.sessionStorage;
    this.isPageNavigating = false;
    this.blocklistLinks = ["http", "mailto:", "tel:"];
    this.elements = {};
    this.imageService = new ImageService();
    this.siteConfig = siteConfig;
    this.transitionsManager = transitionsManager;
  }

  /**
   * Load all page images including navigation overlay background
   * Uses ImageService to load all images with data-src attribute
   * @returns {Promise<void>} Resolves when all images are loaded
   */
  async loadPageImages() {
    try {
      await this.imageService.preloadImages({
        images: 'img[data-src]',
        excludePreloader: true,
        useDecode: true,
      });
    } catch (error) {
      console.warn('Error loading page images:', error);
      // Continue even if image loading fails
    }
  }

  /**
   * Store transition data in sessionStorage for persistence across page loads
   * @param {Object} transitionData - Transition data object with image, alt, copy
   */
  storeTransitionData(transitionData) {
    try {
      this.sessionStorage.setItem('pageTransitionImage', JSON.stringify(transitionData));
    } catch (error) {
      console.warn('Error storing transition data:', error);
    }
  }

  /**
   * Updates the overlay image element with transition image data
   * 
   * Handles DOM manipulation for transition overlay image:
   * - Sets crossOrigin to match preload link (critical for browser cache usage)
   * - Sets src to imageUrl (will use cached image if preloaded)
   * - Updates alt text if provided
   * - Waits for image to load (ensures DOM element is ready)
   * 
   * Why extract this?
   * - Separates DOM manipulation from preloading logic
   * - Makes function more testable
   * - Clearer separation of concerns
   * - Reusable for both updateTransitionOverlay and restoreTransitionData
   * 
   * @param {HTMLImageElement} imageElement - The overlay image element to update
   * @param {string} imageUrl - Image URL to set as src
   * @param {string} [altText] - Optional alt text for the image
   * @returns {Promise<void>} Resolves when image element is updated and loaded
   */
  async updateOverlayImageElement(imageElement, imageUrl, altText) {
    if (!imageElement || !imageUrl) {
      return;
    }

    // CRITICAL: Set crossOrigin on DOM element to match preload link
    // This ensures browser uses the preloaded/cached image instead of re-downloading
    imageElement.crossOrigin = 'anonymous';
    
    // Set src on DOM element
    // If image was preloaded, this should be instant from cache
    // If not preloaded, browser will load it (may cause slight delay/flash)
    imageElement.src = imageUrl;
    
    // Update alt text if provided
    if (altText) {
      imageElement.alt = altText;
    }

    // Wait for DOM element to finish loading
    // Even if image was preloaded, we need to ensure the DOM element is ready
    // This prevents blank image flash when overlay becomes visible
    try {
      await this.imageService.waitForImageLoad(imageElement);
    } catch (error) {
      // Non-blocking error: log warning but continue
      // Transition will proceed even if image load verification fails
      console.warn('Error waiting for transition image load:', error);
    }
  }

  /**
   * Restore transition data from sessionStorage and update overlay markup
   * 
   * Lifecycle Overview:
   * 1. Retrieves transition data from sessionStorage (stored before navigation)
   * 2. Checks if HTML already has correct image (prevents stale overwrites)
   * 3. If image needs updating, ensures it's preloaded via ensureTransitionImageReady()
   * 4. Updates DOM element via updateOverlayImageElement()
   * 
   * Why this complexity?
   * - HTML may have correct image from build-time generation
   * - sessionStorage might have stale image from previous navigation
   * - Prevents overwriting correct HTML image with stale sessionStorage data
   * - Ensures image is preloaded before setting src (smooth transition)
   * 
   * Edge Cases Handled:
   * - No sessionStorage data → return early
   * - HTML has valid image that doesn't match sessionStorage → preserve HTML image
   * - Image already correct and loaded → skip update
   * - Image needs updating → preload then update DOM
   * 
   * @returns {Promise<void>} Resolves when overlay is updated
   */
  async restoreTransitionData() {
    try {
      const storedData = this.sessionStorage.getItem('pageTransitionImage');
      if (!storedData) return;

      const transitionData = JSON.parse(storedData);
      const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
      
      if (imageElement && transitionData.image) {
        // CRITICAL: Prevent stale sessionStorage from overwriting correct HTML image
        // HTML may have correct image from build-time generation
        // sessionStorage might have stale image from previous navigation
        const fallbackImage = 'https://shea-memorandum-site.b-cdn.net/images/home-theme-desktop.webp';
        const htmlHasValidImage = imageElement.src && 
                                  imageElement.src !== '' && 
                                  imageElement.src !== fallbackImage;
        const imageMatchesSessionStorage = imageElement.src === transitionData.image;
        
        // If HTML has valid image that doesn't match sessionStorage, preserve HTML image
        // This prevents wrong image flash when navigating to unvisited pages
        if (htmlHasValidImage && !imageMatchesSessionStorage) {
          this.sessionStorage.removeItem('pageTransitionImage');
          return;
        }
        
        // Check if image is already correct and loaded
        // If so, skip unnecessary work (prevents redundant src assignment)
        const imageAlreadyCorrect = imageMatchesSessionStorage && 
                                   imageElement.complete && 
                                   imageElement.naturalHeight > 0;
        
        // Only update if image is not already correct
        if (!imageAlreadyCorrect) {
          // Ensure image is preloaded before updating DOM
          // Uses extracted method to handle preload check + preload logic
          await this.imageService.ensureTransitionImageReady(transitionData.image, {
            transitionsManager: this.transitionsManager
          });
          
          // Update DOM element with preloaded image
          // Uses extracted method to handle crossOrigin, src, alt, and load verification
          await this.updateOverlayImageElement(imageElement, transitionData.image, transitionData.alt);
        }
      }

      this.sessionStorage.removeItem('pageTransitionImage');
    } catch (error) {
      console.warn('Error restoring transition data:', error);
      this.sessionStorage.removeItem('pageTransitionImage');
    }
  }

  /**
   * Update overlay with transition data from SiteConfig
   * 
   * Lifecycle Overview:
   * 1. Validates route and retrieves transition config from SiteConfig
   * 2. Ensures image is preloaded via ImageService.ensureTransitionImageReady()
   * 3. Updates DOM overlay image element via updateOverlayImageElement()
   * 
   * Why this approach?
   * - Preloading ensures smooth transitions without image loading delays
   * - crossOrigin matching is critical: must match HTML <link rel="preload"> crossorigin
   *   attribute for browser to use cached/preloaded image (otherwise treated as different resource)
   * - Off-DOM preloading prevents layout shifts and ensures image is decoded before display
   * - Waiting for DOM element load ensures image is painted before transition starts
   * 
   * Edge Cases Handled:
   * - Missing siteConfig or route → return early with warning
   * - Route not found in config → return early with warning
   * - No image URL in transition data → return early with warning
   * - TransitionsManager not available → falls back to ImageService
   * - Image already preloaded → skips preload step
   * - Preload fails → continues anyway (image may still load)
   * - DOM element not found → returns early
   * - Image load fails → logs warning but completes (non-blocking)
   * 
   * @param {string} route - SiteConfig route key (e.g., "/introduction", "/section-1")
   * @returns {Promise<void>} Resolves when overlay is updated and image is loaded
   */
  async updateTransitionOverlay(route) {
    // ============================================
    // SECTION 1: Route & Config Validation
    // ============================================
    // Early validation prevents unnecessary work if route/config invalid
    if (!this.siteConfig || !route) {
      console.warn('Cannot update transition overlay: missing siteConfig or route');
      return;
    }

    const routeConfig = this.siteConfig.get(route);
    if (!routeConfig || !routeConfig.transition) {
      console.warn(`Transition data not found for route: ${route}`);
      return;
    }

    const transitionData = routeConfig.transition;
    const imageUrl = transitionData.image;

    if (!imageUrl) {
      console.warn(`No transition image URL for route: ${route}`);
      return;
    }

    // ============================================
    // SECTION 2: Ensure Image is Preloaded
    // ============================================
    // Uses extracted method to handle preload check + preload logic
    // Handles crossOrigin matching, temp img creation, and fallback logic
    await this.imageService.ensureTransitionImageReady(imageUrl, {
      transitionsManager: this.transitionsManager
    });

    // ============================================
    // SECTION 3: Update DOM Element
    // ============================================
    // Find overlay image element and update it
    const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
    if (imageElement) {
      await this.updateOverlayImageElement(imageElement, imageUrl, transitionData.alt);
    }
  }

  async initialize() {
    if (!this.gsap) {
      console.error(
        "GSAP is not loaded. Please ensure the GSAP script is included in the head.",
      );
      return;
    }

    this.elements = {
      transitionOverlay: document.querySelector(".page-transition-overlay"),
      menuToggleBtn: document.querySelector(".navigation__toggle"),
    };

    // Check if transition overlay element exists
    if (!this.elements.transitionOverlay) {
      console.warn(
        "Page transition overlay element not found. Transition animations may not work.",
      );
      return;
    }

    this.isPageNavigating = this.sessionStorage.getItem("pageTransition") === "true";
    const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
    
    this.setupListeners();

    if (this.isPageNavigating) {
      await this.restoreTransitionData();
      
      const imageAfterRestore = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
      
      if (imageAfterRestore && imageAfterRestore.src) {
        imageAfterRestore.crossOrigin = 'anonymous';
        
        if (!imageAfterRestore.complete || imageAfterRestore.naturalHeight === 0) {
          await this.imageService.waitForImageLoad(imageAfterRestore);
        }
        
        // Force browser to paint the image before overlay animation
        // Even with CSS opacity: 1 by default, we need to ensure image is painted
        // to prevent blank image flash when overlay is visible
        void imageAfterRestore.offsetHeight;
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      this.sessionStorage.removeItem("pageTransition");
      await this.hideTransition();
    } else {
      // Hide overlay immediately on initial page load (non-navigating case)
      // CSS has opacity: 1 by default to prevent race condition, so we must hide it here
      this.gsap.set(this.elements.transitionOverlay, { 
        opacity: 0
      });
      
      // Ensure crossorigin is set for future use
      if (imageElement && imageElement.src) {
        imageElement.crossOrigin = 'anonymous';
      }
      
      // If preloader didn't run, load page images now
      // Preloader only runs on first visit (when 'preloaderShown' doesn't exist)
      // On reload, preloader doesn't run, so we need to load images here
      if (!Preloader.shouldShow()) {
        await this.loadPageImages();
      }
    }
  }

  setupListeners() {
    document.addEventListener("click", async (event) => {
      const target = event.target;
      if (!target) return;
      const link = target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      const isBlockedLink =
        href &&
        this.blocklistLinks.some((blockedLink) =>
          href.startsWith(blockedLink),
        );
      if (isBlockedLink) {
        return;
      }

      // prevent same page navigation
      if (this.isSamePage(href)) {
        event.preventDefault();
        this.closeMenuIfOpen();
        return;
      }

      // animate transition to new page
      if (!href) return;
      event.preventDefault();

      // Ensure overlay element is available
      if (!this.elements.transitionOverlay) {
        this.elements.transitionOverlay = document.querySelector(".page-transition-overlay");
        if (!this.elements.transitionOverlay) {
          console.warn('Transition overlay not found, navigating without transition');
          window.location.href = href;
          return;
        }
      }

      try {
        // 1. Normalize href to route key
        const route = this.normalizeHrefToRoute(href);
        
        if (route && this.siteConfig) {
          // 2. Update overlay with transition data
          await this.updateTransitionOverlay(route);
          
          // 3. Store transition data in sessionStorage
          const routeConfig = this.siteConfig.get(route);
          if (routeConfig && routeConfig.transition) {
            this.storeTransitionData(routeConfig.transition);
          }
        }

        await this.showTransition();
        
        // 5. Navigate to new page
        this.sessionStorage.setItem("pageTransition", "true");
        window.location.href = href;
      } catch (error) {
        console.error('Error in page transition:', error);
        // Fallback: navigate without transition
        window.location.href = href;
      }
    });
  }

  async showTransition() {
    return new Promise((resolve) => {
      if (!this.elements.transitionOverlay) {
        resolve();
        return;
      }

      // Fade in to visible (opacity: 1)
      // Note: CSS already has opacity: 1 by default, so no need to set initial state
      this.gsap.to(this.elements.transitionOverlay, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async hideTransition() {
    await this.loadPageImages();

    return new Promise((resolve) => {
      if (!this.elements.transitionOverlay) {
        resolve();
        return;
      }

      // Fade out to hidden (opacity: 0)
      // Note: CSS already has opacity: 1 by default, so no need to set it before animating
      this.gsap.to(this.elements.transitionOverlay, {
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
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
    const cleanHref = href.split('?')[0].split('#')[0];

    // Handle home page variations
    if (cleanHref === "/" || cleanHref === "/index.html" || cleanHref === "index.html" || cleanHref === "./index.html") {
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

  closeMenuIfOpen() {
    // Check if navigation is active by checking the nav element's data attribute
    const nav = document.querySelector("nav");
    if (
      nav &&
      nav.getAttribute("data-navigation-status") === "active" &&
      this.elements.menuToggleBtn
    ) {
      // Click the toggle button to close the menu
      this.elements.menuToggleBtn.click();
    }
  }
}
