---
name: front-end-add-custom-element
description: >-
  Adds a custom element that imports an animation scope because the
  browser constructs it. Use when the user asks to add a web component
  or custom element with motion. Do not use for layout Component
  subclasses or page classes.
---

# Add a custom element

The starter ships class components. A region inside the page is a page component: the view has the HTML, and the page class loads the class ([PAGE_COMPONENTS.md](../../../documentation/reference/PAGE_COMPONENTS.md)). Custom elements are a seam (ADR 0009): the browser constructs them, so they import the scope class directly instead of receiving `animationsService` from the factory. The page class still imports the module, so `customElements.define` runs. A `<script>` inside `<main>` does not.

Write the full steps when the first custom element lands. Until then, if the user wants one, follow [LAYOUT_COMPONENTS.md](../../../documentation/reference/LAYOUT_COMPONENTS.md) and ADR 0009, and expand this file in the same change.

## Do

- Define the element, import the animation scope from `app/animations/gsap/`, revert the scope when the element disconnects.
- Keep GSAP imports on the plugin gate.
- Add the files this change actually creates to this skill so the next one can copy them.

## Do not

- Put it in `createServices()`.
- Use [adapt-layout-component](../front-end-adapt-layout-component/SKILL.md) for a custom element the browser owns.
