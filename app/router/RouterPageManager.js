import { nextPaint } from "../utilities/AsyncHelpers.js";
import { $ } from "../utilities/DOMHelpers.js";
import { ImageService } from "../utilities/ImageService.js";
import BackgroundColors from "../animations/BackgroundColors.js";
import { SELECTORS, ATTRIBUTES, EVENTS } from "../utilities/Constants.js";
import { createError, ERROR_CODES, isErrorCode } from "../utilities/ErrorRegistry.js";

export class RouterPageManager {
  constructor({ siteConfig, routerResolver }) {
    this.siteConfig = siteConfig;
    this.pageTemplate = null;
    this.pageBackgroundColor = null;
    this.pageColor = null;
    this.routerResolver = routerResolver; // Can be undefined initially, set via setRouterResolver()
    this.imageService = new ImageService();
    this.fetchController = null; // AbortController for canceling in-flight fetch requests
  }

  /**
   * Set the router resolver (injected after construction to resolve circular dependency)
   * @param {RouterResolver} routerResolver - The router resolver instance
   */
  setRouterResolver(routerResolver) {
    this.routerResolver = routerResolver;
  }

  /**
   * Update the page content
   * @param {string} href - The href of the page to update
   * @returns {Promise}
   */
  async updatePage(href) {
    try {
      const html = await this.requestPage(href);
      if (!html) {
        throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, { element: 'HTML content' });
      }

      const pageContainer = await this.updateDOM(html);
      if (!pageContainer) {
        throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, { element: 'page container' });
      }

      this.updateFields(pageContainer);

