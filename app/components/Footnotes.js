import Component from "./Component.js";
import { $$ } from "../utilities/DOMHelpers.js";
import { SELECTORS } from "../utilities/Constants.js";

export class Footnotes extends Component {
  constructor({ smoothScroll }) {
    super({
      element: ".page-content aside",
      elements: {
        page: ".page-content",
        footnotes: ".page-footnotes__list .page-footnotes__footnote",
        superscripts: ".page-content a.footnote-superscript-link",
      },
    });

    this.smoothScroll = smoothScroll;
    this.isEnabled = false;
    this.onPageClick = null;
  }

  /**
   * Create the footnotes component and add event listeners
   */
  setup() {
    // Initialize parent Component (queries DOM elements)
    super.create();

    if (!this.elements?.footnotes || !this.elements?.superscripts) return;

    this.refresh();

    if (this.isEnabled && !this.onPageClick) {
      this.onPageClick = (event) => {
        const superscript = event.target.closest(SELECTORS.SUPERSCRIPT_LINK);
        if (superscript) {
          this.handleSuperscriptClick(event, superscript);
          return;
        }

        const footnote = event.target.closest(SELECTORS.FOOTNOTE_LINK);
        if (footnote) {
          this.handleFootnoteClick(event, footnote);
          return;
        }
      };

      this.addListenerAndRegister(
        this.elements.page,
        "click",
        this.onPageClick
      );
    }
  }

  /**
   * Remove the event listeners when the component is destroyed
   *  - Clean up page-specific state (NodeLists, DOM refs)
   *  - Clear element references (element set in setup(), elements from Component)
   *  - Note: smoothScroll is a shared service, don't null it here
   *  - This is a good place to add any other cleanup logic for the component
   */
  remove() {
    // Remove DOM event listeners (custom element methods)
    if (this.onPageClick && this.elements?.page) {
      this.removeListenerAndDeregister(
        this.elements.page,
        "click",
        this.onPageClick
      );
      this.onPageClick = null;
    }

    // Clear references
    this.footnotes = null;
    this.superscripts = null;
    this.element = null;
    this.elements = null;
  }

  /**
   * Refresh the footnotes and superscripts when the DOM changes per route change
   */
  refresh() {
    // Re-query from the component’s cached map (or re-query DOM if needed)
    this.footnotes = this.elements.footnotes || $$(SELECTORS.FOOTNOTES);
    this.superscripts =
      this.elements.superscripts ||
      $$(SELECTORS.SUPERSCRIPT_LINKS);

    const hasFootnotes = this.footnotes && this.footnotes.length > 0;
    const hasSuperscripts = this.superscripts && this.superscripts.length > 0;

    this.isEnabled = !!this.elements.page && hasFootnotes && hasSuperscripts;
  }

  /**
   * Setup the anchor footnotes scroll to the footnote
   */
  handleSuperscriptClick(event, superscriptLink) {
    // Prevent the browser's default anchor jump immediately
    event.preventDefault();

    const href = superscriptLink.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    const footnoteId = href.substring(1);
    // Resolve the target directly by id to avoid stale NodeLists
    const footnoteTarget = this.elements.footnotes.find(
      (footnote) => footnote.id === footnoteId
    );
    if (!footnoteTarget) return;

    if (this.smoothScroll?.isEnabled?.()) {
      this.smoothScroll.scrollTo(footnoteTarget, {
        duration: 1.2,
        offset: -100,
      });
    } else {
      footnoteTarget.scrollIntoView({ behavior: "smooth" });
    }
  }

  /**
   * Setup the return to footnote scroll
   */
  handleFootnoteClick(event, footnoteLink) {
    // Prevent default first to stop native jump
    event.preventDefault();

    const href = footnoteLink.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    const superscriptId = href.substring(1);
    // Resolve target by id
    const superscriptTarget = this.elements.superscripts.find(
      (superscript) => superscript.id === superscriptId
    );
    if (!superscriptTarget) return;

    if (this.smoothScroll?.isEnabled?.()) {
      this.smoothScroll.scrollTo(superscriptTarget, {
        duration: 1.2,
        offset: -100,
      });
    } else {
      superscriptTarget.scrollIntoView({ behavior: "smooth" });
    }
  }
}
