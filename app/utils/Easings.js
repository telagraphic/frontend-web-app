/**
 * Easing functions module for smooth scrolling and animations
 * Provides different easing algorithms and management utilities
 */

export class Easings {
  constructor(defaultType = "linear") {
    // Default easing configuration
    this.ease = 0.08;
    this.springStrength = 0.1;
    this.damping = 0.8;
    this.velocity = 0;
    this.currentType = defaultType;

    // Easing functions object (Strategy Pattern)
    this.easingFunctions = {
      linear: this.linearEasing.bind(this),
      exponential: this.exponentialEasing.bind(this),
      spring: this.springEasing.bind(this),
      bezier: this.bezierEasing.bind(this),
    };
  }

  /**
   * Linear easing - responsive speed based on distance
   * @param {number} current - Current scroll position
   * @param {number} target - Target scroll position
   * @param {number} maxSpeed - Maximum speed limit
   * @returns {number} New current position
   */
  linearEasing(current, target, maxSpeed) {
    const delta = Math.min(Math.abs(target - current), maxSpeed);
    const direction = target > current ? 1 : -1;
    return current + delta * direction;
  }

  /**
   * Exponential decay - starts fast, slows down naturally
   * @param {number} current - Current scroll position
   * @param {number} target - Target scroll position
   * @returns {number} New current position
   */
  exponentialEasing(current, target) {
    return current + (target - current) * this.ease;
  }

  /**
   * Spring physics - bouncy, natural feeling
   * @param {number} current - Current scroll position
   * @param {number} target - Target scroll position
   * @returns {Object} Object with new current position and updated velocity
   */
  springEasing(current, target) {
    this.velocity += (target - current) * this.springStrength;
    this.velocity *= this.damping;
    return {
      current: current + this.velocity,
      velocity: this.velocity,
    };
  }

  /**
   * Bezier curve easing - custom acceleration curves
   * @param {number} current - Current scroll position
   * @param {number} target - Target scroll position
   * @returns {number} New current position
   */
  bezierEasing(current, target) {
    const t = this.ease;
    // Ease out: starts fast, ends slow
    const easeOut = t * (2 - t);
    return current + (target - current) * easeOut;
  }

  /**
   * Get easing function by type
   * @param {string} type - Easing type name
   * @returns {Function|null} Easing function or null if not found
   */
  getEasingFunction(type) {
    return this.easingFunctions[type] || null;
  }

  /**
   * Get all available easing types
   * @returns {Array} Array of available easing type names
   */
  getAvailableEasingTypes() {
    return Object.keys(this.easingFunctions);
  }

  /**
   * Update easing parameters
   * @param {Object} params - Parameters to update
   */
  updateParams(params) {
    if (params.ease !== undefined) this.ease = params.ease;
    if (params.springStrength !== undefined)
      this.springStrength = params.springStrength;
    if (params.damping !== undefined) this.damping = params.damping;
  }

  /**
   * Reset velocity (useful for spring easing)
   */
  resetVelocity() {
    this.velocity = 0;
  }

  /**
   * Change easing type at runtime
   * @param {string} type - New easing type
   * @returns {boolean} Success status
   */
  setEasingType(type) {
    if (this.easingFunctions[type]) {
      this.currentType = type;
      // Reset velocity when switching to spring easing
      if (type === "spring") {
        this.resetVelocity();
      }
      return true;
    }
    return false;
  }

  /**
   * Get current easing type
   * @returns {string} Current easing type
   */
  getEasingType() {
    return this.currentType;
  }

  /**
   * Get easing function by current type
   * @returns {Function|null} Current easing function or null if not found
   */
  getCurrentEasingFunction() {
    return this.easingFunctions[this.currentType] || null;
  }
}