      await this.waitForPageReady();
    } catch (error) {
      if (isErrorCode(error, ERROR_CODES.NETWORK_ERROR)) {
        console.error('Network error:', error.message);
      } else if (isErrorCode(error, ERROR_CODES.ELEMENT_NOT_FOUND)) {
        console.error('Element missing:', error.message);
      } else {
        console.error(`Error updating page:`, error);
      }
      this.routerResolver.redirectToHome();
    }
  }
  /**
   * Request the page from the server
   * @param {string} href - The href/route name of the page to request
   * @param {Object} options - Request options
   * @param {AbortSignal} options.signal - Optional AbortSignal to cancel the request
   * @returns {Promise<string|null>} The HTML content of the page, or null if aborted/error
   */
  async requestPage(href, { signal } = {}) {
    if (!href) return null;

    // Abort any existing fetch request
    if (this.fetchController) {
      this.fetchController.abort();
    }

    // Create new AbortController if signal not provided
    if (!signal) {
      this.fetchController = new AbortController();
      signal = this.fetchController.signal;
    }

    // Check if href is a route name in SiteConfig, if so get the URL
    let url = href;
    const routeConfig = this.siteConfig.get(href);
    if (routeConfig && routeConfig.link) {
      url = routeConfig.link;
    }

    try {
      const res = await fetch(url, { signal });

      // Check if aborted after fetch
      if (signal.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      if (!res.ok) {
        throw createError(ERROR_CODES.NETWORK_ERROR, { message: `Failed to fetch page: ${url}` });
      }

      const html = await res.text();

      // Check if aborted after reading response
      if (signal.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      return html;
    } catch (error) {
      // Silently handle AbortError (expected when navigation is cancelled)
      if (error.name === 'AbortError') {
        return null;
      }
      console.error(`Error requesting page:`, error);
      return null;
    }
  }

  /**
   * Update the DOM with new HTML content
   * Separates parsing, validation, extraction, and DOM updates
   * @param {string} html - The HTML content of the page
   * @returns {HTMLElement} The updated page container
   * @throws {Error} If any step fails
   */
  async updateDOM(html) {
    // Step 1: Parse HTML
    const parsedDOM = this.parseHTML(html);

    // Step 2: Validate parsed DOM
    const { main, content } = this.validateParsedDOM(parsedDOM);

    // Step 3: Extract metadata
    const metadata = this.extractPageMetadata(main);
    this.pageTemplate = metadata.template;
    this.backgroundColor = metadata.backgroundColor;
    this.color = metadata.color;

    // Step 4: Get current page container
    this.pageContainer = this.getPageContainer();

    // Step 5: Update DOM
    return this.updatePageContent(this.pageContainer, content);
  }

  /**
   * Parse HTML string into a DOM document
   * @param {string} html - The HTML content
   * @returns {Document} Parsed DOM document
   * @throws {Error} If HTML cannot be parsed
   * @private
   */
  parseHTML(html) {
    const parsedDOM = new DOMParser().parseFromString(html, "text/html");

    // CRITICAL: Remove preloader from parsed HTML to prevent it from being re-added to body
    // The preloader is in the <body> outside of <main>, so it shouldn't be in fetched pages
    const preloader = parsedDOM.querySelector(SELECTORS.PRELOADER);
    if (preloader) {
      preloader.remove();
    }

    return parsedDOM;
  }

  /**
   * Validate that required elements exist in parsed DOM
   * @param {Document} parsedDOM - The parsed DOM document
   * @returns {{main: HTMLElement, content: HTMLElement}} Validated elements
   * @throws {Error} If validation fails
   * @private
   */
  validateParsedDOM(parsedDOM) {
    const main = parsedDOM.querySelector(SELECTORS.MAIN);
    if (!main) {
      throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, { element: 'main element' });
    }

    const content = main.querySelector(SELECTORS.PAGE_CONTENT);
    if (!content) {
      throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, { element: 'section.page-content' });
    }

    return { main, content };
  }

  /**
   * Extract page metadata from the main element
   * @param {HTMLElement} mainElement - The main element from parsed DOM
   * @returns {{template: string, backgroundColor: string | null, color: string | null}} Page metadata
   * @private
   */
  extractPageMetadata(mainElement) {
    return {
      template: mainElement.getAttribute(ATTRIBUTES.DATA_TEMPLATE),
      backgroundColor:
        mainElement.getAttribute(ATTRIBUTES.DATA_BACKGROUND) ?? null,
      color: mainElement.getAttribute(ATTRIBUTES.DATA_COLOR) ?? null,
    };
  }

  /**
   * Get the current page container element
   * @returns {HTMLElement} The page container
   * @throws {Error} If container not found
   * @private
   */
  getPageContainer() {
    const container = $(SELECTORS.MAIN);
    if (!container) {
      throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, { element: 'page container' });
    }
    return container;
  }

  /**
   * Update the DOM with new page content
   * @param {HTMLElement} pageContainer - The current page container
   * @param {HTMLElement} newContent - The new page content to insert
   * @returns {HTMLElement} The updated page container
   * @private
   */
  updatePageContent(pageContainer, newContent) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(newContent);
    pageContainer.replaceChildren(fragment);
    return pageContainer;
  }

  /**
   * Update page markup fields
   * @param {HTMLElement} pageContainer - The page container DOM element
   * @returns {void}
   */
  updateFields(pageContainer) {
    // Validate if DOM elements exist
    this.validateDOM(pageContainer);

    // Set the data-page attribute on the body element
    document.body.setAttribute(ATTRIBUTES.DATA_PAGE, this.pageTemplate);

    // Update main element classes, will be undefined on an invalid route
    this.pageContainer.setAttribute(
      ATTRIBUTES.DATA_TEMPLATE,
      this.pageTemplate,
    );
    this.pageContainer.removeAttribute("class");
    this.pageContainer.classList.add(this.pageTemplate);
  }

  /**
   * Validate if DOM elements exist
   * @param {HTMLElement} pageContainer - The page container DOM element
   * @returns {void}
   */
  validateDOM(pageContainer) {
    if (!pageContainer) {
      console.error(`No page container found`);
      return;
    }

    // Attributes are now extracted in updateDOM from the parsed main element
    // We just need to apply them to the pageContainer
    if (!this.pageContainer) {
      console.error(`No page container found`);
      return;
    }

    // Guard: Ensure pageTemplate is not null before setting attributes
    if (!this.pageTemplate) {
      console.error(
        `pageTemplate is null or undefined, cannot update data-template attribute`,
      );
      return;
    }
  }

  /**
   * Wait for async operations to complete and style changes to be applied
   */
  async waitForPageReady() {
    await this.imageService.preloadImages({
      images: SELECTORS.LAZY_IMAGES,
      container: this.pageContainer,
      excludePreloader: true,
      useDecode: true,
    });
    await nextPaint(); // Waits for the images to be loaded and complete layout calculation
    window.dispatchEvent(new Event(EVENTS.RESIZE)); // Dispatch a resize event to trigger the smooth scroll to update the new page height
    BackgroundColors.change(this.backgroundColor, this.color); // Set the background and color of the page
  }
}
