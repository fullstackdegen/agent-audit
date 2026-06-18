import { describe, expect, it } from "vitest";

import {
  AGENT_INSTRUCTIONS,
  REPORT_SCHEMA_VERSION,
  type AgentReadyLighthouseReport,
  lighthouseReportOutputSchema,
  parseAuditMode,
} from "../src/report-schema.js";

describe("report contract", () => {
  it("defaults to reliable mode and rejects unsupported modes", () => {
    expect(parseAuditMode(undefined)).toBe("reliable");
    expect(parseAuditMode("fast")).toBe("fast");
    expect(() => parseAuditMode("custom")).toThrow(/mode/i);
  });

  it("publishes a strict structured output schema", () => {
    expect(REPORT_SCHEMA_VERSION).toBe("1.1");
    expect(lighthouseReportOutputSchema.type).toBe("object");
    expect(lighthouseReportOutputSchema.additionalProperties).toBe(false);
    expect(lighthouseReportOutputSchema.required).toContain("profiles");
    expect(lighthouseReportOutputSchema.required).toContain("prioritizedIssues");
    expect(lighthouseReportOutputSchema.required).toContain("siteIntelligence");
    expect(
      lighthouseReportOutputSchema.properties.prioritizedIssues.maxItems,
    ).toBe(10);
    expect(AGENT_INSTRUCTIONS).toHaveLength(9);
  });

  it("requires nullable strict site intelligence output", () => {
    const siteIntelligenceSchema =
      lighthouseReportOutputSchema.properties.siteIntelligence;

    expect(siteIntelligenceSchema.anyOf).toEqual(
      expect.arrayContaining([
        { type: "null" },
        expect.objectContaining({
          type: "object",
          additionalProperties: false,
        }),
      ]),
    );

    const objectSchema = siteIntelligenceSchema.anyOf.find(
      (schema) => schema.type === "object",
    );

    expect(objectSchema?.required).toEqual([
      "status",
      "inspectedUrl",
      "fetchedResources",
      "checks",
      "llmsTxt",
      "prioritizedIssues",
    ]);
    expect(objectSchema?.properties.fetchedResources.required).toEqual([
      "html",
      "robotsTxt",
      "sitemapXml",
    ]);
    expect(objectSchema?.properties.checks.maxItems).toBe(50);
    expect(
      objectSchema?.properties.checks.items.properties.evidence.maxItems,
    ).toBe(10);
    expect(objectSchema?.properties.prioritizedIssues.items).toBe(
      lighthouseReportOutputSchema.properties.prioritizedIssues.items,
    );
  });

  it("allows typed reports to omit site intelligence details with null", () => {
    const report = {
      schemaVersion: REPORT_SCHEMA_VERSION,
      status: "complete",
      target: {
        requestedUrl: "https://example.com",
        finalUrls: {},
      },
      environment: {
        generatedAt: "2026-06-18T00:00:00.000Z",
        lighthouseVersion: "12.6.1",
        userAgent: "agent",
        mode: "fast",
        runsPerProfile: 1,
      },
      profiles: {
        mobile: emptyProfile("mobile"),
        desktop: emptyProfile("desktop"),
      },
      prioritizedIssues: [],
      siteIntelligence: null,
      agentInstructions: [...AGENT_INSTRUCTIONS],
    } satisfies AgentReadyLighthouseReport;

    expect(report.siteIntelligence).toBeNull();
  });
});

function emptyProfile(formFactor: "mobile" | "desktop") {
  const distribution = {
    median: null,
    min: null,
    max: null,
    samples: [],
    unit: "score",
  } as const;

  return {
    status: "complete",
    successfulRuns: 1,
    attemptedRuns: 1,
    failures: [],
    configuration: {
      formFactor,
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
      },
      throttlingMethod: "simulate",
    },
    scores: {
      performance: distribution,
      accessibility: distribution,
      "best-practices": distribution,
      seo: distribution,
    },
    metrics: {
      firstContentfulPaint: distribution,
      speedIndex: distribution,
      largestContentfulPaint: distribution,
      totalBlockingTime: distribution,
      cumulativeLayoutShift: distribution,
    },
    variabilityWarnings: [],
  } as const;
}
