import { describe, expect, it } from "vitest";

import { buildFixPacks } from "../src/fix-packs.js";
import type { PrioritizedIssue } from "../src/report-schema.js";

describe("buildFixPacks", () => {
  it("generates deterministic fix packs from prioritized issues", () => {
    const issues = Array.from({ length: 12 }, (_, index) =>
      makeIssue({
        auditId: `Audit ID ${index}`,
        title: `CUSTOM ISSUE ${index}`,
      }),
    );

    const packs = buildFixPacks(issues);

    expect(packs).toHaveLength(10);
    expect(packs[0]).toEqual({
      id: "fix-audit-id-0",
      priority: 1,
      sourceIssueIds: ["Audit ID 0"],
      goal: "Fix Custom issue 0.",
      category: "performance",
      severity: "high",
      affectedProfiles: ["mobile", "desktop"],
      repoSearchHints: [
        "main img.hero",
        "https://example.com/hero.png",
        '<img class="hero">',
        ".cta",
        "https://example.com/page",
        "Start trial",
      ],
      implementationSteps: [
        "Inspect the repository for the evidence listed in repoSearchHints before editing.",
        "Update the relevant component.",
        "Remove the regression.",
        "Keep changes focused on source issue IDs: Audit ID 0.",
      ],
      acceptanceCriteria: [
        "The audit passes.",
        "The page remains accessible.",
      ],
      verification: {
        rerunMode: "reliable",
        expectedAuditIds: ["Audit ID 0"],
      },
    });
    expect(buildFixPacks(issues)).toEqual(packs);
  });

  it("falls back to title-based search hints when evidence is empty", () => {
    const packs = buildFixPacks([
      makeIssue({
        auditId: "meta-description",
        title: "Document does not have a meta description",
        profiles: {},
      }),
    ]);

    expect(packs[0]?.repoSearchHints).toEqual([
      "Search for user-visible content related to: Document does not have a meta description",
    ]);
  });

  it("keeps the source issue focus step when suggested actions exceed the cap", () => {
    const [pack] = buildFixPacks([
      makeIssue({
        auditId: "render-blocking-resources",
        suggestedActions: [
          "Action 1.",
          "Action 2.",
          "Action 3.",
          "Action 4.",
          "Action 5.",
        ],
      }),
    ]);

    expect(pack?.implementationSteps).toHaveLength(6);
    expect(pack?.implementationSteps.at(-1)).toBe(
      "Keep changes focused on source issue IDs: render-blocking-resources.",
    );
  });

  it("adds fallback acceptance criteria when source criteria are empty", () => {
    const [pack] = buildFixPacks([
      makeIssue({
        auditId: "uses-rel-preconnect",
        acceptanceCriteria: [],
      }),
    ]);

    expect(pack?.acceptanceCriteria).toEqual([
      "The uses-rel-preconnect audit no longer appears in the prioritized issue list after rerunning in reliable mode.",
    ]);
  });

  it("generates unique deterministic IDs when audit IDs slugify to the same value", () => {
    const packs = buildFixPacks([
      makeIssue({ auditId: "link name" }),
      makeIssue({ auditId: "link-name" }),
      makeIssue({ auditId: "!!!" }),
      makeIssue({ auditId: "???" }),
    ]);

    expect(packs.map((pack) => pack.id)).toEqual([
      "fix-link-name",
      "fix-link-name-2",
      "fix-issue",
      "fix-issue-4",
    ]);
  });
});

function makeIssue(overrides: Partial<PrioritizedIssue> = {}): PrioritizedIssue {
  return {
    auditId: "image-alt",
    category: "performance",
    severity: "high",
    affectedProfiles: ["mobile", "desktop"],
    title: "Images do not have alt text",
    description: "Image elements must have alternative text.",
    profiles: {
      mobile: {
        score: 0,
        displayValue: null,
        impact: {
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
        },
        evidence: [
          {
            url: "https://example.com/hero.png",
            selector: "main img.hero",
            snippet: '<img class="hero">',
            totalBytes: null,
            wastedBytes: null,
            wastedMs: null,
          },
          {
            url: "https://example.com/hero.png",
            selector: "main img.hero",
            snippet: '<img class="hero">',
            totalBytes: null,
            wastedBytes: null,
            wastedMs: null,
          },
        ],
      },
      desktop: {
        score: 0,
        displayValue: null,
        impact: {
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
        },
        evidence: [
          {
            url: "https://example.com/page",
            selector: ".cta",
            snippet: "Start trial",
            totalBytes: null,
            wastedBytes: null,
            wastedMs: null,
          },
        ],
      },
    },
    suggestedActions: ["Update the relevant component.", "Remove the regression."],
    acceptanceCriteria: ["The audit passes.", "The page remains accessible."],
    documentationUrl: null,
    ...overrides,
  };
}
