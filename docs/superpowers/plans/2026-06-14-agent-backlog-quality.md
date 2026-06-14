# Agent Backlog Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Produce a concise, canonical, evidence-backed Lighthouse backlog for coding agents.

**Architecture:** Enhance the existing finding normalizer with audit aliases, task eligibility rules, richer evidence extraction, impact-based severity, and a ten-task limit. Keep report generation and Markdown driven by the canonical structured report.

**Tech Stack:** TypeScript, Lighthouse 12, Vitest

---

### Task 1: Add Backlog Regression Tests

**Files:**
- Modify: `test/findings.test.ts`
- Modify: `test/report-schema.test.ts`

- [x] Add fixtures covering alias pairs, metric audits, unknown evidence-free insights, console detail rows, and eleven eligible findings.
- [x] Assert aliases merge into canonical IDs.
- [x] Assert metric audits and evidence-free unknown insights are absent.
- [x] Assert console source and description are retained.
- [x] Assert zero-score SEO issues are high rather than automatically critical.
- [x] Assert the backlog and output schema limit are 10.
- [x] Run focused tests and confirm they fail for the expected behaviors.

### Task 2: Implement Canonical Backlog Rules

**Files:**
- Modify: `src/findings.ts`
- Modify: `src/recommendations.ts`
- Modify: `src/report-schema.ts`

- [x] Add canonical audit aliases.
- [x] Export a recommendation-availability check.
- [x] Exclude raw metric audits.
- [x] Exclude unknown evidence-free insight and diagnostic audits.
- [x] Extract console and network evidence fields.
- [x] Replace zero-score severity with impact- and category-based rules.
- [x] Merge alias impacts and evidence without duplication.
- [x] Limit prioritized issues and JSON schema to 10.
- [x] Run focused tests and type-check until green.

### Task 3: Update Documentation and Verify

**Files:**
- Modify: `README.md`

- [x] Document canonical deduplication and the ten-task limit.
- [x] Run the complete test, type-check, build, audit, and package gates.
- [x] Run a real CommaLabs fast smoke audit.
- [x] Verify no duplicate alias tasks, no raw LCP metric task, console evidence
  when Lighthouse provides it, preserved link selectors, and at most 10 tasks.
- [x] Commit the implementation and verification changes.
