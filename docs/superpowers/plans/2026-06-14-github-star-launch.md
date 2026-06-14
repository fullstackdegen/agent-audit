# GitHub Star Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Lighthouse MCP as a polished GitHub-first open-source project with an npm installation path, real report proof, community infrastructure, and a verified `0.1.0` release.

**Architecture:** Keep the product implementation unchanged and build a release surface around its canonical report contract. Generate real example artifacts from CommaLabs, present them through a product-led README and repository-native SVG, validate release metadata with a deterministic script, then create the public GitHub repository and publish through npm trusted publishing.

**Tech Stack:** Node.js 20+, TypeScript, Vitest, GitHub Actions, npm, MCP, Lighthouse 12

---

### Task 1: Add Release-Surface Validation

**Files:**
- Create: `scripts/validate-release.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create a release validation script**

Create `scripts/validate-release.mjs` that:

```javascript
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const readme = await readFile("README.md", "utf8");
const contributing = await readFile("CONTRIBUTING.md", "utf8");
const exampleJson = JSON.parse(
  await readFile("examples/commalabs-fast-report.json", "utf8"),
);
const exampleMarkdown = await readFile(
  "examples/commalabs-fast-report.md",
  "utf8",
);

const failures = [];

function requireValue(condition, message) {
  if (!condition) failures.push(message);
}

requireValue(packageJson.repository?.url, "package.json repository.url is required");
requireValue(packageJson.homepage, "package.json homepage is required");
requireValue(packageJson.bugs?.url, "package.json bugs.url is required");
requireValue(
  packageJson.scripts?.prepublishOnly ===
    "npm test && npm run check && npm run build && npm run validate:release",
  "prepublishOnly must run every release gate",
);
requireValue(
  readme.includes("Turn Lighthouse audits into coding-agent tasks."),
  "README must contain the product promise",
);
requireValue(
  !contributing.includes("20-issue"),
  "CONTRIBUTING must not reference the obsolete 20-issue limit",
);
requireValue(exampleJson.status === "complete", "Example report must be complete");
requireValue(
  exampleJson.prioritizedIssues.length <= 10,
  "Example report must contain at most 10 tasks",
);
requireValue(
  exampleMarkdown.includes("# Lighthouse Implementation Report"),
  "Example Markdown report is invalid",
);

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Release surface is valid.");
```

- [ ] **Step 2: Add validation scripts**

Add these entries and publishable paths to `package.json`:

```json
{
  "files": [
    "dist",
    "docs/assets",
    "examples",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "validate:release": "node scripts/validate-release.mjs",
    "prepublishOnly": "npm test && npm run check && npm run build && npm run validate:release"
  }
}
```

- [ ] **Step 3: Ignore visual brainstorming state**

Add:

```gitignore
.superpowers/
```

to `.gitignore`.

- [ ] **Step 4: Run the validator and confirm the expected red state**

Run:

```bash
npm run validate:release
```

Expected: FAIL because repository metadata and example artifacts do not exist yet.

- [ ] **Step 5: Commit the validation foundation**

```bash
git add .gitignore package.json scripts/validate-release.mjs
git commit -m "build: add release surface validation"
```

### Task 2: Generate Real Example Reports

**Files:**
- Create: `examples/commalabs-fast-report.json`
- Create: `examples/commalabs-fast-report.md`
- Modify: `scripts/validate-release.mjs`

- [ ] **Step 1: Generate a fresh fast report**

Run:

```bash
npm run --silent smoke -- https://www.commalabs.co/tr fast \
  > examples/commalabs-fast-report.json \
  2> examples/commalabs-fast-report.md
