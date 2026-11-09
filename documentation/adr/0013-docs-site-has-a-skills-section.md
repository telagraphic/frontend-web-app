---
status: accepted
---

# The documentation site has a Skills section for adding features

Agents and people adding a feature need the same conventions: glossary terms, method verbs, where the file lives, and what not to wire. Those steps will drift if they live only in chat. The Starlight site (ADR 0003) has a Skills section. Each page is one task. It states the files to touch, the boilerplate, and the rules that keep the new code inside the existing structure.

A skill page and the `.cursor/skills/` file stay in sync. Changing the convention updates both in the same change. Skills do not bypass ADRs.

## Skills

**In the repo now**

| Skill | Task | Boilerplate |
| --- | --- | --- |
| `add-page` | Route, view, stylesheet, `BasePage` class | [PAGE.md](../reference/PAGE.md) |
| `write-css` | Component or page CSS, Can I Use gate | [STYLES.md](../reference/STYLES.md), `FEATURES.md` beside the skill |
| `add-gsap-transition` | GSAP plug-in: `prepare` / `cover` / `reveal` | [GSAP_TRANSITION.md](../reference/GSAP_TRANSITION.md) |
| `adapt-layout-component` | Fit supplied (or from-scratch) layout markup to the API | [LAYOUT_COMPONENTS.md](../reference/LAYOUT_COMPONENTS.md) |
| `gsap-experiment` | Dev-only experiment, then publish | [TEMPLATES.md](../reference/TEMPLATES.md), `PUBLISH.md` beside the skill |
| `check-performance` | Audit markup, CSS, JS, and network | [PERFORMANCE.md](../reference/PERFORMANCE.md) |
| `write-js` | ESM, class vs function, modern syntax Baseline gate | [JS.md](../reference/JS.md), `FEATURES.md` beside the skill |
| `add-module` | Pick kind, directory, and class boilerplate | [JS.md](../reference/JS.md) |
| `add-service` | New service in `createServices()`, constructor deps, `init` / `destroy` | [SERVICES.md](../reference/SERVICES.md) |
| `add-view-transition` | Names in CSS, `wrapCommit` or `@view-transition`, no host | [PAGE_TRANSITIONS.md](../reference/PAGE_TRANSITIONS.md) |
| `add-effect` | `create*` effect, `data-animation` type, animation index line | [ANIMATIONS.md](../reference/ANIMATIONS.md) |
| `write-test` | Pick unit, wiring, or browser for the thing just added | [TESTS.md](../reference/TESTS.md) |

**Named, written at first use**

| Skill | Task |
| --- | --- |
| `add-custom-element` | A browser-constructed element that imports an animation scope (ADR 0009) |
| `add-integration` | First outside product: database, accounts, or payments |

No skill for renderer (the wizard), overlay fields (a step on `add-page`), or a second layout-component skill.

The Starlight site publishes each skill from `.cursor/skills/`. A skill whose feature is not in the code yet points at the ADR and does not invent APIs.
