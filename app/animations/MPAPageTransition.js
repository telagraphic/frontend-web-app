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
  constructor() {
    this.gsap = window.gsap;
    this.sessionStorage = window.sessionStorage;
    this.isPageNavigating = false;
    this.blocklistLinks = ["http", "mailto:", "tel:"];
    this.elements = {};
    this.imageService = new ImageService();
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

  initialize() {
    if (!this.gsap) {
      console.error(
        "GSAP is not loaded. Please ensure the GSAP script is included in the head.",
      );
      return;
    }

    this.setupListeners();

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

    this.isPageNavigating =
      this.sessionStorage.getItem("pageTransition") === "true";

    if (this.isPageNavigating) {
      this.sessionStorage.removeItem("pageTransition");
      this.hideTransition();
    } else {
      this.gsap.set(this.elements.transitionOverlay, { scaleY: 0 });
    }
  }

  setupListeners() {
    document.addEventListener("click", (event) => {
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
      this.sessionStorage.setItem("pageTransition", "true");
      this.showTransition().then(() => {
        window.location.href = href;
      });
    });
  }

  async showTransition() {
    return new Promise((resolve) => {
      if (!this.elements.transitionOverlay) {
        resolve();
        return;
      }

      this.gsap.set(this.elements.transitionOverlay, {
        scaleY: 0,
        transformOrigin: "bottom",
      });
      this.gsap.to(this.elements.transitionOverlay, {
        scaleY: 1,
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

      this.gsap.set(this.elements.transitionOverlay, {
        scaleY: 1,
        transformOrigin: "top",
      });
      this.gsap.to(this.elements.transitionOverlay, {
        scaleY: 0,
        duration: 0.6,
        delay: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
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
