export const REPORT_SCHEMA_VERSION = "1.2" as const;
export const AUDIT_MODES = ["fast", "reliable"] as const;
export const PROFILE_NAMES = ["mobile", "desktop"] as const;
export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export const CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;

export type AuditMode = (typeof AUDIT_MODES)[number];
export type ProfileName = (typeof PROFILE_NAMES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type CategoryName = (typeof CATEGORIES)[number];
export type ReportStatus = "complete" | "incomplete";
export type ProfileStatus = "complete" | "incomplete" | "failed";
export type SiteIntelligenceStatus = "complete" | "incomplete" | "failed";
export type SiteCheckStatus = "pass" | "warn" | "fail";
export type SiteCheckCategory =
  | "broken-links"
  | "metadata"
  | "structured-data"
  | "indexability"
  | "images"
  | "assets"
  | "llms";

export interface NumericDistribution {
  median: number | null;
  min: number | null;
  max: number | null;
  samples: number[];
  unit: "score" | "ms" | "unitless";
}

export interface ReportEvidence {
  url: string | null;
  selector: string | null;
  snippet: string | null;
  totalBytes: number | null;
  wastedBytes: number | null;
  wastedMs: number | null;
}

export interface FindingProfileData {
  score: number | null;
  displayValue: string | null;
  impact: {
    estimatedSavingsMs: number | null;
    estimatedSavingsBytes: number | null;
  };
  evidence: ReportEvidence[];
}

export interface PrioritizedIssue {
  auditId: string;
  category: CategoryName;
  severity: Severity;
  affectedProfiles: ProfileName[];
  title: string;
  description: string;
  profiles: Partial<Record<ProfileName, FindingProfileData>>;
  suggestedActions: string[];
  acceptanceCriteria: string[];
  documentationUrl: string | null;
}

export interface AgentFixPackVerification {
  rerunMode: "reliable";
  expectedAuditIds: string[];
}

export interface AgentFixPack {
  id: string;
  priority: number;
  sourceIssueIds: string[];
  goal: string;
  category: CategoryName;
  severity: Severity;
  affectedProfiles: ProfileName[];
  repoSearchHints: string[];
  implementationSteps: string[];
  acceptanceCriteria: string[];
  verification: AgentFixPackVerification;
}

export interface FetchSummary {
  url: string;
  statusCode: number | null;
  ok: boolean;
  contentType: string | null;
  finalUrl: string;
  error: string | null;
}

export interface SiteCheck {
  id: string;
  category: SiteCheckCategory;
  status: SiteCheckStatus;
  title: string;
  evidence: ReportEvidence[];
}

export interface LlmsTxtReport {
  status: "generated" | "insufficient-content";
  text: string | null;
  evidence: string[];
}

export interface SiteIntelligenceReport {
  status: SiteIntelligenceStatus;
  inspectedUrl: string;
  fetchedResources: {
    html: FetchSummary;
    robotsTxt: FetchSummary | null;
    sitemapXml: FetchSummary | null;
  };
  checks: SiteCheck[];
  llmsTxt: LlmsTxtReport;
  prioritizedIssues: PrioritizedIssue[];
}

export interface ProfileReport {
  status: ProfileStatus;
  successfulRuns: number;
  attemptedRuns: number;
  failures: string[];
  configuration: {
    formFactor: ProfileName;
    viewport: {
      width: number;
      height: number;
      deviceScaleFactor: number;
    };
    throttlingMethod: string;
  };
  scores: Record<CategoryName, NumericDistribution>;
  metrics: Record<
    | "firstContentfulPaint"
    | "speedIndex"
    | "largestContentfulPaint"
    | "totalBlockingTime"
    | "cumulativeLayoutShift",
    NumericDistribution
  >;
  variabilityWarnings: string[];
}

export interface AgentReadyLighthouseReport {
  schemaVersion: typeof REPORT_SCHEMA_VERSION;
  status: ReportStatus;
  target: {
    requestedUrl: string;
    finalUrls: Partial<Record<ProfileName, string>>;
  };
  environment: {
    generatedAt: string;
    lighthouseVersion: string;
    userAgent: string;
    mode: AuditMode;
    runsPerProfile: number;
  };
  profiles: Record<ProfileName, ProfileReport>;
  prioritizedIssues: PrioritizedIssue[];
  fixPacks: AgentFixPack[];
  siteIntelligence: SiteIntelligenceReport | null;
  agentInstructions: string[];
}

export const AGENT_INSTRUCTIONS = [
  "Treat structuredContent as the source of truth.",
  "Inspect the repository before proposing file-level changes.",
  "Address issues in prioritizedIssues order.",
  "Prefer one source change that resolves the same audit on both profiles.",
  "Preserve user-visible behavior and accessibility.",
  "Run the repository's tests after each logical fix.",
  "Rerun this Lighthouse tool in reliable mode.",
  "Compare medians and variability against the report's acceptance criteria.",
  "Do not claim completion when the new report is incomplete or materially more variable than the baseline.",
] as const;

export const lighthouseToolInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      description:
        "A fully qualified public HTTP or HTTPS URL, for example https://example.com.",
    },
    mode: {
      type: "string",
      enum: AUDIT_MODES,
      default: "reliable",
      description:
        "fast runs each profile once; reliable runs each profile three times and reports medians.",
    },
  },
  required: ["url"],
} as const;

