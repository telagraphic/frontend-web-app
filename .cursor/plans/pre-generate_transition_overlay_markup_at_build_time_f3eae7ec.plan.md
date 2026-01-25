---
name: ""
overview: ""
todos: []
isProject: false
---

## Problem Analysis

**Current Issue**: Flash of new page content before transition overlay markup is updated via JavaScript, causing visual glitches.

**Root Cause**: In MPA, each page loads fresh HTML. The overlay markup is static (hardcoded in partial), then JavaScript tries to update it after page load, creating a race condition.

**Solution**: Pre-generate the correct transition overlay markup for each page during build time, so the HTML already contains the right image and alt text when the page loads.

## Benefits of Build-Time Approach

1. **No Race Conditions**: Markup is correct from the start
2. **No Flash**: Overlay has correct content immediately
3. **Simpler Runtime Code**: No DOM manipulation needed for markup
4. **Better Performance**: No JavaScript needed to update overlay content
5. **More Reliable**: Works even if JavaScript fails or is slow
6. **MPA-Optimized**: Each page is self-contained with correct markup

## Implementation Steps

### Step 1: Add Transition Data to Template Data

**File**: `scripts/generate-static-pages.js`

**Changes**:

- In the loop where `templateData` is built, add transition data from `routeConfig.transition`
- Pass `transitionImage` and `transitionAlt` to template (no copy text)
- Handle case where route doesn't have transition data (fallback to defaults)

**Code location**: Around line 210-228 where `templateData` is populated

### Step 2: Update page-transition.html Partial

**File**: `views/partials/page-transition.html`

**Changes**:

- Replace hardcoded image `src` with `{{ transitionImage }}` or fallback
- Replace hardcoded `alt` with `{{ transitionAlt }}` or fallback
- Use Nunjucks conditionals to handle missing data gracefully

**Current hardcoded values**:

- Image: `"https://shea-memorandum-site.b-cdn.net/images/home-theme-desktop.webp"`
- Alt: `"The Shea Memorandum Logo"`

### Step 3: Simplify MPAPageTransition.js

**File**: `app/animations/MPAPageTransition.js`

**Changes**:

- Remove `updateTransitionOverlay()` method (no longer needed)
- Remove `restoreTransitionData()` method (no longer needed)
- Remove `storeTransitionData()` method (no longer needed)
- Keep `normalizeHrefToRoute()` (still needed for route lookup)
- Keep animation methods (`showTransition()`, `hideTransition()`)
- Simplify `setupListeners()` - remove overlay update logic, just show transition and navigate
- Simplify `initialize()` - remove restore logic, just handle hide animation

**Result**: MPAPageTransition becomes a pure animation controller, not a markup updater.

### Step 4: Update initialize() Logic

**File**: `app/animations/MPAPageTransition.js`

**Changes**:

- When `isPageNavigating` is true, the overlay already has correct markup from HTML
- Just need to ensure it's visible (`scaleY: 1, opacity: 1`) before hiding
- Remove all `restoreTransitionData()` calls

## Implementation Details

### generate-static-pages.js Changes

```javascript
if (routeKey) {
  const routeConfig = siteConfig.get(routeKey);
  if (routeConfig) {
    // ... existing code ...
    
    // Add transition data for overlay (image and alt only, no copy)
    if (routeConfig.transition) {
      templateData.transitionImage = routeConfig.transition.image;
      templateData.transitionAlt = routeConfig.transition.alt;
    }
  }
}

// Fallback defaults if no transition data
if (!templateData.transitionImage) {
  templateData.transitionImage = "https://shea-memorandum-site.b-cdn.net/images/home-theme-desktop.webp";
  templateData.transitionAlt = "The Shea Memorandum Logo";
}
```

### page-transition.html Changes

```html
<section class="page-transition-overlay">
  <img
    class="page-transition-overlay__image"
    src="{{ transitionImage or 'https://shea-memorandum-site.b-cdn.net/images/home-theme-desktop.webp' }}"
    alt="{{ transitionAlt or 'The Shea Memorandum Logo' }}"
  />
</section>

<section id="page-transition-overlay-templates"></section>
```

### MPAPageTransition.js Simplification

**Remove**:

- `updateTransitionOverlay()` method
- `storeTransitionData()` method  
- `restoreTransitionData()` method
- All calls to these methods

**Keep**:

- `normalizeHrefToRoute()` - still useful for route validation
- `showTransition()` - animation logic
- `hideTransition()` - animation logic
- `loadPageImages()` - still needed for page images

**Simplify `setupListeners()`**:

- Remove overlay update logic
- Remove sessionStorage storage
- Just normalize route (for validation), show transition, navigate

**Simplify `initialize()`**:

- Remove `restoreTransitionData()` call
- Just handle hide animation when `isPageNavigating` is true

## Flow Comparison

### Before (Runtime Update):

1. Page loads with default overlay markup
2. JavaScript runs, updates overlay markup
3. Flash of default content visible
4. Show transition animation
5. Navigate

### After (Build-Time):

1. Page loads with correct overlay markup (already in HTML)
2. Show transition animation (markup already correct)
3. Navigate
4. New page loads with its own correct overlay markup

## Files to Modify

1. `scripts/generate-static-pages.js` - Add transition data to templateData
2. `views/partials/page-transition.html` - Use template variables instead of hardcoded values
3. `app/animations/MPAPageTransition.js` - Remove markup update methods, simplify logic

## Notes

- **Backward Compatibility**: Use Nunjucks `or` operator for fallbacks
- **Default Values**: Keep current defaults as fallback if route has no transition data
- **Animation Still Needed**: We still need GSAP animations for show/hide, just no DOM manipulation
- **sessionStorage**: Can remove `pageTransitionImage` storage, but keep `pageTransition` flag for navigation detection