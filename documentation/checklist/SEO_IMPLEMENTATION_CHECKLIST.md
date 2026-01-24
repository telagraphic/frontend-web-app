# SEO Implementation Checklist for The Shea Memorandum Site

## Current State Analysis

### What's Already Good

- ✅ Proper HTML5 structure with `lang="en"` attribute
- ✅ Responsive viewport meta tag
- ✅ Theme color meta tag
- ✅ Favicon setup (multiple sizes and formats)
- ✅ Semantic HTML structure
- ✅ Image alt attributes present
- ✅ Analytics integration (Umami)
- ✅ Static HTML generation for all pages

### Critical Gaps Identified

- ❌ All pages share the same title ("The Shea Memorandum")
- ❌ No meta descriptions
- ❌ No Open Graph tags for social sharing
- ❌ No Twitter Card tags
- ❌ No canonical URLs
- ❌ No structured data (JSON-LD)
- ❌ No robots.txt file
- ❌ No sitemap.xml
- ❌ No hreflang tags (if needed)

---

## SEO Implementation Checklist

### 1. Meta Tags & Page Titles

#### 1.1 Unique Page Titles

- [ ] Create unique, descriptive titles for each page
  - Home: "The Shea Memorandum | Israeli Surveillance of 9/11 Hijackers"
  - Introduction: "Introduction | The Shea Memorandum"
  - Section pages: "[Section Title] | The Shea Memorandum"
  - References: "References | The Shea Memorandum"
- [ ] Update `views/layouts/page.html` to support dynamic titles
- [ ] Update `SiteConfig.js` to include title metadata for each route
- [ ] Modify `generate-static-pages.js` to inject page-specific titles

#### 1.2 Meta Descriptions

- [ ] Add unique meta descriptions (150-160 characters) for each page
- [ ] Include primary keywords naturally
- [ ] Make descriptions compelling for click-through
- [ ] Add meta description block to `views/layouts/page.html`
- [ ] Store descriptions in `SiteConfig.js` or separate metadata file

#### 1.3 Meta Keywords (Optional - Low Priority)

- [ ] Consider adding meta keywords tag (though less important for modern SEO)

---

### 2. Open Graph & Social Media Tags

#### 2.1 Open Graph Tags

- [ ] Add `og:title` - unique per page
- [ ] Add `og:description` - unique per page
- [ ] Add `og:image` - use section-specific images from CDN
- [ ] Add `og:url` - canonical URL for each page
- [ ] Add `og:type` - "website" for most pages, "article" for sections
- [ ] Add `og:site_name` - "The Shea Memorandum"
- [ ] Add `og:locale` - "en_US"

#### 2.2 Twitter Card Tags

- [ ] Add `twitter:card` - "summary_large_image" (recommended for this content type)
- [ ] Add `twitter:title` - unique per page
- [ ] Add `twitter:description` - unique per page
- [ ] Add `twitter:image` - use section-specific images
- [ ] Add `twitter:site` - if you have a Twitter handle

#### 2.3 Implementation

- [ ] Create SEO partial template (`views/partials/seo.html`)
- [ ] Add SEO block to `views/layouts/page.html`
- [ ] Update `SiteConfig.js` with OG/Twitter metadata per route
- [ ] Use existing transition images from `SiteConfig.js` for OG images

---

### 3. Canonical URLs

#### 3.1 Canonical Tags

- [ ] Add `<link rel="canonical">` to each page
- [ ] Use absolute URLs (e.g., `https://yourdomain.com/section-1`)
- [ ] Ensure canonical points to the correct page version
- [ ] Handle trailing slash consistency
- [ ] Add canonical URL to SEO partial template

#### 3.2 Base URL Configuration

- [ ] Create environment variable or config for base URL
- [ ] Update `generate-static-pages.js` to inject base URL
- [ ] Consider adding to `app/config/Environment.js`

---

### 4. Structured Data (JSON-LD)

#### 4.1 Article/WebPage Schema

- [ ] Add `WebPage` schema for all pages
- [ ] Add `Article` schema for section pages (if appropriate)
- [ ] Include: `@context`, `@type`, `headline`, `description`, `author`, `datePublished`, `dateModified`, `publisher`
- [ ] Add `BreadcrumbList` schema for navigation
- [ ] Add `Organization` schema for site-wide information

#### 4.2 Implementation

- [ ] Create structured data generator utility
- [ ] Add JSON-LD script tags to SEO partial
- [ ] Store schema data in `SiteConfig.js` or metadata file
- [ ] Ensure valid JSON-LD syntax

---

### 5. Technical SEO

#### 5.1 robots.txt

- [ ] Create `robots.txt` file
- [ ] Allow all crawlers: `User-agent: *` and `Allow: /`
- [ ] Reference sitemap location
- [ ] Place in `dist/` root for production
- [ ] Add to build process

