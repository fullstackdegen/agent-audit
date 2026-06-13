# Lighthouse MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure TypeScript MCP server that audits public websites with Lighthouse.

**Architecture:** Separate URL policy, report formatting, Chrome/Lighthouse execution, and MCP transport concerns into independently testable modules. Inject the audit function into the MCP server so protocol behavior can be tested without launching Chrome.

**Tech Stack:** Node.js, TypeScript, Model Context Protocol SDK, Lighthouse, chrome-launcher, Vitest

---

### Task 1: Package Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] Define ESM package metadata, Node.js engine requirements, build, test, and type-check scripts.
- [ ] Configure strict TypeScript compilation from `src` to `dist`.
- [ ] Ignore generated output, dependencies, coverage, logs, and local environment files.

### Task 2: URL Policy

**Files:**
- Create: `test/url-policy.test.ts`
- Create: `src/url-policy.ts`

- [ ] Write tests that accept public HTTP(S) URLs and reject invalid protocols, credentials, localhost, and private IP ranges.
- [ ] Run the tests and confirm they fail because the module does not exist.
- [ ] Implement parsing, hostname resolution, and public-address enforcement.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Report Formatting

**Files:**
- Create: `test/report.test.ts`
- Create: `src/report.ts`

- [ ] Write tests for normalized category scores, zero scores, metrics, and sorted opportunities.
- [ ] Run the tests and confirm they fail because the module does not exist.
- [ ] Implement deterministic Markdown formatting with no embedded terminal control data.
- [ ] Run the focused tests and confirm they pass.

### Task 4: Audit Lifecycle

**Files:**
- Create: `src/audit.ts`

- [ ] Implement secure Chrome defaults and opt-in `--no-sandbox` support.
- [ ] Run Lighthouse with silent logging and the four supported categories.
- [ ] Validate the result payload and always terminate Chrome in `finally`.

### Task 5: MCP Server

**Files:**
- Create: `test/server.test.ts`
- Create: `src/server.ts`
- Create: `src/index.ts`

- [ ] Write tests for tool discovery, unknown tool errors, validation failures, and successful responses.
- [ ] Run the tests and confirm they fail because the server module does not exist.
- [ ] Implement the MCP request handlers with an injected audit function.
- [ ] Add the stdio entry point and keep operational logging on stderr.
- [ ] Run the complete test suite and TypeScript compiler.

### Task 6: Open-Source Documentation

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] Document installation, client configuration, tool schema, security boundaries, development commands, and troubleshooting.
- [ ] Add the MIT license.
- [ ] Run tests, type checking, build, and package inspection as the final release gate.
