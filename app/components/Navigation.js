import Component from "./Component.js";
import { $, $$ } from "../utilities/DOMHelpers.js";
import { SELECTORS, VALUES } from "../utilities/Constants.js";

/**
 * Navigation component is responsible for updating the navigation links when the page changes, hide links, change colors depending on the page, etc...
 */
export class Navigation extends Component {
  constructor({ siteConfig, pageRegistry, smoothScroll }) {
    super({
      element: SELECTORS.NAV,
      elements: {
        links: SELECTORS.NAV_LINKS,
      },
      navigation: ".navigation",
      menuButton: ".navigation__toggle",
      title: ".navigation__title",
    });

    this.siteConfig = siteConfig;
    this.pageRegistry = pageRegistry;
    this.smoothScroll = smoothScroll;
  }

  /**
   * Initialize Navigation component
   */
  create() {
    super.create();
    this.navigation = $(SELECTORS.NAV);
    this.menuButton = $(SELECTORS.NAV_TOGGLE);
    this.menuLinks = $$(SELECTORS.NAV_LINKS);
    this.title = $(SELECTORS.NAV_TITLE);
    this.setupNavigation();
    this.addEventListeners();
    this.setupLinkListeners();
    this.setupMenuButtonStyles();
    this.setupTitleObserver();
  }

  setupNavigation() {
    if (!this.menuButton) return;
    this.menuButtonClickHandler = () => {
      if (!this.navigation) return;
      if (
        this.navigation.getAttribute("data-navigation-status") === "not-active"
      ) {
        this.navigation.setAttribute("data-navigation-status", "active");
        this.smoothScroll.stop();
      } else {
        this.navigation.setAttribute("data-navigation-status", "not-active");
        this.smoothScroll.start();
      }
    };
    this.addListenerAndRegister(this.menuButton, "click", this.menuButtonClickHandler);
  }

  hideNavigation() {
    this.navigation.setAttribute("data-navigation-status", "not-active");
  }

  showNavigation() {
    this.navigation.setAttribute("data-navigation-status", "active");
  }

  getNavigationStatus() {
    return this.navigation.getAttribute("data-navigation-status");
  }

  setupLinkListeners() {
    // In MPA, browser handles navigation. Close menu when links are clicked.
    this.menuLinkHandlers = [];
    for (const link of this.menuLinks) {
      const handler = (event) => {
        const isMenuActive =
          this.navigation.getAttribute("data-navigation-status") === "active";
        if (isMenuActive) {
          setTimeout(() => {
            this.hideNavigation();
          }, VALUES.NAV_TIMEOUT);
        }
      };
      this.menuLinkHandlers.push({ link, handler });
      this.addListenerAndRegister(link, "click", handler);
    }
  }

  /**
   * Listen for esc key press to close navigation
   *
   */
  addEventListeners() {
    if (!this.navigation) return;
    
    // Escape key handler
    this.escapeKeyHandler = (e) => {
      if (e.key === "Escape" || e.code === "Escape") {
        if (
          this.navigation.getAttribute("data-navigation-status") === "active"
        ) {
          this.navigation.setAttribute("data-navigation-status", "not-active");
        }
      }
    };
    this.addListenerAndRegister(document, "keydown", this.escapeKeyHandler);

    // M key handler
    this.mKeyHandler = (e) => {
      if (e.key === "M" || e.code === "KeyM") {
        if (this.menuButton) {
          this.menuButton.click();
        }
      }
    };
    this.addListenerAndRegister(document, "keydown", this.mKeyHandler);
  }


