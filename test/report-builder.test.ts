import { describe, expect, it } from "vitest";

import { buildAgentReadyReport } from "../src/report-builder.js";
import type { SiteIntelligenceReport } from "../src/report-schema.js";
import { makeLighthouseResult } from "./fixtures/lighthouse-results.js";

describe("buildAgentReadyReport", () => {
  it("uses medians and includes complete mobile and desktop profiles", () => {
    const report = buildAgentReadyReport({
      requestedUrl: "https://example.com",
      mode: "reliable",
      generatedAt: new Date("2026-06-13T12:00:00.000Z"),
      profiles: {
        mobile: {
          attemptedRuns: 3,
          failures: [],
          runs: [
            makeLighthouseResult({ performance: 0.6, lcpMs: 3000 }),
            makeLighthouseResult({ performance: 0.8, lcpMs: 2000 }),
            makeLighthouseResult({ performance: 0.7, lcpMs: 2500 }),
          ],
        },
        desktop: {
          attemptedRuns: 3,
          failures: [],
          runs: [
            makeLighthouseResult({
              formFactor: "desktop",
              performance: 0.9,
            }),
            makeLighthouseResult({
              formFactor: "desktop",
              performance: 1,
            }),
            makeLighthouseResult({
              formFactor: "desktop",
              performance: 0.95,
            }),
          ],
        },
      },
    });

    expect(report.status).toBe("complete");
    expect(report.profiles.mobile.scores.performance.median).toBe(70);
    expect(
      report.profiles.mobile.metrics.largestContentfulPaint.median,
    ).toBe(2500);
    expect(report.profiles.desktop.scores.performance.median).toBe(95);
    expect(report.prioritizedIssues.length).toBeGreaterThan(0);
    expect(report.siteIntelligence).toBeNull();
    expect(report.environment.generatedAt).toBe("2026-06-13T12:00:00.000Z");
  });

  it("marks a report incomplete when only one profile has enough successful runs", () => {
    const report = buildAgentReadyReport({
      requestedUrl: "https://example.com",
      mode: "reliable",
      generatedAt: new Date("2026-06-13T12:00:00.000Z"),
      profiles: {
        mobile: {
          attemptedRuns: 3,
          failures: ["timeout", "timeout"],
          runs: [makeLighthouseResult()],
        },
        desktop: {
          attemptedRuns: 3,
          failures: [],
          runs: [
            makeLighthouseResult({ formFactor: "desktop" }),
            makeLighthouseResult({ formFactor: "desktop" }),
            makeLighthouseResult({ formFactor: "desktop" }),
          ],
        },
      },
    });

    expect(report.status).toBe("incomplete");
    expect(report.profiles.mobile.status).toBe("incomplete");
    expect(report.profiles.desktop.status).toBe("complete");
  });

  it("rejects a collection with no usable profile", () => {
    expect(() =>
      buildAgentReadyReport({
        requestedUrl: "https://example.com",
        mode: "fast",
        generatedAt: new Date("2026-06-13T12:00:00.000Z"),
        profiles: {
          mobile: { attemptedRuns: 1, failures: ["failed"], runs: [] },
          desktop: { attemptedRuns: 1, failures: ["failed"], runs: [] },
        },
      }),
    ).toThrow(/No Lighthouse profile/i);
  });

  it("includes site intelligence and merges site issues into the top-level backlog", () => {
    const mobileResult = makeLighthouseResult();
    for (let index = 0; index < 12; index += 1) {
      const auditId = `custom-audit-${index}`;
      mobileResult.categories.performance.auditRefs.push({
        id: auditId,
        weight: 1,
        group: "performance",
      });
      mobileResult.audits[auditId] = {
        id: auditId,
        title: `Custom audit ${index}`,
        description: `Custom audit ${index}`,
        score: 0.5,
        scoreDisplayMode: "metricSavings",
        details: {
          type: "opportunity",
          overallSavingsBytes: 1000 + index,
          items: [
            {
              url: `https://example.com/${index}.js`,
              wastedBytes: 1000 + index,
            },
          ],
        },
      };
    }

    const siteIntelligence: SiteIntelligenceReport = {
      status: "complete",
      inspectedUrl: "https://example.com/",
      fetchedResources: {
        html: {
          url: "https://example.com/",
          statusCode: 200,
          ok: true,
          contentType: "text/html",
          finalUrl: "https://example.com/",
          error: null,
        },
        robotsTxt: null,
        sitemapXml: null,
      },
      checks: [],
      llmsTxt: {
        status: "generated",
        text: "# Example",
        evidence: ["Used document title."],
      },
      prioritizedIssues: [
        {
          auditId: "site-broken-link",
          category: "seo",
          severity: "high",
          affectedProfiles: ["mobile", "desktop"],
          title: "Broken link detected",
          description: "A linked URL returned an error status.",
          profiles: {},
          suggestedActions: ["Fix or remove the broken link."],
          acceptanceCriteria: ["The broken-link check passes."],
          documentationUrl: null,
        },
      ],
    };

    const report = buildAgentReadyReport({
      requestedUrl: "https://example.com",
      mode: "fast",
      generatedAt: new Date("2026-06-13T12:00:00.000Z"),
      siteIntelligence,
      profiles: {
        mobile: {
          attemptedRuns: 1,
          failures: [],
          runs: [mobileResult],
        },
        desktop: {
          attemptedRuns: 1,
          failures: [],
          runs: [makeLighthouseResult({ formFactor: "desktop" })],
        },
      },
    });

    expect(report.siteIntelligence).toBe(siteIntelligence);
    expect(report.prioritizedIssues[0]?.auditId).toBe("site-broken-link");
    expect(report.prioritizedIssues.map((issue) => issue.auditId)).toContain(
      "site-broken-link",
    );
    expect(report.prioritizedIssues).toHaveLength(10);
  });
});
