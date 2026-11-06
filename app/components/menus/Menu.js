import Navigation from "../Navigation.js";
import { $ } from "../../utilities/dom.js";
import { gsap } from "../../animations/gsap/gsap.js";
import { VALUES } from "../../utilities/Constants.js";

export default class Menu extends Navigation {
  onInit() {
    super.onInit();
    this.title = this.$(".navigation__title");
    this.listenTitleScroll();
    this.observeMenuButton();
    this.router?.addEventListener(
      "navigationend",
      () => this.observeMenuButton(),
      { signal: this.signal },
    );
  }

  listenTitleScroll() {
    if (!this.title) return;

    const scrollThreshold = VALUES.NAV_SCROLL_THRESHOLD;
    this.titleIsFadedOut = false;
    this.titleFadeTimeline = null;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;

      if (scrollY > scrollThreshold && !this.titleIsFadedOut) {
        this.titleIsFadedOut = true;
        this.titleFadeTimeline?.kill();
        this.titleFadeTimeline = gsap.to(this.title, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      } else if (scrollY <= scrollThreshold && this.titleIsFadedOut) {
        this.titleIsFadedOut = false;
        this.titleFadeTimeline?.kill();
        this.titleFadeTimeline = gsap.to(this.title, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }
    };

    window.addEventListener("scroll", handleScroll, {
      signal: this.signal,
      passive: true,
    });
    handleScroll();
  }

  observeMenuButton() {
    if (!this.toggle) return;
    this.menuButtonObserver?.disconnect();

    const defaultColor = "#191919";
    const intersectingColor = "#FFFFFF";
    const intersectingToggleBarColor = "#FFFFFF";

    const checkIntersection = () => {
      const menuButtonRect = this.toggle.getBoundingClientRect();
      const pageNavigation = $(".page-navigation");
      let isIntersecting = false;

      if (pageNavigation) {
        const navRect = pageNavigation.getBoundingClientRect();
        if (
          menuButtonRect.bottom >= navRect.top &&
          menuButtonRect.top <= navRect.bottom &&
          menuButtonRect.right >= navRect.left &&
          menuButtonRect.left <= navRect.right
        ) {
          isIntersecting = true;
        }
      }

      this.toggle.style.color = isIntersecting
        ? intersectingColor
        : defaultColor;

      if (isIntersecting) {
        this.toggle.style.setProperty(
          "--toggle-bar-color",
          intersectingToggleBarColor,
        );
      } else {
        this.toggle.style.removeProperty("--toggle-bar-color");
      }
    };

    this.menuButtonObserver = new IntersectionObserver(checkIntersection);
    const pageNavigation = $(".page-navigation");
    if (pageNavigation) this.menuButtonObserver.observe(pageNavigation);

    if (!this.menuButtonChromeListening) {
      this.menuButtonChromeListening = true;
      this.signal.addEventListener(
        "abort",
        () => this.menuButtonObserver?.disconnect(),
        { once: true },
      );
      window.addEventListener("scroll", checkIntersection, {
        signal: this.signal,
        passive: true,
      });
      window.addEventListener("resize", checkIntersection, {
        signal: this.signal,
        passive: true,
      });
    }
    checkIntersection();
  }

  onDestroy() {
    this.menuButtonObserver?.disconnect();
    this.menuButtonObserver = null;
    this.titleFadeTimeline?.kill();
    this.titleFadeTimeline = null;
  }
}
