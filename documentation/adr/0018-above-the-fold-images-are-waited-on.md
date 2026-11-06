---
status: accepted
---

# Above-the-fold images are waited on, and the browser lazy-loads the rest

`ImageService` and `LazyImageLoader` both exist to swap `data-src` onto `src`. Callers each construct their own `ImageService`, so the caches do not meet, and `LazyImageLoader` has no callers. The preloader already waits only for `[data-preload]`, and a failed image still counts as finished (ADR 0014). Below-the-fold images were delaying that wait because every `img[data-src]` was in it.

The browser already lazy-loads an image that has a real `src` and `loading="lazy"`. A second observer that copies `data-src` does that job again and hides the picture when JavaScript does not run.

## Decisions

- `loadImages(elements)` is the only image function. Each element settles on `load` or `error`, then `decode()` when the browser has it. A failure counts as finished. It lives in `app/utilities/images.js`. It is not a boot service, and it has no settings file.
- `LazyImageLoader` is removed. `ImageService` stays until a real site is built, then it is replaced by `loadImages`. A note at the top of `app/utilities/ImageService.js` says so. `data-src` goes away with that replacement.
- `[data-preload]` marks an above-the-fold image the cover waits for. It has a real `src` and no `loading="lazy"`. The preloader waits for those images plus `document.fonts.ready`, raced against `maxWait` (ADR 0014).
- Every other image has a real `src` and `loading="lazy"`. The browser fetches it as it nears the viewport. Nothing in our code waits for it.
- A page swap waits for `[data-preload]` inside the new `<main>` before reveal, with the same settle-on-failure rule and the same `maxWait`. A transition plug-in that shows its own image calls `loadImages` on that image.
- One image per page, the largest paint, may set `fetchpriority="high"`. Width and height are on every image so the layout does not jump when it arrives.
- Markup is the configuration. There is no image entry in `app/config`.

## Considered Options

- **Keep `data-src` and `LazyImageLoader`.** The observer repeats `loading="lazy"`, and a page with JavaScript off has no pictures.
- **Wait for every image before reveal.** One slow photo below the fold holds the cover. ADR 0014 already rejected that for the first document.
- **A shared `ImageService` cache.** The browser's HTTP cache is that cache. Three class instances were not sharing it anyway.
