import { describe, expect, it } from "vitest";

import { validateReleaseSurface } from "../scripts/release-validation.mjs";
import { renderReportMarkdown } from "../src/markdown.js";
import {
  AGENT_INSTRUCTIONS,
  REPORT_SCHEMA_VERSION,
  type AgentReadyLighthouseReport,
} from "../src/report-schema.js";

describe("release surface validation", () => {
  const completeSurface = () => {
    const exampleJson = minimalReport();
    return {
      packageJson: {
        name: "agent-audit",
        description: "Turn Lighthouse audits into coding-agent fix packs.",
        bin: { "agent-audit": "dist/index.js" },
        repository: { url: "https://github.com/example/lighthouse-mcp.git" },
        homepage: "https://github.com/example/lighthouse-mcp#readme",
        bugs: { url: "https://github.com/example/lighthouse-mcp/issues" },
        scripts: {
          prepublishOnly:
            "npm test && npm run check && npm run build && npm run validate:release",
        },
      },
      readme: "Turn Lighthouse audits into coding-agent fix packs.",
      contributing: "Preserve the 10-issue response limit.",
      exampleJson,
      exampleMarkdown: renderReportMarkdown(exampleJson),
      overviewSvg: "<svg><title>Agent Audit</title></svg>",
    };
  };

  it("reports missing metadata, obsolete limits, and oversized examples", () => {
    const failures = validateReleaseSurface({
      packageJson: {
        name: "old-package-name",
        description: "Old package promise.",
        bin: {},
        scripts: {
          prepublishOnly:
            "npm test && npm run check && npm run build && npm run validate:release",
        },
      },
      readme: "# Lighthouse MCP",
      contributing: "Preserve the 20-issue response limit.",
      exampleJson: {
        ...minimalReport(),
        status: "complete",
        prioritizedIssues: Array.from({ length: 11 }, () => ({})),
      },
      exampleMarkdown: "# Lighthouse Implementation Report",
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "package.json name must be agent-audit",
        "package.json must expose the agent-audit binary",
        "package.json description must match the product promise",
        "package.json repository.url is required",
        "package.json homepage is required",
        "package.json bugs.url is required",
        "README must contain the product promise",
        "README must not contain stale Lighthouse MCP branding",
        "CONTRIBUTING must not reference the obsolete 20-issue limit",
        "Example JSON must satisfy the advertised output schema",
        "Example Markdown must match the canonical renderer output",
        "Example report must contain at most 10 tasks",
        "Example Markdown report must include agent fix packs",
      ]),
    );
  });

  it("accepts a complete release surface", () => {
    const failures = validateReleaseSurface(completeSurface());

    expect(failures).toEqual([]);
  });

  it("reports missing or mismatched example fix packs", () => {
    const surface = completeSurface();
    expect(
      validateReleaseSurface({
        ...surface,
        exampleJson: {
          ...surface.exampleJson,
          fixPacks: undefined,
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        "Example JSON must satisfy the advertised output schema",
        "Example Markdown must match the canonical renderer output",
        "Example report must include one fix pack per prioritized issue",
      ]),
    );

    expect(
      validateReleaseSurface({
        ...surface,
        exampleJson: {
          ...surface.exampleJson,
          fixPacks: [],
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        "Example Markdown must match the canonical renderer output",
        "Example report must include one fix pack per prioritized issue",
      ]),
    );
  });

  it("reports schema-invalid example JSON", () => {
    const surface = completeSurface();
    const failures = validateReleaseSurface({
      ...surface,
      exampleJson: {
        ...surface.exampleJson,
        schemaVersion: "0.1",
      },
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "Example JSON must satisfy the advertised output schema",
      ]),
    );
  });

  it("reports stale example Markdown", () => {
    const failures = validateReleaseSurface({
      ...completeSurface(),
      exampleMarkdown: `${completeSurface().exampleMarkdown}\n`,
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "Example Markdown must match the canonical renderer output",
      ]),
    );
  });

  it("reports a missing agent fix pack Markdown section", () => {
    const failures = validateReleaseSurface({
      ...completeSurface(),
      exampleMarkdown: "# Lighthouse Implementation Report\n\n## Prioritized Issues",
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "Example Markdown report must include agent fix packs",
      ]),
    );
  });

  it("reports wrong package identity and missing agent-audit binary", () => {
    const failures = validateReleaseSurface({
      ...completeSurface(),
      packageJson: {
        name: "mcp-server-lighthouse",
        description: "Turn Lighthouse audits into coding-agent fix packs.",
        bin: { "mcp-server-lighthouse": "dist/index.js" },
        repository: { url: "https://github.com/example/lighthouse-mcp.git" },
        homepage: "https://github.com/example/lighthouse-mcp#readme",
        bugs: { url: "https://github.com/example/lighthouse-mcp/issues" },
        scripts: {
          prepublishOnly:
            "npm test && npm run check && npm run build && npm run validate:release",
        },
      },
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "package.json name must be agent-audit",
        "package.json must expose the agent-audit binary",
      ]),
    );
  });

  it("reports stale public branding in examples and overview assets", () => {
    const surface = completeSurface();
    const failures = validateReleaseSurface({
      ...surface,
      exampleJson: {
        ...surface.exampleJson,
        prioritizedIssues: [
          {
            ...surface.exampleJson.prioritizedIssues[0],
            acceptanceCriteria: [
              "Check passes in Lighthouse MCP site intelligence.",
            ],
          },
        ],
        fixPacks: [
          {
            ...surface.exampleJson.fixPacks[0],
            sourceIssueIds: ["legacy-branding"],
          },
        ],
      },
      exampleMarkdown:
        "# Lighthouse Implementation Report\n\n## Agent Fix Packs\n\nRun with mcp-server-lighthouse.",
      overviewSvg:
        "<svg><title>Lighthouse MCP converts raw audits</title></svg>",
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        "Example Markdown must not contain stale Lighthouse MCP branding",
        "Example JSON must not contain stale Lighthouse MCP branding",
        "Overview SVG must not contain stale Lighthouse MCP branding",
      ]),
    );
  });
});

