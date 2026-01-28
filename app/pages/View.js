import Page from "./Page.js";


/**
 * View class for rendering a view
 * 
 * Generic class for view/pages/*.html files instead of using a class for each page.
 * Extends Page and can use all lifecycle hooks.
 * 
 * See `documentation/guides/PAGE_LIFECYCLE.md` for examples of using lifecycle hooks:
 * - Custom exit animations (beforeHide)
 * - Custom entrance animations (afterShow)
 * - Component setup and teardown (afterCreate, beforeDestroy)
 * 
 * @param {Object} props - The properties for the view
 * @param {string} props.element - The element selector for the view
 * @param {Object} props.elements - Additional element selectors
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
  
  // Lifecycle hooks can be implemented here:
  // See documentation/guides/PAGE_LIFECYCLE.md for examples
  // 
  // async beforeCreate() { }
  // async afterCreate() { }
  // async beforeShow() { }
  // async afterShow() { }
  // async beforeHide() { }  ← Use for custom exit animations (SplitText, images, etc.)
  // async afterHide() { }
  // async beforeDestroy() { }
  // async afterDestroy() { }
}
