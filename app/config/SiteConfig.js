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
    this.settingsByTemplate = Object.values(siteRoutes).reduce((acc, routeConfig) => {
      if (routeConfig?.template) acc[routeConfig.template] = routeConfig;
      return acc;
    }, {});
  }

  get(template) {
    return this.settings[template];
  }

  getClass(template) {
    return this.settings[template]?.class;
  }

  /**
   * Lookup a route config by `data-template` value.
   * `siteRoutes` is keyed by URL path, so this provides a template-first lookup
   * for MPA bootstrapping.
   */
  getByTemplate(template) {
    return this.settingsByTemplate?.[template];
  }

  getClassByTemplate(template) {
    return this.getByTemplate(template)?.class;
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
