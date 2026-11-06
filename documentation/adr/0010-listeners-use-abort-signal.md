---
status: accepted
---

# Listeners use AbortSignal; EventManager is removed

`EventManager` is a Map of `{ handler, target }` around `addEventListener`, plus a second `EventTarget` for `emit` / `on`. Component already extends `EventTarget`, so those are two buses. The Map also drops `addEventListener` options, so a `{ capture: true }` listener can survive `removeAllListeners()`. Every owner already gets an abort signal on destroy (ADR 0005). We will pass `{ signal: this.signal }` to every `addEventListener`, dispatch with `dispatchEvent(new CustomEvent(...))`, and delete `app/utilities/EventManager.js`.

## Decisions

- No `EventManager`, and no `listen()` helper until a real case needs to add or remove one listener while the owner is still alive. That case uses a child `AbortController` or a stored handler and `removeEventListener`, not a new event system.
- `Component.destroy()` (and `Owner.destroy()`, if extracted) aborts the signal. Subclass `onDestroy` only tears down what a signal cannot: observers, and GSAP through the animation scope.
- SmoothScroll's resize listener uses the service's own controller the same way.

## Considered Options

- **Keep `EventManager` for mid-life removal.** `removeAllListeners("resize")` is one call, but it is the only job the Map still does, and a child `AbortController` does it without a parallel API.
- **A ten-line `listen()` that always passes `this.signal`.** It would stop a caller forgetting `{ signal }`. We will add it only if that forgetfulness shows up in review.

## Consequences

- Navigation, Preloader, and SmoothScroll stop calling `addListenerAndRegister` / `on` / `emit` / `removeAllListeners`.
- Boot listens for preloader completion with `preloader.addEventListener("preloader-complete", handler, { signal })`.
- Listeners use `{ signal }` (this ADR). The old EventManager guides are deleted.
