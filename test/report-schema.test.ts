import { describe, expect, it } from "vitest";

import {
  AGENT_INSTRUCTIONS,
  REPORT_SCHEMA_VERSION,
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
    expect(REPORT_SCHEMA_VERSION).toBe("1.0");
    expect(lighthouseReportOutputSchema.type).toBe("object");
    expect(lighthouseReportOutputSchema.additionalProperties).toBe(false);
    expect(lighthouseReportOutputSchema.required).toContain("profiles");
    expect(lighthouseReportOutputSchema.required).toContain("prioritizedIssues");
    expect(
      lighthouseReportOutputSchema.properties.prioritizedIssues.maxItems,
    ).toBe(10);
    expect(AGENT_INSTRUCTIONS).toHaveLength(9);
  });
});
