import { gsap } from "../gsap.js";
import { EASES } from "../easings.js";
import { presets } from "../presets.js";

/**
 * Title reveal
 *
 *    0ms   element hidden (CSS, under html.is-loading / html.is-animating)
 *  100ms   fade and rise when the element enters the viewport
 *    end   element at rest
 */

export function createTitleReveal(element, { reducedMotion } = {}) {
  if (!element) return;

  if (reducedMotion) {
    gsap.set(element, { autoAlpha: 1, y: 0 });
    return;
  }

  return gsap.fromTo(
    element,
    { autoAlpha: 0, y: presets.titleY },
    {
      autoAlpha: 1,
      y: 0,
      duration: presets.titleDuration,
      ease: EASES.outQuad,
      scrollTrigger: { trigger: element, start: "top 85%", once: true },
    },
  );
}
