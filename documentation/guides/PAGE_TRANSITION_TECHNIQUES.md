# Page Transition Implementation Techniques

## Overview

This document explains the techniques and optimizations used in `MPAPageTransition.js` to ensure seamless page transitions without visual flashes or broken images.

## Key Problem: Race Condition Between CSS and JavaScript

**The Challenge:**
- Page HTML loads → CSS renders → Overlay starts at `opacity: 0` (default)
- JavaScript runs → Sets overlay to `opacity: 1` 
- **Gap between CSS render and JavaScript execution** → Page content (blue background) flashes through

**The Solution:**
Set overlay to `opacity: 1` by default in CSS, eliminating the race condition entirely.

## Technique 1: CSS-First Visibility (Eliminates Race Condition)

**Location:** `styles/components/_page-transitions.scss`

```scss
.page-transition-overlay {
  opacity: 1; /* Visible by default to cover page content immediately */
  /* ... */
}
```

**Why it works:**
- Overlay is visible **immediately** when HTML loads (before JavaScript runs)
- No gap between page render and overlay visibility
- Prevents blue/white background flash completely

**Trade-off:**
- Overlay is visible by default, so we must explicitly hide it when not navigating
- This is handled in `MPAPageTransition.initialize()` when `!isPageNavigating`

## Technique 2: Crossorigin Matching for Cache Usage

**Location:** Multiple places in `MPAPageTransition.js`

```javascript
imageElement.crossOrigin = 'anonymous';
```

**Why it's critical:**
- HTML `<link rel="preload">` uses `crossorigin="anonymous"`
- If `<img>` tag doesn't match, browser treats them as different resources
- Result: Preloaded image is ignored, causing network request and flash

**Where applied:**
- `restoreTransitionData()` - When restoring image from sessionStorage
- `updateTransitionOverlay()` - When updating overlay for navigation
- `initialize()` - When setting up image element

## Technique 3: Preventing Stale sessionStorage Overwrites

**Location:** `restoreTransitionData()` method

```javascript
const htmlHasValidImage = imageElement.src && 
                          imageElement.src !== '' && 
                          imageElement.src !== fallbackImage;
const imageMatchesSessionStorage = imageElement.src === transitionData.image;

if (htmlHasValidImage && !imageMatchesSessionStorage) {
  // Don't overwrite correct HTML image with stale sessionStorage data
  this.sessionStorage.removeItem('pageTransitionImage');
  return;
}
```

**Why it's needed:**
- HTML has correct image from build-time generation
- sessionStorage might have stale image from previous navigation
- Without this check, correct image gets overwritten → flash

**Example scenario:**
1. User visits `/references` → sessionStorage stores `home-theme-desktop.webp`
2. User navigates to `/section-3` → HTML has `section-3-desktop.webp` (correct)
3. Without check: sessionStorage overwrites HTML image → wrong image flashes
4. With check: HTML image is preserved → correct image displays

## Technique 4: Image Readiness Check Before Setting src

**Location:** `restoreTransitionData()` method

```javascript
const imageAlreadyCorrect = imageMatchesSessionStorage && 
                           imageElement.complete && 
                           imageElement.naturalHeight > 0;

if (imageAlreadyCorrect) {
  // Skip unnecessary work - image is already loaded and correct
}
```

**Why it's needed:**
- Prevents redundant `src` assignment
- Setting `src` on an already-loaded image can trigger re-render
- `complete` + `naturalHeight > 0` confirms image is fully loaded and painted

## Technique 5: Force Browser Paint Before Overlay Visibility

**Location:** `initialize()` method (when navigating)

```javascript
if (!imageAfterRestore.complete || imageAfterRestore.naturalHeight === 0) {
  await this.imageService.waitForImageLoad(imageAfterRestore);
}

// Force browser to paint the image
void imageAfterRestore.offsetHeight; // Force layout calculation
await new Promise(resolve => requestAnimationFrame(resolve));
```

**Why it's needed:**
- `complete: true` means image data is loaded, but browser might not have painted it yet
- Reading `offsetHeight` forces layout calculation
- `requestAnimationFrame` ensures paint completes before next operation
- Without this: Image data loaded but not painted → overlay shows but image appears blank/flash

