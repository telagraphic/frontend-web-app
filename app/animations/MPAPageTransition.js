/**
 * Page Transition Class for MPA
 *
 * @description: This class is responsible for the page transition animation in a Multi-Page Application.
 * @author: CodeGrid
 * @version: 1.0.0
 * @since: 2026-01-21
 */
import { ImageService } from '../utilities/ImageService.js';

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
   * Restore transition data from sessionStorage and update overlay markup
   * @returns {Promise<void>} Resolves when overlay is updated
   */
  async restoreTransitionData() {
    try {
      const storedData = this.sessionStorage.getItem('pageTransitionImage');
      if (!storedData) return;

      const transitionData = JSON.parse(storedData);
      
      // Update overlay image element
      const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
      if (imageElement && transitionData.image) {
        // Check if image is preloaded
        if (this.transitionsManager && this.transitionsManager.isImagePreloaded(transitionData.image)) {
          imageElement.src = transitionData.image;
        } else {
          // Preload if not already loaded
          const tempImg = document.createElement('img');
          tempImg.setAttribute('data-src', transitionData.image);
          if (this.transitionsManager) {
            await this.transitionsManager.preloadSingleImage(tempImg);
          } else {
            await this.imageService.loadImage({ element: tempImg });
          }
          imageElement.src = transitionData.image;
        }
        
        if (transitionData.alt) {
          imageElement.alt = transitionData.alt;
        }
      }

      // Update copy text if element exists
      const copyElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__copy');
      if (copyElement && transitionData.copy) {
        copyElement.textContent = transitionData.copy;
      }

      // Clear sessionStorage after restoring
      this.sessionStorage.removeItem('pageTransitionImage');
    } catch (error) {
      console.warn('Error restoring transition data:', error);
      // Clear corrupted data
      this.sessionStorage.removeItem('pageTransitionImage');
    }
  }

  /**
   * Update overlay with transition data from SiteConfig
   * Checks if image is preloaded, preloads if needed, then updates overlay markup
   * @param {string} route - SiteConfig route key (e.g., "/introduction", "/section-1")
   * @returns {Promise<void>} Resolves when overlay is updated and image is loaded
   */
  async updateTransitionOverlay(route) {
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

    // Check if image is preloaded
    let imageReady = false;
    if (this.transitionsManager && this.transitionsManager.isImagePreloaded(imageUrl)) {
      imageReady = true;
    } else {
      // Preload image if not already loaded
      try {
        const tempImg = document.createElement('img');
        tempImg.setAttribute('data-src', imageUrl);
        
        if (this.transitionsManager) {
          await this.transitionsManager.preloadSingleImage(tempImg);
        } else {
          await this.imageService.loadImage({ element: tempImg });
        }
        imageReady = true;
      } catch (error) {
        console.warn(`Failed to preload transition image for route ${route}:`, error);
        // Continue anyway - image may still load
      }
    }

    // Update overlay image element
    const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
    if (imageElement) {
      if (imageReady) {
        imageElement.src = imageUrl;
      } else {
        // Set src anyway - browser will load it
        imageElement.src = imageUrl;
      }
      
      if (transitionData.alt) {
        imageElement.alt = transitionData.alt;
      }
    }

    // Update copy text if element exists
    const copyElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__copy');
    if (copyElement && transitionData.copy) {
      copyElement.textContent = transitionData.copy;
    }

    // Wait for image to be ready if element exists
    if (imageElement) {
      try {
        await this.imageService.waitForImageLoad(imageElement);
      } catch (error) {
        console.warn('Error waiting for transition image load:', error);
        // Continue anyway
      }
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

    // Set up listeners after elements are found
    this.setupListeners();

    this.isPageNavigating =
      this.sessionStorage.getItem("pageTransition") === "true";

    if (this.isPageNavigating) {
      // Overlay should be visible (scaleY: 1, opacity: 1) when navigating to new page
      // It will be hidden by hideTransition()
      this.gsap.set(this.elements.transitionOverlay, { 
        scaleY: 1,
        opacity: 1,
        transformOrigin: "top"
      });
      this.sessionStorage.removeItem("pageTransition");
      
      // Restore transition data from sessionStorage before hiding
      // This ensures visual continuity - overlay shows correct image when hiding
      await this.restoreTransitionData();
      
      this.hideTransition();
    } else {
      // Initial state: overlay hidden
      this.gsap.set(this.elements.transitionOverlay, { 
        scaleY: 0,
        opacity: 0
      });
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

        // 4. Show transition
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

      // Set initial state: hidden (scaleY: 0, opacity: 0)
      this.gsap.set(this.elements.transitionOverlay, {
        scaleY: 0,
        opacity: 0,
        transformOrigin: "bottom",
      });
      
      // Animate to visible (scaleY: 1, opacity: 1)
      this.gsap.to(this.elements.transitionOverlay, {
        scaleY: 1,
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async hideTransition() {
    // Wait for all page images to load before hiding transition
    await this.loadPageImages();

    return new Promise((resolve) => {
      if (!this.elements.transitionOverlay) {
        resolve();
        return;
      }

      // Ensure overlay is visible before hiding
      this.gsap.set(this.elements.transitionOverlay, {
        scaleY: 1,
        opacity: 1,
        transformOrigin: "top",
      });
      
      // Animate to hidden (scaleY: 0, opacity: 0)
      this.gsap.to(this.elements.transitionOverlay, {
        scaleY: 0,
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
