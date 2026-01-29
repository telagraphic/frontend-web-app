# History API Guide

## Table of Contents

- [History API methods used and their purposes](#history-api-methods-used-and-their-purposes)
  - [1. `window.history.pushState(state, title, url)`](#1-windowhistorypushstatestate-title-url)
  - [2. `window.history.replaceState(state, title, url)`](#2-windowhistoryreplacestatestate-title-url)
  - [3. `window.history.state`](#3-windowhistorystate)
  - [4. `popstate` event](#4-popstate-event)
  - [5. `window.history.length` (read-only)](#5-windowhistorylength-read-only)
- [HistoryManager example](#historymanager-example)

---

## History API methods used and their purposes

### 1. `window.history.pushState(state, title, url)`
- Purpose: Adds a new entry to the history stack
- When to use: When navigating to a new page via user action (clicking a link)
- Your usage: In `RouterHistory.updateHistory()` when `addToHistory = true`
- Note: Does not trigger a page reload or `popstate` event

### 2. `window.history.replaceState(state, title, url)`
- Purpose: Replaces the current history entry without adding a new one
- When to use: 
  - Initial page load (to set initial state without creating a history entry)
  - Redirects (to replace invalid routes)
  - Silent URL updates (when you don't want back button to go to previous URL)
- Your usage: In `setupPopState()` for initial state, and in `redirectToHome()`
- Note: Does not trigger `popstate` event

### 3. `window.history.state`
- Purpose: Returns the state object of the current history entry
- When to use: To check if state exists, or to read current state
- Your usage: In `setupPopState()` to check if initial state exists

### 4. `popstate` event
- Purpose: Fired when user navigates via back/forward buttons
- When to use: To handle browser navigation (back/forward buttons, keyboard shortcuts)
- Your usage: In `setupInitialState()` to listen for back/forward navigation
- Note: Only fires for `pushState`/`replaceState` entries, not initial page load

### 5. `window.history.length` (read-only)
- Purpose: Returns the number of entries in the history stack
- When to use: Debugging (not typically used in production)
- Note: Includes entries from all tabs/windows in the same origin

## HistoryManager example

Here's what a `HistoryManager` would look like:

```javascript
/**
 * HistoryManager - Centralized history management
 * 
 * Responsibilities:
 * - Single source of truth for all history operations
 * - Prevents duplicate history entries
 * - Ensures URL and state stay in sync
 * - Handles route normalization
 */
export class HistoryManager {
  constructor({ routerResolver }) {
    this.routerResolver = routerResolver;
    this.pageHistory = window.history;
    this.isInitialized = false;
    this.isNavigating = false; // Prevent recursive updates
  }

  /**
   * Initialize history manager
   * Sets up initial state and popstate listener
   */
  create() {
    if (this.isInitialized) {
      console.warn('HistoryManager already initialized');
      return;
    }

    // Register popstate listener FIRST (before any state changes)
    this.setupPopStateListener();
    
    // Set initial state
    this.setupInitialState();
    
    this.isInitialized = true;
  }

  /**
   * Setup popstate listener for back/forward navigation
   */
  setupPopStateListener() {
    window.addEventListener("popstate", (event) => {
      this.handlePopState(event);
    });
  }

  /**
   * Setup initial history state on page load
   */
  setupInitialState() {
    // Only set initial state if it doesn't exist
    if (this.pageHistory.state !== null) {
      return; // State already exists, don't overwrite
    }

    const pathname = window.location.pathname;
    const route = this.normalizeRoute(pathname);

    // Validate route exists
    if (!this.routerResolver.hasRoute(route) && route !== "") {
      // Invalid route, redirect to home
      this.replaceState("", "/");
      return;
    }

    // Set initial state (replaceState doesn't add to history)
    this.replaceState(route, pathname);
  }

  /**
   * Handle browser back/forward navigation
   */
  handlePopState(event) {
    if (this.isNavigating) {
      return; // Prevent recursive calls
    }

    const state = event.state;
    let route = null;

    if (state && state.route !== undefined) {
      route = state.route;
    } else {
      // Fallback: extract route from pathname
      const pathname = window.location.pathname;
      route = this.normalizeRoute(pathname);
    }

    // Dispatch event for router to handle
    window.dispatchEvent(
      new CustomEvent("history-navigation", {
        detail: {
          route: route,
          pathname: window.location.pathname,
          state: state,
        },
      })
    );
  }

  /**
   * Update history for new page navigation
   * @param {string} route - The route identifier
   * @param {boolean} addToHistory - Whether to add to history (true) or replace (false)
   */
  async updateHistory(route, addToHistory = true) {
    if (this.isNavigating) {
      console.warn('History update already in progress');
      return;
    }

    this.isNavigating = true;

    try {
      const normalizedRoute = this.normalizeRoute(route);
      const url = this.routeToUrl(normalizedRoute);

      // Check if we're navigating to the same URL
      if (url === window.location.pathname) {
        // Same URL, just update state without changing history
        this.replaceState(normalizedRoute, url);
        return;
      }

      if (addToHistory) {
        this.pushState(normalizedRoute, url);
      } else {
        this.replaceState(normalizedRoute, url);
      }
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Push new state to history (for forward navigation)
   */
  pushState(route, url) {
    this.pageHistory.pushState(
      { route: route },
      "", // Title is ignored by modern browsers
      url
    );
  }

  /**
   * Replace current state (for initial load, redirects, silent updates)
   */
  replaceState(route, url) {
    this.pageHistory.replaceState(
      { route: route },
      "",
      url
    );
  }

  /**
   * Normalize route (home -> "", remove leading slashes)
   */
  normalizeRoute(route) {
    if (!route || route === "/" || route === "home") {
      return "";
    }
    return route.replace(/^\/+/, ""); // Remove leading slashes
  }

  /**
   * Convert route to URL pathname
   */
  routeToUrl(route) {
    if (route === "") {
      return "/";
    }
    return route.startsWith("/") ? route : `/${route}`;
  }

  /**
   * Get current route from history state or URL
   */
  getCurrentRoute() {
    const state = this.pageHistory.state;
    if (state && state.route !== undefined) {
      return state.route;
    }
    return this.normalizeRoute(window.location.pathname);
  }

  /**
   * Check if current state matches route
   */
  isCurrentRoute(route) {
    const currentRoute = this.getCurrentRoute();
    const normalizedRoute = this.normalizeRoute(route);
    return currentRoute === normalizedRoute;
  }
}
```