function minimalReport(): AgentReadyLighthouseReport {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    status: "complete",
    target: {
      requestedUrl: "https://www.commalabs.co/tr",
      finalUrls: {
        mobile: "https://www.commalabs.co/tr",
        desktop: "https://www.commalabs.co/tr",
      },
    },
    environment: {
      generatedAt: "2026-06-14T12:00:00.000Z",
      lighthouseVersion: "12.6.1",
      userAgent: "agent-audit-test",
      mode: "fast",
      runsPerProfile: 1,
    },
    profiles: {
      mobile: minimalProfile("mobile"),
      desktop: minimalProfile("desktop"),
    },
    prioritizedIssues: [
      {
        auditId: "link-name",
        category: "accessibility",
        severity: "high",
        affectedProfiles: ["mobile", "desktop"],
        title: "Links do not have a discernible name",
        description: "Add accessible names to links.",
        profiles: {
          mobile: minimalFindingProfile(),
          desktop: minimalFindingProfile(),
        },
        suggestedActions: ["Add descriptive link text."],
        acceptanceCriteria: ["Links expose accessible names."],
        documentationUrl: null,
      },
    ],
    fixPacks: [
      {
        id: "fix-pack-link-name",
        priority: 1,
        sourceIssueIds: ["link-name"],
        goal: "Add accessible link names",
        category: "accessibility",
        severity: "high",
        affectedProfiles: ["mobile", "desktop"],
        repoSearchHints: ["link-name"],
        implementationSteps: ["Add aria-labels or visible link text."],
        acceptanceCriteria: ["The link-name audit passes."],
        verification: {
          rerunMode: "reliable",
          expectedAuditIds: ["link-name"],
        },
      },
    ],
    siteIntelligence: null,
    agentInstructions: [...AGENT_INSTRUCTIONS],
  };
}

function minimalProfile(formFactor: "mobile" | "desktop") {
  const scoreDistribution = minimalDistribution("score");
  const metricDistribution = minimalDistribution("ms");

  return {
    status: "complete",
    successfulRuns: 1,
    attemptedRuns: 1,
    failures: [],
    configuration: {
      formFactor,
      viewport: {
        width: formFactor === "mobile" ? 390 : 1350,
        height: formFactor === "mobile" ? 844 : 940,
        deviceScaleFactor: formFactor === "mobile" ? 3 : 1,
      },
      throttlingMethod: "simulate",
    },
    scores: {
      performance: scoreDistribution,
      accessibility: scoreDistribution,
      "best-practices": scoreDistribution,
      seo: scoreDistribution,
    },
    metrics: {
      firstContentfulPaint: metricDistribution,
      speedIndex: metricDistribution,
      largestContentfulPaint: metricDistribution,
      totalBlockingTime: metricDistribution,
      cumulativeLayoutShift: minimalDistribution("unitless"),
    },
    variabilityWarnings: [],
  } as const;
}

function minimalDistribution(unit: "score" | "ms" | "unitless") {
  return {
    median: null,
    min: null,
    max: null,
    samples: [],
    unit,
  } as const;
}

function minimalFindingProfile() {
  return {
    score: null,
    displayValue: null,
    impact: {
      estimatedSavingsMs: null,
      estimatedSavingsBytes: null,
    },
    evidence: [],
  } as const;
}
