import { describe, expect, it } from "vitest";

import { formatAuditReport } from "../src/report.js";

describe("formatAuditReport", () => {
  it("preserves valid zero scores and sorts opportunities by savings", () => {
    const report = formatAuditReport("https://example.com/", {
      categories: {
        performance: { score: 0 },
        accessibility: { score: 0.91 },
        "best-practices": { score: null },
        seo: { score: 1 },
      },
      audits: {
        "first-contentful-paint": { displayValue: "1.2 s" },
        "speed-index": { displayValue: "2.0 s" },
        "largest-contentful-paint": { displayValue: "2.5 s" },
        "total-blocking-time": { displayValue: "120 ms" },
        images: {
          title: "Properly size images",
          displayValue: "1.5 s",
          details: { type: "opportunity", overallSavingsMs: 1500 },
        },
        scripts: {
          title: "Reduce unused JavaScript",
          displayValue: "2.0 s",
          details: { type: "opportunity", overallSavingsMs: 2000 },
        },
        css: {
          title: "Reduce unused CSS",
          displayValue: "0.4 s",
          details: { type: "opportunity", overallSavingsMs: 400 },
        },
      },
    });

    expect(report).toContain("Performance: **0/100**");
    expect(report).toContain("Accessibility: **91/100**");
    expect(report).toContain("Best Practices: **N/A**");
    expect(report.indexOf("Reduce unused JavaScript")).toBeLessThan(
      report.indexOf("Properly size images"),
    );
    expect(report).not.toContain("Reduce unused CSS");
  });
});