#### 5.2 XML Sitemap

- [ ] Generate `sitemap.xml` dynamically
- [ ] Include all pages from `SiteConfig.js`
- [ ] Set proper priority and changefreq values
  - Home: priority 1.0, changefreq weekly
  - Sections: priority 0.8, changefreq monthly
  - References: priority 0.6, changefreq monthly
- [ ] Include lastmod dates
- [ ] Add sitemap generation script (`scripts/generate-sitemap.js`)
- [ ] Reference sitemap in `robots.txt`
- [ ] Submit to Google Search Console

#### 5.3 HTML Improvements

- [ ] Ensure proper heading hierarchy (h1 → h2 → h3)
- [ ] Add `<h1>` tags to each page (currently using h2/h3)
- [ ] Verify semantic HTML structure
- [ ] Add `lang` attribute (already present ✅)

---

### 6. Content Optimization

#### 6.1 Heading Structure

- [ ] Review and optimize heading hierarchy on all pages
- [ ] Ensure each page has one `<h1>` tag
- [ ] Use descriptive, keyword-rich headings
- [ ] Maintain logical heading order

#### 6.2 Internal Linking

- [ ] Verify internal links use proper anchor text
- [ ] Ensure links are crawlable (not JavaScript-only)
- [ ] Add breadcrumb navigation (if not present)
- [ ] Consider adding "Related Sections" links

#### 6.3 Image Optimization

- [ ] Verify all images have descriptive alt text
- [ ] Ensure images use appropriate file names
- [ ] Consider adding image titles
- [ ] Verify lazy loading doesn't break SEO

---

### 7. Performance & Core Web Vitals

#### 7.1 Page Speed

- [ ] Optimize images (already using WebP ✅)
- [ ] Minimize CSS/JS (already minifying ✅)
- [ ] Consider preloading critical resources
- [ ] Add `rel="preconnect"` for CDN domains

#### 7.2 Mobile Optimization

- [ ] Verify mobile-friendly design (viewport already set ✅)
- [ ] Test touch targets
- [ ] Ensure readable font sizes

---

### 8. URL Structure & Routing

#### 8.1 URL Optimization

- [ ] Verify clean, descriptive URLs (already good ✅)
- [ ] Ensure consistent trailing slash usage
- [ ] Consider adding URL slugs that match content

#### 8.2 SPA Considerations

- [ ] Verify static HTML generation works for crawlers (already implemented ✅)
- [ ] Ensure JavaScript doesn't block content rendering
- [ ] Consider server-side rendering for initial load (optional)

---

### 9. Analytics & Monitoring

#### 9.1 Search Console

- [ ] Set up Google Search Console
- [ ] Submit sitemap
- [ ] Monitor indexing status
- [ ] Track search performance

#### 9.2 SEO Monitoring

- [ ] Set up tracking for organic traffic
- [ ] Monitor keyword rankings (if applicable)
- [ ] Track click-through rates from search results

---

### 10. Additional Enhancements

#### 10.1 RSS Feed (Optional)

- [ ] Consider adding RSS feed for content updates
- [ ] Useful for content syndication

#### 10.2 Author Information

- [ ] Add author meta tags if applicable
- [ ] Consider adding author schema

#### 10.3 Date Information

- [ ] Add publication dates to pages
- [ ] Include in structured data
- [ ] Add `article:published_time` and `article:modified_time` OG tags

---

## Implementation Priority

### High Priority (Do First)

1. Unique page titles
2. Meta descriptions
3. Canonical URLs
4. Open Graph tags
5. robots.txt
6. XML sitemap

### Medium Priority

7. Twitter Card tags
8. Structured data (JSON-LD)
9. Heading structure optimization
10. Breadcrumb schema

### Low Priority (Nice to Have)

11. RSS feed
12. Author information
13. Advanced schema markup

---

## Files to Modify/Create

### New Files

- `views/partials/seo.html` - SEO meta tags partial
- `scripts/generate-sitemap.js` - Sitemap generator
- `robots.txt` - Robots file
- `app/config/SEOConfig.js` - SEO metadata configuration (optional)

### Files to Modify

- `views/layouts/page.html` - Add SEO blocks
- `app/config/SiteConfig.js` - Add SEO metadata per route
- `scripts/generate-static-pages.js` - Inject SEO data during build
- `netlify.toml` - Ensure robots.txt and sitemap.xml are served

---

## Notes

- The site uses a SPA architecture but generates static HTML, which is good for SEO
- All pages currently share the same title, which is a critical SEO issue
- The site has good semantic structure and image optimization already
- Consider adding a base URL configuration for canonical URLs
- The existing `SiteConfig.js` is a good place to centralize SEO metadata
