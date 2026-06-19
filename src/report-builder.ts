import type { Result } from "lighthouse";

import {
  createDistribution,
  getVariabilityWarnings,
  selectRepresentativeRun,
} from "./aggregate.js";
import {
  extractProfileFindings,
  mergeAndPrioritizeFindings,
} from "./findings.js";
import {
  AGENT_INSTRUCTIONS,
  CATEGORIES,
  PROFILE_NAMES,
  REPORT_SCHEMA_VERSION,
  type AgentReadyLighthouseReport,
  type AuditMode,
  type CategoryName,
  type NumericDistribution,
  type ProfileName,
  type ProfileReport,
  type SiteIntelligenceReport,
} from "./report-schema.js";

export interface CollectedProfileRuns {
  attemptedRuns: number;
  failures: string[];
  runs: Result[];
}

interface BuildReportInput {
  requestedUrl: string;
  mode: AuditMode;
  generatedAt: Date;
  siteIntelligence?: SiteIntelligenceReport | null;
  profiles: Record<ProfileName, CollectedProfileRuns>;
}

const METRICS = {
  firstContentfulPaint: "first-contentful-paint",
  speedIndex: "speed-index",
  largestContentfulPaint: "largest-contentful-paint",
  totalBlockingTime: "total-blocking-time",
  cumulativeLayoutShift: "cumulative-layout-shift",
} as const;

export function buildAgentReadyReport(
  input: BuildReportInput,
): AgentReadyLighthouseReport {
  const successfulRuns = PROFILE_NAMES.flatMap(
    (profile) => input.profiles[profile].runs,
  );
  if (successfulRuns.length === 0) {
    throw new Error("No Lighthouse profile produced a usable report.");
  }

  const reports = {} as Record<ProfileName, ProfileReport>;
  const representativeRuns: Partial<Record<ProfileName, Result>> = {};
  const finalUrls: Partial<Record<ProfileName, string>> = {};

  for (const profile of PROFILE_NAMES) {
    const collected = input.profiles[profile];
    const representative = selectRepresentativeRun(collected.runs);
    if (representative) {
      representativeRuns[profile] = representative;
      finalUrls[profile] =
        representative.finalDisplayedUrl ??
        representative.finalUrl ??
        input.requestedUrl;
    }
    reports[profile] = buildProfileReport(
      profile,
      input.mode,
      collected,
      representative,
    );
  }

  const profileFindings = PROFILE_NAMES.flatMap((profile) => {
    const representative = representativeRuns[profile];
    return representative
      ? extractProfileFindings(profile, representative)
      : [];
  });
  const environmentSource = successfulRuns[0]!;

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    status:
      reports.mobile.status === "complete" &&
      reports.desktop.status === "complete"
        ? "complete"
        : "incomplete",
    target: {
      requestedUrl: input.requestedUrl,
      finalUrls,
    },
    environment: {
      generatedAt: input.generatedAt.toISOString(),
      lighthouseVersion: environmentSource.lighthouseVersion,
      userAgent: environmentSource.userAgent,
      mode: input.mode,
      runsPerProfile: input.mode === "reliable" ? 3 : 1,
    },
    profiles: reports,
    siteIntelligence: input.siteIntelligence ?? null,
    prioritizedIssues: [
      ...(input.siteIntelligence?.prioritizedIssues ?? []),
      ...mergeAndPrioritizeFindings(profileFindings),
    ].slice(0, 10),
    agentInstructions: [...AGENT_INSTRUCTIONS],
  };
}

function buildProfileReport(
  profile: ProfileName,
  mode: AuditMode,
  collected: CollectedProfileRuns,
  representative: Result | undefined,
): ProfileReport {
  const requiredSuccesses = mode === "reliable" ? 2 : 1;
  const scores = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      scoreDistribution(collected.runs, category),
    ]),
  ) as Record<CategoryName, NumericDistribution>;
  const metrics = {
    firstContentfulPaint: metricDistribution(
      collected.runs,
      METRICS.firstContentfulPaint,
      "ms",
    ),
    speedIndex: metricDistribution(
      collected.runs,
      METRICS.speedIndex,
      "ms",
    ),
    largestContentfulPaint: metricDistribution(
      collected.runs,
      METRICS.largestContentfulPaint,
      "ms",
    ),
    totalBlockingTime: metricDistribution(
      collected.runs,
      METRICS.totalBlockingTime,
      "ms",
    ),
    cumulativeLayoutShift: metricDistribution(
      collected.runs,
      METRICS.cumulativeLayoutShift,
      "unitless",
    ),
  };
  const warnings = getVariabilityWarnings({
    performance: scores.performance,
    lcp: metrics.largestContentfulPaint,
    tbt: metrics.totalBlockingTime,
    cls: metrics.cumulativeLayoutShift,
  });

  for (const category of CATEGORIES) {
    const distribution = scores[category];
    if (
      category !== "performance" &&
      distribution.min != null &&
      distribution.max != null &&
      distribution.max - distribution.min > 10
    ) {
      warnings.push(`${category} score varied by more than 10 points.`);
    }
  }

  const emulation = representative?.configSettings.screenEmulation;
  return {
    status:
      collected.runs.length === 0
        ? "failed"
        : collected.runs.length >= requiredSuccesses
          ? "complete"
          : "incomplete",
    successfulRuns: collected.runs.length,
    attemptedRuns: collected.attemptedRuns,
    failures: [...collected.failures],
    configuration: {
      formFactor: profile,
      viewport: {
        width: emulation?.width ?? (profile === "mobile" ? 412 : 1350),
        height: emulation?.height ?? (profile === "mobile" ? 823 : 940),
        deviceScaleFactor:
          emulation?.deviceScaleFactor ?? (profile === "mobile" ? 1.75 : 1),
      },
      throttlingMethod:
        representative?.configSettings.throttlingMethod ?? "simulate",
    },
    scores,
    metrics,
    variabilityWarnings: warnings,
  };
}

function scoreDistribution(
  runs: Result[],
  category: CategoryName,
): NumericDistribution {
  return createDistribution(
    runs.map((run) => {
      const score = run.categories[category]?.score;
      return score == null ? null : score * 100;
    }),
    "score",
  );
}

function metricDistribution(
  runs: Result[],
  auditId: string,
  unit: NumericDistribution["unit"],
): NumericDistribution {
  return createDistribution(
    runs.map((run) => run.audits[auditId]?.numericValue),
    unit,
  );
}
