export interface LighthouseCategory {
  score: number | null;
}

export interface LighthouseAudit {
  title?: string;
  displayValue?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
  } | null;
}

export interface LighthouseReport {
  categories: {
    performance?: LighthouseCategory;
    accessibility?: LighthouseCategory;
    "best-practices"?: LighthouseCategory;
    seo?: LighthouseCategory;
  };
  audits: Record<string, LighthouseAudit>;
}

const METRICS = [
  ["first-contentful-paint", "First Contentful Paint (FCP)"],
  ["speed-index", "Speed Index"],
  ["largest-contentful-paint", "Largest Contentful Paint (LCP)"],
  ["total-blocking-time", "Total Blocking Time (TBT)"],
] as const;

/**
 * Converts a Lighthouse result into a compact Markdown report for MCP clients.
 */
export function formatAuditReport(url: string, report: LighthouseReport): string {
  const opportunities = Object.values(report.audits)
    .filter(isOpportunity)
    .sort(
      (left, right) =>
        (right.details?.overallSavingsMs ?? 0) -
        (left.details?.overallSavingsMs ?? 0),
    )
    .slice(0, 2)
    .map(
      (audit) =>
        `- **${audit.title ?? "Untitled opportunity"}**: ${audit.displayValue ?? "Savings available"}`,
    );

  const metrics = METRICS.map(
    ([auditId, label]) =>
      `- **${label}:** ${report.audits[auditId]?.displayValue ?? "N/A"}`,
  );

  return [
    `### Google Lighthouse Audit Results: ${url}`,
    "",
    "**Core Audit Scores:**",
    `- Performance: **${formatScore(report.categories.performance?.score)}**`,
    `- Accessibility: **${formatScore(report.categories.accessibility?.score)}**`,
    `- Best Practices: **${formatScore(report.categories["best-practices"]?.score)}**`,
    `- SEO: **${formatScore(report.categories.seo?.score)}**`,
    "",
    "**Key Performance Metrics:**",
    ...metrics,
    ...(opportunities.length > 0
      ? ["", "**Top Performance Optimization Opportunities:**", ...opportunities]
      : []),
  ].join("\n");
}

function formatScore(score: number | null | undefined): string {
  return score == null ? "N/A" : `${Math.round(score * 100)}/100`;
}

function isOpportunity(audit: LighthouseAudit): boolean {
  return (
    audit.details?.type === "opportunity" &&
    (audit.details.overallSavingsMs ?? 0) > 0
  );
}
