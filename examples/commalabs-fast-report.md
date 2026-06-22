# Lighthouse Implementation Report

- Target: https://www.commalabs.co/tr
- Status: **complete**
- Generated: 2026-06-14T17:35:41.505Z
- Mode: fast (1 run(s) per profile)
- Lighthouse: 12.6.1
- User agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36

## Category Scores

| Category | Mobile median (range) | Desktop median (range) |
| --- | ---: | ---: |
| Performance | 97/100 (97-97/100) | 100/100 (100-100/100) |
| Accessibility | 96/100 (96-96/100) | 96/100 (96-96/100) |
| Best Practices | 96/100 (96-96/100) | 96/100 (96-96/100) |
| SEO | 92/100 (92-92/100) | 92/100 (92-92/100) |

## Key Metrics

| Metric | Mobile median (range) | Desktop median (range) |
| --- | ---: | ---: |
| First Contentful Paint | 991.73 ms (991.73-991.73 ms) | 311.87 ms (311.87-311.87 ms) |
| Speed Index | 2262.88 ms (2262.88-2262.88 ms) | 429.24 ms (429.24-429.24 ms) |
| Largest Contentful Paint | 2641.73 ms (2641.73-2641.73 ms) | 591.87 ms (591.87-591.87 ms) |
| Total Blocking Time | 47.50 ms (47.50-47.50 ms) | 0 ms (0-0 ms) |
| Cumulative Layout Shift | 0 (0-0) | 0 (0-0) |

## Site Intelligence

- Status: **complete**
- Inspected URL: https://www.commalabs.co/tr
- Checks: 1
- **WARN** Render blocking asset found (site-render-blocking-asset)

### Generated llms.txt Draft

```txt
# Comma Labs \| Dijital Çözümler & Digital Solutions \| Comma Labs

Source: https://www.commalabs.co/tr

> A company solving niche market problems, focusing on elegant software solutions with thoughtful user experiences.

## Same-origin links
- [Comma Labs](https://www.commalabs.co/tr#)
- [https://www.commalabs.co/tr#consultation](https://www.commalabs.co/tr#consultation)
- [https://www.commalabs.co/tr#team](https://www.commalabs.co/tr#team)
- [https://www.commalabs.co/tr#contact](https://www.commalabs.co/tr#contact)
- [EN](https://www.commalabs.co/en)
```

## Agent Fix Packs

### Fix Pack 1: Fix Render blocking asset found.

- Severity: **medium**
- Category: performance
- Affected profiles: mobile, desktop
- Source issues: `site-render-blocking-asset`
- Repository search hints:
  - `link[rel="stylesheet"]`
  - `https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css`
  - `script[src]`
  - `https://www.commalabs.co/_next/static/chunks/63116806de80c822.js`
  - `https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js`
  - `https://www.commalabs.co/_next/static/chunks/91e80d59c97e220b.js`
  - `https://www.commalabs.co/_next/static/chunks/turbopack-0c9a516cfb4d45fa.js`
  - `https://www.commalabs.co/_next/static/chunks/455726be14c729ce.js`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Fix render blocking asset found.`
  - `Keep changes focused on source issue IDs: site-render-blocking-asset.`
- Acceptance criteria:
  - `Render blocking asset found check passes in Agent Audit site intelligence.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `site-render-blocking-asset`

### Fix Pack 2: Fix Links do not have a discernible name.

- Severity: **critical**
- Category: accessibility
- Affected profiles: mobile, desktop
- Source issues: `link-name`
- Repository search hints:
  - `div.border-t-2 > div.flex > div.flex > a.text-gray-600`
  - `<a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/commalabs">`
  - `<a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/commalabs.co">`
  - `nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap`
  - `<a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#consultation">`
  - `<a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#team">`
  - `<a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#contact">`
  - `<a target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="https://wa.me/905372519038">`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Give every link a discernible accessible name.`
  - `Keep changes focused on source issue IDs: link-name.`
- Acceptance criteria:
  - `All link elements pass the Lighthouse link-name audit.`
  - `Raise the median accessibility score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `link-name`

### Fix Pack 3: Fix Largest contentful paint element.

