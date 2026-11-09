# Wizard setups

How to create the seven wizard sites, run them, and read the results. The option list is [WIZARD.md](WIZARD.md). The dev links are [TEMPLATES.md](TEMPLATES.md).

Status: `/admin` is on the dev server. The create script and the seven folders are the next step. This page is the procedure.

The starter is not rewritten. `bun run create` refuses a destination inside this repo. Each setup is a folder beside the starter. The `wizard-` name is the folder and, if that folder is its own git repo, its branch. The results page does not check out branches. The script `cd`s into the folder and runs the commands there.

## Names

Nunjucks is the renderer for the five navigation setups. Vento and JSX test only GSAP + page swap.

| Setup | Folder |
| --- | --- |
| GSAP + page swap | `../setups/wizard-gsap-page-swap` |
| GSAP + document load | `../setups/wizard-gsap-document-load` |
| View transition + page swap | `../setups/wizard-view-page-swap` |
| View transition + document load | `../setups/wizard-view-document-load` |
| None | `../setups/wizard-none-document-load` |
| GSAP + page swap, Vento | `../setups/wizard-gsap-page-swap-vento` |
| GSAP + page swap, JSX | `../setups/wizard-gsap-page-swap-jsx` |

Create refuses a folder that already exists.

## What each Nunjucks setup runs

From the created folder: `bun install`, then `bun run lint`, `bun run format:check`, `bun test`, `bun run build`, then `bun run test:browser`. Then `bun run dev` and click Home from `/404`, back and forward, and an unknown path.

`../setups/index.html` is the scoreboard, served at `/admin/setups/`. One row per `wizard-` folder. Each cell is pass, fail, or pending for lint, unit tests, build, and browser tests. Pending means that setup has not been run. The browser cell links to that folder's Playwright report. The five Nunjucks rows also list the browser tests that are expected to skip. The file map is `/admin/codebase`. The scoreboard is rewritten on every run, so the map stays on its own page.

Vento and JSX run lint, unit tests, and build. Their browser cell stays pending. Playwright is off for those two, matching CI.

## What each setup must show

**GSAP + page swap.** Cover, swap `<main>`, reveal. The focus test runs. The view-transition test skips.

**GSAP + document load.** The click covers, writes the session flag, and loads the next document. Reveal plays there. The cover test skips because the head script contains `gsap-cover`. The focus test skips. `documentLoad.test.js` stays.

**View transition + page swap.** `document.startViewTransition` wraps the swap. No overlay host, so the cover test skips. The focus test runs. The view-transition test counts one call.

**View transition + document load.** The browser follows the link. `@view-transition { navigation: auto }` is the feature. The cover, focus, and `startViewTransition` tests skip. The layout has no `[data-transition-host]`.

**None.** A click is a document load. Those three browser tests skip. Home, back and forward, the screenshot, reduced motion, both not-found cases, and `pageshow` still run.

On every Nunjucks setup, an unknown path returns HTTP 404 and keeps the URL. `/404` returns 200. Both use `data-route="not-found"`.

## Order

1. `/admin` on `bun run dev`. Done.
2. Add the create script with the `wizard-` names.
3. Create the five Nunjucks sites and run lint, unit tests, build, and Playwright. The scoreboard updates after each step.
4. Click through each dev server and check the skips against this page.
5. Create the Vento and JSX sites and run lint, unit tests, and build.
6. A setup is done when its row is green and its skips match this page.

Create copies the working tree. Run it from a committed starter, or the folders include local edits.
