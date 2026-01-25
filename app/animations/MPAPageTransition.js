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
   * Restore transition data from sessionStorage and update overlay markup
   * @returns {Promise<void>} Resolves when overlay is updated
   */
  async restoreTransitionData() {
    try {
      const storedData = this.sessionStorage.getItem('pageTransitionImage');
      if (!storedData) return;

      const transitionData = JSON.parse(storedData);
      const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
      
      if (imageElement && transitionData.image) {
        imageElement.crossOrigin = 'anonymous';
        
        const fallbackImage = 'https://shea-memorandum-site.b-cdn.net/images/home-theme-desktop.webp';
        const htmlHasValidImage = imageElement.src && 
                                  imageElement.src !== '' && 
                                  imageElement.src !== fallbackImage;
        const imageMatchesSessionStorage = imageElement.src === transitionData.image;
        
        if (htmlHasValidImage && !imageMatchesSessionStorage) {
          this.sessionStorage.removeItem('pageTransitionImage');
          return;
        }
        
        const imageAlreadyCorrect = imageMatchesSessionStorage && 
                                   imageElement.complete && 
                                   imageElement.naturalHeight > 0;
        
        if (!imageAlreadyCorrect) {
          const isPreloaded = this.transitionsManager && this.transitionsManager.isImagePreloaded(transitionData.image);
          
          if (isPreloaded) {
            imageElement.src = transitionData.image;
          } else {
            const tempImg = document.createElement('img');
            tempImg.setAttribute('data-src', transitionData.image);
            tempImg.crossOrigin = 'anonymous';
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
      }

      this.sessionStorage.removeItem('pageTransitionImage');
    } catch (error) {
      console.warn('Error restoring transition data:', error);
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
        tempImg.crossOrigin = 'anonymous'; // Match preload link crossorigin
        
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

    const imageElement = this.elements.transitionOverlay?.querySelector('.page-transition-overlay__image');
    if (imageElement) {
      // Ensure crossorigin matches preload link
      imageElement.crossOrigin = 'anonymous';
      
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

    if (imageElement) {
      try {
        await this.imageService.waitForImageLoad(imageElement);
      } catch (error) {
        console.warn('Error waiting for transition image load:', error);
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
        
        void imageAfterRestore.offsetHeight;
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      this.sessionStorage.removeItem("pageTransition");
      await this.hideTransition();
    } else {
      // Initial state: overlay hidden
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

      // Set initial state: hidden (opacity: 0)
      this.gsap.set(this.elements.transitionOverlay, {
        opacity: 0,
      });
      
      // Fade in to visible (opacity: 1)
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

      this.gsap.set(this.elements.transitionOverlay, {
        opacity: 1,
      });
      
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
