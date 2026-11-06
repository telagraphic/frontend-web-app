---
status: accepted
---

# The lists a project edits live in app/config

A project changes a few lists to say what the site runs: which routes exist, which page classes load, which entrance effects exist, and how smooth scroll feels. Those lists were headed for a different folder each, beside the module they feed. One folder already holds the route table. The other lists go there too, under the name `app/config`. A second folder called settings or configuration would be the same place with a name the glossary already retired.

## Decisions

- `app/config` holds the lists a project edits. A file there is plain data, or a list of literal `import()` calls. It contains no classes.
- The lists are:
  - `siteRoutes.js`, the route table. Already here.
  - `pages.js`, the page index. One literal `import()` per page class. This replaces the planned `app/pages/index.js` (ADR 0004).
  - `animations.js`, the animation index. One literal import per effect. This replaces the planned `app/animations/index.js` (ADR 0009).
  - `scrollPresets.js`, the smooth-scroll feels. `default` is `lerp: 0.1`. `heavy` is `lerp: 0.05`. `expo` is a 1.2 second ease-out and has no lerp. The factory passes one name. A preset has no mobile and desktop pair.
  - `transitions.js`, the GSAP transition effect map. One literal `import()` per plug-in class, used when a route names an effect other than the factory default (ADR 0024). Omit the file when the site has one effect.
- `SiteConfig.js` is a class and leaves `app/config`. `Environment.js` moves to `app/utilities/environment.js` and exports `isProduction` only (ADR 0019). The canonical origin moves to `app/config/site.js`.
- Selectors stay in `app/utilities/Constants.js`.
- GSAP easing registration stays under `app/animations/gsap/`, because that file imports GSAP (ADR 0009).
- Wizard choices stay as imports in the factory. The factory does not read a settings file at runtime (ADR 0006).
- The layout list stays inside `createLayout()`. It constructs components (ADR 0007).

## Considered Options

- **A folder named `settings` or `configuration`.** Same job as `app/config`. "Settings" is already an avoided name for the route table.
- **Each index beside its module.** Easy to find from the code, scattered for the person editing the project. The index imports the module either way, and Bun still follows a literal `import()` from `app/config`.
- **A mobile key and a desktop key on each scroll preset.** The width was read once, at startup, and a duration set beside a lerp never runs.
