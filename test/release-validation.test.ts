import { describe, expect, it } from "vitest";

import { validateReleaseSurface } from "../scripts/release-validation.mjs";

describe("release surface validation", () => {
  const completeSurface = () => ({
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
    exampleJson: {
      status: "complete",
      target: { requestedUrl: "https://www.commalabs.co/tr" },
      environment: { generatedAt: "2026-06-14T12:00:00.000Z" },
      profiles: { mobile: {}, desktop: {} },
      prioritizedIssues: [
        {
          id: "link-name",
          title: "Links do not have a discernible name",
        },
      ],
      fixPacks: [
        {
          id: "fix-pack-link-name",
          sourceIssueIds: ["link-name"],
        },
      ],
    },
    exampleMarkdown:
      "# Lighthouse Implementation Report\n\n## Agent Fix Packs\n\n## Prioritized Issues",
    overviewSvg: "<svg><title>Agent Audit</title></svg>",
  });

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
        "Example report must contain at most 10 tasks",
        "Example report must include one fix pack per prioritized issue",
        "Example Markdown report must include agent fix packs",
      ]),
    );
  });

  it("accepts a complete release surface", () => {
    const failures = validateReleaseSurface(completeSurface());

    expect(failures).toEqual([]);
  });

  it("reports missing or mismatched example fix packs", () => {
    expect(
      validateReleaseSurface({
        ...completeSurface(),
        exampleJson: {
          ...completeSurface().exampleJson,
          fixPacks: undefined,
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        "Example report must include one fix pack per prioritized issue",
      ]),
    );

    expect(
      validateReleaseSurface({
        ...completeSurface(),
        exampleJson: {
          ...completeSurface().exampleJson,
          fixPacks: [],
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        "Example report must include one fix pack per prioritized issue",
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
    const failures = validateReleaseSurface({
      ...completeSurface(),
      exampleJson: {
        ...completeSurface().exampleJson,
        prioritizedIssues: [
          {
            acceptanceCriteria: [
              "Check passes in Lighthouse MCP site intelligence.",
            ],
          },
        ],
        fixPacks: [
          {
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