**Note:** With CSS `opacity: 1` by default, this is less critical but still ensures image is painted before overlay becomes visible.

## Technique 6: Fallback Image Loading When Preloader Doesn't Run

**Location:** `initialize()` method (when NOT navigating)

```javascript
if (!Preloader.shouldShow()) {
  await this.loadPageImages();
}
```

**Why it's needed:**
- Preloader only runs on first visit (`!sessionStorage.getItem('preloaderShown')`)
- On reload, preloader doesn't run → page images never get loaded
- This fallback ensures images load even when preloader skips

**Flow:**
1. Hard refresh → Preloader runs → Images loaded ✅
2. Reload → Preloader doesn't run → `loadPageImages()` runs → Images loaded ✅
3. Navigation → Preloader doesn't run → `hideTransition()` calls `loadPageImages()` → Images loaded ✅

## Technique 7: Await hideTransition to Prevent Content Flash

**Location:** `initialize()` method

```javascript
await this.hideTransition();
```

**Why it's needed:**
- `hideTransition()` is async (fades out overlay)
- Without `await`, `initialize()` returns immediately
- Page content becomes visible before overlay finishes hiding → text flash
- With `await`, overlay fully hides before page content shows

## Technique 8: Simple Fade In/Out (No scaleY)

**Location:** `showTransition()` and `hideTransition()` methods

```javascript
// Fade in
this.gsap.to(this.elements.transitionOverlay, {
  opacity: 1,
  duration: 0.6,
  ease: "power2.inOut",
});

// Fade out
this.gsap.to(this.elements.transitionOverlay, {
  opacity: 0,
  duration: 0.6,
  delay: 0.5,
  ease: "power2.inOut",
});
```

**Why removed scaleY:**
- `scaleY` creates vertical slide animation
- Not needed for fade transitions
- Simpler animation = better performance
- Overlay covers full viewport regardless of scaleY

## Summary of Techniques

| Technique | Purpose | Impact |
|----------|---------|--------|
| CSS `opacity: 1` default | Eliminate race condition | **Critical** - Prevents blue flash |
| Crossorigin matching | Use browser cache | **Critical** - Prevents image re-download |
| Prevent stale overwrites | Preserve correct HTML image | **Important** - Prevents wrong image flash |
| Image readiness check | Skip redundant work | **Optimization** - Prevents unnecessary operations |
| Force paint | Ensure image rendered | **Important** - Ensures image visible |
| Fallback image loading | Handle reload case | **Critical** - Prevents broken images |
| Await hideTransition | Prevent content flash | **Important** - Prevents text flash |
| Simple fade animation | Clean UX | **Design choice** - Simpler animation |

## Code Flow Diagram

```
Page Load
├─ CSS: Overlay visible (opacity: 1) ← Eliminates race condition
├─ JavaScript: initialize()
│  ├─ isPageNavigating?
│  │  ├─ YES: Restore image → Wait for load → Force paint → Hide overlay
│  │  └─ NO: Hide overlay → Check preloader → Load images if needed
│  └─ setupListeners() ← Ready for navigation
│
Navigation Click
├─ updateTransitionOverlay() ← Preload image
├─ showTransition() ← Fade in
├─ Navigate to new page
│
New Page Load
├─ CSS: Overlay visible (opacity: 1) ← Already covering content
├─ JavaScript: initialize()
│  ├─ isPageNavigating = true
│  ├─ restoreTransitionData() ← May update image
│  ├─ Wait for image load
│  ├─ Force paint
│  └─ hideTransition() ← Fade out (loads page images)
```

## Testing Checklist

- [ ] Hard refresh → Preloader runs → Images load → Transitions work
- [ ] Reload page → Preloader doesn't run → Images still load → No broken images
- [ ] Navigate between pages → Transition images display correctly → No flash
- [ ] Navigate to unvisited page → Correct image displays → No fallback image flash
- [ ] Navigate after visiting `/references` → Correct page image (not stale) → No wrong image flash
