---
name: add-effect
description: >-
  Adds a GSAP create* effect and, when needed, a data-animation type in
  the animation index. Use when the user asks to add an effect, a
  title reveal, a reusable motion recipe, or a data-animation type.
  Do not use for page transitions or experiments that are not ready
  to publish.
---

# Add an effect

Read [ANIMATIONS.md](../../../documentation/reference/ANIMATIONS.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md). Decisions: ADR 0009, ADR 0015.

Prefer publishing from [gsap-experiment](../gsap-experiment/SKILL.md) when the motion is still being tried.

## Do

1. Add `app/animations/gsap/effects/{name}.js` exporting `create{Name}(element, { reducedMotion })`. It builds GSAP objects in the caller's scope and returns the timeline. Duration is `0` when `reducedMotion` is set.
2. Import GSAP only from `app/animations/gsap/gsap.js`.
3. Start the file with a short storyboard comment.
4. If markup should opt in, add a type to `app/config/animations.js` (`title` → this `import()`). Unknown types log and skip.
5. Page or component code calls the effect inside `this.animations.add`.
6. Follow [write-test](../write-test/SKILL.md). The check is that `destroy` reverts the scope. Do not assert tween values.

The work is done when one owner can apply the effect and `destroy` reverts it.

## Do not

- Give the effect its own registry or `init` / `destroy`.
- Put sequenced motion in CSS that GSAP already tweens ([write-css](../write-css/SKILL.md)).
- Add a page-transition plug-in. Use [add-gsap-transition](../add-gsap-transition/SKILL.md).
