import type {
  AgentFixPack,
  AgentReadyLighthouseReport,
  NumericDistribution,
  PrioritizedIssue,
  ProfileName,
} from "./report-schema.js";

const SCORE_ROWS = [
  ["Performance", "performance"],
  ["Accessibility", "accessibility"],
  ["Best Practices", "best-practices"],
  ["SEO", "seo"],
] as const;

const METRIC_ROWS = [
  ["First Contentful Paint", "firstContentfulPaint"],
  ["Speed Index", "speedIndex"],
  ["Largest Contentful Paint", "largestContentfulPaint"],
  ["Total Blocking Time", "totalBlockingTime"],
  ["Cumulative Layout Shift", "cumulativeLayoutShift"],
] as const;

export function renderReportMarkdown(
  report: AgentReadyLighthouseReport,
): string {
  const lines = [
    "# Lighthouse Implementation Report",
    "",
    `- Target: ${inline(report.target.requestedUrl)}`,
    `- Status: **${report.status}**`,
    `- Generated: ${report.environment.generatedAt}`,
    `- Mode: ${report.environment.mode} (${report.environment.runsPerProfile} run(s) per profile)`,
    `- Lighthouse: ${inline(report.environment.lighthouseVersion)}`,
    `- User agent: ${inline(report.environment.userAgent)}`,
  ];

  if (report.status === "incomplete") {
    lines.push(
      "",
      "> **Warning:** Do not use this incomplete report as a release baseline.",
    );
  }

  lines.push(
    "",
    "## Category Scores",
    "",
    "| Category | Mobile median (range) | Desktop median (range) |",
    "| --- | ---: | ---: |",
    ...SCORE_ROWS.map(
      ([label, key]) =>
        `| ${label} | ${formatDistribution(report.profiles.mobile.scores[key])} | ${formatDistribution(report.profiles.desktop.scores[key])} |`,
    ),
    "",
    "## Key Metrics",
    "",
    "| Metric | Mobile median (range) | Desktop median (range) |",
    "| --- | ---: | ---: |",
    ...METRIC_ROWS.map(
      ([label, key]) =>
        `| ${label} | ${formatDistribution(report.profiles.mobile.metrics[key])} | ${formatDistribution(report.profiles.desktop.metrics[key])} |`,
    ),
  );

  for (const profile of ["mobile", "desktop"] as const) {
    appendProfileWarnings(lines, profile, report);
  }

  appendSiteIntelligence(lines, report);
  appendFixPacks(lines, report);

  lines.push("", "## Prioritized Issues");
  if (report.prioritizedIssues.length === 0) {
    lines.push("", "No actionable Lighthouse issues were found.");
  } else {
    report.prioritizedIssues.forEach((issue, index) => {
      appendIssue(lines, issue, index + 1);
    });
  }

  lines.push("", "## Coding-Agent Instructions", "");
  report.agentInstructions.forEach((instruction, index) => {
    const rendered =
      instruction === "Treat structuredContent as the source of truth."
        ? "Treat `structuredContent` as the source of truth."
        : inline(instruction);
    lines.push(`${index + 1}. ${rendered}`);
  });

  return lines.join("\n");
}

function appendFixPacks(
  lines: string[],
  report: AgentReadyLighthouseReport,
): void {
  lines.push("", "## Agent Fix Packs");

  if (report.fixPacks.length === 0) {
    lines.push("", "No agent fix packs were generated.");
    return;
  }

  for (const pack of report.fixPacks) {
    appendFixPack(lines, pack);
  }
}

function appendFixPack(lines: string[], pack: AgentFixPack): void {
  lines.push(
    "",
    `### Fix Pack ${pack.priority}: ${inline(pack.goal)}`,
    "",
    `- Severity: **${inline(pack.severity)}**`,
    `- Category: ${inline(pack.category)}`,
    `- Affected profiles: ${pack.affectedProfiles.map((profile) => inline(profile)).join(", ")}`,
    `- Source issues: ${pack.sourceIssueIds.map((id) => codeSpan(id)).join(", ")}`,
    "- Repository search hints:",
  );

  for (const hint of pack.repoSearchHints) {
    lines.push(`  - ${codeSpan(hint)}`);
  }

  lines.push("- Implementation steps:");
  for (const step of pack.implementationSteps) {
    lines.push(`  - ${codeSpan(step)}`);
  }

  lines.push("- Acceptance criteria:");
  for (const criterion of pack.acceptanceCriteria) {
    lines.push(`  - ${codeSpan(criterion)}`);
  }

  lines.push(
    `- Verification: rerun this tool in ${codeSpan(pack.verification.rerunMode)} mode; expected audit IDs: ${pack.verification.expectedAuditIds.map((id) => codeSpan(id)).join(", ")}`,
  );
}

