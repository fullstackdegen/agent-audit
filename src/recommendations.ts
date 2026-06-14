import type { ProfileName } from "./report-schema.js";

export interface Recommendation {
  suggestedActions: string[];
  acceptanceCriteria: string[];
  documentationUrl: string | null;
}

interface CatalogEntry {
  actions: string[];
  criteria: string[];
  documentationUrl: string;
}

const CATALOG: Record<string, CatalogEntry> = {
  "unused-javascript": entry(
    ["Remove unused modules and split non-critical JavaScript into on-demand chunks."],
    ["Reduce the reported wasted JavaScript bytes."],
    "https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/",
  ),
  "unused-css-rules": entry(
    ["Remove unused selectors and load non-critical styles only where required."],
    ["Reduce the reported wasted CSS bytes."],
    "https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/",
  ),
  "render-blocking-resources": entry(
    ["Inline critical styles and defer non-critical stylesheets and scripts."],
    ["Eliminate render-blocking resources from the critical rendering path."],
    "https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/",
  ),
  "network-dependency-tree-insight": entry(
    [
      "Shorten critical request chains, defer non-critical dependencies, and keep preconnect hints limited to required origins.",
    ],
    [
      "Reduce the longest critical dependency chain and remove unnecessary preconnect hints reported by Lighthouse.",
    ],
    "https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/",
  ),
  "uses-responsive-images": entry(
    ["Serve images sized for their rendered dimensions and viewport."],
    ["Eliminate responsive-image byte savings reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images/",
  ),
  "uses-optimized-images": entry(
    ["Compress image assets without materially reducing visual quality."],
    ["Eliminate image-encoding byte savings reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/",
  ),
  "modern-image-formats": entry(
    ["Serve supported images in WebP or AVIF with an appropriate fallback."],
    ["Eliminate modern-image-format byte savings reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images/",
  ),
  "offscreen-images": entry(
    ["Lazy-load below-the-fold images without delaying the LCP image."],
    ["Eliminate offscreen-image transfer savings reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/offscreen-images/",
  ),
  "server-response-time": entry(
    ["Reduce origin processing time and cache reusable responses."],
    ["Keep the initial document server response time below 600 ms."],
    "https://developer.chrome.com/docs/lighthouse/performance/time-to-first-byte/",
  ),
  "largest-contentful-paint-element": entry(
    ["Prioritize the LCP resource and reduce work required to render its element."],
    ["Keep median Largest Contentful Paint at or below 2,500 ms."],
    "https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/",
  ),
  "lcp-lazy-loaded": entry(
    ["Load the LCP image eagerly and expose it in the initial document."],
    ["Ensure the LCP image is not lazy-loaded."],
    "https://developer.chrome.com/docs/lighthouse/performance/lcp-lazy-loaded/",
  ),
  "total-byte-weight": entry(
    ["Remove unnecessary payloads and reduce the size of critical assets."],
    ["Reduce total transferred bytes without removing required functionality."],
    "https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/",
  ),
  "mainthread-work-breakdown": entry(
    ["Split long main-thread tasks and defer non-critical computation."],
    ["Reduce main-thread execution time reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown/",
  ),
  "bootup-time": entry(
    ["Reduce JavaScript parse, compile, and execution work during startup."],
    ["Reduce JavaScript boot-up time reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/bootup-time/",
  ),
  "third-party-summary": entry(
    ["Remove unnecessary third-party code and delay non-critical integrations."],
    ["Reduce third-party transfer size and main-thread blocking time."],
    "https://developer.chrome.com/docs/lighthouse/performance/third-party-summary/",
  ),
  "image-alt": entry(
    ["Add concise alternative text to informative images and empty alt text to decorative images."],
    ["All relevant image elements pass the Lighthouse image-alt audit."],
    "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
  ),
  label: entry(
    ["Associate every form control with a visible or programmatic label."],
    ["All form controls pass the Lighthouse label audit."],
    "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html",
  ),
  "color-contrast": entry(
    ["Adjust foreground and background colors to meet WCAG contrast ratios."],
    ["All reported text elements pass the Lighthouse color-contrast audit."],
    "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
  ),
  "button-name": entry(
    ["Give every button an accessible name that describes its action."],
    ["All button elements pass the Lighthouse button-name audit."],
    "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html",
  ),
  "link-name": entry(
    ["Give every link a discernible accessible name."],
    ["All link elements pass the Lighthouse link-name audit."],
    "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html",
  ),
  "errors-in-console": entry(
    ["Resolve application, resource-loading, and browser console errors."],
    ["The audited page produces no Lighthouse-reported browser errors."],
    "https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/",
  ),
  "is-on-https": entry(
    ["Serve every page and subresource over HTTPS without mixed content."],
    ["The Lighthouse HTTPS audit passes."],
    "https://developer.chrome.com/docs/lighthouse/pwa/is-on-https/",
  ),
  "document-title": entry(
    ["Add a concise, page-specific document title."],
    ["The Lighthouse document-title audit passes."],
    "https://developer.chrome.com/docs/lighthouse/seo/document-title/",
  ),
  "meta-description": entry(
    ["Add a concise meta description that summarizes the page."],
    ["The Lighthouse meta-description audit passes."],
    "https://developer.chrome.com/docs/lighthouse/seo/meta-description/",
  ),
  "robots-txt": entry(
    [
      "Fix robots.txt syntax errors, remove unsupported directives, and serve the file as plain text with an HTTP 200 response.",
    ],
    [
      "Serve a valid robots.txt file that passes the Lighthouse robots-txt audit.",
    ],
    "https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/",
  ),
  "html-has-lang": entry(
    ["Set the document language with a valid lang attribute on the html element."],
    ["The Lighthouse html-has-lang audit passes."],
    "https://developer.chrome.com/docs/lighthouse/accessibility/html-has-lang/",
  ),
  canonical: entry(
    ["Declare the preferred page URL with a valid canonical link."],
    ["The Lighthouse canonical audit passes."],
    "https://developer.chrome.com/docs/lighthouse/seo/canonical/",
  ),
  charset: entry(
    ["Declare UTF-8 in the first 1,024 bytes of the HTML or in the Content-Type response header."],
    ["The Lighthouse charset audit passes."],
    "https://developer.chrome.com/docs/lighthouse/best-practices/charset/",
  ),
  "link-text": entry(
    ["Replace generic link labels with text that describes the destination or action."],
    ["The Lighthouse link-text audit passes."],
    "https://developer.chrome.com/docs/lighthouse/seo/link-text/",
  ),
  "legacy-javascript": entry(
    ["Adjust the JavaScript build target to avoid unnecessary legacy transforms and polyfills for supported browsers."],
    ["Reduce the legacy JavaScript bytes reported by Lighthouse."],
    "https://developer.chrome.com/docs/lighthouse/performance/legacy-javascript/",
  ),
};

const TBT_RELATED_AUDITS = new Set([
  "unused-javascript",
  "mainthread-work-breakdown",
  "bootup-time",
  "third-party-summary",
  "total-blocking-time",
]);

export function getRecommendation(
  auditId: string,
  profile: ProfileName,
): Recommendation {
  const catalogEntry = CATALOG[auditId];
  const tbtCriterion =
    profile === "mobile"
      ? "Keep median mobile Total Blocking Time at or below 200 ms."
      : "Keep median desktop Total Blocking Time at or below 150 ms.";

  const profileCriteria = TBT_RELATED_AUDITS.has(auditId)
    ? [tbtCriterion]
    : [];

  if (!catalogEntry) {
    return {
      suggestedActions: [
        "Inspect the affected resource or DOM node in the repository and implement the smallest change that satisfies the measured acceptance criteria.",
      ],
      acceptanceCriteria: [
        "The affected Lighthouse audit passes or shows a measurable improvement.",
        ...profileCriteria,
      ],
      documentationUrl: null,
    };
  }

  return {
    suggestedActions: [...catalogEntry.actions],
    acceptanceCriteria: [...catalogEntry.criteria, ...profileCriteria],
    documentationUrl: catalogEntry.documentationUrl,
  };
}

export function hasRecommendation(auditId: string): boolean {
  return auditId in CATALOG;
}

function entry(
  actions: string[],
  criteria: string[],
  documentationUrl: string,
): CatalogEntry {
  return { actions, criteria, documentationUrl };
}
