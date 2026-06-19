import type { HtmlFacts } from "./html-inspector.js";
import type {
  CategoryName,
  FetchSummary,
  LlmsTxtReport,
  PrioritizedIssue,
  ReportEvidence,
  SiteCheck,
} from "./report-schema.js";

const MAX_SITE_CHECKS = 50;
const MAX_EVIDENCE = 10;

export interface BuildSiteFindingsInput {
  inspectedUrl: URL;
  facts: HtmlFacts;
  resources: {
    html: FetchSummary;
    robotsTxt: FetchSummary | null;
    sitemapXml: FetchSummary | null;
    probedUrls: FetchSummary[];
  };
  llmsTxt: LlmsTxtReport;
}

export interface SiteFindingsResult {
  checks: SiteCheck[];
  prioritizedIssues: PrioritizedIssue[];
}

export function buildSiteFindings(
  input: BuildSiteFindingsInput,
): SiteFindingsResult {
  const checks = [
    ...metadataChecks(input),
    ...structuredDataChecks(input),
    ...indexabilityChecks(input),
    ...brokenLinkChecks(input),
    ...imageChecks(input),
    ...assetChecks(input),
    ...llmsChecks(input),
  ];
  const cappedChecks = checks.slice(0, MAX_SITE_CHECKS);

  return {
    checks: cappedChecks,
    prioritizedIssues: cappedChecks
      .filter((check) => check.status !== "pass")
      .map(checkToIssue)
      .slice(0, 10),
  };
}

function metadataChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  const checks: SiteCheck[] = [];

  if (isBlank(input.facts.title)) {
    checks.push({
      id: "site-missing-title",
      category: "metadata",
      status: "fail",
      title: "Missing document title",
      evidence: [evidence({ url: input.inspectedUrl.href, selector: "title" })],
    });
  }

  if (isBlank(input.facts.description)) {
    checks.push({
      id: "site-missing-meta-description",
      category: "metadata",
      status: "fail",
      title: "Missing meta description",
      evidence: [
        evidence({
          url: input.inspectedUrl.href,
          selector: 'meta[name="description"]',
        }),
      ],
    });
  }

  if (isBlank(input.facts.viewport)) {
    checks.push({
      id: "site-missing-viewport",
      category: "metadata",
      status: "fail",
      title: "Missing viewport meta tag",
      evidence: [
        evidence({
          url: input.inspectedUrl.href,
          selector: 'meta[name="viewport"]',
        }),
      ],
    });
  }

  if (input.facts.headings.h1.length === 0) {
    checks.push({
      id: "site-missing-h1",
      category: "metadata",
      status: "fail",
      title: "Missing H1 heading",
      evidence: [evidence({ url: input.inspectedUrl.href, selector: "h1" })],
    });
  }

  return checks;
}

function structuredDataChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  const checks: SiteCheck[] = [];
  const invalidEvidence: ReportEvidence[] = [];
  const missingTypeEvidence: ReportEvidence[] = [];

  input.facts.jsonLdBlocks.forEach((block, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block.raw);
    } catch {
      if (invalidEvidence.length < MAX_EVIDENCE) {
        invalidEvidence.push(
          evidence({
            url: input.inspectedUrl.href,
            selector: jsonLdSelector(index),
            snippet: truncate(block.raw),
          }),
        );
      }
      return;
    }

    if (!jsonLdHasType(parsed) && missingTypeEvidence.length < MAX_EVIDENCE) {
      missingTypeEvidence.push(
        evidence({
          url: input.inspectedUrl.href,
          selector: jsonLdSelector(index),
          snippet: truncate(block.raw),
        }),
      );
    }
  });

  if (invalidEvidence.length > 0) {
    checks.push({
      id: "site-invalid-json-ld",
      category: "structured-data",
      status: "fail",
      title: "Invalid JSON-LD",
      evidence: invalidEvidence,
    });
  }

  if (missingTypeEvidence.length > 0) {
    checks.push({
      id: "site-json-ld-missing-type",
      category: "structured-data",
      status: "warn",
      title: "JSON-LD missing @type",
      evidence: missingTypeEvidence,
    });
  }

  return checks;
}

function jsonLdSelector(index: number): string {
  if (index === 0) {
    return 'script[type="application/ld+json"]';
  }

  return `script[type="application/ld+json"]:nth-of-type(${index + 1})`;
}

function indexabilityChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  const checks: SiteCheck[] = [];
  const robotsMeta = input.facts.robotsMeta?.toLowerCase() ?? "";

  if (robotsMeta.includes("noindex")) {
    checks.push({
      id: "site-noindex",
      category: "indexability",
      status: "fail",
      title: "Page is marked noindex",
      evidence: [
        evidence({
          url: input.inspectedUrl.href,
          selector: 'meta[name="robots"]',
          snippet: input.facts.robotsMeta,
        }),
      ],
    });
  }

  if (input.facts.canonicalUrl !== null) {
    try {
      const canonical = new URL(input.facts.canonicalUrl);
      if (canonical.origin !== input.inspectedUrl.origin) {
        checks.push({
          id: "site-cross-origin-canonical",
          category: "indexability",
          status: "warn",
          title: "Canonical URL points to a different origin",
          evidence: [
            evidence({
              url: input.inspectedUrl.href,
              selector: 'link[rel="canonical"]',
              snippet: input.facts.canonicalUrl,
            }),
          ],
        });
      }
    } catch {
      checks.push({
        id: "site-invalid-canonical",
        category: "indexability",
        status: "warn",
        title: "Canonical URL is invalid",
        evidence: [
          evidence({
            url: input.inspectedUrl.href,
            selector: 'link[rel="canonical"]',
            snippet: input.facts.canonicalUrl,
          }),
        ],
      });
    }
  }

  if (input.resources.robotsTxt === null) {
    checks.push({
      id: "site-missing-robots-txt",
      category: "indexability",
      status: "warn",
      title: "Missing robots.txt summary",
      evidence: [
        evidence({ url: new URL("/robots.txt", input.inspectedUrl).href }),
      ],
    });
  }

  if (input.resources.sitemapXml === null) {
    checks.push({
      id: "site-missing-sitemap-xml",
      category: "indexability",
      status: "warn",
      title: "Missing sitemap.xml summary",
      evidence: [
        evidence({ url: new URL("/sitemap.xml", input.inspectedUrl).href }),
      ],
    });
  }

  return checks;
}

function brokenLinkChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  const brokenLinks = input.resources.probedUrls.filter(
    (summary) =>
      !summary.ok && summary.statusCode !== null && summary.statusCode >= 400,
  );

  if (brokenLinks.length === 0) {
    return [];
  }

  return [
    {
      id: "site-broken-link",
      category: "broken-links",
      status: "fail",
      title: "Broken link found",
      evidence: brokenLinks.slice(0, MAX_EVIDENCE).map((summary) =>
        evidence({
          url: summary.url,
          snippet: `${summary.statusCode} ${summary.finalUrl}`,
        }),
      ),
    },
  ];
}

function imageChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  const checks: SiteCheck[] = [];
  const missingAltEvidence: ReportEvidence[] = [];
  const oversizedEvidence: ReportEvidence[] = [];

  for (const image of input.facts.images) {
    if (isBlank(image.alt) && missingAltEvidence.length < MAX_EVIDENCE) {
      missingAltEvidence.push(
        evidence({
          url: image.src,
          selector: "img",
          snippet: `alt=${image.alt ?? "null"}`,
        }),
      );
    }

    if (
      ((image.width ?? 0) > 1600 || (image.height ?? 0) > 1600) &&
      oversizedEvidence.length < MAX_EVIDENCE
    ) {
      oversizedEvidence.push(
        evidence({
          url: image.src,
          selector: "img",
          snippet: `${image.width ?? "unknown"}x${image.height ?? "unknown"}`,
        }),
      );
    }
  }

  if (missingAltEvidence.length > 0) {
    checks.push({
      id: "site-image-missing-alt",
      category: "images",
      status: "fail",
      title: "Image missing alt text",
      evidence: missingAltEvidence,
    });
  }

  if (oversizedEvidence.length > 0) {
    checks.push({
      id: "site-oversized-image",
      category: "images",
      status: "warn",
      title: "Oversized image",
      evidence: oversizedEvidence,
    });
  }

  return checks;
}

function assetChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  if (input.facts.stylesheets.length === 0 && input.facts.scripts.length === 0) {
    return [];
  }

  return [
    {
      id: "site-render-blocking-asset",
      category: "assets",
      status: "warn",
      title: "Render blocking asset found",
      evidence: [
        ...input.facts.stylesheets.map((url) =>
          evidence({ url, selector: 'link[rel="stylesheet"]' }),
        ),
        ...input.facts.scripts.map((url) =>
          evidence({ url, selector: "script[src]" }),
        ),
      ].slice(0, 10),
    },
  ];
}

function llmsChecks(input: BuildSiteFindingsInput): SiteCheck[] {
  if (input.llmsTxt.status !== "insufficient-content") {
    return [];
  }

  return [
    {
      id: "site-llms-txt-insufficient-content",
      category: "llms",
      status: "warn",
      title: "llms.txt has insufficient content",
      evidence: input.llmsTxt.evidence
        .slice(0, MAX_EVIDENCE)
        .map((item) => evidence({ snippet: item })),
    },
  ];
}

function checkToIssue(check: SiteCheck): PrioritizedIssue {
  const category: CategoryName =
    check.category === "images" || check.category === "assets"
      ? "performance"
      : "seo";

  return {
    auditId: check.id,
    category,
    severity: check.status === "fail" ? "high" : "medium",
    affectedProfiles: ["mobile", "desktop"],
    title: check.title,
    description: check.title,
    profiles: {
      mobile: {
        score: null,
        displayValue: null,
        impact: {
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
        },
        evidence: check.evidence,
      },
      desktop: {
        score: null,
        displayValue: null,
        impact: {
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
        },
        evidence: check.evidence,
      },
    },
    suggestedActions: [`Fix ${check.title.toLowerCase()}.`],
    acceptanceCriteria: [
      `${check.title} check passes in Lighthouse MCP site intelligence.`,
    ],
    documentationUrl: null,
  };
}

function evidence(value: Partial<ReportEvidence>): ReportEvidence {
  return {
    url: value.url ?? null,
    selector: value.selector ?? null,
    snippet: value.snippet ?? null,
    totalBytes: value.totalBytes ?? null,
    wastedBytes: value.wastedBytes ?? null,
    wastedMs: value.wastedMs ?? null,
  };
}

function isBlank(value: string | null): boolean {
  return value === null || value.trim() === "";
}

function jsonLdHasType(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(jsonLdHasType);
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ("@type" in value) {
    const typeValue = (value as { "@type": unknown })["@type"];
    if (Array.isArray(typeValue)) {
      return typeValue.some(
        (item) => typeof item === "string" && !isBlank(item),
      );
    }
    if (typeof typeValue === "string" && !isBlank(typeValue)) {
      return true;
    }
  }

  return (
    "@graph" in value &&
    jsonLdHasType((value as { "@graph": unknown })["@graph"])
  );
}

function truncate(value: string): string {
  return value.slice(0, 500);
}
