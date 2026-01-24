import { nextPaint } from "../utilities/AsyncHelpers.js";
import { $, createPageObjectFromSelectors } from "../utilities/DOMHelpers.js";
import { SELECTORS, ATTRIBUTES, VALUES } from "../utilities/Constants.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";


export default class Page {
  constructor({
    element,
    elements,
    smoothScroll,
    animationsManager,
    transitionsManager,
    footnotes,
  }) {
    this.selector = element;
    this.selectorChildren = {
      titleAnimations: SELECTORS.TITLE_ANIMATIONS,
      ...elements,
    };

    this.smoothScroll = smoothScroll;
    this.footnotes = footnotes;
    this.animationsManager = animationsManager; // AnimationsManager is a utility class - doesn't need element/elements in constructor
    this.transitionsManager = transitionsManager;
    this._created = false;
    this._destroyed = false;
    this._eventListenersSetup = false;
  }

  // ============================================
  // LIFECYCLE: CREATE
  // ============================================

  /**
   * Create a page object of elements
   * Initialize any other components for the page
   */
  async create() {
    if (this._created) {
      console.warn(`Page ${this.id}.create() called multiple times`);
      return;
    }

    await this.beforeCreate?.()
    await this.createElements();    
    await this.createComponents();
    this.createPageAnimations();
    this.createPage();

    this._created = true;
    await this.afterCreate?.()
  }

  async createElements() {
    this.element = $(SELECTORS.MAIN_WITH_TEMPLATE);
    if (!this.element) {
      throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, { element: `data-template attribute on ${this.selector}` });
    }
    this.elements = createPageObjectFromSelectors(this.selectorChildren);
    this.pageTransition = $(SELECTORS.TRANSITION_OVERLAY);
    this.preloader = $(SELECTORS.PRELOADER); 

    this.smoothScroll?.scrollTo(0, { immediate: true });

    return true;
  }

  async createComponents() {
    this.footnotes?.setup();
    return true;
  }

  /**
   * Create the page animations 
   * TODO: create an AnimationRegistry for this method instead
   */
  createPageAnimations() {
    this.animationsManager.createPageAnimations(this.element);
  }

  createPage() {
    this.setupEventListeners();
    return true;
  }

  // ============================================
  // LIFECYCLE: DESTROY
  // ============================================

  /**
   * Remove page state to avoid memory leaks (duplicate animations on page return, etc...)
   */
  async destroy() {
    if (this._destroyed) {
      console.warn(`Page ${this.id}.destroy() called multiple times`);
      return;
    }

    this._destroyed = true;

    // NOTE: Destroy function are in reverse order of create
    await this.beforeDestroy?.()
    this.destroyPageAnimations();
    this.removeEventListeners();
    this.destroyComponents();
    this.destroyElements();
    await this.afterDestroy?.()
  }

  /**
   * Destroy the page animations
   */
  destroyPageAnimations() {
    this.animationsManager.destroyPageAnimations();
  }

  destroyComponents() {
    this.footnotes = null;
    this.smoothScroll = null;
    return true;
  }

  destroyElements() {
    this.element = null;
    this.elements = null;
    this.pageTransition = null;
    this.preloader = null;
    return true;
  }

  // ============================================
  // LIFECYCLE: SHOW / HIDE
  // ============================================

  /**
   * Show the page
   */
  async show() {
    await this.beforeShow?.()
    if (this.pageTransition) {
      if (this.smoothScroll.isStopped()) {
        this.smoothScroll.start();
        this.smoothScroll.scrollTo(0, { immediate: true }); 
      }
      try { 
        await this.transitionsManager.hidePageTransition(this.pageTransition);
      } catch (error) {
        console.warn(`Page ${this.id}: Transition animation failed, continuing:`, error);
        // Continue execution - page should still be shown even if animation fails
      }
    }
    
    if (this.smoothScroll.isEnabled()) {
      this.smoothScroll.scrollTo(0, { immediate: true });
    } else {
      this.smoothScroll.create();
      this.smoothScroll.scrollTo(0, { immediate: true });
    }

    await this.afterShow?.()
  }

  /**
   * Hide the page
   */
  async hide(route) {
    await this.beforeHide?.();
    await this.transitionsManager.updateTransitionOverlay(route); // update the transition overlay markup with the custom transition markup
    await nextPaint();
    if (this.pageTransition) {
      try {
        await this.transitionsManager.showPageTransition(this.pageTransition);
      } catch (error) {
        console.warn(`Page ${this.id}: Transition animation failed, continuing:`, error);
        // NOTE: Continue execution - page should still be hidden even if animation fails
      }
      this.smoothScroll.scrollTo(0, { immediate: true });
    }
    this.destroy();
    await this.afterHide?.();
  }

  // ============================================
  // UTILITIES
  // ============================================

  setPageFocus() {
    if (this.element) {
      // Make the element focusable if it isn't already
      // (main elements are focusable by default in modern browsers with tabindex="-1")
      if (!this.element.hasAttribute(ATTRIBUTES.TABINDEX)) {
        this.element.setAttribute(ATTRIBUTES.TABINDEX, VALUES.TABINDEX_DISABLED);
      }

      // Move focus to the main content
      this.element.focus();
    }
  }

  /**
   * Setup page event listeners
   */
  setupEventListeners() {
    if (this._eventListenersSetup) {
      console.warn(`Page ${this.id}: Event listeners already setup`);
      return;
    }

    this._eventListenersSetup = true;

    // NOTE: Resize listener is now automatically managed by SmoothScroll.create()/destroy()
  }

  /**
   * Remove page event listeners
   */
  removeEventListeners() {
    // ✅ Safety check: footnotes might be null if already destroyed
    if (this.footnotes) {
      this.footnotes.remove();
    }
    // SmoothScroll resize listener is automatically removed in smoothScroll.destroy()
  }
}