```

Expected: JSON begins with `{`; Markdown begins with
`# Lighthouse Implementation Report`.

- [ ] **Step 2: Preserve the canonical report contract**

Keep the generated JSON unchanged so it remains a valid example of the actual
MCP output. Inspect every URL, selector, snippet, warning, and environment field
for secrets or private data. The public CommaLabs target and browser version
may remain because they are part of the reproducible audit context.

Do not add example-only properties to the canonical JSON and do not remove
required schema fields. Document score variability in README text instead.

- [ ] **Step 3: Add explicit fixture validation**

Extend `scripts/validate-release.mjs`:

```javascript
requireValue(
  exampleJson.environment?.generatedAt?.startsWith("2026-06-14"),
  "Example must contain its canonical capture timestamp",
);
requireValue(
  exampleJson.target?.requestedUrl === "https://www.commalabs.co/tr",
  "Example target must be CommaLabs",
);
requireValue(
  exampleJson.profiles?.mobile && exampleJson.profiles?.desktop,
  "Example must contain mobile and desktop profiles",
);
```

- [ ] **Step 4: Validate JSON and report limits**

Run:

```bash
jq empty examples/commalabs-fast-report.json
jq '.prioritizedIssues | length <= 10' examples/commalabs-fast-report.json
npm run validate:release
```

Expected: `jq empty` succeeds, the second command prints `true`, and release
validation still fails only for missing repository metadata or README work.

- [ ] **Step 5: Commit examples**

```bash
git add examples scripts/validate-release.mjs
git commit -m "docs: add real CommaLabs report examples"
```

### Task 3: Create The Product-Led Demo Visual

**Files:**
- Create: `docs/assets/lighthouse-mcp-overview.svg`

- [ ] **Step 1: Create a repository-native SVG**

Create a 1600x900 SVG with:

- dark `#0b1020` background;
- heading `Turn Lighthouse audits into coding-agent tasks.`;
- left panel labeled `RAW LIGHTHOUSE` with metrics, diagnostics, and overlapping
  audit rows;
- center arrow labeled `CANONICALIZE · PRIORITIZE · EXPLAIN`;
- right panel labeled `AGENT BACKLOG` with `≤ 10 tasks`, evidence, suggested
  action, and acceptance criterion;
- footer labels `MOBILE + DESKTOP`, `STRUCTURED JSON + MARKDOWN`, and
  `MCP-NATIVE`.

Use only system fonts and SVG primitives. Do not embed external images, fonts,
scripts, or tracking resources.

- [ ] **Step 2: Verify visual integrity**

Render or open the SVG and confirm:

- all text is readable at GitHub README width;
- no text clips outside the 1600x900 view box;
- the product promise is readable without zooming;
- mobile and desktop support is visible.

- [ ] **Step 3: Commit the visual**

```bash
git add docs/assets/lighthouse-mcp-overview.svg
git commit -m "docs: add Lighthouse MCP product overview"
```

### Task 4: Rewrite The README For Discovery

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Replace the README opening**

Use this opening structure:

```markdown
# Lighthouse MCP

## Turn Lighthouse audits into coding-agent tasks.

Run repeatable mobile and desktop Lighthouse audits from any MCP client.
Receive a bounded implementation backlog with evidence, suggested actions,
and measurable acceptance criteria as structured JSON and Markdown.

```bash
npx -y mcp-server-lighthouse
```

![Lighthouse MCP converts raw audits into an agent-ready backlog](docs/assets/lighthouse-mcp-overview.svg)
```

- [ ] **Step 2: Add the proof section**

Add:

```markdown
## From Audit Noise To An Implementation Plan

Lighthouse MCP normalizes overlapping audits, keeps raw metrics in the profile
summary, and returns at most ten prioritized coding tasks.

Each task can include:

- affected mobile and desktop profiles;
- resource URLs or DOM selectors;
- estimated time or byte savings;
- deterministic suggested actions;
- measurable acceptance criteria.

See the real [CommaLabs JSON report](examples/commalabs-fast-report.json) and
[Markdown report](examples/commalabs-fast-report.md).

> Lighthouse results vary with browser version, hardware, network conditions,
> and page changes. The example demonstrates the report format, not a permanent
> performance score.
```

- [ ] **Step 3: Add client configuration sections**

Document the stable stdio configuration:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "mcp-server-lighthouse"]
    }
  }
}
```

Label this as the generic MCP configuration shared by clients that accept the
standard `mcpServers` shape. Add client-specific instructions only after
checking the current official Claude Desktop, Codex, and Cursor documentation.
Do not invent configuration keys.

- [ ] **Step 4: Preserve technical evaluation content**

Keep concise sections for:

- fast and reliable modes;
- output contract;
- coding-agent workflow;
- URL and SSRF-oriented security model;
- development and troubleshooting;
- contributing and license.

Move implementation details below installation, proof, and configuration.

- [ ] **Step 5: Fix the contribution contract**

Change:

```markdown
- Preserve the 20-issue and 10-evidence-row response limits.
```

to:

```markdown
- Preserve the 10-issue and 10-evidence-row response limits.
```

- [ ] **Step 6: Check README references**

Run:

```bash
rg -n "20-issue|20 prioritized|TODO|TBD|placeholder" README.md CONTRIBUTING.md
test -f docs/assets/lighthouse-mcp-overview.svg
test -f examples/commalabs-fast-report.json
test -f examples/commalabs-fast-report.md
```

Expected: no obsolete limits or placeholders; all linked local files exist.

- [ ] **Step 7: Commit the product-led documentation**

```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: present Lighthouse MCP as an agent tool"
```

### Task 5: Add GitHub Community Infrastructure

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add a bug report form**

Require:

- package version;
- Node.js version;
- Chrome or Chromium version;
- operating system;
- MCP client;
- audit mode;
- reproduction steps;
- expected behavior;
- sanitized stderr output.

Include a checkbox confirming that private URLs, credentials, and sensitive
report data were removed.

- [ ] **Step 2: Add a feature request form**

Require:

- problem statement;
- proposed workflow;
- affected MCP client or Lighthouse audit;
- alternatives considered;
- willingness to contribute.

- [ ] **Step 3: Add issue configuration**

Set:

```yaml
blank_issues_enabled: false
contact_links: []
```

- A real private security-reporting URL is added after the repository exists.

- [ ] **Step 4: Add a pull request template**

Include checkboxes for:

- scoped change;
- tests updated;
- stdout remains protocol-only;
- public-network URL policy preserved;
- Markdown remains derived from canonical JSON;
- `npm test`, `npm run check`, and `npm run build` passed.

- [ ] **Step 5: Extend CI with release validation**

After build and before package inspection add:

```yaml
- name: Validate release surface
  run: npm run validate:release
