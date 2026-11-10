# Frontend web app

Starter for a content-driven site on Bun. Static HTML documents, page classes, GSAP, and Lenis.

Create a site from the published package:

```
bunx frontend-web-app@latest ../my-site
```

Name `@latest` or a version. A cached `bunx` can still run the previous release.

From a checkout of this repo:

```
bun install
bun run create ../my-site
```

The wizard writes the chosen page transition, navigation, and renderer, then stops. In the new folder, run `bun install` and `bun run dev`.

`bun run docs:dev` serves the reference.
