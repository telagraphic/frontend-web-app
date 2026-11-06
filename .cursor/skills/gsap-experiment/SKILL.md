---
name: gsap-experiment
description: >-
  Creates or publishes a GSAP experiment: a dev-only test page in
  experiments/{name}/ with its own markup, CSS, and JS for rapid iteration.
  Use when the user wants to try, prototype, or explore an animation, or to
  publish a finished experiment into views, styles, and app code.
---

# GSAP experiment

An experiment is a sandbox page at `/experiments/{name}` that `bun run dev` serves and the build never publishes. Rendering and live reload are in [TEMPLATES.md](../../../documentation/reference/TEMPLATES.md). Motion conventions are in [ANIMATIONS.md](../../../documentation/reference/ANIMATIONS.md).

Pick the branch: **Create** for a new experiment or more iteration on one, **Publish** when the user says the exploration is done.

## Create

1. Name the folder in kebab case after the motion, such as `split-title` or `image-trail`.
2. Read the extension from `server/renderer.js`: `.njk`, `.vto`, or `.jsx`.
3. Write four files in `experiments/{name}/`:

   | File | Holds |
   | --- | --- |
   | `index.{ext}` | Markup. Extends `layouts/experiment.{ext}`, or `layouts/page.{ext}` to test inside the real page with the router, Lenis, and the menu |
    | `styles.css` | The same CSS as production. Uses tokens as `var(--…)`. [STYLES.md](../../../documentation/reference/STYLES.md) |
   | `experiment.js` | One `create{Name}(element, { reducedMotion })` function, plus a few lines at the bottom that call it on the page's element |
   | `NOTES.md` | `Goal`, `Tried`, `Kept`, and `Published to` headings |

4. Shape the motion as the effect it will become. `create{Name}` takes the element and `{ reducedMotion }`, and returns the tween or timeline. Hard-coded numbers, `GSDevTools` from `"gsap/GSDevTools"`, and `markers: true` are fine here.
5. Import GSAP from `app/animations/gsap/gsap.js`. Import extra plugins directly only while experimenting.
6. Open `http://localhost:{port}/experiments/{name}` and iterate. CSS saves swap in place. Markup and JS saves reload.
7. After each round the user likes, record the values and the reason under `Kept` in `NOTES.md`.

The experiment is ready when the page runs at its URL with no console errors and `NOTES.md` lists what was kept.

## Publish

Read [PUBLISH.md](PUBLISH.md) and follow it. Publishing is done when the live site uses the published files, the experiment's behavior matches, and `NOTES.md` lists every file under `Published to`.

Experiments stay in git as a record. Leave the folder in place after publishing.
