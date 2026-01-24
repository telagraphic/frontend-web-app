/**
 * Centralized error registry with generic error categories
 * Provides consistent error handling throughout the application
 */

export const ERROR_CODES = {
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
  CLASS_NOT_FOUND: 'CLASS_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.ELEMENT_NOT_FOUND]: 'Element not found: {element}',
  [ERROR_CODES.PAGE_NOT_FOUND]: 'Page not found: {page}',
  [ERROR_CODES.CLASS_NOT_FOUND]: 'Class not found: {className}',
  [ERROR_CODES.NETWORK_ERROR]: 'Network error: {message}',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error: {message}',
};

/**
 * Create an error with a specific error code and context
 * @param {string} code - Error code from ERROR_CODES
 * @param {Object} context - Context object with details for error message
 * @returns {Error} Error object with code and context properties
 */
export function createError(code, context = {}) {
  let message = ERROR_MESSAGES[code] || 'An unknown error occurred';
  
  // Handle special case for CLASS_NOT_FOUND with availableExports
  if (code === ERROR_CODES.CLASS_NOT_FOUND && context.availableExports) {
    message += `. Available exports: ${context.availableExports.join(', ')}`;
  }
  
  // Replace placeholders with context values
  message = message.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined ? String(context[key]) : match;
  });
  
  const error = new Error(message);
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
