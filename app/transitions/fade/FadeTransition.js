import { gsap } from "../../animations/gsap/gsap.js";
import { loadImages } from "../../utilities/images.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function overlayFields(to) {
  const value = to?.pageTransition;
  if (!value || typeof value === "string") return {};
  return value;
}

export default class FadeTransition {
  constructor({ host, animationsService }) {
    this.host = host;
    this.animationsService = animationsService;
  }

  init() {
    if (!this.host) return;
    this.animations = this.animationsService?.createScope(this.host);
  }

  destroy() {
    this.animations?.destroy();
    this.animations = null;
    if (!this.host) return;
    this.host.replaceChildren();
    this.host.hidden = true;
  }

  markup({ to }) {
    const { copy = "", image, alt = "" } = overlayFields(to);
    const imageTag = image
      ? `<img class="page-transition-overlay__image" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}">`
      : "";
    const copyTag = copy
      ? `<p class="page-transition-overlay__copy">${escapeHtml(copy)}</p>`
      : "";
    return `${imageTag}${copyTag}`;
  }

  async prepare(navigationContext) {
    if (!this.host) return;
    this.host.innerHTML = this.markup(navigationContext);
    this.host.hidden = false;
    const image = this.host.querySelector("img");
    if (image) await loadImages([image]);
  }

  cover() {
    if (!this.host || !this.animations) return Promise.resolve();
    return new Promise((resolve) => {
      this.animations.add(({ reducedMotion }) => {
        if (reducedMotion) {
          gsap.set(this.host, { autoAlpha: 1 });
          resolve();
          return;
        }
        gsap.fromTo(
          this.host,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.45,
            ease: "power2.inOut",
            onComplete: resolve,
          },
        );
      });
    });
  }

  reveal() {
    if (!this.host || !this.animations) return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => {
        this.host.hidden = true;
        this.host.replaceChildren();
        resolve();
      };
      this.animations.add(({ reducedMotion }) => {
        if (reducedMotion) {
          gsap.set(this.host, { autoAlpha: 0 });
          finish();
          return;
        }
        gsap.to(this.host, {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: finish,
        });
      });
    });
  }
}