- Severity: **high**
- Category: performance
- Affected profiles: mobile
- Source issues: `largest-contentful-paint-element`
- Repository search hints:
  - `Search for user-visible content related to: Largest Contentful Paint element`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Prioritize the LCP resource and reduce work required to render its element.`
  - `Keep changes focused on source issue IDs: largest-contentful-paint-element.`
- Acceptance criteria:
  - `Keep median Largest Contentful Paint at or below 2,500 ms.`
  - `Raise the median performance score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `largest-contentful-paint-element`

### Fix Pack 4: Fix Reduce unused javascript.

- Severity: **high**
- Category: performance
- Affected profiles: mobile, desktop
- Source issues: `unused-javascript`
- Repository search hints:
  - `https://www.commalabs.co/_next/static/chunks/f7f8b7557f00a7b3.js`
  - `https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Remove unused modules and split non-critical JavaScript into on-demand chunks.`
  - `Keep changes focused on source issue IDs: unused-javascript.`
- Acceptance criteria:
  - `Reduce the reported wasted JavaScript bytes.`
  - `Keep median mobile Total Blocking Time at or below 200 ms.`
  - `Raise the median performance score to at least 90/100.`
  - `Keep median desktop Total Blocking Time at or below 150 ms.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `unused-javascript`

### Fix Pack 5: Fix Avoid serving legacy javascript to modern browsers.

- Severity: **medium**
- Category: performance
- Affected profiles: mobile, desktop
- Source issues: `legacy-javascript`
- Repository search hints:
  - `https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Adjust the JavaScript build target to avoid unnecessary legacy transforms and polyfills for supported browsers.`
  - `Keep changes focused on source issue IDs: legacy-javascript.`
- Acceptance criteria:
  - `Reduce the legacy JavaScript bytes reported by Lighthouse.`
  - `Raise the median performance score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `legacy-javascript`

### Fix Pack 6: Fix Reduce unused css.

- Severity: **medium**
- Category: performance
- Affected profiles: mobile, desktop
- Source issues: `unused-css-rules`
- Repository search hints:
  - `https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Remove unused selectors and load non-critical styles only where required.`
  - `Keep changes focused on source issue IDs: unused-css-rules.`
- Acceptance criteria:
  - `Reduce the reported wasted CSS bytes.`
  - `Raise the median performance score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `unused-css-rules`

### Fix Pack 7: Fix Network dependency tree.

- Severity: **high**
- Category: performance
- Affected profiles: mobile, desktop
- Source issues: `network-dependency-tree-insight`
- Repository search hints:
  - `Search for user-visible content related to: Network dependency tree`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Shorten critical request chains, defer non-critical dependencies, and keep preconnect hints limited to required origins.`
  - `Keep changes focused on source issue IDs: network-dependency-tree-insight.`
- Acceptance criteria:
  - `Reduce the longest critical dependency chain and remove unnecessary preconnect hints reported by Lighthouse.`
  - `Raise the median performance score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `network-dependency-tree-insight`

### Fix Pack 8: Fix Eliminate render-blocking resources.

- Severity: **high**
- Category: performance
- Affected profiles: mobile, desktop
- Source issues: `render-blocking-resources`
- Repository search hints:
  - `https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Inline critical styles and defer non-critical stylesheets and scripts.`
  - `Keep changes focused on source issue IDs: render-blocking-resources.`
- Acceptance criteria:
  - `Eliminate render-blocking resources from the critical rendering path.`
  - `Raise the median performance score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `render-blocking-resources`

### Fix Pack 9: Fix Browser errors were logged to the console.

- Severity: **high**
- Category: best-practices
- Affected profiles: mobile, desktop
- Source issues: `errors-in-console`
- Repository search hints:
  - `https://www.commalabs.co/_next/static/media/fonts.woff2`
  - `Failed to load resource: the server responded with a status of 404 ()`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Resolve application, resource-loading, and browser console errors.`
  - `Keep changes focused on source issue IDs: errors-in-console.`
- Acceptance criteria:
  - `The audited page produces no Lighthouse-reported browser errors.`
  - `Raise the median best-practices score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `errors-in-console`

### Fix Pack 10: Fix Robots.txt is not valid.

