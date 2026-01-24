import Component from "./Component.js";
import { returnImagesArray, normalizeToArray } from "../utilities/ArrayHelpers.js";
import { ImageService } from "../utilities/ImageService.js";
import { PreloaderAnimation } from "../animations/PreloaderAnimation.js";
import { SELECTORS, EVENTS, BACKGROUND_IMAGES } from "../utilities/Constants.js";

/**
 * Preloader element is displayed until all images are loaded and ready to be displayed
 */

export class Preloader extends Component {
  constructor() {
    super({
      element: SELECTORS.PRELOADER,
      elements: {
        title: SELECTORS.PRELOADER_TITLE,
        counter: SELECTORS.PRELOADER_COUNTER,
        copy: SELECTORS.PRELOADER_COPY,
        copyContainer: SELECTORS.PRELOADER_COPY_CONTAINER,
        image: SELECTORS.PRELOADER_IMAGE,
        images: SELECTORS.LAZY_IMAGES,
      },
    });
    this.imageLoader = new ImageService();
    this.preloaderAnimation = new PreloaderAnimation();
  }

  /**
   * Initialize Preloader component
   */
  create() {
    super.create();
    this.images = returnImagesArray(this.elements.images);
    this.images = this.images.filter(image => !image.closest(SELECTORS.PRELOADER)); // Dont use Preloader images for page Images
    this.imagesLoaded = 0;
    this.percentage = null;
    this.animationStarted = false;  // state for tracking when images are loaded and the animation can start
    this.backgroundImageUrl = BACKGROUND_IMAGES.PRELOADER_COPY;
    this.backgroundImageLoaded = false;
    this.createLoader();
  }

  /**
   * Preload the background image used in CSS
   * @returns {Promise<HTMLImageElement|null>} Resolves when background image is loaded
   */
  async preloadBackgroundImage() {
    try {
      // Create a temporary image element to use with ImageService
      const tempImg = document.createElement('img');
      tempImg.setAttribute('data-src', this.backgroundImageUrl);
      
      const result = await this.imageLoader.loadImage({
        element: tempImg,
        useDecode: true,
      });
      
      this.backgroundImageLoaded = true;
      return result;
    } catch (error) {
      console.error('Error preloading background image:', error);
      // Continue anyway to prevent hanging
      this.backgroundImageLoaded = true;
      return null;
    }
  }

  /**
   * Wait for images to load and then update the DOM with the path
   */
  async createLoader() {

    // If no images to load, wait for background image and complete
    if (this.images.length === 0) {
      await this.startPreloaderAnimation();
      return;
    }

    // Preload page images using ImageService
    const pageImagesPromise = this.imageLoader.preloadImages({
      images: this.images,
      excludePreloader: false,
      useDecode: true,
      onProgress: (imagesLoaded, total, percentage) => {
        this.imagesLoaded = imagesLoaded;
        this.percentage = percentage;
       
        // Update the counter element if it exists
        if (this.elements.counter) {
          this.elements.counter.innerHTML = `${percentage}%`;
        }
      }
    }).catch((error) => {
      console.error('Error preloading images:', error);
      // Return empty result to prevent hanging
      return { loaded: 0, total: 0, images: [] };
    });

    // Wait for images to complete
    const pageImagesResult = await pageImagesPromise;

    // Check if all images loaded and the animation hasn't started yet
    if (pageImagesResult && pageImagesResult.loaded === pageImagesResult.total && !this.animationStarted) {
      await this.startPreloaderAnimation();
    }
  }
  

  /**
   * Play the preloader animation
   * Delegates to PreloaderAnimation class for animation logic
   */
  async startPreloaderAnimation() {
    // Guard: prevent multiple calls
    if (this.animationStarted) {
      return;
    }
    
    // Validate elements exist before starting animation
    if (!this.element) {
      console.warn('Preloader: element not found, cannot start animation');
      return;
    }
    
    if (!this.elements || !this.elements.copy) {
      console.warn('Preloader: copy elements not found, cannot start animation');
      return;
    }
    
    // Normalize elements to array (handles Array, NodeList, single element, or null/undefined)
    const copyElements = normalizeToArray(this.elements.copy);
    
    if (copyElements.length === 0) {
      console.warn('Preloader: no copy elements to animate');
      return;
    }
    
    // Set flag AFTER validation passes
    this.animationStarted = true;

    await this.preloaderAnimation.create({
      preloaderElement: this.element,
      copyElements: copyElements,
      onComplete: () => {
        this.emit(EVENTS.PRELOADER_COMPLETE, { message: "Preloader completed" });
      },
    });
  }

  /**
   * Hide the preloader element
   */
  hide() {
    this.element.style.opacity = 0;
  }

  /**
   * Remove the preloader element and clean up event listeners
   */
  destroy() {
    // Clean up animation before destroying the preloader
    if (this.preloaderAnimation) {
      this.preloaderAnimation.remove();
    }

    // Remove DOM element
    if (this.element) {
      this.element.remove();
    }
    
    // Remove all event listeners (prevents memory leaks)
    // This removes any listeners registered via this.on() or this.once()
    this.removeAllListeners(EVENTS.PRELOADER_COMPLETE);

    // Clear references
    this.element = null;
    this.elements = null;
    this.images = null;
    this.preloaderAnimation = null;
  }
}

