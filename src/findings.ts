import {
  getRecommendation,
  hasRecommendation,
} from "./recommendations.js";
import type {
  CategoryName,
  FindingProfileData,
  PrioritizedIssue,
  ProfileName,
  ReportEvidence,
  Severity,
} from "./report-schema.js";

interface LighthouseAuditLike {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    items?: unknown[];
  } | null;
}

interface LighthouseResultLike {
  categories: Record<
    string,
    { auditRefs?: Array<{ id: string }> } | undefined
  >;
  audits: Record<string, LighthouseAuditLike>;
}

export interface ProfileFinding {
  auditId: string;
  category: CategoryName;
  severity: Severity;
  profile: ProfileName;
  title: string;
  description: string;
  profileData: FindingProfileData;
}

const EXCLUDED_MODES = new Set(["manual", "notApplicable", "informative"]);
const CATEGORY_ORDER: CategoryName[] = [
  "accessibility",
  "performance",
  "best-practices",
  "seo",
];
const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];
const AUDIT_ALIASES: Record<string, string> = {
  "legacy-javascript-insight": "legacy-javascript",
  "render-blocking-insight": "render-blocking-resources",
};
const METRIC_AUDITS = new Set([
  "first-contentful-paint",
  "speed-index",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "interactive",
  "max-potential-fid",
]);
const SECURITY_CRITICAL_AUDITS = new Set(["is-on-https"]);

export function extractProfileFindings(
  profile: ProfileName,
  input: unknown,
): ProfileFinding[] {
  const result = input as LighthouseResultLike;
  const membership = buildCategoryMembership(result);
  const findings: ProfileFinding[] = [];

  for (const [auditId, audit] of Object.entries(result.audits)) {
    const category = membership.get(auditId);
    const canonicalAuditId = canonicalizeAuditId(auditId);
    const evidence = extractEvidence(audit.details);
    if (
      !category ||
      !isActionable(audit) ||
      !isEligibleTask(canonicalAuditId, audit, evidence)
    ) {
      continue;
    }

    findings.push({
      auditId: canonicalAuditId,
      category,
      severity: deriveSeverity(audit, category, evidence),
      profile,
      title: sanitizeText(audit.title ?? auditId, 160),
      description: sanitizeText(audit.description ?? "", 600),
      profileData: {
        score: finiteOrNull(audit.score),
        displayValue: sanitizeNullableText(audit.displayValue, 200),
        impact: {
          estimatedSavingsMs: finiteOrNull(audit.details?.overallSavingsMs),
          estimatedSavingsBytes: finiteOrNull(
            audit.details?.overallSavingsBytes,
          ),
        },
        evidence,
      },
    });
  }

  return findings;
}

