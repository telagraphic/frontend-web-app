# Publish an experiment

Turn `experiments/{name}/` into files that read like the rest of the starter. Terms are in [GLOSSARY.md](../../../GLOSSARY.md). Method names follow [METHOD_VERBS.md](../../../documentation/reference/METHOD_VERBS.md).

## 1. Sort what it became

Each piece goes to one place. An experiment can produce several.

| The experiment became | Publish to |
| --- | --- |
| Motion any page could reuse | An effect: `app/animations/gsap/effects/{camelName}.js`, plus a `data-animation` type in `app/config/animations.js` |
| Motion for one page | `add()` inside that page class's `onInit` |
| Markup with behavior: state, listeners, open and close | A component: `app/components/{PascalName}.js` extending `Component` |
| Markup on several pages | A partial: `views/partials/{kebab-name}.{ext}` |
| Styles | `styles/components/{kebab-name}.css` |

Ask the user when a piece fits two rows.

## 2. Write each file

**Effect.** Copy the shape of `titleReveal.js` in ANIMATIONS.md:

- Import `gsap` from `../gsap.js`. Import named eases from `../easings.js`, and add a `CustomEase` there if the experiment drew one.
- Write the timeline comment block, with one line per beat and its time in ms.
- Handle `reducedMotion` first: set the end state and return.
- Move hard-coded values that other effects share into `presets.js`. Values only this effect uses stay as literals.

**Component.** Extend `Component`. List its elements in `static elements` and look them up only inside its root ([DOM.md](../../../documentation/reference/DOM.md)). Create motion inside `this.animations.add`. Add listeners with the component's signal (ADR 0010). Add it to `createLayout()` only if it sits outside `<main>`.

**Partial.** Port `index.{ext}` without the layout wrapper. Move computed values, such as current state or a class switch, into `server/data.js`, so the partial only outputs values.

**Styles.** Copy `styles.css` into `styles/components/{kebab-name}.css` following [STYLES.md](../../../documentation/reference/STYLES.md):

- Replace raw colors, spacing, and sizes with tokens.
- Write full BEM names: `.block`, `.block__element`, `.block--modifier`. Do not write `&__element`.
- Replace pixel width queries with rem queries such as `@media (width >= 56.25rem)`.
- Add `@import "./components/{kebab-name}.css" layer(components);` to `styles/styles.css`. Do not wrap the file in `@layer`.
- Hide pre-animation states under `html.is-animating`, not with inline styles.

## 3. Remove what only the sandbox needed

- `GSDevTools`, `markers: true`, and any `console.log`.
- Plugin imports from `"gsap/…"`. A plugin the effect needs is registered in `app/animations/gsap/gsap.js`.
- The bottom-of-file call that ran `create{Name}` on page load. The animation index, a page class, or a component calls it now.

## 4. Check it

1. Use the effect on a real page: a `data-animation` attribute, a page class `add()`, or the component's markup.
2. Run `bun run lint` and `bun run format`.
3. With `bun run dev`, open the page. Compare it with `/experiments/{name}`, then turn on reduced motion and reload.
4. Do a page swap away and back. The motion plays once, and nothing is left behind (the leak check in ANIMATIONS.md).
5. Write every published path under `Published to` in `NOTES.md`.
