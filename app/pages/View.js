import Page from "./Page.js";


/**
 * View class for rendering a view
 * @param {Object} props - The properties for the view
 * @param {string} props.id - The id of the view
 * @param {string} props.element - The element of the view
 * @param {Object} props.elements - The elements of the view
 * 
 * @description 
 * This class is a generic class for view/pages/*.html files instead of using a class for each page.
 */
export class View extends Page {
  constructor({ element, elements, ...options }) {
    super({
      element: element,
      pageTransitionOverlay: ".page-transition-overlay",
      elements: { wrapper: ".page-content", ...elements },
      // Forward services and any other options
      ...options,
    });
  }

  create() {
    super.create({});
  }
}
