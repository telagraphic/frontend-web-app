---
status: accepted
---

# The menu API is shared, and each project supplies its own markup and motion

The site menu is a layout component. Projects bring their own markup, styles, and GSAP from a tutorial or a package. The behavior other code relies on does not change with that artwork: open, close, the current link, focus, and scroll. `Navigation` is that behavior. A subclass is the artwork. `createLayout()` imports the subclass.

The wizard question named navigation is still page swap or document load (ADR 0002). It does not choose a menu. A second menu subclass is what would make the wizard ask.

## Decisions

- `Navigation` is the base. Its public methods are `init`, `destroy`, `open`, and `close`. A project subclass implements `onOpen` and `onClose` for motion and does not reimplement the behavior.
- The base finds its elements by `[data-navigation]`, `[data-navigation-toggle]`, and `[data-navigation-panel]`. Class names belong to the layout.
- `open()` sets `data-navigation-status="active"`, sets `aria-expanded="true"`, moves focus to the first link, sets `inert` on `<main>`, calls `smoothScroll.stop()`, then `onOpen()`.
- `close()` sets `data-navigation-status="not-active"`, sets `aria-expanded="false"`, returns focus to the toggle, clears `inert`, then `onClose()`. It calls `smoothScroll.start()` only when this menu was what stopped scroll. `navigationstart` closes the menu and does not resume scroll. The router owns `stop()` until the next page is shown (ADR 0016).
- Escape and the toggle call `open()` or `close()`. `init()` and `navigationend` set `aria-current="page"` on the link whose href matches the current path, and clear it from the others. The built HTML includes that attribute so a document load is correct before JavaScript runs.
- The panel carries `data-lenis-prevent` (ADR 0016) and `overscroll-behavior: contain`. The toggle has an accessible name and is at least `2.75rem` in both axes (or a 44px hit area that does not overlap another control).
- GSAP in `onOpen`, `onClose`, and `onInit` runs inside the component's animation scope. Import GSAP from `app/animations/gsap/gsap.js`. Reduced motion uses duration `0`.
- The starter overlay's title fade and toggle color are that subclass and its stylesheet. They are not methods on the base.
- `createLayout()` imports one menu subclass. The starter subclass is `Menu` in `app/components/menus/Menu.js`. The base is not constructed on its own.

## Considered Options

- **One class per project, copied from a tutorial.** Each copy forgets `aria-current`, focus, or `stop()`, and the router cannot rely on `close()`.
- **A plug-in object, as with page transitions.** A menu lives for the whole document and holds listeners. A subclass fits that better than a plug-in that runs once per navigation.
- **The wizard offering menu styles now.** There is one starter menu. The import in `createLayout()` is the switch.