- Severity: **high**
- Category: seo
- Affected profiles: mobile, desktop
- Source issues: `robots-txt`
- Repository search hints:
  - `Search for user-visible content related to: robots.txt is not valid`
- Implementation steps:
  - `Inspect the repository for the evidence listed in repoSearchHints before editing.`
  - `Fix robots.txt syntax errors, remove unsupported directives, and serve the file as plain text with an HTTP 200 response.`
  - `Keep changes focused on source issue IDs: robots-txt.`
- Acceptance criteria:
  - `Serve a valid robots.txt file that passes the Lighthouse robots-txt audit.`
  - `Raise the median seo score to at least 90/100.`
- Verification: rerun this tool in `reliable` mode; expected audit IDs: `robots-txt`

## Prioritized Issues

### 1. Render blocking asset found

- Audit: `site-render-blocking-asset`
- Category: performance
- Severity: **medium**
- Affected profiles: mobile, desktop
- Description: Render blocking asset found
- Mobile result: score N/A; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; selector link[rel="stylesheet"]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/63116806de80c822.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/91e80d59c97e220b.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/turbopack-0c9a516cfb4d45fa.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/455726be14c729ce.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/6bcbe5d000786e7c.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/87b41357a59b99ab.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/d34cfa4bf83d51fa.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/df4cde154f389101.js; selector script[src]
- Desktop result: score N/A; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; selector link[rel="stylesheet"]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/63116806de80c822.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/91e80d59c97e220b.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/turbopack-0c9a516cfb4d45fa.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/455726be14c729ce.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/6bcbe5d000786e7c.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/87b41357a59b99ab.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/d34cfa4bf83d51fa.js; selector script[src]
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/df4cde154f389101.js; selector script[src]
- Suggested actions:
  - Fix render blocking asset found.
- Acceptance criteria:
  - Render blocking asset found check passes in Agent Audit site intelligence.

### 2. Links do not have a discernible name

- Audit: `link-name`
- Category: accessibility
- Severity: **critical**
- Affected profiles: mobile, desktop
- Description: Link text (and alternate text for images, when used as links) that is discernible, unique, and focusable improves the navigation experience for screen reader users. [Learn how to make links accessible](https://dequeuniversity.com/rules/axe/4.10/link-name).
- Mobile result: score 0; no display value
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/commalabs">
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/commalabs.co">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#consultation">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#team">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#contact">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="https://wa.me/905372519038">
- Desktop result: score 0; no display value
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/commalabs">
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/commalabs.co">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#consultation">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#team">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#contact">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="https://wa.me/905372519038">
- Suggested actions:
  - Give every link a discernible accessible name.
- Acceptance criteria:
  - All link elements pass the Lighthouse link-name audit.
  - Raise the median accessibility score to at least 90/100.
- Documentation: https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html

### 3. Largest Contentful Paint element

- Audit: `largest-contentful-paint-element`
- Category: performance
- Severity: **high**
- Affected profiles: mobile
- Description: This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)
- Mobile result: score 0; 2,640 ms
- Suggested actions:
  - Prioritize the LCP resource and reduce work required to render its element.
- Acceptance criteria:
  - Keep median Largest Contentful Paint at or below 2,500 ms.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/

### 4. Reduce unused JavaScript

- Audit: `unused-javascript`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/).
- Mobile result: score 0; Est savings of 61 KiB
- Mobile impact: 300 ms, 62862 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/f7f8b7557f00a7b3.js; 38931 wasted bytes
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 23931 wasted bytes
- Desktop result: score 0; Est savings of 61 KiB
- Desktop impact: 40 ms, 62862 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/f7f8b7557f00a7b3.js; 38931 wasted bytes
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 23931 wasted bytes
- Suggested actions:
  - Remove unused modules and split non-critical JavaScript into on-demand chunks.
- Acceptance criteria:
  - Reduce the reported wasted JavaScript bytes.
  - Keep median mobile Total Blocking Time at or below 200 ms.
  - Raise the median performance score to at least 90/100.
  - Keep median desktop Total Blocking Time at or below 150 ms.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/

### 5. Avoid serving legacy JavaScript to modern browsers

