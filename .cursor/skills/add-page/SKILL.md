---
name: add-page
description: >-
  Adds a site page: route, view, stylesheet, and BasePage class with boilerplate.
  Use when the user asks to add a page, a new route, a view, or a page class.
  Do not use for experiments, layout components, or page transitions.
---

# Add a page

Read [PAGE.md](../../../documentation/reference/PAGE.md) and copy that boilerplate. Terms are in [GLOSSARY.md](../../../GLOSSARY.md). CSS rules: [STYLES.md](../../../documentation/reference/STYLES.md).

The starter already has Home at `/`. This skill adds another route.

## Do

1. Name the route key in kebab case (`about`, `work-item`). The class is PascalCase (`About`). The public path is `/about` unless the user gives another.
2. Read the view extension from `server/renderer.js`: `.njk`, `.vto`, or `.jsx`.
3. Add the route to `app/config/siteRoutes.js` with `path`, `title`, `description`, and `page`.
4. Add `views/pages/{route key}.{ext}` extending the page layout. Content only; the layout owns the skip link and `<main id="main" data-route tabindex="-1">`.
5. Add `styles/pages/{route key}.css` and `@import "./pages/{route key}.css" layer(pages);` in `styles/styles.css`. Follow [write-css](../write-css/SKILL.md) if the CSS uses a feature STYLES.md does not already require.
6. Add `app/pages/{PascalName}.js` as a default export extending `BasePage`, with `static elements` and empty `onInit`. List it in `app/config/pages.js` as a literal `import()`.
7. If the overlay needs copy or an image, set `pageTransition` on this destination route (ADR 0024).

The work is done when `bun run dev` serves the path, the document has one `main[data-route="{route key}"]`, and the page class runs `onInit` with no console errors.

## Do not

- Add `View.js`, `Introduction.js`, or `References.js`. Home is the only sample page class.
- Name the view `index.{ext}`. Home is `home.{ext}` at path `/`.
- Call `create`, `setup`, or `super.create()`. Stages are `init`, `show`, `hide`, `destroy`.
- Query outside `main[data-route]`. Layout components own the menu, preloader, and footer.
- Put motion in the stylesheet that GSAP should own. Declarative motion is `data-animation` plus an effect ([ANIMATIONS.md](../../../documentation/reference/ANIMATIONS.md)).
- Use this skill for an experiment. Use [gsap-experiment](../gsap-experiment/SKILL.md).
- Delete or rewrite the running client pages unless the user is implementing this composition.
