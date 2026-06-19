import { describe, expect, it } from "vitest";

import { buildSiteFindings } from "../src/site-findings.js";
import type { HtmlFacts } from "../src/html-inspector.js";
import type { FetchSummary, LlmsTxtReport } from "../src/report-schema.js";

const okHtml: FetchSummary = {
  url: "https://example.com/",
  statusCode: 200,
  ok: true,
  contentType: "text/html",
  finalUrl: "https://example.com/",
  error: null,
};

const okLlmsTxt: LlmsTxtReport = {
  status: "generated",
  text: "# Example",
  evidence: ["Used document title."],
};

function completeFacts(overrides: Partial<HtmlFacts> = {}): HtmlFacts {
  return {
    title: "Example",
    description: "Example description.",
    robotsMeta: null,
    viewport: "width=device-width, initial-scale=1",
    canonicalUrl: "https://example.com/",
    headings: { h1: ["Example"] },
    links: [],
    images: [],
    scripts: [],
    stylesheets: [],
    jsonLdBlocks: [],
    ...overrides,
  };
}

describe("buildSiteFindings", () => {
  it("creates checks and prioritized issues for metadata, JSON-LD, broken links, and llms.txt", () => {
    const facts: HtmlFacts = {
      title: "",
      description: null,
      robotsMeta: "noindex",
      viewport: null,
      canonicalUrl: "https://other.example/",
      headings: { h1: [] },
      links: [
        { url: "https://example.com/missing", text: "Missing", kind: "http" },
      ],
      images: [
        {
          src: "https://example.com/a.jpg",
          alt: null,
          width: 2000,
          height: 1200,
        },
      ],
      scripts: ["https://example.com/app.js"],
      stylesheets: ["https://example.com/app.css"],
      jsonLdBlocks: [{ raw: "{invalid" }],
    };
    const llmsTxt: LlmsTxtReport = {
      status: "insufficient-content",
      text: null,
      evidence: ["Missing document title.", "Missing meta description."],
    };

    const result = buildSiteFindings({
      inspectedUrl: new URL("https://example.com/"),
      facts,
      resources: {
        html: okHtml,
        robotsTxt: null,
        sitemapXml: null,
        probedUrls: [
          {
            url: "https://example.com/missing",
            statusCode: 404,
            ok: false,
            contentType: "text/html",
            finalUrl: "https://example.com/missing",
            error: null,
          },
        ],
      },
      llmsTxt,
    });

    expect(result.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "site-missing-meta-description",
        "site-noindex",
        "site-invalid-json-ld",
        "site-broken-link",
        "site-image-missing-alt",
        "site-render-blocking-asset",
        "site-llms-txt-insufficient-content",
      ]),
    );
    expect(result.prioritizedIssues.map((issue) => issue.auditId)).toContain(
      "site-broken-link",
    );
    expect(result.prioritizedIssues[0]?.suggestedActions.length).toBeGreaterThan(
      0,
    );
  });

  it("aggregates repeated broken links and image checks with bounded evidence", () => {
    const facts = completeFacts({
      images: Array.from({ length: 20 }, (_, index) => ({
        src: `https://example.com/image-${index}.jpg`,
        alt: "",
        width: 2000,
        height: 1200,
      })),
    });

    const result = buildSiteFindings({
      inspectedUrl: new URL("https://example.com/"),
      facts,
      resources: {
        html: okHtml,
        robotsTxt: okHtml,
        sitemapXml: okHtml,
        probedUrls: Array.from({ length: 20 }, (_, index) => ({
          url: `https://example.com/missing-${index}`,
          statusCode: 404,
          ok: false,
          contentType: "text/html",
          finalUrl: `https://example.com/missing-${index}`,
          error: null,
        })),
      },
      llmsTxt: okLlmsTxt,
    });

    expect(result.checks.length).toBeLessThanOrEqual(50);
    expect(result.checks.filter((check) => check.id === "site-broken-link"))
      .toHaveLength(1);
    expect(
      result.checks.find((check) => check.id === "site-broken-link")?.evidence,
    ).toHaveLength(10);
    expect(result.checks.filter((check) => check.id === "site-image-missing-alt"))
      .toHaveLength(1);
    expect(
      result.checks.find((check) => check.id === "site-image-missing-alt")
        ?.evidence,
    ).toHaveLength(10);
    expect(result.checks.filter((check) => check.id === "site-oversized-image"))
      .toHaveLength(1);
    expect(
      result.prioritizedIssues.filter(
        (issue) => issue.auditId === "site-broken-link",
      ),
    ).toHaveLength(1);
    expect(
      result.prioritizedIssues.filter(
        (issue) => issue.auditId === "site-image-missing-alt",
      ),
    ).toHaveLength(1);
  });

  it("treats @graph JSON-LD entries with @type as typed structured data", () => {
    const result = buildSiteFindings({
      inspectedUrl: new URL("https://example.com/"),
      facts: completeFacts({
        jsonLdBlocks: [
          {
            raw: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [{ "@type": "Organization", name: "Example" }],
            }),
          },
        ],
      }),
      resources: {
        html: okHtml,
        robotsTxt: okHtml,
        sitemapXml: okHtml,
        probedUrls: [],
      },
      llmsTxt: okLlmsTxt,
    });

    expect(result.checks.map((check) => check.id)).not.toContain(
      "site-json-ld-missing-type",
    );
  });

  it("aggregates repeated JSON-LD issue checks with bounded evidence", () => {
    const result = buildSiteFindings({
      inspectedUrl: new URL("https://example.com/"),
      facts: completeFacts({
        jsonLdBlocks: [
          ...Array.from({ length: 30 }, (_, index) => ({
            raw: `{invalid-${index}`,
          })),
          ...Array.from({ length: 30 }, (_, index) => ({
            raw: JSON.stringify({ name: `Untyped ${index}` }),
          })),
        ],
      }),
      resources: {
        html: okHtml,
        robotsTxt: okHtml,
        sitemapXml: okHtml,
        probedUrls: [
          {
            url: "https://example.com/missing",
            statusCode: 404,
            ok: false,
            contentType: "text/html",
            finalUrl: "https://example.com/missing",
            error: null,
          },
        ],
      },
      llmsTxt: okLlmsTxt,
    });

    expect(result.checks.length).toBeLessThanOrEqual(50);
    expect(result.checks.filter((check) => check.id === "site-invalid-json-ld"))
      .toHaveLength(1);
    expect(
      result.checks.find((check) => check.id === "site-invalid-json-ld")
        ?.evidence,
    ).toHaveLength(10);
    expect(
      result.checks.filter(
        (check) => check.id === "site-json-ld-missing-type",
      ),
    ).toHaveLength(1);
    expect(
      result.checks.find((check) => check.id === "site-json-ld-missing-type")
        ?.evidence,
    ).toHaveLength(10);
    expect(result.checks.map((check) => check.id)).toContain(
      "site-broken-link",
    );
    expect(
      result.prioritizedIssues.filter(
        (issue) => issue.auditId === "site-invalid-json-ld",
      ),
    ).toHaveLength(1);
    expect(
      result.prioritizedIssues.filter(
        (issue) => issue.auditId === "site-json-ld-missing-type",
      ),
    ).toHaveLength(1);
  });
});
