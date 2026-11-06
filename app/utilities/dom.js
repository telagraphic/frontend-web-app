export const $ = (selector, root = document) => {
  if (!selector) return null;
  return root.querySelector(selector);
};

export const $$ = (selector, root = document) => {
  if (!selector) return [];
  return [...root.querySelectorAll(selector)];
};

const warned = new Set();

export function select(root, map, { className } = {}) {
  const elements = {};
  const missing = [];

  for (const [key, value] of Object.entries(map ?? {})) {
    if (Array.isArray(value)) {
      elements[key] = $$(value[0], root);
      if (elements[key].length === 0) missing.push(key);
    } else if (typeof value === "string") {
      elements[key] = $(value, root);
      if (!elements[key]) missing.push(key);
    } else {
      elements[key] = value;
    }
  }

  if (className && missing.length && !warned.has(className)) {
    warned.add(className);
    console.warn(`${className}: missing elements: ${missing.join(", ")}`);
  }

  return elements;
}

export function delegate(root, type, selector, handler, { signal } = {}) {
  root.addEventListener(
    type,
    (event) => {
      const match = event.target.closest(selector);
      if (match && root.contains(match)) handler(event, match);
    },
    { signal },
  );
}

export function getData(element, key, fallback) {
  const value = element.dataset[key];
  if (value === undefined) return fallback;
  if (value === "" || value === "true") return true;
  if (value === "false") return false;
  if (value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  if (value.startsWith("{") || value.startsWith("[")) return JSON.parse(value);
  return value;
}

export function whenVisible(
  element,
  callback,
  { signal, once = true, rootMargin = "0px", threshold = 0 } = {},
) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callback(entry);
        if (once) observer.unobserve(entry.target);
      }
    },
    { rootMargin, threshold },
  );
  observer.observe(element);
  signal?.addEventListener("abort", () => observer.disconnect(), {
    once: true,
  });
  return observer;
}

export function whenDOMReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}
