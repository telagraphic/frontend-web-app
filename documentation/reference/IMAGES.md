# Images

How a page marks images, and the one function that waits for the above-the-fold set. Decisions: [ADR 0018](../adr/0018-above-the-fold-images-are-waited-on.md). The preloader's clock and counter: [ADR 0014](../adr/0014-preloader-runs-once-per-session.md).

Below-the-fold images never go through that wait. The browser loads those. `LazyImageLoader` is removed. New markup uses the strategies below.

## How `loadImages` waits

`loadImages` lives in `app/utilities/images.js`. It is a function, not a boot service. The preloader, the page-swap router, and a GSAP plug-in each call it with the elements they need to have finished before the cover lifts.

Each element settles on its own. If `complete` is already true, the response is in and the function moves on to decode. Otherwise it listens once for `load` or `error`. An error settles the same way a load does, so a missing file does not hold the cover. After a load, `decode()` runs when the element has that method, and a decode failure also settles. Decoding finishes the bitmap before the cover lifts, so the first painted frame is whole.

The elements are waited on together. `maxWait` defaults to 4000 milliseconds and races that wait. When the timer wins, `loadImages` resolves and the caller continues. Images still in flight finish on their own. `{ maxWait: null }` waits with no timer. The preloader uses that per image so a counter can advance, then races fonts and images against its own `maxWait`. The router calls `loadImages` on `[data-preload]` inside the new `<main>` with the default timer. A plug-in calls it on the overlay image it just injected. An empty list resolves immediately.

```js
// app/utilities/images.js
function loadOne(element) {
  return new Promise((resolve) => {
    const finish = () => {
      if (typeof element.decode === "function") {
        element.decode().then(resolve, resolve);
        return;
      }
      resolve();
    };

    if (element.complete) {
      finish();
      return;
    }

    element.addEventListener("load", finish, { once: true });
    element.addEventListener("error", () => resolve(), { once: true });
  });
}

export function loadImages(elements, { maxWait = 4000 } = {}) {
  const images = [...(elements ?? [])].filter(Boolean);
  if (images.length === 0) return Promise.resolve();

  const settle = Promise.all(images.map(loadOne));
  if (maxWait == null) return settle;

  return Promise.race([
    settle,
    new Promise((resolve) => setTimeout(resolve, maxWait)),
  ]);
}
```

## `ImageService`

`ImageService` in `app/utilities/ImageService.js` is the previous loader. A note at the top of that file points here. It stays in the tree until a site has no `data-src` left.

It took an element whose URL lived in `data-src`, loaded and decoded that URL on an image that was not in the document, then assigned `src` so the visible element painted from the HTTP cache. It counted progress for a preloader and remembered in-flight URLs on that instance. Each caller constructed its own instance, so those memories never met. The browser's HTTP cache is the shared cache. Boot does not construct `ImageService`. The waits above are `loadImages`.

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

**Transition image.** The URL lives on the destination route's `pageTransition.image` (ADR 0024). The plug-in injects the element in `prepare()`, then calls `loadImages` on it before cover. That call is the same helper as the preloader and the router: wait until this one image settles or `maxWait` elapses, then start the cover. The image is not marked `data-preload`, because that attribute belongs to the page, not the cover. Do not idle-preload every route's overlay image.

```js
await loadImages([image]);
```

**No picture yet.** Leave the `src` off and skip `data-preload`. An empty preload image would count as a failure and still settle, but it should not be in the markup.