const nullableNumberSchema = {
  anyOf: [{ type: "number" }, { type: "null" }],
} as const;

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }],
} as const;

const distributionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    median: nullableNumberSchema,
    min: nullableNumberSchema,
    max: nullableNumberSchema,
    samples: { type: "array", items: { type: "number" } },
    unit: { type: "string", enum: ["score", "ms", "unitless"] },
  },
  required: ["median", "min", "max", "samples", "unit"],
} as const;

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: nullableStringSchema,
    selector: nullableStringSchema,
    snippet: nullableStringSchema,
    totalBytes: nullableNumberSchema,
    wastedBytes: nullableNumberSchema,
    wastedMs: nullableNumberSchema,
  },
  required: [
    "url",
    "selector",
    "snippet",
    "totalBytes",
    "wastedBytes",
    "wastedMs",
  ],
} as const;

const findingProfileSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: nullableNumberSchema,
    displayValue: nullableStringSchema,
    impact: {
      type: "object",
      additionalProperties: false,
      properties: {
        estimatedSavingsMs: nullableNumberSchema,
        estimatedSavingsBytes: nullableNumberSchema,
      },
      required: ["estimatedSavingsMs", "estimatedSavingsBytes"],
    },
    evidence: {
      type: "array",
      maxItems: 10,
      items: evidenceSchema,
    },
  },
  required: ["score", "displayValue", "impact", "evidence"],
} as const;

const prioritizedIssueSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    auditId: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    severity: { type: "string", enum: SEVERITIES },
    affectedProfiles: {
      type: "array",
      uniqueItems: true,
      items: { type: "string", enum: PROFILE_NAMES },
    },
    title: { type: "string" },
    description: { type: "string" },
    profiles: {
      type: "object",
      additionalProperties: false,
      properties: {
        mobile: findingProfileSchema,
        desktop: findingProfileSchema,
      },
    },
    suggestedActions: {
      type: "array",
      items: { type: "string" },
    },
    acceptanceCriteria: {
      type: "array",
      items: { type: "string" },
    },
    documentationUrl: nullableStringSchema,
  },
  required: [
    "auditId",
    "category",
    "severity",
    "affectedProfiles",
    "title",
    "description",
    "profiles",
    "suggestedActions",
    "acceptanceCriteria",
    "documentationUrl",
  ],
} as const;

const fixPackSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    priority: { type: "integer", minimum: 1 },
    sourceIssueIds: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      uniqueItems: true,
      items: { type: "string" },
    },
    goal: { type: "string" },
    category: { type: "string", enum: CATEGORIES },
    severity: { type: "string", enum: SEVERITIES },
    affectedProfiles: {
      type: "array",
      uniqueItems: true,
      items: { type: "string", enum: PROFILE_NAMES },
    },
    repoSearchHints: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    implementationSteps: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    acceptanceCriteria: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    verification: {
      type: "object",
      additionalProperties: false,
      properties: {
        rerunMode: { type: "string", enum: ["reliable"] },
        expectedAuditIds: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
          items: { type: "string" },
        },
      },
      required: ["rerunMode", "expectedAuditIds"],
    },
  },
  required: [
    "id",
    "priority",
    "sourceIssueIds",
    "goal",
    "category",
    "severity",
    "affectedProfiles",
    "repoSearchHints",
    "implementationSteps",
    "acceptanceCriteria",
    "verification",
  ],
} as const;

const profileReportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["complete", "incomplete", "failed"],
    },
    successfulRuns: { type: "integer", minimum: 0 },
    attemptedRuns: { type: "integer", minimum: 1 },
    failures: { type: "array", items: { type: "string" } },
    configuration: {
      type: "object",
      additionalProperties: false,
      properties: {
        formFactor: { type: "string", enum: PROFILE_NAMES },
        viewport: {
          type: "object",
          additionalProperties: false,
          properties: {
            width: { type: "number" },
            height: { type: "number" },
            deviceScaleFactor: { type: "number" },
          },
          required: ["width", "height", "deviceScaleFactor"],
        },
        throttlingMethod: { type: "string" },
      },
      required: ["formFactor", "viewport", "throttlingMethod"],
    },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        performance: distributionSchema,
        accessibility: distributionSchema,
        "best-practices": distributionSchema,
        seo: distributionSchema,
      },
      required: CATEGORIES,
    },
    metrics: {
      type: "object",
      additionalProperties: false,
      properties: {
        firstContentfulPaint: distributionSchema,
        speedIndex: distributionSchema,
        largestContentfulPaint: distributionSchema,
        totalBlockingTime: distributionSchema,
        cumulativeLayoutShift: distributionSchema,
      },
      required: [
        "firstContentfulPaint",
        "speedIndex",
        "largestContentfulPaint",
        "totalBlockingTime",
        "cumulativeLayoutShift",
      ],
    },
    variabilityWarnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "status",
    "successfulRuns",
    "attemptedRuns",
    "failures",
    "configuration",
    "scores",
    "metrics",
    "variabilityWarnings",
  ],
} as const;

const fetchSummarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: { type: "string" },
    statusCode: nullableNumberSchema,
    ok: { type: "boolean" },
    contentType: nullableStringSchema,
    finalUrl: { type: "string" },
    error: nullableStringSchema,
  },
  required: ["url", "statusCode", "ok", "contentType", "finalUrl", "error"],
} as const;

const siteCheckSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    category: {
      type: "string",
      enum: [
        "broken-links",
        "metadata",
        "structured-data",
        "indexability",
        "images",
        "assets",
        "llms",
      ],
    },
    status: { type: "string", enum: ["pass", "warn", "fail"] },
    title: { type: "string" },
    evidence: {
      type: "array",
      maxItems: 10,
      items: evidenceSchema,
    },
  },
  required: ["id", "category", "status", "title", "evidence"],
} as const;

const llmsTxtSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["generated", "insufficient-content"] },
    text: nullableStringSchema,
    evidence: { type: "array", maxItems: 10, items: { type: "string" } },
  },
  required: ["status", "text", "evidence"],
} as const;

const siteIntelligenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["complete", "incomplete", "failed"] },
    inspectedUrl: { type: "string" },
    fetchedResources: {
      type: "object",
      additionalProperties: false,
      properties: {
        html: fetchSummarySchema,
        robotsTxt: { anyOf: [fetchSummarySchema, { type: "null" }] },
        sitemapXml: { anyOf: [fetchSummarySchema, { type: "null" }] },
      },
      required: ["html", "robotsTxt", "sitemapXml"],
    },
    checks: { type: "array", maxItems: 50, items: siteCheckSchema },
    llmsTxt: llmsTxtSchema,
    prioritizedIssues: {
      type: "array",
      maxItems: 10,
      items: prioritizedIssueSchema,
    },
  },
  required: [
    "status",
    "inspectedUrl",
    "fetchedResources",
    "checks",
    "llmsTxt",
    "prioritizedIssues",
  ],
} as const;

export const lighthouseReportOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    schemaVersion: { type: "string", const: REPORT_SCHEMA_VERSION },
    status: { type: "string", enum: ["complete", "incomplete"] },
    target: {
      type: "object",
      additionalProperties: false,
      properties: {
        requestedUrl: { type: "string" },
        finalUrls: {
          type: "object",
          additionalProperties: false,
          properties: {
            mobile: { type: "string" },
            desktop: { type: "string" },
          },
        },
      },
      required: ["requestedUrl", "finalUrls"],
    },
    environment: {
      type: "object",
      additionalProperties: false,
      properties: {
        generatedAt: { type: "string" },
        lighthouseVersion: { type: "string" },
        userAgent: { type: "string" },
        mode: { type: "string", enum: AUDIT_MODES },
        runsPerProfile: { type: "integer", enum: [1, 3] },
      },
      required: [
        "generatedAt",
        "lighthouseVersion",
        "userAgent",
        "mode",
        "runsPerProfile",
      ],
    },
    profiles: {
      type: "object",
      additionalProperties: false,
      properties: {
        mobile: profileReportSchema,
        desktop: profileReportSchema,
      },
      required: PROFILE_NAMES,
    },
    prioritizedIssues: {
      type: "array",
      maxItems: 10,
      items: prioritizedIssueSchema,
    },
    fixPacks: {
      type: "array",
      maxItems: 10,
      items: fixPackSchema,
    },
    siteIntelligence: {
      anyOf: [siteIntelligenceSchema, { type: "null" }],
    },
    agentInstructions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "schemaVersion",
    "status",
    "target",
    "environment",
    "profiles",
    "prioritizedIssues",
    "fixPacks",
    "siteIntelligence",
    "agentInstructions",
  ],
} as const;

export function parseAuditMode(input: unknown): AuditMode {
  if (input === undefined) {
    return "reliable";
  }
  if (input === "fast" || input === "reliable") {
    return input;
  }
  throw new Error("The mode argument must be either fast or reliable.");
}
