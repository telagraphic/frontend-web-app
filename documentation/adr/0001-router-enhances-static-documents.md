---
status: accepted
---

# The router enhances static documents and commits only after the next page loads

Every route is already a complete HTML document, so a direct visit or a reload is an ordinary page load. The client router only intercepts `a.internal-link` clicks and back/forward navigation, and swaps `<main>` in place. We keep that model and do not add a second MPA router or adopt Barba. We change the order of a navigation: the current page's leave animation and the fetch of the next document start together on the click, the current page is destroyed only after the next document has loaded, and any navigation that cannot finish falls back to a full document load of the same URL.

## Considered Options

| Option | For | Against |
| --- | --- | --- |
| **Keep the enhancer and harden it** (chosen) | Uses documents the build already produces. A failure can reload the real URL. `Page` lifecycle hooks and `TransitionsService` stay as they are. | The page swap has to reproduce what a document load sets, such as the title and meta description. |
| Separate MPA router class | Picks a navigation model per site. | Duplicates what the browser already does on a document load. Two code paths to keep consistent, and no failure mode it fixes. |
| Barba.js | Container swap, prefetch, and transition hooks are maintained upstream. | Replaces `Router` and `TransitionsService` together. Its hooks duplicate `Page.hide` and `Page.show`. It adds a dependency without fixing the commit order. |
| A framework router (React Router, Vue Router, SvelteKit) | Mature loading, cancellation, and scroll handling. | Requires their component model. Nested routes and data loaders do not fit a flat route table with one class per page. |

We also considered a sync mode like Barba's, where the outgoing and incoming pages share the DOM while both animate. We do not add it. Pages, their element queries, `AnimationsService`, `RegistryService`, and scroll handling all assume one page in the DOM, and the full-screen overlay gains nothing from an overlap. Shared-element transitions use same-document View Transitions (`document.startViewTransition`) around the commit step instead, as another `TransitionsService` strategy. The browser snapshots the old page, so only one page is ever live.

What we take from the framework routers is limited to five things: one parsed URL per navigation, a single navigate entry point, load before destroy, the newest navigation cancels older ones, and a full document load as the fallback.

## Current problems this fixes

- **A failed fetch leaves a destroyed page on screen.** `Router.startPageUpdate` runs `currentPage.hide()` before `RouterPageManager.updatePage()`. `updatePage` catches its own error, calls `redirectToHome()`, and does not rethrow. `redirectToHome()` only calls `history.replaceState` to `/`. The URL changes and the old page is already gone.
- **Back/forward can overlap a click.** `updatePage` checks `isNavigating`, and drops a click that arrives during a navigation after `preventDefault()` has already cancelled it. `handleHistoryNavigation` does not check the flag at all, and repeats the same lock, overlay, try, and finally block.
- **The same-page check is a substring match.** On `/section-10`, `currentPath.includes("/section-1")` is true, so the link to Section 1 is cancelled and nothing happens. External links are detected with `href.includes("http")`.
- **Unknown paths are accepted.** `validateRoute` returns `valid` for a path that is not in the route table.
- **One page has four identifiers.** The table key is `introduction`, the public path is `/introduction`, the fetch URL is `/pages/introduction.html`, and history stores `""` for home and the key otherwise. `Router` maps `""` back to `"home"`. `RouteValidationResult.valid()` ignores its second argument, so `valid("home", "home")` stores no URL. `samePage()` and `redirectHome()` are never returned.
- **A page swap keeps the previous title and description.** `siteRoutes` has `title` and `metaDescription` for every route. A document load renders them. The swap only updates `data-template`, `data-page`, and the background color.
- **History, resolver, and page manager call one another in a cycle.** `RouterHistory` asks `RouterResolver` whether a route exists. `RouterResolver` writes history. `RouterPageManager` redirects through the resolver. `ServicesFactory` connects them with setters, and popstate reaches the router through a custom `history-navigation` event that exists only to cross that cycle.
- **`Router` loses one of its dependencies.** `ServicesFactory` passes `transitionsService`, and the `Router` constructor reads `transitionsManager`, so the value is `undefined`.

