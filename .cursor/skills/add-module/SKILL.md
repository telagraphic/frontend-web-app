---
name: add-module
description: >-
  Creates a JS class or module from the starter boilerplate in the
  right directory. Use when the user asks to add a module, class,
  component, helper, or boilerplate file, or when the kind of object
  is not yet chosen. Do not use for CSS-only work or experiments.
---

# Add a module

Read [JS.md](../../../documentation/reference/JS.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md). This skill picks the **kind** and copies that boilerplate. It does not invent a fourth base class.

## Pick

| User wants | Kind | Directory | Then follow |
| --- | --- | --- | --- |
| A route, view, page class | Page | `app/pages/` | [add-page](../add-page/SKILL.md) |
| Menu, preloader, footer, header | Layout component | `app/components/` | [adapt-layout-component](../adapt-layout-component/SKILL.md) |
| Long-lived, no markup | Service | `app/services/` | [add-service](../add-service/SKILL.md) |
| Reusable GSAP recipe | Effect | `app/animations/gsap/effects/` | [add-effect](../add-effect/SKILL.md) |
| Overlay cover/reveal | GSAP transition | `app/transitions/{name}/` | [add-gsap-transition](../add-gsap-transition/SKILL.md) |
| Shared helper | Utility | `app/utilities/` | [JS.md](../../../documentation/reference/JS.md) named export |
| Composition root (`createServices`, `createLayout`) | Named `create*` function | `app/services/` or `app/layout/` | [JS.md](../../../documentation/reference/JS.md) |
| Custom element | Custom element | `app/components/` | [add-custom-element](../add-custom-element/SKILL.md) |
| Motion still being tried | Experiment | `experiments/{name}/` | [gsap-experiment](../gsap-experiment/SKILL.md) |

If the kind is still unclear, ask. Do not add a `Manager` or a registry.

## Boilerplate (lifecycle class)

```js
import { Component } from "./Component.js";

export default class Example extends Component {
  static elements = {
    root: "[data-example]",
  };

  onInit() {
    // addEventListener(..., { signal: this.signal })
    // this.animations.add(({ reducedMotion }) => { … })
  }
}
```

Page classes extend `BasePage` instead. Services omit `static elements` and implement `init` / `destroy` only. Effects are `create*` functions, not classes.

The work is done when the file sits in the directory above, uses the matching skill's full steps, and [write-js](../write-js/SKILL.md) would accept the syntax.

## Do not

- Put a page class in `components/` or a service in `pages/`.
- Duplicate `AbortController` or GSAP scope setup. The base owns those.
- Add a second helper that already exists in `app/utilities/`.
