---
name: adapt-layout-component
description: >-
  Adapts a tutorial or package's markup, styles, and GSAP into a layout
  component that keeps this starter's API, or creates one from scratch.
  Use when the user supplies custom menu, navigation, preloader, header,
  or other layout-component code, or asks to add a layout component.
  Do not use for page transitions or custom elements.
---

# Adapt a layout component

Read [LAYOUT_COMPONENTS.md](../../../documentation/reference/LAYOUT_COMPONENTS.md) and copy the branch that matches the component. Terms are in [GLOSSARY.md](../../../GLOSSARY.md).

## Do

1. Classify the source as a menu, a preloader, or a new layout component.
2. Take its markup, styles, and motion. Leave its router, scroll lock, image-wait loop, and page lifecycle behind.
3. Menu: subclass `Navigation`. Put motion in `onOpen`, `onClose`, and `onInit`. Map elements to `[data-navigation]`, `[data-navigation-toggle]`, and `[data-navigation-panel]`.
4. Preloader: replace `views/partials/preloader.html`, `styles/components/preloader.css`, and the hide timeline. Keep the session flag, `maxWait`, the optional counter, and `is-loading` (ADR 0014).
5. New layout component: extend `Component`, create motion inside `this.animations.add`, and add the class to `createLayout()`.
6. Import GSAP from `app/animations/gsap/gsap.js`. Use duration `0` when `reducedMotion` is set.
7. Add `@import "./components/{name}.css" layer(components);` to `styles/styles.css`. Convert tutorial CSS following [STYLES.md](../../../documentation/reference/STYLES.md): BEM with full class names, tokens, rem width queries. Page-specific layout-component styles use `body:has(main[data-route="…"])`.

The work is done when the tutorial's artwork runs through the existing API, the base methods are unchanged, and the menu toggle still meets the 44px hit area in [ACCESSIBILITY.md](../../../documentation/reference/ACCESSIBILITY.md).

## Do not

- Edit `Navigation.open`, `Navigation.close`, or the preloader's wait, session flag, or head script to match the tutorial.
- Call `smoothScroll.stop` or `smoothScroll.start` from a menu subclass.
- Set `aria-current`, `inert`, or focus from a subclass.
- Start page `show` or `data-animation` tweens from the preloader timeline.
- Import GSAP from `"gsap"`.
- Use this skill for a page transition. Use the GSAP transition skill, or [PAGE_TRANSITIONS.md](../../../documentation/reference/PAGE_TRANSITIONS.md) for a view transition.