```

- [ ] **Step 6: Validate workflow YAML and commit**

Run:

```bash
npx --yes prettier@3.8.1 --check ".github/**/*.{yml,yaml,md}"
```

Expected: PASS after formatting.

Commit:

```bash
git add .github
git commit -m "chore: add GitHub community workflows"
```

### Task 6: Create The Public GitHub Repository And Metadata

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Confirm GitHub CLI authentication**

Run:

```bash
gh auth status
gh api user --jq .login
```

Expected: an authenticated GitHub owner login. Store it as:

```bash
OWNER="$(gh api user --jq .login)"
```

- [ ] **Step 2: Create the public repository**

Run from the worktree:

```bash
gh repo create "$OWNER/lighthouse-mcp" \
  --public \
  --description "Turn Lighthouse audits into coding-agent tasks." \
  --source . \
  --remote origin
```

Expected: `origin` points to
`https://github.com/$OWNER/lighthouse-mcp.git`.

- [ ] **Step 3: Add exact package metadata**

Use the authenticated owner value without writing placeholder URLs:

```bash
npm pkg set repository.type=git
npm pkg set "repository.url=git+https://github.com/${OWNER}/lighthouse-mcp.git"
npm pkg set "homepage=https://github.com/${OWNER}/lighthouse-mcp#readme"
npm pkg set "bugs.url=https://github.com/${OWNER}/lighthouse-mcp/issues"
npm pkg set \
  keywords[0]=mcp \
  keywords[1]=model-context-protocol \
  keywords[2]=lighthouse \
  keywords[3]=coding-agent \
  keywords[4]=ai-agent \
  keywords[5]=core-web-vitals \
  keywords[6]=web-performance \
  keywords[7]=accessibility \
  keywords[8]=seo \
  keywords[9]=claude \
  keywords[10]=codex \
  keywords[11]=cursor
```

- [ ] **Step 4: Add working badges**

Add CI, npm version, npm downloads, license, and Node badges using the real
owner and repository URL. Open every badge URL and confirm it resolves; do not
commit a badge that returns an error.

- [ ] **Step 5: Update security reporting**

Set:

```bash
SECURITY_URL="https://github.com/${OWNER}/lighthouse-mcp/security/advisories/new"
```

Replace the generic private-reporting sentence in `SECURITY.md` with the exact
value printed by `printf '%s\n' "$SECURITY_URL"`.

- [ ] **Step 6: Add the real security contact link**

Set `.github/ISSUE_TEMPLATE/config.yml` to:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Security vulnerability
    url: SECURITY_URL
    about: Report vulnerabilities privately.
```

Before saving the file, replace `SECURITY_URL` with the exact value printed by
`printf '%s\n' "$SECURITY_URL"`. The committed YAML must contain the absolute
GitHub URL, not the variable name.

- [ ] **Step 7: Validate and commit metadata**

Run:

```bash
npm install --package-lock-only
npm run validate:release
git diff --check
```

Expected: PASS.

Commit:

```bash
git add package.json package-lock.json README.md SECURITY.md .github/ISSUE_TEMPLATE/config.yml
git commit -m "chore: add repository and npm metadata"
```

### Task 7: Add Trusted npm Release Automation

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `README.md`

- [ ] **Step 1: Create a tag-triggered release workflow**

Use:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run check
      - run: npm run build
      - run: npm run validate:release
      - run: npm publish --provenance --access public
```

