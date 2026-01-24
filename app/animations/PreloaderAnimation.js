import { normalizeToArray } from "../utilities/ArrayHelpers.js";

/**
 * PreloaderAnimation handles the GSAP animations for the preloader component
 * Manages text splitting, character animations, and fade out transitions
 */
export class PreloaderAnimation {
  constructor() {
    this.timeline = null;
    this.splitTexts = null;
  }

  /**
   * Create and run the preloader animation
   * @param {Object} options - Animation configuration
   * @param {HTMLElement} options.preloaderElement - The main preloader element
   * @param {NodeList|Array} options.copyElements - The copy/text elements to animate
   * @param {Function} options.onComplete - Callback when animation completes
   * @returns {Promise<void>}
   */
  async create({ preloaderElement, copyElements, onComplete }) {
    // Wait for fonts to load to prevent FOUT (Flash of Unstyled Text)
    await document.fonts.ready;

    // Reset any existing animation first
    if (this.timeline) {
      this.remove();
    }

    // Validate elements exist
    if (!preloaderElement) {
      console.warn('PreloaderAnimation: preloaderElement is required');
      return;
    }

    // Normalize elements to array (handles Array, NodeList, single element, or null/undefined)
    const elementsArray = normalizeToArray(copyElements);
    if (elementsArray.length === 0) {
      console.warn('PreloaderAnimation: No copy elements found');
      return;
    }

    this.timeline = gsap.timeline({
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      },
    });

    // Check if SplitText is available (GSAP 3.13.0+)
    const hasSplitText = typeof SplitText !== 'undefined';
    
    if (hasSplitText && elementsArray.length > 0) {
      this.createSplitTextAnimation(elementsArray, preloaderElement);
    } else {
      this.createFallbackAnimation(elementsArray, preloaderElement);
    }
  }

  /**
   * Create animation using SplitText with mask option
   * @param {Array} elementsArray - Array of text elements to animate
   * @param {HTMLElement} preloaderElement - The main preloader element
   * @private
   */
  createSplitTextAnimation(elementsArray, preloaderElement) {
    this.splitTexts = [];
    
    for (const [index, h1] of elementsArray.entries()) {
      // Use SplitText mask option to handle clipping automatically
      const split = SplitText.create(h1, { 
        type: "chars",
        mask: "chars" // Automatically handles clipping for background-clip: text effects
      });
      this.splitTexts.push(split);
      
      // Set initial state: below and invisible
      gsap.set(split.chars, {
        y: 100,
        opacity: 0,
      });
      
      // Animate up with stagger, with delay between each h1
      this.timeline.to(split.chars, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.05,
        ease: "power2.out",
      }, index * 0.3);
    }
    
    // Calculate fade out timing
    const lastH1Index = elementsArray.length - 1;
    const lastAnimationEndTime = lastH1Index * 0.3 + 0.8;
    const fadeOutStartTime = lastAnimationEndTime + 1;
    
    // Fade out each h1's characters
    for (const [index, split] of this.splitTexts.entries()) {
      this.timeline.to(split.chars, {
        y: "-100%",
        opacity: 0,
        duration: 0.75,
        stagger: 0.05,
        ease: "power2.inOut",
      }, fadeOutStartTime + index * 0.05);
    }
    
    // Fade out the preloader element
    this.timeline.to(preloaderElement, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
    }, fadeOutStartTime + "-=0.3");
  }

  /**
   * Create fallback animation without SplitText
   * @param {Array} elementsArray - Array of text elements to animate
   * @param {HTMLElement} preloaderElement - The main preloader element
   * @private
   */
  createFallbackAnimation(elementsArray, preloaderElement) {
    gsap.set(elementsArray, {
      y: 100,
    });
    
    this.timeline.to(elementsArray, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.05,
      ease: "power2.out",
    });

    this.timeline.to(elementsArray, {
      delay: 1,
      y: "-100%",
      opacity: 0,
      duration: 0.75,
      stagger: 0.05,
      ease: "power2.inOut",
    });
    
    this.timeline.to(preloaderElement, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
    }, "-=0.3");
  }

  /**
   * Run the animation (alias for create for consistency with other animation classes)
   * @param {Object} options - Animation configuration
   * @param {HTMLElement} options.preloaderElement - The main preloader element
   * @param {NodeList|Array} options.copyElements - The copy/text elements to animate
   * @param {Function} options.onComplete - Callback when animation completes
   * @returns {Promise<void>}
   */
  async run(options) {
    await this.create(options);
  }

  /**
   * Remove and clean up the animation
   * Kills the timeline and reverts SplitText instances
   * @returns {void}
   */
  remove() {
    // Kill any running animation
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    // Clean up SplitText instances if they exist (new API)
    if (this.splitTexts && this.splitTexts.length > 0) {
      for (const split of this.splitTexts) {
        if (split && split.revert) {
          split.revert(); // Revert SplitText changes (same API)
        }
      }
      this.splitTexts = null;
    }
  }

  /**
   * Destroy the animation (alias for remove for consistency)
   * @returns {void}
   */
  destroy() {
    this.remove();
  }
}