export function mergeAndPrioritizeFindings(
  findings: ProfileFinding[],
): PrioritizedIssue[] {
  const merged = new Map<string, PrioritizedIssue>();

  for (const finding of findings) {
    const existing = merged.get(finding.auditId);
    if (!existing) {
      const recommendation = getRecommendation(
        finding.auditId,
        finding.profile,
      );
      merged.set(finding.auditId, {
        auditId: finding.auditId,
        category: finding.category,
        severity: finding.severity,
        affectedProfiles: [finding.profile],
        title: finding.title,
        description: finding.description,
        profiles: { [finding.profile]: finding.profileData },
        suggestedActions: recommendation.suggestedActions,
        acceptanceCriteria: unique([
          ...recommendation.acceptanceCriteria,
          categoryScoreCriterion(finding.category),
        ]),
        documentationUrl: recommendation.documentationUrl,
      });
      continue;
    }

    existing.profiles[finding.profile] = mergeProfileData(
      existing.profiles[finding.profile],
      finding.profileData,
    );
    if (!existing.affectedProfiles.includes(finding.profile)) {
      existing.affectedProfiles.push(finding.profile);
      existing.affectedProfiles.sort(
        (left, right) =>
          profileOrder(left) - profileOrder(right),
      );
    }
    if (
      SEVERITY_ORDER.indexOf(finding.severity) <
      SEVERITY_ORDER.indexOf(existing.severity)
    ) {
      existing.severity = finding.severity;
    }
    const recommendation = getRecommendation(
      finding.auditId,
      finding.profile,
    );
    existing.acceptanceCriteria = unique([
      ...existing.acceptanceCriteria,
      ...recommendation.acceptanceCriteria,
    ]);
  }

  return [...merged.values()]
    .sort(compareIssues)
    .slice(0, 10);
}

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/```+/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function extractEvidence(
  details: LighthouseAuditLike["details"],
): ReportEvidence[] {
  if (!details?.items || !Array.isArray(details.items)) {
    return [];
  }

  const evidence = new Map<string, ReportEvidence>();
  for (const rawItem of details.items) {
    if (!isRecord(rawItem)) {
      continue;
    }
    const node = isRecord(rawItem.node) ? rawItem.node : undefined;
    const sourceLocation = isRecord(rawItem.sourceLocation)
      ? rawItem.sourceLocation
      : undefined;
    const row: ReportEvidence = {
      url: sanitizeNullableText(
        rawItem.url ?? rawItem.href ?? sourceLocation?.url,
        500,
      ),
      selector: sanitizeNullableText(node?.selector ?? rawItem.selector, 300),
      snippet: sanitizeNullableText(
        node?.snippet ??
          rawItem.snippet ??
          rawItem.text ??
          rawItem.description ??
          rawItem.failureReason ??
          rawItem.source,
        500,
      ),
      totalBytes: finiteOrNull(rawItem.totalBytes),
      wastedBytes: finiteOrNull(rawItem.wastedBytes),
      wastedMs: finiteOrNull(rawItem.wastedMs),
    };
    if (Object.values(row).every((value) => value == null || value === "")) {
      continue;
    }
    evidence.set(JSON.stringify(row), row);
    if (evidence.size === 10) {
      break;
    }
  }
  return [...evidence.values()];
}

function buildCategoryMembership(
  result: LighthouseResultLike,
): Map<string, CategoryName> {
  const membership = new Map<string, CategoryName>();
  for (const category of CATEGORY_ORDER) {
    for (const reference of result.categories[category]?.auditRefs ?? []) {
      if (!membership.has(reference.id)) {
        membership.set(reference.id, category);
      }
    }
  }
  return membership;
}

function isActionable(audit: LighthouseAuditLike): boolean {
  if (EXCLUDED_MODES.has(audit.scoreDisplayMode ?? "")) {
    return false;
  }
  const savings =
    (audit.details?.overallSavingsMs ?? 0) > 0 ||
    (audit.details?.overallSavingsBytes ?? 0) > 0;
  return savings || (typeof audit.score === "number" && audit.score < 1);
}

function isEligibleTask(
  auditId: string,
  audit: LighthouseAuditLike,
  evidence: ReportEvidence[],
): boolean {
  if (METRIC_AUDITS.has(auditId)) {
    return false;
  }
  const diagnostic =
    auditId.endsWith("-insight") ||
    audit.scoreDisplayMode === "informative" ||
    audit.details?.type === "debugdata";
  return !diagnostic || evidence.length > 0 || hasRecommendation(auditId);
}

function deriveSeverity(
  audit: LighthouseAuditLike,
  category: CategoryName,
  evidence: ReportEvidence[],
): Severity {
  const score = audit.score;
  const savingsMs = audit.details?.overallSavingsMs ?? 0;
  if (
    SECURITY_CRITICAL_AUDITS.has(audit.id ?? "") ||
    savingsMs > 1000 ||
    (category === "accessibility" && evidence.some((row) => row.selector))
  ) {
    return "critical";
  }
  if (
    score === 0 ||
    (typeof score === "number" && score < 0.5) ||
    savingsMs > 500 ||
    (audit.details?.overallSavingsBytes ?? 0) > 50 * 1024
  ) {
    return "high";
  }
  if (
    (typeof score === "number" && score < 0.9) ||
    savingsMs > 0 ||
    (audit.details?.overallSavingsBytes ?? 0) > 0
  ) {
    return "medium";
  }
  return "low";
}

function compareIssues(left: PrioritizedIssue, right: PrioritizedIssue): number {
  const tierDifference = priorityTier(left) - priorityTier(right);
  if (tierDifference !== 0) {
    return tierDifference;
  }
  const timeDifference = maxSavings(right, "estimatedSavingsMs") -
    maxSavings(left, "estimatedSavingsMs");
  if (timeDifference !== 0) {
    return timeDifference;
  }
  const byteDifference = maxSavings(right, "estimatedSavingsBytes") -
    maxSavings(left, "estimatedSavingsBytes");
  if (byteDifference !== 0) {
    return byteDifference;
  }
  return minScore(left) - minScore(right) || left.auditId.localeCompare(right.auditId);
}

function priorityTier(issue: PrioritizedIssue): number {
  const shared = issue.affectedProfiles.length === 2;
  if (issue.severity === "critical" && shared) return 0;
  if (
    issue.severity === "critical" &&
    issue.affectedProfiles.includes("mobile")
  ) {
    return 1;
  }
  if (
    issue.severity === "high" &&
    ["largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift"]
      .some((metric) => issue.auditId.includes(metric))
  ) {
    return 2;
  }
  if (issue.category === "accessibility") return 3;
  if (issue.category === "performance") return 4;
  if (issue.category === "best-practices") return 5;
  return 6;
}

function maxSavings(
  issue: PrioritizedIssue,
  field: "estimatedSavingsMs" | "estimatedSavingsBytes",
): number {
  return Math.max(
    0,
    ...Object.values(issue.profiles).map(
      (data) => data?.impact[field] ?? 0,
    ),
  );
}

function minScore(issue: PrioritizedIssue): number {
  return Math.min(
    1,
    ...Object.values(issue.profiles).map((data) => data?.score ?? 1),
  );
}

function profileOrder(profile: ProfileName): number {
  return profile === "mobile" ? 0 : 1;
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sanitizeNullableText(
  value: unknown,
  maxLength: number,
): string | null {
  const sanitized = sanitizeText(value, maxLength);
  return sanitized === "" ? null : sanitized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function categoryScoreCriterion(category: CategoryName): string {
  return `Raise the median ${category} score to at least 90/100.`;
}

function canonicalizeAuditId(auditId: string): string {
  return AUDIT_ALIASES[auditId] ?? auditId;
}

function mergeProfileData(
  existing: FindingProfileData | undefined,
  incoming: FindingProfileData,
): FindingProfileData {
  if (!existing) {
    return incoming;
  }
  return {
    score: minNullable(existing.score, incoming.score),
    displayValue: incoming.displayValue ?? existing.displayValue,
    impact: {
      estimatedSavingsMs: maxNullable(
        existing.impact.estimatedSavingsMs,
        incoming.impact.estimatedSavingsMs,
      ),
      estimatedSavingsBytes: maxNullable(
        existing.impact.estimatedSavingsBytes,
        incoming.impact.estimatedSavingsBytes,
      ),
    },
    evidence: deduplicateEvidence([
      ...existing.evidence,
      ...incoming.evidence,
    ]),
  };
}

function deduplicateEvidence(evidence: ReportEvidence[]): ReportEvidence[] {
  const merged = new Map<string, ReportEvidence>();
  for (const row of evidence) {
    const key = JSON.stringify([row.url, row.selector, row.snippet]);
    const existing = merged.get(key);
    merged.set(
      key,
      existing
        ? {
            url: row.url ?? existing.url,
            selector: row.selector ?? existing.selector,
            snippet: row.snippet ?? existing.snippet,
            totalBytes: maxNullable(existing.totalBytes, row.totalBytes),
            wastedBytes: maxNullable(existing.wastedBytes, row.wastedBytes),
            wastedMs: maxNullable(existing.wastedMs, row.wastedMs),
          }
        : row,
    );
  }
  return [...merged.values()].slice(0, 10);
}

function maxNullable(
  left: number | null,
  right: number | null,
): number | null {
  if (left == null) return right;
  if (right == null) return left;
  return Math.max(left, right);
}

function minNullable(
  left: number | null,
  right: number | null,
): number | null {
  if (left == null) return right;
  if (right == null) return left;
  return Math.min(left, right);
}