  setupTitleObserver() {
    if (!this.title) return;

    // Scroll threshold in pixels - fade out after scrolling this amount
    const scrollThreshold = VALUES.NAV_SCROLL_THRESHOLD;
    
    // Track current fade state to avoid unnecessary animations
    this.titleIsFadedOut = false;
    this.titleFadeTimeline = null;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;

      if (scrollY > scrollThreshold && !this.titleIsFadedOut) {
        // Fade out title
        this.titleIsFadedOut = true;
        
        if (this.titleFadeTimeline) {
          this.titleFadeTimeline.kill();
        }

        this.titleFadeTimeline = gsap.to(this.title, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      } else if (scrollY <= scrollThreshold && this.titleIsFadedOut) {
        // Fade in title
        this.titleIsFadedOut = false;
        
        if (this.titleFadeTimeline) {
          this.titleFadeTimeline.kill();
        }

        this.titleFadeTimeline = gsap.to(this.title, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }
    };

    // Store reference for cleanup
    this.titleScrollHandler = handleScroll;

    // Add scroll listener with passive flag for better performance
    this.addListenerAndRegister(window, "scroll", this.titleScrollHandler, { passive: true });

    // Initial check in case page is already scrolled
    handleScroll();
  }

  setupMenuButtonStyles() {
    if (!this.menuButton) return;

    const defaultColor = "#191919";
    const intersectingColor = "#FFFFFF";
    
    // Only define intersecting color - CSS handles defaults
    const intersectingToggleBarColor = "#FFFFFF";

    // Check if menuButton overlaps with target elements
    const checkIntersection = () => {
      const menuButtonRect = this.menuButton.getBoundingClientRect();
      const pageNavigation = document.querySelector(".page-navigation");
      const pageFootnotes = document.querySelector(".page-footnotes");

      let isIntersecting = false;

      // Check overlap with page-navigation
      if (pageNavigation) {
        const navRect = pageNavigation.getBoundingClientRect();
        if (
          menuButtonRect.bottom >= navRect.top &&
          menuButtonRect.top <= navRect.bottom &&
          menuButtonRect.right >= navRect.left &&
          menuButtonRect.left <= navRect.right
        ) {
          isIntersecting = true;
        }
      }

      // Check overlap with page-footnotes
      if (!isIntersecting && pageFootnotes) {
        const footnotesRect = pageFootnotes.getBoundingClientRect();
        if (
          menuButtonRect.bottom >= footnotesRect.top &&
          menuButtonRect.top <= footnotesRect.bottom &&
          menuButtonRect.right >= footnotesRect.left &&
          menuButtonRect.left <= footnotesRect.right
        ) {
          isIntersecting = true;
        }
      }

      // Update button text color
      this.menuButton.style.color = isIntersecting ? intersectingColor : defaultColor;
      
      // Only override CSS variable when intersecting
      // When not intersecting, remove the variable to let CSS defaults take over
      if (isIntersecting) {
        this.menuButton.style.setProperty('--toggle-bar-color', intersectingToggleBarColor);
      } else {
        // Remove the inline style to allow CSS cascade to work
        this.menuButton.style.removeProperty('--toggle-bar-color');
      }
    };

    // Observe page-navigation and page-footnotes for changes
    const observerOptions = {
      root: null, // viewport
      rootMargin: "0px",
      threshold: 0,
    };

    const observerCallback = () => {
      checkIntersection();
    };

    this.menuButtonObserver = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const pageNavigation = document.querySelector(".page-navigation");
    const pageFootnotes = document.querySelector(".page-footnotes");

    if (pageNavigation) {
      this.menuButtonObserver.observe(pageNavigation);
    }

    if (pageFootnotes) {
      this.menuButtonObserver.observe(pageFootnotes);
    }

    // Also check on scroll and resize
    this.handleScroll = () => checkIntersection();
    this.handleResize = () => checkIntersection();

    this.addListenerAndRegister(window, "scroll", this.handleScroll, { passive: true });
    this.addListenerAndRegister(window, "resize", this.handleResize, { passive: true });

    // Initial check
    checkIntersection();
  }

  /**
   * Clean up navigation component
   * Remove event listeners and clear references
   */
  destroy() {
    // Clean up IntersectionObserver
    if (this.menuButtonObserver) {
      this.menuButtonObserver.disconnect();
      this.menuButtonObserver = null;
    }

    // Clean up title fade timeline
    if (this.titleFadeTimeline) {
      this.titleFadeTimeline.kill();
      this.titleFadeTimeline = null;
    }

    // Remove all Component event listeners (includes scroll/resize handlers registered via addListenerAndRegister)
    this.removeAllListeners();

    // Clear references for memory cleanup
    this.titleScrollHandler = null;
    this.handleScroll = null;
    this.handleResize = null;

    // Clear references
    this.element = null;
    this.elements = null;
    this.currentPage = null;
  }
}
