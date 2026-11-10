# Page transitions

Two families. They do not share markup or a class hierarchy.

| | GSAP transition | View transition |
| --- | --- | --- |
| Who animates | Our GSAP plug-in | The browser, View Transitions API |
| Service | `TransitionsService` | Page swap: yes, thin. Document load: **no** |
| Router | Page swap: yes. Document load: no, `location.assign` | Page swap: yes, inside `startViewTransition`. Document load: **no**, the browser navigates |
| Markup | Empty host, plug-in injects HTML | No host. `view-transition-name` in CSS |
| Page `onHide` | Runs in parallel with the cover | Page swap: runs before the snapshot. Document load: **does not run** |

Terms: [GLOSSARY.md](../../GLOSSARY.md). Decisions: [ADR 0002](../adr/0002-setup-wizard-configures-navigation-and-page-transitions.md), [ADR 0012](../adr/0012-page-transitions-are-visual-plugins.md).

Do not call these SPA and MPA. **Page swap** replaces `<main>` in the current document. **Document load** is a new document.

## Route field

The **destination** route owns the look (ADR 0024). View-transition routes usually omit the field; names live in CSS.

```js
pageTransition: "wipe"   // effect name only; extra effects live in app/config/transitions.js

pageTransition: {        // effect plus fields markup() reads as strings
  effect: "wipe",
  copy: "Section 3",
  image: "/images/section-3.webp",
  alt: "Section 3",
}
```

The site-wide default effect is the class the factory imports. Omit `pageTransition` when that default is enough and the overlay needs no copy or image. There is no from–to matrix and no `<template>` overlay host. Custom markup is the plug-in's `markup()`, not HTML in the route table.

`prepare()` injects that markup, then `loadImages` on any image, then cover. A GSAP document load also writes `copy`, `image`, and `alt` into the sessionStorage flag so the next document's head script can paint the covering image.

## GSAP transition boilerplate

The copy-paste class, styles, factory wiring, and route field are in [GSAP_TRANSITION.md](GSAP_TRANSITION.md). An agent adding one follows `.cursor/skills/front-end-add-gsap-transition/SKILL.md`.

## GSAP transition + page swap

The router owns hide, load, and commit. The service only orders them around cover and reveal.

The layout includes one empty host. The plug-in fills it during `prepare` and clears it at the end of `reveal`.

```html
<div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
```

`markup` reads the destination route and returns the overlay HTML. `prepare` writes it into the host before the tween. `cover` and `reveal` are the tweens. The full class, including `loadImages` and the animation scope, is in [GSAP_TRANSITION.md](GSAP_TRANSITION.md).

```js
// WipeTransition.js — markup lives here, not in the layout
export default class WipeTransition {
  markup({ to }) {
    const { copy, image, alt } = to.pageTransition ?? {};
    return `<div class="wipe">${copy ?? ""}</div>`;
  }
  async prepare(navigationContext) {
    this.host.innerHTML = this.markup(navigationContext);
    this.host.hidden = false;
  }
  cover() { /* gsap, resolve when covered */ }
  reveal() { /* gsap, resolve when gone; then host.replaceChildren() */ }
}
```

`run` is the sequence the service awaits. `prepare` finishes first, so the overlay image is decoded before anything moves. Load, the current page's `hide`, and `cover` then run together. `commit` swaps `<main>` while the cover is up. `reveal` runs after the new page is in the document.

```js
// TransitionsService.run
await plugin.prepare?.(navigationContext);
await Promise.all([loadNext(), hideCurrent(), plugin.cover?.() ?? Promise.resolve()]);
await commit(html);          // destroy old page, swap <main>, init new page
await plugin.reveal?.();
```

Classes: `TransitionsService`, one plug-in class, `BasePage` hooks `onHide` / `onShow`. No `view-transition-name`.

## GSAP transition + document load

Same host and plug-in. No page-swap router. The click calls `cover()`, writes `{ path, at }` to `sessionStorage`, then `location.assign(url)`. The next document's head script sees a fresh matching flag and shows the host already covering; boot calls `reveal()` and skips the preloader. See ADR 0002.

## View transition + page swap

Spec: [same-document view transitions](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition). The callback **is** the DOM update. `TransitionsService` exists only to call it. There is no host and no GSAP cover.

The CSS gives an element a name the browser can match across the two states of the document. `chrome-nav` stays on the menu, which does not swap. A page part uses `{part}-{route key}` (`title-home`), so that name is unique in the snapshot. The same name on both pages, once in each snapshot, is how that part moves from one page into the other. The reduced-motion query turns those group animations off. The full naming table is [PAGE.md](PAGE.md).

```css
[data-navigation] {
  view-transition-name: chrome-nav;
}

main[data-route="home"] .home__title {
  view-transition-name: title-home;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) { animation: none; }
}
```

`wrapCommit` is the only method on this path. It runs `commit` inside `document.startViewTransition` and returns the `finished` promise, which settles when the browser's animation ends. When the API is missing, it runs `commit` directly and the navigation still completes.

```js
// ViewTransition.js
export default class ViewTransition {
  wrapCommit(commit) {
    if (!document.startViewTransition) return commit();
    return document.startViewTransition(() => commit()).finished;
  }
}
```

`hide` finishes before the snapshot, so the browser photographs the settled page. `wrapCommit` is the DOM update the spec requires inside the callback. The new page is already loaded, because `startViewTransition` should not wait on a fetch.

```js
// TransitionsService.run — this path
await hideCurrent();                 // leave motion, then the snapshot sees the settled page
const html = await loadNext();
await plugin.wrapCommit(() => commit(html));
```

Rules that keep this spec-shaped:

- One `view-transition-name` per element. A duplicate skips the whole transition.
- Set names in CSS. `view-transition-class` styles groups; it does not capture.
- Do not use `view-transition-name: match-element` across documents. It is same-document only. This path is same-document, so it is allowed here and forbidden on document load.
- Do not animate the outgoing page with GSAP during the snapshot. `onHide` finishes before `startViewTransition`.

## View transition + document load

Spec: [cross-document view transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using#cross-document_view_transitions). The browser performs the navigation. **Do not ship `TransitionsService` or the page-swap router.** Do not `preventDefault` on links.

`@view-transition { navigation: auto }` opts the document into that browser navigation. The named elements are the same idea as the page-swap path: `chrome-nav` on the menu, and `{part}-{route key}` on a page part. The reduced-motion query turns the group animations off.

```css
@view-transition {
  navigation: auto;
}

[data-navigation] {
  view-transition-name: chrome-nav;
}

main[data-route="home"] .home__title {
  view-transition-name: title-home;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) { animation: none; }
}
```

The listeners below are optional, and only when a shared name must be chosen at click time. `pageswap` fires on the outgoing document before its snapshot. `pagereveal` fires on the incoming document. Both can set the same `view-transition-name` on the elements that should move together. They live in the external head script. `TransitionsService` does not exist on this path.

```js
// external head script, not TransitionsService
window.addEventListener("pageswap", (event) => {
  if (!event.viewTransition) return;
  // set a name on the outgoing document before it is snapshotted
});

window.addEventListener("pagereveal", (event) => {
  if (!event.viewTransition) return;
  // set the matching name on the incoming document
});
```

What still runs: boot, page classes, `onInit` / `onShow`, `data-animation`. What does not: `onHide` on the outgoing page, overlay host, prefetch manager. Prefetch is Speculation Rules. Firefox may ignore the opt-in and do a plain load; the page must still work.

## None

Document loads. No host, no `@view-transition`, no `TransitionsService`.
