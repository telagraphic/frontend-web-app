/**
 * Centralized error registry with generic error categories
 * Provides consistent error handling throughout the application
 */

export const ERROR_CODES = {
  ELEMENT_NOT_FOUND: "ELEMENT_NOT_FOUND",
  PAGE_NOT_FOUND: "PAGE_NOT_FOUND",
  CLASS_NOT_FOUND: "CLASS_NOT_FOUND",
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_DEPENDENCY: "MISSING_DEPENDENCY",
  SERVICE_INIT_FAILED: "SERVICE_INIT_FAILED",
  COMPONENT_INIT_FAILED: "COMPONENT_INIT_FAILED",
  PAGE_HOOK_FAILED: "PAGE_HOOK_FAILED",
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.ELEMENT_NOT_FOUND]: "Element not found: {element}",
  [ERROR_CODES.PAGE_NOT_FOUND]: "Page not found: {page}",
  [ERROR_CODES.CLASS_NOT_FOUND]: "Class not found: {className}",
  [ERROR_CODES.NETWORK_ERROR]: "Network error: {message}",
  [ERROR_CODES.VALIDATION_ERROR]: "Validation error: {message}",
  [ERROR_CODES.MISSING_DEPENDENCY]:
    "{owner} is missing dependency: {dependency}",
  [ERROR_CODES.SERVICE_INIT_FAILED]: "Service failed to init: {service}",
  [ERROR_CODES.COMPONENT_INIT_FAILED]:
    "Layout component failed to init: {component}",
  [ERROR_CODES.PAGE_HOOK_FAILED]: "Page {page} failed in {hook} hook",
};

/**
 * Create an error with a specific error code and context
 * @param {string} code - Error code from ERROR_CODES
 * @param {Object} context - Context object with details for error message
 * @param {Error} [context.cause] - The original error, kept as `error.cause`
 * @returns {Error} Error object with code and context properties
 */
export function createError(code, context = {}) {
  let message = ERROR_MESSAGES[code] || "An unknown error occurred";

  // Handle special case for CLASS_NOT_FOUND with availableExports
  if (code === ERROR_CODES.CLASS_NOT_FOUND && context.availableExports) {
    message += `. Available exports: ${context.availableExports.join(", ")}`;
  }

  // Replace placeholders with context values
  message = message.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined ? String(context[key]) : match;
  });

  const error = new Error(
    message,
    context.cause ? { cause: context.cause } : undefined,
  );
  error.code = code;
  error.context = context;
  return error;
}

/**
 * Check if an error has a specific error code
 * @param {Error} error - Error object to check
 * @param {string} code - Error code to check against
 * @returns {boolean} True if error has the specified code
 */
export function isErrorCode(error, code) {
  return error?.code === code;
}

export function requireDependency(owner, dependencies) {
  for (const [name, value] of Object.entries(dependencies)) {
    if (value === undefined) {
      throw createError(ERROR_CODES.MISSING_DEPENDENCY, {
        owner,
        dependency: name,
      });
    }
  }
}