- Audit: `legacy-javascript`
- Category: performance
- Severity: **medium**
- Affected profiles: mobile, desktop
- Description: Polyfills and transforms enable legacy browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile [Baseline](https://web.dev/baseline) features, unless you know you must support legacy browsers. [Learn why most sites can deploy ES6+ code without transpiling](https://philipwalton.com/articles/the-state-of-es5-on-the-web/)
- Mobile result: score 0.5; Est savings of 14 KiB
- Mobile impact: 0 ms, 13950 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 14000 wasted bytes
- Desktop result: score 0.5; Est savings of 14 KiB
- Desktop impact: 0 ms, 13950 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 13979 wasted bytes
- Suggested actions:
  - Adjust the JavaScript build target to avoid unnecessary legacy transforms and polyfills for supported browsers.
- Acceptance criteria:
  - Reduce the legacy JavaScript bytes reported by Lighthouse.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/legacy-javascript/

### 6. Reduce unused CSS

- Audit: `unused-css-rules`
- Category: performance
- Severity: **medium**
- Affected profiles: mobile, desktop
- Description: Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to reduce unused CSS](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/).
- Mobile result: score 0.5; Est savings of 11 KiB
- Mobile impact: 0 ms, 11222 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; 11222 wasted bytes
- Desktop result: score 0.5; Est savings of 10 KiB
- Desktop impact: 0 ms, 10702 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; 10702 wasted bytes
- Suggested actions:
  - Remove unused selectors and load non-critical styles only where required.
- Acceptance criteria:
  - Reduce the reported wasted CSS bytes.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/

### 7. Network dependency tree

- Audit: `network-dependency-tree-insight`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: [Avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains) by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load.
- Mobile result: score 0; no display value
- Desktop result: score 0; no display value
- Suggested actions:
  - Shorten critical request chains, defer non-critical dependencies, and keep preconnect hints limited to required origins.
- Acceptance criteria:
  - Reduce the longest critical dependency chain and remove unnecessary preconnect hints reported by Lighthouse.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/

### 8. Eliminate render-blocking resources

- Audit: `render-blocking-resources`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles. [Learn how to eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/).
- Mobile result: score 0; Est savings of 0 ms
- Mobile impact: 0 ms, 0 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; 150 wasted ms
- Desktop result: score 0.5; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css
- Suggested actions:
  - Inline critical styles and defer non-critical stylesheets and scripts.
- Acceptance criteria:
  - Eliminate render-blocking resources from the critical rendering path.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/

### 9. Browser errors were logged to the console

- Audit: `errors-in-console`
- Category: best-practices
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more about this errors in console diagnostic audit](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)
- Mobile result: score 0; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/media/fonts.woff2; snippet Failed to load resource: the server responded with a status of 404 ()
- Desktop result: score 0; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/media/fonts.woff2; snippet Failed to load resource: the server responded with a status of 404 ()
- Suggested actions:
  - Resolve application, resource-loading, and browser console errors.
- Acceptance criteria:
  - The audited page produces no Lighthouse-reported browser errors.
  - Raise the median best-practices score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/

### 10. robots.txt is not valid

- Audit: `robots-txt`
- Category: seo
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: If your robots.txt file is malformed, crawlers may not be able to understand how you want your website to be crawled or indexed. [Learn more about robots.txt](https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/).
- Mobile result: score 0; 6 errors found
- Desktop result: score 0; 6 errors found
- Suggested actions:
  - Fix robots.txt syntax errors, remove unsupported directives, and serve the file as plain text with an HTTP 200 response.
- Acceptance criteria:
  - Serve a valid robots.txt file that passes the Lighthouse robots-txt audit.
  - Raise the median seo score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/

## Coding-Agent Instructions

1. Treat `structuredContent` as the source of truth.
2. Inspect the repository before proposing file-level changes.
3. Address issues in prioritizedIssues order.
4. Prefer one source change that resolves the same audit on both profiles.
5. Preserve user-visible behavior and accessibility.
6. Run the repository's tests after each logical fix.
7. Rerun this Lighthouse tool in reliable mode.
8. Compare medians and variability against the report's acceptance criteria.
9. Do not claim completion when the new report is incomplete or materially more variable than the baseline.