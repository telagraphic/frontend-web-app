---
status: accepted
---

# The router runs the page lifecycle, and page classes only implement hooks

Page classes currently run the overlay, scrolling, and smooth scroll from inside `show()` and `hide()`, and each subclass overrides the stage methods itself. Every page class calls `super.create()` without `await`, so `show()` starts before `create()` finishes. The view transition option has no overlay at all. We will have the router run the order of every navigation and call the page transition strategy and the page hooks itself. Page classes then handle only their own content, so one lifecycle works for page swap, document load, overlay transitions, and view transitions.

## Decisions

- Each page class has four stages the router calls: `init`, `show`, `hide`, and `destroy`. Subclasses do not override those. They implement optional `onInit`, `onShow`, `onHide`, and `onDestroy` hooks. The `on` prefix marks an event-type hook, not a stage the router calls. There are no before and after pairs. The verbs follow `documentation/reference/METHOD_VERBS.md`, where `create` is reserved for functions that build and return an object.
  - **init / onInit:** the new page's content is in the document but not yet revealed.
  - **show / onShow:** the page has been revealed, so entrance animations run.
  - **hide / onHide:** a link was clicked. Leave animations run while the cover plays and the next page is fetched.
  - **destroy / onDestroy:** the next page has arrived, so this page cleans up.
- Each page transition strategy implements `run({ leave, load, swap })`. The overlay strategy starts the cover animation, the leave animation, and the fetch together, then swaps the content and plays the reveal. The view transition strategy calls `document.startViewTransition(swap)`.
- Page classes never import `TransitionsService`. Every hook receives a navigation context: the family (page swap or document load), the route it came from, the route it's going to, whether a click or back/forward started it, and an abort signal. Page classes use it only to vary their own animations. `navigationstart` and `navigationend` carry the same context so layout listeners can skip document load (focus runs only on page swap).
- Each page has an abort signal that fires when the destroy stage begins. Listeners and fetches pass it, so cleanup doesn't depend on remembering to remove them.
- Page classes register their components with `this.use(component)`, and `BasePage` destroys them. `Component` gets a `destroy()` method and ties its listeners to a signal.
- Under document load, the browser discards the document, so destroy never runs. A page restored from the back/forward cache runs `show` only.
- If `init` or `hide` throws, the router falls back to a document load of the target URL (ADR 0001). If `show` throws, the page is already on screen, so the error is logged and the navigation finishes.

## Considered Options

- **Pass `TransitionsService` into `show()` and `hide()`.** Each page class would have to know which page transition the site uses, and the order of one navigation would be split between two page classes.
- **Keep the eight before and after hooks.** They wrapped the overlay animation, which no longer runs inside the page class, so each pair would have nothing in between.

## Consequences

- Page classes that override `create()`, which is all four today, move that code into hooks or components. Home's follower code becomes a component.
- `show()` no longer always scrolls to the top, so the router can restore the scroll position on back and forward (ADR 0001, action 10).
- On the first visit, boot calls `show` only after the preloader has hidden (ADR 0014). `onShow` and `data-animation` entrance motion start then, not while the preloader is covering the page.
- `documentation/reference/PAGE_LIFECYCLE.md` describes the old hooks and needs rewriting.
