---
status: accepted
---

# The preloader covers the first document of a session, then gets out of the way

The preloader is a layout component. It plays once per tab. A later document load, including a reload and a navigation to another page, must not paint it for even one frame. A page swap never boots again, so it does not replay there either. An arrival through a GSAP document-load cover also skips it (ADR 0002).

The cover is in the document so the page underneath can load, and it is `display: none` unless `<html>` has `is-loading`. A blocking external script in `<head>` adds that class only when this document will play the preloader. The script is external because the site's CSP has no `'unsafe-inline'` for scripts. It reads `sessionStorage` before the body is parsed, so a skipped visit never shows the cover.

A failed image counts as settled. The wait is `document.fonts.ready` plus images marked `data-preload`, raced against `maxWait`. There is no minimum time on screen. When the race ends, the preloader hides. Reduced motion never adds `is-loading`, so the cover never paints. If boot fails, or storage throws, the preloader is removed and the page can scroll again (ADR 0004).

## Decisions

- Starter copy is the word "Preloader". A client site replaces that string. It is not the site title.
- `sessionStorage` key `preloader-played`. Read and write are inside `try/catch`. The head script writes the key when it decides to play, so a reload during the timeline also skips. If storage throws, the preloader plays this document and is not remembered.
- The head script does not add `is-loading` when `preloader-played` is set, when `prefers-reduced-motion: reduce` matches, or when the GSAP document-load cover flag is fresh. No script means the class is never added, so the page is readable.
- While `is-loading` is set, `<html>` has `overflow: hidden` and the skip link, menu, footer, transition host, and `<main>` are `inert`. The preloader is the only tab stop. All of that comes off when the preloader hides. A `pageshow` with `persisted` removes the class, the cover, and `inert` without replaying the timeline.
- `maxWait` is a constructor option. Default `4000` milliseconds. It is the only timing control. Assets that settle sooner end the wait then.
- A counter is optional. Constructor option `counter`, default `false`. The starter markup includes `<p class="preloader-counter" hidden>`. `true` removes `hidden` and updates the text. A missing element means no counter. The number is the settled share of `document.fonts.ready` and `[data-preload]` images, from `0%` to `100%`. When `maxWait` wins the race, the number goes to `100%` and the hide starts. It is not a timer.
- Page `init` may run while the preloader is up. It finds elements and creates the animation scope. It does not start entrance motion. `data-animation` types and `onShow` run only in `show`, after the preloader has hidden and been destroyed. A fixed cover does not stop ScrollTrigger from seeing the hero, so starting those tweens during `init` would play them underneath the preloader.
- If the preloader is skipped, `show` runs as soon as `init` finishes.
- CSS hides `[data-preload]` and `[data-animation]` under `is-loading`. Which images carry `data-preload` is [ADR 0018](0018-above-the-fold-images-are-waited-on.md).

## Considered Options

- **Wait for every image, and only hide when `loaded === total`.** One 404 leaves the cover up. Below-the-fold images delay the first screen.
- **`localStorage`.** The flag would outlive the cache. The next visit could skip the preloader while the hero is cold.
- **A fixed three-second timer with no asset check.** A fast connection still waits. A slow one uncovers a blank hero.
- **A minimum time on screen.** `maxWait` is a ceiling. A cached visit exits as soon as the assets settle.
- **A counter that counts on its own clock.** The number would hit `100%` before the hero is ready, or keep climbing after the assets have settled.
- **Hiding the cover from the app bundle.** That script runs after first paint. A reload would flash the cover and then remove it.