Do not add `NODE_AUTH_TOKEN`. Configure npm trusted publishing for the exact
GitHub repository and `release.yml` workflow before pushing a release tag.

- [ ] **Step 2: Document provenance**

Add one sentence to the installation section:

```markdown
Official npm releases are published from GitHub Actions with npm provenance.
```

- [ ] **Step 3: Commit release automation**

```bash
git add .github/workflows/release.yml README.md
git commit -m "ci: publish npm releases with provenance"
```

### Task 8: Final Local Release Verification

**Files:**
- No new files

- [ ] **Step 1: Run all local gates**

Run:

```bash
npm test
npm run check
npm run build
npm run validate:release
npm audit --omit=dev
npm_config_cache=/tmp/lighthouse-mcp-npm-cache npm pack --dry-run
git diff --check
git status --short
```

Expected:

- all tests pass;
- type checking and build succeed;
- release validation succeeds;
- zero production vulnerabilities;
- package includes `dist`, `docs/assets`, `examples`, `README.md`, and
  `LICENSE`;
- working tree is clean.

- [ ] **Step 2: Test the packed executable**

Run:

```bash
npm_config_cache=/tmp/lighthouse-mcp-npm-cache npm pack
mkdir -p /tmp/lighthouse-mcp-package-test
cd /tmp/lighthouse-mcp-package-test
npm init -y
npm install /absolute/path/to/mcp-server-lighthouse-0.1.0.tgz
test -x node_modules/.bin/mcp-server-lighthouse
```

Expected: package installs and npm creates an executable binary shim.

- [ ] **Step 3: Run a packaged MCP initialization smoke test**

Start `node_modules/.bin/mcp-server-lighthouse`, send an MCP initialize request
over stdio, and confirm the server advertises
`analyze_website_performance` without writing diagnostics to stdout.

- [ ] **Step 4: Review the final diff and commit any verification-only fixes**

If verification exposes a release-surface defect, fix only that defect, rerun
all gates, and commit with:

```bash
git commit -m "fix: harden release packaging"
```

### Task 9: Publish GitHub And npm `0.1.0`

**Files:**
- No new files

- [ ] **Step 1: Push the feature branch**

```bash
git push -u origin codex/agent-ready-lighthouse-report
```

- [ ] **Step 2: Open a pull request**

Use a title:

```text
Launch Lighthouse MCP with agent-ready reports
```

The body must include:

- product outcome;
- mobile and desktop audit support;
- report contract;
- security model;
- local verification results;
- real CommaLabs example;
- npm release plan.

- [ ] **Step 3: Wait for hosted CI**

Run:

```bash
gh pr checks --watch
```

Expected: Node.js 20 and 22 jobs pass.

- [ ] **Step 4: Merge to main**

Merge only after review and green CI. Pull the updated `main` branch and rerun:

```bash
npm ci
npm test
npm run check
npm run build
npm run validate:release
```

- [ ] **Step 5: Configure npm trusted publishing**

In npm package settings, connect:

- repository: the exact value printed by
  `gh repo view --json nameWithOwner --jq .nameWithOwner`;
- workflow: `.github/workflows/release.yml`;
- environment: none unless explicitly configured.

- [ ] **Step 6: Publish the first release**

Create and push:

```bash
git tag -a v0.1.0 -m "Lighthouse MCP v0.1.0"
git push origin v0.1.0
```

Watch the release workflow and confirm `mcp-server-lighthouse@0.1.0` appears on
npm with provenance.

- [ ] **Step 7: Verify the public install path**

Run from a clean temporary directory:

```bash
npx -y mcp-server-lighthouse@0.1.0
```

Send an MCP initialize and tools/list request. Expected:
`analyze_website_performance` is advertised.

- [ ] **Step 8: Create the GitHub release**

Create release `v0.1.0` with:

- the product promise;
- `npx -y mcp-server-lighthouse` install command;
- the overview SVG;
- links to JSON and Markdown examples;
- mobile and desktop support;
- security and Chrome requirements;
- known limitation that scores vary by environment.

- [ ] **Step 9: Verify the public launch surface**

Confirm:

- README images and badges render;
- npm, homepage, issues, and security links resolve;
- CI and release workflows are green;
- the npm package installs;
- GitHub topics include `mcp`, `lighthouse`, `coding-agent`,
  `web-performance`, `accessibility`, and `core-web-vitals`.
