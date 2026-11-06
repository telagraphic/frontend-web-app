---
status: accepted
---

# Every owner animates inside an animation scope, and AnimationsService is the only connection to GSAP

Animations are created three ways: by `data-animation` types on page load, by page classes using GSAP directly or through effects, and by layout components and custom elements with their own motion. Today `AnimationsService` holds the current page's animations itself and only handles one type. Nothing reliably cleans up tweens, timelines, ScrollTriggers, or SplitText when a page is left or the dev server reloads, so they can pile up. We will give every owner (page class, component, page transition strategy) one animation scope built on `gsap.matchMedia()`. It records everything GSAP creates inside it, and reverts all of it in one `destroy()`. This replaces hand-kept registries like the one in `telagraphic/scroll-trigger-architecture`. Those registries leak when an add is forgotten or a key is reused, and they don't restore inline styles.

## Decisions

- **Animation scope.** `AnimationScope` has `init()`, `add(build)`, `track(handler)`, and `destroy()`.
  - `add(build)` runs `build` right away with the reduced-motion conditions and records what it creates. If reduced motion changes, `build` is reverted and runs again.
  - `track(handler)` wraps a function that runs later, such as an event handler, so what it creates is recorded too.
  - `destroy()` kills everything, restores inline styles, and runs any cleanup functions `build` returned.
- **Scope rules.**
  - `build` is synchronous, because GSAP only records objects created while it runs.
  - Anything started later goes through `track()`.
  - Motion that repeats often, such as hover effects, is built once in `add()` and replayed, so a scope doesn't keep collecting finished tweens.
  - In development, `AnimationsService` warns when ScrollTriggers outlive their owner. Tests assert the same thing (ADR 0008).
- **Who owns a scope.** `BasePage` and `Component` each create one as `this.animations` during their `init` stage, and revert it after their destroy hook. Page transition strategies own one for as long as they exist.
- **Effects** are `create*` functions that build GSAP objects inside the caller's scope and return the timeline. They have no registry of their own, and each file starts with a storyboard comment.
- **Animation index.** Each project lists its `data-animation` types in `app/config/animations.js` (ADR 0015). An unknown type is logged and skipped, so the element just shows.
- **AnimationsService** is the site's only connection to the animation library:
  - `init()` registers the plugins and connects smooth scroll to ScrollTrigger and `gsap.ticker`. `destroy()` reverts every live scope and disconnects them.
  - `createScope(root)` builds a scope for an owner.
  - `addTypes(scope, root)` runs the `data-animation` types from the animation index.
  - `refresh()` is called after a page's init stage, after fonts load, and on `pageshow`. After a page swap, `smoothScroll.refresh()` runs in the same place, because the document height changed even though the viewport did not.
- **Smooth scroll never imports GSAP.** It runs its own animation loop until `AnimationsService` hands it `gsap.ticker`, so a site can use Lenis without GSAP. Its window `resize` listener refreshes only when **width** changes. Height-only resizes are the iOS URL bar and would jump the scroll position.
- **Where GSAP lives.** GSAP, its plugins, and Lenis are bundled from npm. Everything that imports GSAP lives under `app/animations/gsap/`, and other files import GSAP only through its plugin gate.
- **One library for now.** GSAP is the only supported library (ADR 0002). Owners get scopes from `animationsService.createScope()`, so another library would be a new folder implementing the same scope interface, plus one import in the composition root. Custom elements, which the browser builds, import the scope class directly.

## Considered Options

- **A hand-kept registry per module**, as in `scroll-trigger-architecture`. It does the same job, but every tween has to be added by key, nested effects have to be destroyed by hand, and killing leaves inline styles behind.
- **One wrapper API covering both GSAP and Motion.** It would hide each library's features behind the smallest set they share, for a switch that may never happen.
- **A shared IntersectionObserver for `data-animation`.** ScrollTrigger does the same job, and it's tracked by the scope.

## Consequences

- The hot-reload `dispose` handler destroys layout components and services in reverse order, so restarting the dev server never leaves a second set of tweens or ScrollTriggers.
- `Titles.js` becomes the `titleReveal` effect. `FadeInAndOut` moves to `app/transitions/`, `PreloaderAnimation` moves next to the preloader, and `BackgroundColors` leaves the router part. Theme is `data-background` and `data-color` on `<main>` (ADR 0021); CSS owns the colors. None of those files ship in the starter.
- Elements marked `data-animation` are hidden by CSS only under a class that the `<head>` script adds before first paint. Boot removes that class if it fails, so content stays readable.
