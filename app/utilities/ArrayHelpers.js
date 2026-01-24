/**
 * Selects images from a single element or an array of elements
 * @param {HTMLElement | HTMLElement[]} elements - The element or array of elements to select images from
 * @returns {HTMLElement[]} An array of images or an image or an empty array
 */
export function returnImagesArray(elements) {
  if (!elements) return [];
  if (Array.isArray(elements)) return elements;
  return [elements];
}

/**
 * Normalizes various element input types to an array
 * Handles Arrays, NodeLists, single HTMLElements, and null/undefined
 * @param {HTMLElement|HTMLElement[]|NodeList|null|undefined} elements - Elements to normalize
 * @returns {HTMLElement[]} An array of elements, or empty array if input is null/undefined
 */
export function normalizeToArray(elements) {
  if (!elements) return [];
  if (Array.isArray(elements)) return elements;
  if (elements instanceof NodeList) return Array.from(elements);
  // Single element - wrap in array
  return [elements];
}
