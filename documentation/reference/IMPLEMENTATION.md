# Implementation order

How the accepted ADRs land in the running tree. Each slice leaves a runnable site. The default combination (GSAP + page swap) is finished before the other wizard paths. The current client site is dogfood until slice 8. Watch-list APIs stay out ([CANDIDATES.md](CANDIDATES.md)).

Terms: [GLOSSARY.md](../../GLOSSARY.md). Decisions live in `documentation/adr/`.

## Slices

GitHub: parent [#5](https://github.com/telagraphic/frontend-web-app/issues/5). Children #6–#17.

| Slice | Issue | What ships | ADRs | Done when |
| --- | --- | --- | --- | --- |
| **0** | [#6](https://github.com/telagraphic/frontend-web-app/issues/6) | Delete history markdown | 0003 | `documentation/guides/`, `documentation/refactoring-reviews/`, `APPLICATION_GUIDE.md`, `ARCHITECTURE.md`, superseded CSS notes, stale reference, SEO/CSP checklists are gone |
| **1** | [#7](https://github.com/telagraphic/frontend-web-app/issues/7) | `main[data-route]`; CSS files and layers; skip link | 0021 markup, 0023 | One `main#main[data-route][tabindex="-1"]`, skip link, no Sass. Can overlap slices 2–3 |
| **2** | [#8](https://github.com/telagraphic/frontend-web-app/issues/8) | `BaseLifecycle`, `{ signal }`, `static elements`, `isProduction` | 0010, 0011, 0022, 0019 | Pages and components use `init` / `destroy`. No `create` / `setup` |
| **3** | [#9](https://github.com/telagraphic/frontend-web-app/issues/9) | Config lists, `createServices()`, `createLayout()`, page index | 0015, 0006, 0007, 0004 | Boot is factory, then layout, then the first page. Wiring test exists (ADR 0008) |
| **4** | [#10](https://github.com/telagraphic/frontend-web-app/issues/10) | Page swap of `<main>` children; lifecycle; `navigationstart` / `navigationend` | 0021 JS, 0005, 0001 | A click swaps content. Menu and preloader stay |
| **5** | [#11](https://github.com/telagraphic/frontend-web-app/issues/11) | Animation scope, Lenis `stop`, `loadImages`, preloader session, menu API | 0009, 0016, 0018, 0014, 0017 | No leftover ScrollTriggers after a swap. Preloader `inert` covers chrome |
| **6** | [#12](https://github.com/telagraphic/frontend-web-app/issues/12) | GSAP plug-in; destination `pageTransition`; empty host | 0012, 0024 | Default combination works |
| **7** | [#13](https://github.com/telagraphic/frontend-web-app/issues/13) | Playwright on that combination | 0008 | Overlay, back/forward, `pageshow` |
| **8** | [#14](https://github.com/telagraphic/frontend-web-app/issues/14) | Hono renderer; Home and not-found views | 0020, 0025, starter composition | `bun run dev` / `build`. Shea pages gone. Home is `views/pages/home.{ext}`. Unknown paths are HTTP 404 |
| **9** | [#15](https://github.com/telagraphic/frontend-web-app/issues/15) | Document-load navigation; both view-transition paths; None | 0002 | Five combinations run via create flags |
| **10** | [#16](https://github.com/telagraphic/frontend-web-app/issues/16) | `bun run create` + CI matrix | 0002 | Seven created-site jobs ([WIZARD.md](WIZARD.md)) |
| **11** | [#17](https://github.com/telagraphic/frontend-web-app/issues/17) | Documentation site from the markdown | 0003, 0027 | Site matches the code |

Skills whose bodies wait on code (`front-end-add-service`, `front-end-add-effect`, `front-end-write-test`, `front-end-add-view-transition`) are filled in the slice that builds that feature.

## Not in this sequence

Integrations, custom elements, Navigation API, prerender, and the rest of [CANDIDATES.md](CANDIDATES.md). Each of those needs its own ADR when it starts.
