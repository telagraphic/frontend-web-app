# Content Security Policy (CSP) Implementation Checklist

## Table of Contents

- [Overview: What is CSP?](#overview-what-is-csp)
- [General CSP Use Cases & Settings](#general-csp-use-cases--settings)
- [Quick Reference Checklist](#quick-reference-checklist)
- [SPA-Specific Implementation](#spa-specific-implementation)
  - [Current External Resources](#current-external-resources)
  - [Implementation Checklist](#implementation-checklist)
  - [Implemented CSP Policy](#implemented-csp-policy)
  - [Testing Your CSP Implementation](#testing-your-csp-implementation)
  - [Common Issues and Solutions](#common-issues-and-solutions)

---

## Overview: What is CSP?

**Content Security Policy (CSP)** is a security standard that helps prevent cross-site scripting (XSS) attacks, data injection attacks, and other security vulnerabilities by controlling which resources (scripts, stylesheets, images, fonts, etc.) can be loaded and executed on a web page.

### How CSP Works

CSP works by defining a **whitelist** of trusted sources for different types of resources. When a browser encounters a CSP policy, it:

1. **Checks each resource** before loading it (scripts, styles, images, etc.)
2. **Compares the source** against the allowed sources in the policy
3. **Blocks or allows** the resource based on the policy rules
4. **Reports violations** (in report-only mode) or blocks them (in enforce mode)

### What CSP Protects Against

- **XSS Attacks**: Prevents malicious scripts from executing by controlling script sources
- **Data Injection**: Blocks unauthorized data from being loaded
- **Clickjacking**: Can prevent iframe embedding (via `frame-ancestors`)
- **Mixed Content**: Forces HTTPS for all resources
- **Code Injection**: Prevents inline scripts/styles unless explicitly allowed

### CSP Implementation Methods

CSP can be implemented in three ways:

1. **HTTP Headers** (Recommended for production)
   ```http
   Content-Security-Policy: default-src 'self';
   ```

2. **Meta Tags** (Useful for development/testing)
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self';">
   ```
   ⚠️ **Note**: Meta tags don't support report-only mode in most browsers

3. **Report-Only Mode** (For testing)
   ```http
   Content-Security-Policy-Report-Only: default-src 'self';
   ```

### Key Concepts

- **Directives**: Rules that control specific resource types (`script-src`, `style-src`, `img-src`, etc.)
- **Sources**: Allowed origins (`'self'`, `https://example.com`, `'unsafe-inline'`, etc.)
- **Report-Only Mode**: Logs violations without blocking resources (for testing)
- **Enforce Mode**: Actually blocks violating resources (production)

---

## General CSP Use Cases & Settings

This section provides common CSP configurations for different types of web applications. Use these as starting points and customize based on your specific needs.

### Use Case 1: Static Website (No External Resources)

**Best for**: Simple static sites with no external dependencies

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none';
```

**Key Settings:**
- ✅ All resources from same origin only
- ✅ No external scripts/styles
- ✅ No iframes or plugins
- ✅ Forms submit to same origin

---

### Use Case 2: Website with CDN Resources

**Best for**: Sites using CDNs for libraries, fonts, or images

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' https://cdn.example.com; img-src 'self' https://cdn.example.com data:; font-src 'self' https://cdn.example.com data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ✅ Allow specific CDN domains
- ✅ Allow `data:` URIs for inline images/fonts
- ✅ Upgrade insecure requests to HTTPS

**Common CDN Domains:**
- `cdn.jsdelivr.net` - JavaScript libraries
- `cdnjs.cloudflare.com` - Cloudflare CDN
- `unpkg.com` - npm packages
- `fonts.googleapis.com` - Google Fonts
- `fonts.gstatic.com` - Google Fonts static files

---

### Use Case 3: Website with Analytics

**Best for**: Sites using Google Analytics, Adobe Analytics, or other tracking services

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://www.analytics.google.com; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ✅ Allow analytics script domains in `script-src`
- ✅ Allow analytics API endpoints in `connect-src`
- ✅ Allow analytics pixel images in `img-src`

**Common Analytics Services:**
- **Google Analytics**: `www.google-analytics.com`, `www.googletagmanager.com`
- **Adobe Analytics**: `*.omtrdc.net`, `*.sc.omtrdc.net`
- **Mixpanel**: `api.mixpanel.com`
- **Segment**: `cdn.segment.com`
- **Umami**: `cloud.umami.is` or your self-hosted domain

---

### Use Case 4: Website with Embedded Content (YouTube, Maps, etc.)

**Best for**: Sites embedding videos, maps, or other third-party content

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.youtube.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ytimg.com https://maps.googleapis.com https://maps.gstatic.com; font-src 'self' data:; connect-src 'self'; frame-src 'self' https://www.youtube.com https://www.google.com; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ✅ Allow embedding domains in `frame-src`
- ✅ Allow embedded content scripts in `script-src`
- ✅ Allow embedded content images in `img-src`
- ⚠️ May need `'unsafe-inline'` for styles if embedded content requires it

**Common Embedding Services:**
- **YouTube**: `www.youtube.com`, `i.ytimg.com`
- **Vimeo**: `player.vimeo.com`
- **Google Maps**: `maps.googleapis.com`, `maps.gstatic.com`
- **Twitter**: `platform.twitter.com`
- **Facebook**: `www.facebook.com`

---

### Use Case 5: Single Page Application (SPA)

**Best for**: React, Vue, Angular, or other SPA frameworks

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ⚠️ `'unsafe-eval'` may be needed for some frameworks (React dev mode, Vue templates)
- ⚠️ `'unsafe-inline'` often needed for styles in SPAs
- ✅ Consider using nonces/hashes instead of `'unsafe-inline'` when possible
- ✅ API endpoints in `connect-src`

**Framework-Specific Notes:**
- **React**: May need `'unsafe-eval'` in development, not production
- **Vue**: Template compilation may require `'unsafe-eval'`
- **Angular**: Consider using nonces for inline styles

---

### Use Case 6: E-commerce Site

**Best for**: Online stores with payment processing

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com https://checkout.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.stripe.com; font-src 'self' data:; connect-src 'self' https://api.stripe.com; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ✅ Payment processor domains in `script-src`, `connect-src`, `frame-src`
- ✅ Payment form actions in `form-action`
- ✅ Payment processor images in `img-src`

**Common Payment Processors:**
- **Stripe**: `js.stripe.com`, `checkout.stripe.com`, `api.stripe.com`
- **PayPal**: `www.paypal.com`, `www.paypalobjects.com`
- **Square**: `js.squareup.com`, `connect.squareup.com`

---

### Use Case 7: Content Management System (CMS)

**Best for**: WordPress, Drupal, or custom CMS

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-src 'self'; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ⚠️ CMS often requires `'unsafe-inline'` and `'unsafe-eval'` for plugins/themes
- ✅ Consider implementing nonces for better security
- ✅ Allow `https:` for images/fonts if using external media

---

### Use Case 8: Progressive Web App (PWA)

**Best for**: PWAs with service workers and offline functionality

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; worker-src 'self' blob:; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none'; upgrade-insecure-requests;
```

**Key Settings:**
- ✅ `worker-src` for service workers
- ✅ `blob:` for service worker registration
- ✅ May need `'unsafe-eval'` for service worker scripts

---

### General Best Practices

1. **Start Restrictive**: Begin with `default-src 'self'` and add exceptions as needed
2. **Use Report-Only First**: Test in report-only mode before enforcing
3. **Avoid `'unsafe-inline'`**: Use nonces or hashes instead when possible
4. **Avoid `'unsafe-eval'`**: Only use if absolutely necessary (some frameworks require it)
5. **Specify Exact Domains**: Use `https://example.com` instead of `*.example.com` when possible
6. **Set `object-src 'none'`**: Always block plugins (Flash, etc.)
7. **Use `upgrade-insecure-requests`**: Automatically upgrade HTTP to HTTPS
8. **Test Thoroughly**: Validate in multiple browsers before enforcing

---

## Quick Reference Checklist

Use this checklist as a quick reference guide. Each item links to detailed sections below.

### ✅ Basic Setup
- [ ] [Add CSP Header](#phase-1-basic-csp-setup) - Configure HTTP headers or meta tags
- [ ] [Choose Implementation Method](#csp-implementation-methods) - Headers (recommended) or meta tags
- [ ] [Start in Report-Only Mode](#phase-4-reporting-and-monitoring) - Test before enforcing

### ✅ Directive Configuration
- [ ] [Script Sources (`script-src`)](#21-script-sources-script-src) - Control JavaScript execution
- [ ] [Style Sources (`style-src`)](#22-style-sources-style-src) - Control CSS loading
- [ ] [Image Sources (`img-src`)](#23-image-sources-img-src) - Control image loading
- [ ] [Font Sources (`font-src`)](#24-font-sources-font-src) - Control font loading
- [ ] [Connect Sources (`connect-src`)](#25-connect-sources-connect-src) - Control API/fetch requests
- [ ] [Base URI (`base-uri`)](#26-base-uri-base-uri) - Prevent base tag injection
- [ ] [Form Action (`form-action`)](#27-form-action-form-action) - Control form submissions
- [ ] [Frame Sources (`frame-src`)](#28-frame-sources-frame-src) - Control iframe embedding
- [ ] [Object/Embed Sources](#29-objectembedmedia-sources) - Block plugins
- [ ] [Default Source (`default-src`)](#210-default-source-default-src) - Fallback policy

### ✅ Security Enhancements
- [ ] [Implement Nonces](#31-implement-nonces-advanced) - Secure inline scripts/styles
- [ ] [Use Strict-Dynamic](#32-implement-strict-dynamic) - Allow trusted script loading
- [ ] [Upgrade Insecure Requests](#33-add-upgrade-insecure-requests) - Force HTTPS
- [ ] [Block Mixed Content](#34-add-block-all-mixed-content) - Prevent HTTP on HTTPS pages

### ✅ Testing & Validation
- [ ] [Browser Testing](#51-browser-testing) - Test in Chrome, Firefox, Safari
- [ ] [CSP Evaluator](#52-csp-evaluator-testing) - Validate policy with Google's tool
- [ ] [Functionality Testing](#53-functionality-testing) - Verify all features work
- [ ] [Switch to Enforce Mode](#switch-to-enforce-mode) - Enable blocking after validation

### ✅ Monitoring
- [ ] [Set Up CSP Reporting](#41-set-up-csp-reporting) - Collect violation reports
- [ ] [Monitor Violations](#42-test-csp-in-report-only-mode) - Review and fix issues
- [ ] [Create Violation Handler](#43-create-csp-violation-handler-optional) - Log violations server-side

### ✅ Documentation
- [ ] [Document CSP Policy](#61-document-csp-policy) - Record your final policy
- [ ] [Update Security Docs](#62-update-security-documentation) - Include in security documentation

---

## SPA-Specific Implementation

> **Note**: The following sections are specific to the Shea Memorandum SPA implementation. For general CSP guidance, refer to the sections above.

---

## Current External Resources

Based on codebase analysis, the following external resources are used:

- **Scripts:**
  - `cdn.jsdelivr.net` - GSAP library, CustomEase, Lenis
  - `cloud.umami.is` - Analytics script
  - Local scripts from `{{ jsPath }}`

- **Styles:**
  - `cdn.jsdelivr.net` - Lenis CSS
  - Local styles from `{{ cssPath }}`

- **Images:**
  - `shea-memorandum-site.b-cdn.net` - All images, favicons, manifest

- **Fonts:**
  - Local fonts from `/fonts/` directory

---

## Implementation Checklist

### Phase 1: Basic CSP Setup

#### ✅ 1.1 Add CSP Meta Tag (Development/Testing)
- [x] Add CSP meta tag to `views/layouts/page.html` for testing
- [x] Use `Content-Security-Policy` meta tag in `<head>`
- [x] Start with report-only mode: `Content-Security-Policy-Report-Only`
- [x] **Location:** `views/layouts/page.html` (in `<head>` section)
- [x] **Status:** ✅ IMPLEMENTED - Removed (meta tags don't work in report-only mode, using HTTP headers instead)

#### ✅ 1.2 Add CSP Header via Netlify (Production)
- [x] Add CSP header to `netlify.toml`
- [x] Configure for all HTML pages: `for = "/*.html"`
- [x] Use `Content-Security-Policy` header (enforce mode)
- [x] **Location:** `netlify.toml`
- [x] **Status:** ✅ IMPLEMENTED - Using enforce mode

**Example:**
```toml
[[headers]]
  for = "/*.html"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cloud.umami.is; style-src 'self' https://cdn.jsdelivr.net; img-src 'self' https://shea-memorandum-site.b-cdn.net data:; font-src 'self' data:; connect-src 'self' https://cloud.umami.is; base-uri 'self'; form-action 'self'; frame-src 'none'; object-src 'none'; upgrade-insecure-requests;"
```

#### ✅ 1.3 Add CSP Header to Development Server
- [x] Add CSP header in `server.js` for development
- [x] Add to response headers in `serveFile()` and `serveProductionPage()`
- [x] Use enforce mode in development
- [x] **Location:** `server.js`
- [x] **Status:** ✅ IMPLEMENTED - Using enforce mode

---

### Phase 2: Directive Configuration

#### ✅ 2.1 Script Sources (`script-src`)
- [x] Allow `'self'` for local JavaScript modules
- [x] Allow `https://cdn.jsdelivr.net` for GSAP and Lenis
- [x] Allow `https://cloud.umami.is` for analytics
- [x] Add `'unsafe-inline'` ONLY if absolutely necessary (not recommended)
- [x] Consider using nonces or hashes instead of `'unsafe-inline'`
- [x] **Recommended:** `script-src 'self' https://cdn.jsdelivr.net https://cloud.umami.is;`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.2 Style Sources (`style-src`)
- [x] Allow `'self'` for local CSS
- [x] Allow `https://cdn.jsdelivr.net` for Lenis CSS
- [x] Add `'unsafe-inline'` if inline styles are used (check codebase)
- [x] **Recommended:** `style-src 'self' https://cdn.jsdelivr.net;`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.3 Image Sources (`img-src`)
- [x] Allow `'self'` for local images
- [x] Allow `https://shea-memorandum-site.b-cdn.net` for CDN images
- [x] Allow `data:` for inline images (if used)
- [x] **Recommended:** `img-src 'self' https://shea-memorandum-site.b-cdn.net data:;`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.4 Font Sources (`font-src`)
- [x] Allow `'self'` for local fonts in `/fonts/` directory
- [x] Allow `data:` if data URIs are used for fonts
- [x] **Recommended:** `font-src 'self' data:;`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.5 Connect Sources (`connect-src`)
- [x] Allow `'self'` for same-origin requests
- [x] Allow `https://cloud.umami.is` for analytics API calls
- [x] **Recommended:** `connect-src 'self' https://cloud.umami.is;`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.6 Base URI (`base-uri`)
- [x] Restrict to `'self'` to prevent base tag injection attacks
- [x] **Recommended:** `base-uri 'self';`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.7 Form Action (`form-action`)
- [x] Restrict to `'self'` if forms exist
- [x] Check if any forms submit to external URLs
- [x] **Recommended:** `form-action 'self';`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.8 Frame Sources (`frame-src`)
- [x] Set to `'none'` if no iframes are used
- [x] Or specify allowed iframe sources if needed
- [x] **Recommended:** `frame-src 'none';`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.9 Object/Embed/Media Sources
- [x] Set `object-src 'none'` to prevent Flash/plugins
- [x] Set `media-src` if audio/video are used
- [x] **Recommended:** `object-src 'none';`
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 2.10 Default Source (`default-src`)
- [x] Set fallback policy: `'self'`
- [x] This applies to all directives not explicitly set
- [x] **Recommended:** `default-src 'self';`
- [x] **Status:** ✅ IMPLEMENTED

---

### Phase 3: Security Enhancements

#### ✅ 3.1 Implement Nonces (Advanced)
- [ ] Generate unique nonce per request
- [ ] Add nonce to inline scripts (if any)
- [ ] Add nonce to inline styles (if any)
- [ ] Update CSP to include nonce: `script-src 'nonce-{value}'`
- [ ] **Note:** Requires server-side nonce generation
- [ ] **Status:** ⏳ Not needed (no inline scripts/styles)

#### ✅ 3.2 Implement Strict-Dynamic
- [ ] Use `'strict-dynamic'` for script-src if using nonces
- [ ] Allows scripts loaded by trusted scripts to execute
- [ ] **Note:** Only use with nonces or hashes
- [ ] **Status:** ⏳ Not needed (no nonces)

#### ✅ 3.3 Add Upgrade Insecure Requests
- [x] Add `upgrade-insecure-requests` directive
- [x] Automatically upgrades HTTP to HTTPS
- [x] **Recommended:** Add to CSP header
- [x] **Status:** ✅ IMPLEMENTED

#### ✅ 3.4 Add Block All Mixed Content
- [ ] Add `block-all-mixed-content` directive
- [ ] Prevents loading HTTP resources on HTTPS pages
- [ ] **Note:** `upgrade-insecure-requests` already handles this
- [ ] **Status:** ⏳ Not needed (using `upgrade-insecure-requests`)

---

### Phase 4: Reporting and Monitoring

#### ✅ 4.1 Set Up CSP Reporting
- [ ] Add `report-uri` or `report-to` directive
- [ ] Configure endpoint to receive violation reports
- [ ] Use report-only mode initially to gather violations
- [ ] **Example:** `report-uri /api/csp-report;`
- [ ] **Status:** ⏳ Optional - Can be added later

#### ✅ 4.2 Test CSP in Report-Only Mode
- [x] Deploy with `Content-Security-Policy-Report-Only`
- [x] Monitor reports for 1-2 weeks
- [x] Fix any legitimate violations
- [x] Switch to enforce mode after validation
- [x] **Status:** ✅ COMPLETED - Switched to enforce mode

#### ✅ 4.3 Create CSP Violation Handler (Optional)
- [ ] Create endpoint to log CSP violations
- [ ] Store violations for analysis
- [ ] Alert on suspicious patterns
- [ ] **Status:** ⏳ Optional - Can be added later

---

### Phase 5: Testing and Validation

#### ✅ 5.1 Browser Testing
- [x] Test in Chrome/Edge (DevTools Console)
- [x] Test in Firefox (Console)
- [x] Test in Safari (Web Inspector)
- [x] Check for CSP violation errors
- [x] Verify all resources load correctly
- [x] **Status:** ✅ COMPLETED

#### ✅ 5.2 CSP Evaluator Testing
- [x] Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [x] Paste your CSP policy
- [x] Fix any warnings or misconfigurations
- [x] Aim for "Good" or "Excellent" rating
- [x] **Status:** ✅ COMPLETED

#### ✅ 5.3 Functionality Testing
- [x] Test page navigation
- [x] Test image loading
- [x] Test animations (GSAP)
- [x] Test smooth scroll (Lenis)
- [x] Test analytics (Umami)
- [x] Test all interactive features
- [x] **Status:** ✅ COMPLETED

---

### Phase 6: Documentation

#### ✅ 6.1 Document CSP Policy
- [x] Document final CSP policy in this file
- [x] Explain each directive and why it's needed
- [x] Document external domains and their purpose
- [x] Add notes about any `'unsafe-inline'` usage
- [x] **Status:** ✅ COMPLETED

#### ✅ 6.2 Update Security Documentation
- [ ] Add CSP section to security docs
- [ ] Document how to update CSP when adding new resources
- [ ] Include troubleshooting guide
- [ ] **Status:** ⏳ Optional

---

## ✅ Implemented CSP Policy

**Status:** ✅ **ENFORCE MODE** - Active and protecting the site

**Implementation Locations:**
- `server.js` - Development server headers (enforce mode)
- `netlify.toml` - Production headers (enforce mode)

**Current Policy:**
```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://cloud.umami.is;
style-src 'self' https://cdn.jsdelivr.net;
img-src 'self' https://shea-memorandum-site.b-cdn.net data:;
font-src 'self' data:;
connect-src 'self' https://cloud.umami.is;
base-uri 'self';
form-action 'self';
frame-src 'none';
object-src 'none';
upgrade-insecure-requests;
```

**Policy Breakdown:**
- `default-src 'self'` - Fallback: only same-origin resources
- `script-src` - Allows local scripts, jsdelivr CDN (GSAP, Lenis), and Umami analytics
- `style-src` - Allows local CSS and jsdelivr CDN (Lenis CSS)
- `img-src` - Allows local images, CDN images, and data URIs
- `font-src` - Allows local fonts and data URIs
- `connect-src` - Allows same-origin API calls and Umami analytics
- `base-uri 'self'` - Prevents base tag injection
- `form-action 'self'` - Forms can only submit to same origin
- `frame-src 'none'` - Blocks all iframes
- `object-src 'none'` - Blocks plugins (Flash, etc.)
- `upgrade-insecure-requests` - Automatically upgrades HTTP to HTTPS

---

## 🧪 Testing Your CSP Implementation

### Quick Testing Steps

1. **Check Browser Console**
   - Open your site in a browser
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for CSP violation warnings (they'll be prefixed with "Content Security Policy")
   - In report-only mode, violations are logged but don't block resources
   - In enforce mode, violations are blocked and logged

2. **Use CSP Evaluator**
   - Visit: https://csp-evaluator.withgoogle.com/
   - Copy your CSP policy from `netlify.toml` or `server.js`
   - Paste it into the evaluator
   - Review warnings and suggestions
   - Aim for "Good" or "Excellent" rating

3. **Test Functionality**
   - ✅ Navigate between pages
   - ✅ Verify images load correctly
   - ✅ Test GSAP animations
   - ✅ Test Lenis smooth scroll
   - ✅ Verify Umami analytics is tracking
   - ✅ Check all external links work

4. **Monitor Violations (Report-Only Mode)**
   - In report-only mode, violations are logged to console
   - Check browser console for any CSP reports
   - Fix any legitimate violations before switching to enforce mode

5. **Switch to Enforce Mode**
   - Once validated, change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in:
     - `netlify.toml` (line 27)
     - `server.js` (line 25)
   - Deploy and test again
   - Resources will now be blocked if they violate the policy

### Current Implementation Status

✅ **CSP Headers:** Added to `server.js` (enforce mode)  
✅ **CSP Headers:** Added to `netlify.toml` (enforce mode)  
✅ **All Directives:** Configured based on codebase analysis  
✅ **Testing:** Completed and validated  
✅ **Enforce Mode:** Active and protecting the site  

---

## Common Issues and Solutions

### Issue: "Refused to load the script"
**Solution:** Add the script's domain to `script-src` directive

### Issue: "Refused to load the stylesheet"
**Solution:** Add the stylesheet's domain to `style-src` directive

### Issue: "Refused to load the image"
**Solution:** Add the image domain to `img-src` directive

### Issue: "Refused to connect to"
**Solution:** Add the API domain to `connect-src` directive

### Issue: Inline styles not working
**Solution:** Add `'unsafe-inline'` to `style-src` (or use nonces/hashes)

### Issue: Analytics not working
**Solution:** Ensure analytics domain is in both `script-src` and `connect-src`

### Issue: CSP meta tag not working in report-only mode
**Solution:** Use HTTP headers instead of meta tags for report-only mode

---

## Resources

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Quick Reference](https://content-security-policy.com/)
- [Netlify Headers Documentation](https://docs.netlify.com/routing/headers/)

---

## Notes

- Always test CSP in report-only mode before enforcing
- Monitor violation reports regularly
- Update CSP when adding new external resources
- Consider using subresource integrity (SRI) for CDN scripts
- Keep CSP policy as restrictive as possible while maintaining functionality
- Meta tags don't support report-only mode in most browsers - use HTTP headers instead