function appendSiteIntelligence(
  lines: string[],
  report: AgentReadyLighthouseReport,
): void {
  const siteIntelligence = report.siteIntelligence;
  if (!siteIntelligence) {
    return;
  }

  lines.push(
    "",
    "## Site Intelligence",
    "",
    `- Status: **${siteIntelligence.status}**`,
    `- Inspected URL: ${inline(siteIntelligence.inspectedUrl)}`,
    `- Checks: ${siteIntelligence.checks.length}`,
  );

  const nonPassChecks = siteIntelligence.checks
    .filter((check) => check.status !== "pass")
    .slice(0, 10);
  for (const check of nonPassChecks) {
    lines.push(
      `- **${check.status.toUpperCase()}** ${inline(check.title)} (${inline(check.id)})`,
    );
  }

  if (siteIntelligence.llmsTxt.text) {
    const fence = markdownFenceFor(siteIntelligence.llmsTxt.text);
    lines.push(
      "",
      "### Generated llms.txt Draft",
      "",
      `${fence}txt`,
      siteIntelligence.llmsTxt.text,
      fence,
    );
  }
}

function appendProfileWarnings(
  lines: string[],
  profile: ProfileName,
  report: AgentReadyLighthouseReport,
): void {
  const profileReport = report.profiles[profile];
  if (
    profileReport.status === "complete" &&
    profileReport.variabilityWarnings.length === 0
  ) {
    return;
  }

  lines.push("", `### ${capitalize(profile)} Measurement Warnings`, "");
  if (profileReport.status !== "complete") {
    lines.push(
      `- Profile status: **${profileReport.status}** (${profileReport.successfulRuns}/${profileReport.attemptedRuns} successful runs).`,
    );
  }
  for (const warning of profileReport.variabilityWarnings) {
    lines.push(`- ${inline(warning)}`);
  }
  for (const failure of profileReport.failures) {
    lines.push(`- Run failure: ${inline(failure)}`);
  }
}

function appendIssue(
  lines: string[],
  issue: PrioritizedIssue,
  position: number,
): void {
  lines.push(
    "",
    `### ${position}. ${inline(issue.title)}`,
    "",
    `- Audit: \`${inline(issue.auditId)}\``,
    `- Category: ${issue.category}`,
    `- Severity: **${issue.severity}**`,
    `- Affected profiles: ${issue.affectedProfiles.join(", ")}`,
    `- Description: ${inline(issue.description)}`,
  );

  for (const profile of issue.affectedProfiles) {
    const data = issue.profiles[profile];
    if (!data) continue;
    lines.push(
      `- ${capitalize(profile)} result: score ${data.score ?? "N/A"}; ${inline(data.displayValue ?? "no display value")}`,
    );
    if (
      data.impact.estimatedSavingsMs != null ||
      data.impact.estimatedSavingsBytes != null
    ) {
      lines.push(
        `- ${capitalize(profile)} impact: ${data.impact.estimatedSavingsMs ?? 0} ms, ${data.impact.estimatedSavingsBytes ?? 0} bytes estimated savings`,
      );
    }
    for (const evidence of data.evidence) {
      const fields = [
        evidence.url ? `URL ${inline(evidence.url)}` : null,
        evidence.selector ? `selector ${inline(evidence.selector)}` : null,
        evidence.snippet ? `snippet ${inline(evidence.snippet)}` : null,
        evidence.wastedBytes != null
          ? `${evidence.wastedBytes} wasted bytes`
          : null,
        evidence.wastedMs != null ? `${evidence.wastedMs} wasted ms` : null,
      ].filter((value): value is string => value !== null);
      lines.push(`  - Evidence: ${fields.join("; ")}`);
    }
  }

  lines.push("- Suggested actions:");
  for (const action of issue.suggestedActions) {
    lines.push(`  - ${inline(action)}`);
  }
  lines.push("- Acceptance criteria:");
  for (const criterion of issue.acceptanceCriteria) {
    lines.push(`  - ${inline(criterion)}`);
  }
  if (issue.documentationUrl) {
    lines.push(`- Documentation: ${inline(issue.documentationUrl)}`);
  }
}

function formatDistribution(distribution: NumericDistribution): string {
  if (distribution.median == null) {
    return "N/A";
  }
  const suffix =
    distribution.unit === "score"
      ? "/100"
      : distribution.unit === "ms"
        ? " ms"
        : "";
  return `${formatNumber(distribution.median)}${suffix} (${formatNumber(distribution.min)}-${formatNumber(distribution.max)}${suffix})`;
}

function formatNumber(value: number | null): string {
  if (value == null) return "N/A";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function inline(value: string): string {
  return value.replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function codeSpan(value: string): string {
  const sanitized = inline(value);
  const longestBacktickRun = Math.max(
    0,
    ...[...sanitized.matchAll(/`+/g)].map((match) => match[0].length),
  );
  const fence = "`".repeat(longestBacktickRun + 1);
  const padding =
    sanitized.startsWith("`") || sanitized.endsWith("`") ? " " : "";

  return `${fence}${padding}${sanitized}${padding}${fence}`;
}

function markdownFenceFor(value: string): string {
  const longestBacktickRun = Math.max(
    0,
    ...[...value.matchAll(/`+/g)].map((match) => match[0].length),
  );
  return "`".repeat(Math.max(3, longestBacktickRun + 1));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
