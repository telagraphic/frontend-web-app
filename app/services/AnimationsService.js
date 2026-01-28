import { Titles } from "../animations/Titles.js";
import { SELECTORS, ATTRIBUTES } from "../utilities/Constants.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

/**
 * AnimationsManager handles page animations lifecycle
 * - Creates single IntersectionObserver per page
 * - Auto-detects data-animation attributes
 * - Registers and tracks animation instances
 * - Kills all animations on destroy
 */
export class AnimationsService {
  constructor() {
    this.animationRegistry = {
      title: Titles,
      // Future: image: Images, parallax: Parallax
    };
    
    // Current page state
    this.pageAnimations = [];
    this.intersectionObserver = null;
  }

  /**
   * Validates that the page element is a valid HTMLElement
   * @param {HTMLElement} pageElement - The page container element to validate
   * @returns {void}
   * @throws {Error} Throws if pageElement is null, undefined, or not an HTMLElement
   */
  validatePageElement(pageElement) {
    if (!pageElement || !(pageElement instanceof HTMLElement)) {
      throw createError(ERROR_CODES.VALIDATION_ERROR, { message: 'Invalid page element' });
    }
  }

  /**
   * Finds all elements within the page that have data-animation attributes
   * @param {HTMLElement} pageElement - The page container element to search within
   * @returns {NodeList<HTMLElement>} NodeList of elements with data-animation attributes
   */
  findAnimatedElements(pageElement) {
    return pageElement.querySelectorAll(SELECTORS.ANIMATIONS_ATTRIBUTE);
  }

  /**
   * Groups elements by their data-animation attribute value
   * @param {NodeList<HTMLElement>|Array<HTMLElement>} elements - Elements to group
   * @returns {Map<string, Array<HTMLElement>>} Map where keys are animation types and values are arrays of elements
   */
  groupElementsByType(elements) {
    const elementsByType = new Map();
    elements.forEach((element) => {
      const animationType = element.getAttribute(ATTRIBUTES.DATA_ANIMATION);
      if (!elementsByType.has(animationType)) {
        elementsByType.set(animationType, []);
      }
      elementsByType.get(animationType).push(element);
    });
    return elementsByType;
  }

  /**
   * Creates animation instances for grouped elements and registers them
   * Updates this.pageAnimations state with created instances
   * @param {Map<string, Array<HTMLElement>>} elementsByType - Elements grouped by animation type
   * @returns {Array<Object>} Array of created animation instances
   * @throws {Error} Throws if an unknown animation type is encountered
   */
  createAnimationInstances(elementsByType) {
    const animations = [];
    elementsByType.forEach((elements, type) => {
      const AnimationClass = this.animationRegistry[type];
      
      if (!AnimationClass) {
        throw createError(ERROR_CODES.CLASS_NOT_FOUND, { className: `animation type: ${type}` });
      }

      elements.forEach((element) => {
        try {
          const animation = new AnimationClass(element);
          animations.push(animation);
          this.pageAnimations.push(animation);
        } catch (error) {
          console.error(`AnimationsManager#createAnimationInstances: Error creating ${type} animation:`, error);
        }
      });
    });
    return animations;
  }

  /**
   * Creates page animations from data-animation attributes
   * Orchestrates the animation creation process: validation, discovery, grouping, and instantiation
   * Sets up a single IntersectionObserver for all animations
   * @param {HTMLElement} pageElement - The page container element
   * @returns {void}
   * @throws {Error} Throws if pageElement is invalid or unknown animation types are found
   */
  createPageAnimations(pageElement) {
    this.destroyPageAnimations();
    
    this.validatePageElement(pageElement);
    
    const animatedElements = this.findAnimatedElements(pageElement);
    if (animatedElements.length === 0) {
      return;
    }
    
    const elementsByType = this.groupElementsByType(animatedElements);
    const animations = this.createAnimationInstances(elementsByType);
    
    if (animations.length > 0) {
      this.createSharedIntersectionObserver(animations);
    }
  }

  /**
   * Create a single IntersectionObserver for all page animations
   * @param {Array} animations - Array of animation instances
   */
  createSharedIntersectionObserver(animations) {
    // Disconnect previous observer if exists
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Track which elements have already been animated
    const animatedElements = new Set();

    // Create observer with callback that routes to appropriate animation
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Skip if already animated
        if (animatedElements.has(entry.target)) {
          return;
        }

        // Find the animation instance for this element
        const animation = animations.find(anim => anim.element === entry.target);
        
        if (!animation) {
          return;
        }

        if (entry.isIntersecting) {
          animation.animateIn();
          animatedElements.add(entry.target);
          this.intersectionObserver.unobserve(entry.target);
        } else {
          animation.animateOut();
        }
      });
    }, {
      rootMargin: '0px',
      threshold: 0.1
    });

    // Observe all animated elements
    animations.forEach((animation) => {
      if (animation.element && animation.element instanceof HTMLElement) {
        this.intersectionObserver.observe(animation.element);
      }
    });
  }

  /**
   * Register a custom animation (for page-specific animations)
   * @param {*} animation - GSAP timeline or animation object with kill() method
   */
  register(animation) {
    if (!animation) {
      console.error('AnimationsManager#register: Animation is required');
      return false;
    }
    this.pageAnimations.push(animation);
    return true;
  }

  /**
   * Destroy all page animations and reset state
   */
  destroyPageAnimations() {
    // Kill all animation instances
    this.pageAnimations.forEach((animation) => {
      try {
        if (typeof animation.kill === 'function') {
          animation.kill();
        }
      } catch (error) {
        console.error('AnimationsManager#destroyPageAnimations: Error killing animation:', error);
      }
    });

    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Reset array
    this.pageAnimations = [];
  }
}