## Actions

The first three items carry the robustness change. Items 4 to 7 remove the cycle and the duplication. Items 8 and 9 align the page swap with a document load. Item 10 restores reading position on back and forward. Item 11 covers reduced motion.

1. **Route on parsed URLs.** Parse every href with `new URL(href, location.href)`. A link is the router's only when it is same-origin and its pathname matches a row in the route table. Same-page means the pathnames are equal. One function maps a pathname to its route record. Home is `/` in the table, the address bar, and `history.state`.
2. **Add a single `navigate(url, { history })`.** `history` is `"push"`, `"replace"`, or `"traverse"`. The click handler and popstate both call it. It replaces the duplicated bodies of `updatePage` and `handleHistoryNavigation`.
3. **Destroy the current page only after the next page has loaded.** On the click, `navigate` starts two things together: fetching and parsing the next document, and the current page's leave up to the covering overlay. It waits for both. If the fetch or parse fails, the overlay already covers the screen, and the router calls `location.assign(url)`. After both succeed: destroy the current page, swap `<main>`, update history, construct the page class, and show it. An error after the swap also ends in `location.assign(url)`.
4. **The newest navigation wins.** The router owns one `AbortController`. While the overlay is up it blocks clicks, so a newer navigation comes from back or forward. That navigation aborts the running fetch, keeps the overlay up, and goes to the history entry's page instead of being ignored. Prefetch keeps its own controller so a hover cannot cancel a navigation.
5. **Intercept only what the router can finish.** Do not handle a click with Shift, Alt, Cmd, or Ctrl held, a non-primary button, `target` other than `_self`, `download`, a `#hash` in the href, or a pathname outside the route table. The browser performs those navigations. Drop `stopImmediatePropagation()`; `preventDefault()` is enough for links the router keeps.
6. **Give history one job.** `RouterHistory` reads and writes `history.state` (`{ path, scroll }`) and reports popstate to `navigate` directly. It stops calling `RouterResolver`. `RouterResolver` stops writing history. `RouterPageManager` stops redirecting and returns or throws. The `history-navigation` event and the setters in `ServicesFactory` are removed.
7. **Trim the navigation result.** `RouteValidationResult` has four outcomes: `commit`, `same-document`, `external`, `not-found`. Remove `samePage()`, `redirectHome()`, and the ignored second argument to `valid()`.
8. **Match a full page load during the swap.** Copy `<title>`, the meta description, and the canonical link from the fetched document, alongside the `data-*` attributes of `<main>` (ADR 0021). Move focus to `<main>` after the next page shows. Navigation listens for `navigationend` and sets `aria-current="page"` on the link whose href matches the new route, and removes it from the others. Match by href, not by index.
9. **Pass the transitions dependency under the name `Router` reads.** Either rename the constructor field to `transitionsService` or pass `transitionsManager` from `ServicesFactory`.
10. **Restore scroll position on back and forward.** Boot sets `history.scrollRestoration = "manual"` so the browser does not fight Lenis. Save the scroll position in each history entry's state. A back or forward navigation restores it after the page shows. A link click still opens the next page at the top.
11. **Respect reduced motion.** When `prefers-reduced-motion: reduce` matches, the overlay transition becomes a short opacity fade with no movement. The overlay still covers the swap. View transitions follow the same rule in CSS.

## Consequences

- A navigation that fails is a normal page load of the requested URL, not a broken screen at `/`.
- The overlay starts on the click, so a slow network shows as a longer cover rather than a click that seems to do nothing. A slow fetch holds the covering overlay until the next document arrives.
- Hash links are not handled by the router. Lenis scrolls to them with `anchors: true` (ADR 0016).
- Every page must keep working as a standalone HTML document, because that document is the fallback. A route that only works after a page swap is a bug.
- The route table is the boundary of the client router. A page that is not in `siteRoutes` is reached by a document load.
- A shared-element transition animates snapshots, not live elements. The outgoing page is animated with CSS on `::view-transition-old` and cannot run GSAP during the transition.
