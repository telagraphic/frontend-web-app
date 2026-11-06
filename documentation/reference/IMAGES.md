# Images

How a page marks images, and the one function that waits for the above-the-fold set. Decisions: [ADR 0018](../adr/0018-above-the-fold-images-are-waited-on.md). The preloader's clock and counter: [ADR 0014](../adr/0014-preloader-runs-once-per-session.md).

`loadImages(elements)` settles each element on load or error, then decodes it. A failure counts as finished. Below-the-fold images never go through it. The browser loads those.

`LazyImageLoader` is removed. `ImageService` remains until a real site replaces it with `loadImages()`. A note at the top of that file points here. New markup uses the strategies below.

## Sequence

On the first document, the head script adds `is-loading` when the preloader will play. CSS hides `[data-preload]`. The browser starts those images immediately because they have a real `src`. Images with `loading="lazy"` wait until they are near the viewport.

The preloader waits for `document.fonts.ready` and every `[data-preload]` image, and gives up at `maxWait`. Then it hides, and the page's `show` runs. Lazy images keep loading as the visitor scrolls.

On a page swap the cover is already up. The new `<main>` arrives, and the router waits for `[data-preload]` inside it, or for `maxWait`. Reveal runs after that. Lazy images in the new page are not part of the wait.

## Markup

| | Above the fold | Below the fold |
| --- | --- | --- |
| When it loads | During the cover | As it nears the viewport |
| Who waits | Preloader, or the page-swap reveal | The browser |
| Attributes | `data-preload`, real `src`, no `loading="lazy"` | real `src`, `loading="lazy"` |
| Holds the cover | Yes, until it settles or `maxWait` | No |

Every image has `width` and `height`. `decoding="async"` is fine on a lazy image. A `[data-preload]` image is decoded by `loadImages` before the cover lifts.

There is no image file in `app/config`. `maxWait` and `counter` are the preloader's constructor options (ADR 0014).

## Strategies

**Hero.** The picture that fills the first screen. One of these per page may set `fetchpriority="high"`.

```html
<img
  data-preload
  src="/images/hero.webp"
  alt="Harbor at dusk"
  width="1600"
  height="900"
  fetchpriority="high"
>
```

**Content below the fold.** A figure the visitor reaches by scrolling. Omit `data-preload`.

```html
<img
  src="/images/detail.webp"
  alt="Detail of the ledger"
  width="1200"
  height="800"
  loading="lazy"
  decoding="async"
>
```

**Menu image.** The overlay is not the first screen. Treat it as below the fold so it does not hold the preloader. The panel already has `data-lenis-prevent`.

```html
<img
  src="/images/menu.webp"
  alt=""
  width="1600"
  height="900"
  loading="lazy"
  decoding="async"
>
```

**Transition image.** The URL lives on the destination route's `pageTransition.image` (ADR 0024). The plug-in injects the element in `prepare()`, then calls `loadImages` on it before cover. It is not marked `data-preload`, because that attribute belongs to the page, not the cover. Do not idle-preload every route's overlay image.

```js
await loadImages([image]);
```

**No picture yet.** Leave the `src` off and skip `data-preload`. An empty preload image would count as a failure and still settle, but it should not be in the markup.
