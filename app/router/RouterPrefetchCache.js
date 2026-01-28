/**
 * RouterPrefetchCache
 *
 * In-memory HTML cache for prefetched pages (cache-aside).
 * Stores raw HTML strings keyed by route.
 *
 * Notes:
 * - Uses a basic LRU policy (recently accessed keys are moved to the end).
 * - Uses TTL to expire old entries.
 */
export class RouterPrefetchCache {
  constructor({ maxSize = 10, ttlMs = 5 * 60 * 1000 } = {}) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    /** @type {Map<string, { html: string, timestamp: number, metadata: object }>} */
    this.cache = new Map();
  }

  /**
   * @param {string} route
   * @returns {{ html: string, metadata: object }|null}
   */
  get(route) {
    const entry = this.cache.get(route);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.cache.delete(route);
      return null;
    }

    // LRU: bump to most-recent
    this.cache.delete(route);
    this.cache.set(route, entry);

    return { html: entry.html, metadata: entry.metadata };
  }

  /**
   * @param {string} route
   * @param {string} html
   * @param {object} [metadata]
   */
  set(route, html, metadata = {}) {
    if (!route || typeof html !== "string") return;

    // LRU: if exists, overwrite and bump
    if (this.cache.has(route)) {
      this.cache.delete(route);
    }

    // Evict least-recent if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(route, { html, timestamp: Date.now(), metadata });
  }

  /**
   * @param {string} route
   * @returns {boolean}
   */
  has(route) {
    return this.get(route) !== null;
  }

  /**
   * @param {string} [route]
   */
  clear(route) {
    if (route) this.cache.delete(route);
    else this.cache.clear();
  }
}

