/**
 * SiteConfig - Site-wide route mappings and page metadata
 * Harmonizes the data-template field to href, js classes and browser urls 
 * Central configuration for all routes, page classes, and transition data
 */

import { siteRoutes } from './siteRoutes.js';

export class SiteConfig {
  constructor() {
    this.routes = {};
    this.initializeSettings();
  }

  initializeSettings() {
    this.settings = siteRoutes;
  }

  get(template) {
    return this.settings[template];
  }

  getClass(template) {
    return this.settings[template]?.class;
  }

  getLink(template) {
    return this.settings[template]?.link;
  }

  getUrl(template) {
    return this.settings[template]?.url;
  }

  getTemplate(template) {
    return this.settings[template]?.template;
  }

  has(template) {
    return this.settings[template] !== undefined;
  }
}
