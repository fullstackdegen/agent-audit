import {
  PROFILE_NAMES,
  type AgentFixPack,
  type PrioritizedIssue,
  type ReportEvidence,
} from "./report-schema.js";

const MAX_FIX_PACKS = 10;
const MAX_REPO_SEARCH_HINTS = 8;
const MAX_IMPLEMENTATION_STEPS = 6;
const MAX_ACCEPTANCE_CRITERIA = 6;

export function buildFixPacks(issues: PrioritizedIssue[]): AgentFixPack[] {
  const usedIds = new Set<string>();

  return issues.slice(0, MAX_FIX_PACKS).map((issue, index) => ({
    id: buildFixPackId(issue, index, usedIds),
    priority: index + 1,
    sourceIssueIds: [issue.auditId],
    goal: `Fix ${sentenceCase(issue.title)}.`,
    category: issue.category,
    severity: issue.severity,
    affectedProfiles: [...issue.affectedProfiles],
    repoSearchHints: buildRepoSearchHints(issue),
    implementationSteps: buildImplementationSteps(issue),
    acceptanceCriteria: buildAcceptanceCriteria(issue),
    verification: {
      rerunMode: "reliable",
      expectedAuditIds: [issue.auditId],
    },
  }));
}

function buildFixPackId(
  issue: PrioritizedIssue,
  index: number,
  usedIds: Set<string>,
): string {
  const baseId = `fix-${slugify(issue.auditId)}`;
  let id = baseId;

  if (usedIds.has(id)) {
    let suffix = index + 1;
    do {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    } while (usedIds.has(id));
  }

  usedIds.add(id);

  return id;
}

function buildAcceptanceCriteria(issue: PrioritizedIssue): string[] {
  const criteria = issue.acceptanceCriteria.slice(0, MAX_ACCEPTANCE_CRITERIA);

  if (criteria.length > 0) {
    return criteria;
  }

  return [
    `The ${issue.auditId} audit no longer appears in the prioritized issue list after rerunning in reliable mode.`,
  ];
}

function buildRepoSearchHints(issue: PrioritizedIssue): string[] {
  const hints = unique(
    evidenceForIssue(issue).flatMap((evidence) => [
      evidence.selector,
      evidence.url,
      evidence.snippet,
    ]),
  ).slice(0, MAX_REPO_SEARCH_HINTS);

  if (hints.length > 0) {
    return hints;
  }

  return [`Search for user-visible content related to: ${issue.title}`];
}

function buildImplementationSteps(issue: PrioritizedIssue): string[] {
  const inspectStep =
    "Inspect the repository for the evidence listed in repoSearchHints before editing.";
  const focusStep = `Keep changes focused on source issue IDs: ${issue.auditId}.`;
  const actionLimit = MAX_IMPLEMENTATION_STEPS - 2;

  return [
    inspectStep,
    ...issue.suggestedActions.slice(0, actionLimit),
    focusStep,
  ];
}

function evidenceForIssue(issue: PrioritizedIssue): ReportEvidence[] {
  return PROFILE_NAMES.flatMap(
    (profile) => issue.profiles[profile]?.evidence ?? [],
  );
}

function unique(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "issue"
  );
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "issue";
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
}
