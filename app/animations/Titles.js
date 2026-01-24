
/**
 * Title animations that reference the title data field in the html
 * Fade in the title text when the element is in viewport
 * 
 * Note: IntersectionObserver is managed by AnimationsManager
 * This class only handles the animation logic
 */
export class Titles {
  constructor(element) {
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('Titles#constructor: Invalid element provided');
      this.element = null;
      this.animationTimelines = [];
      return;
    }

    this.element = element;
    this.animationTimelines = [];
    // Note: No observer creation - handled by AnimationsManager
  }

  /**
   * Animate the title in
   * Called by AnimationsManager's shared IntersectionObserver
   */
  animateIn() {
    if (!this.element) return;

    const showTimeline = gsap.timeline();

    showTimeline.fromTo(
      this.element,
      {
        autoAlpha: 0,
      },
      {
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
      }
    );

    this.animationTimelines.push(showTimeline);
    return showTimeline;
  }

  /**
   * Animate the title out
   * Called by AnimationsManager's shared IntersectionObserver
   */
  animateOut() {
    if (!this.element) return;

    const hideTimeline = gsap.timeline();

    // It's fastest to just hide the element, then replay the animateIn animation
    hideTimeline.set(this.element, {
      autoAlpha: 0,
    });

    this.animationTimelines.push(hideTimeline);
    return hideTimeline;
  }

  /**
   * Kill all animation timelines
   * Called by AnimationsManager on page destroy
   */
  kill() {
    if (this.animationTimelines && this.animationTimelines.length > 0) {
      this.animationTimelines.forEach((timeline) => {
        try {
          timeline.kill();
        } catch (error) {
          console.error('Titles#kill: Error killing timeline:', error);
        }
      });
      this.animationTimelines = [];
    }
  }
}
