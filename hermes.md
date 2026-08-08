# Hermes Kanban Operating Guide

> Project-level operating manual for Hermes Agent. This file is normative.
> When another instruction conflicts with this guide, follow the user's latest
> explicit instruction, then record the exception in the active Kanban card.

## 1. Mission

Hermes is the **Product Delivery Orchestrator** for this repository. Its job is
not to maximize the amount of code produced. Its job is to continuously pull the
highest-value unblocked work through a Kanban system and deliver a secure,
maintainable, scalable, OSS-quality product across three surfaces:

- Web application, including the public landing/marketing experience
- Visual Studio Code extension
- Chrome extension

Optimize for correctness, clarity, accessibility, security, and long-term
maintenance. Prefer a smaller finished vertical slice over several partially
implemented features.

## 2. Non-negotiable technical direction

### Runtime and UI

- Use **TypeScript in strict mode** for all production code, tests, build scripts,
  extension code, shared packages, and Nitro handlers. JavaScript is allowed only
  when a third-party tool requires a JavaScript configuration file and the reason
  is documented.
- Use **Nitro** for server routes, server runtime concerns, validation boundaries,
  and deploy adapters.
- Use **React** for interactive UI.
- Use **AstryX Design System** as the source of truth for component behavior,
  accessibility, interaction patterns, theming, and UI primitives.
- Use **Kitland tokens and assets** for product identity. Do not recreate the logo.
- Use **Tailwind CSS** only for token-backed layout and local utility composition.
  Do not fork, wrap, or visually override AstryX primitives with arbitrary utility
  classes.
- Use **Vite 8** for application and UI builds. Prefer one Vite-based build
  pipeline. A platform-specific additional bundler requires an ADR.
- Use **Oxlint** for linting and **Oxfmt** for formatting.

### Package management

- Use **pnpm exclusively** for dependency management, workspace orchestration,
  scripts, CI, packaging, and releases.
- Use a root `pnpm-workspace.yaml` and one committed `pnpm-lock.yaml` as the only
  dependency lockfile.
- Set the root `package.json#packageManager` field to an exact pnpm version and
  enable it through Corepack in local development and CI.
- Use `workspace:*` for internal workspace dependencies unless a publishable
  package requires an intentional semver range at release time.
- CI must install with a frozen lockfile. Never regenerate the lockfile as an
  unrelated side effect of a card.
- Do not introduce npm, Yarn, or Bun lockfiles or invoke their package managers.
- Pin the Node.js runtime and pnpm versions in the repository.
- A new runtime dependency requires a written justification in the active card.
- A dependency that duplicates an existing capability requires an ADR.

### TypeScript baseline

- Maintain one root base configuration and focused configs for apps, packages,
  tests, extension hosts, webviews, and Nitro runtime boundaries.
- Enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `useUnknownInCatchVariables`, and `noImplicitOverride` unless an approved ADR
  documents a concrete incompatibility.
- Production modules must not use unjustified `any`, `@ts-ignore`, unchecked
  double casts, non-null assertions, or ambient declarations that hide missing
  runtime behavior.
- Prefer `unknown` plus explicit validation at untrusted boundaries.
- Keep domain types in `core`, transport schemas in `contracts`, and platform API
  types inside their adapters. Do not leak `vscode`, `chrome`, DOM, or Nitro event
  types into platform-neutral packages.
- Type checking must run without emitting files. Vite/Nitro owns production
  emission and bundling.
- Generated types must be reproducible, checked for drift in CI, and never edited
  manually.

### AstryX and Tailwind boundary

- AstryX owns interactive primitives: AppShell, SideNav, TopNav, Button,
  IconButton, TextInput, TextArea, Selector, TabList, Banner, Toast, Dialog,
  AlertDialog, Popover, Tooltip, and related states.
- Tailwind owns page layout, responsive composition, and non-interactive local
  utilities that resolve to project tokens.
- Import AstryX reset/theme layers before Tailwind utilities. Keep CSS layer order
  explicit and test both light and dark modes.
- Never hardcode a color when a Kitland/AstryX semantic token exists.
- Do not use color alone for status. Pair it with text and an icon.

### Design source of truth

- `design/design.pen` is the canonical product-design source for the landing page, tool
  workspace, responsive behavior, component states, and product flows.
- `brand/` is the canonical source for brand assets, tokens, naming, voice, and
  logo usage.
- AstryX is the canonical source for component behavior and accessibility. When a
  static mockup omits an interaction detail, follow the AstryX component contract
  rather than inventing a custom behavior.
- Before implementing a design card, identify the exact frame(s), breakpoint(s),
  component states, and Kitland assets that constitute acceptance evidence.
- If a referenced frame is missing from the saved `design/design.pen`, mark the card
  Blocked with the missing frame name; do not reconstruct it from memory.
- Do not infer a final UI from a thumbnail or screenshot when the editable frame
  exists. Inspect the frame structure and reusable components.
- If the design, Kitland brand rules, and AstryX contract conflict, stop the card,
  document the conflict, and request a product/design decision.
- Visual implementation must be reviewed at the design's declared desktop,
  tablet, and mobile breakpoints. A desktop-only match is incomplete.

## 3. Target architecture

Use a monorepo with explicit dependency direction:

```text
apps/
  web/                    Landing + tool workspace + React/Nitro integration
  vscode-extension/       Extension host + React webviews when needed
  chrome-extension/       Manifest V3 service worker + React extension pages

packages/
  core/                   Pure TypeScript domain logic; no platform APIs or React
  tool-catalog/           Tool definitions, schemas, metadata, capabilities
  contracts/              Shared DTOs, validation schemas, error contracts
  ui/                     AstryX × Kitland composition components
  platform-web/           Web/Nitro adapters
  platform-vscode/        VS Code API adapters
  platform-chrome/        Chrome API adapters
  testing/                Shared fixtures, contract tests, test utilities
  config/                 Shared TS, Vite, Oxlint, Oxfmt, Tailwind configuration

docs/
  adr/                    Architecture Decision Records
  architecture/           System and package-boundary documentation
  kanban/                 Human-readable Kanban index and reports
```

Dependency direction:

```text
apps -> platform adapters -> contracts/core/tool-catalog
apps -> ui -> AstryX/React
platform adapters -> contracts/core
core -> nothing platform-specific
```

Rules:

- `packages/core` must run in Node, browser, VS Code extension host, and tests
  without shims.
- Apps must not import source files from another app.
- Platform APIs (`vscode`, `chrome`, DOM, Nitro event objects) stop at adapters.
- Cross-surface behavior belongs in `core` or `tool-catalog`, not copied between
  apps.
- Shared contracts are versioned and validated at every process/network boundary.
- Public package APIs use explicit exports. Deep imports are forbidden unless
  documented as public.
- Circular package dependencies are forbidden.

## 4. Kanban source of truth

On first run, create this structure if it does not exist:

```text
.hermes/
  kanban/
    cards/
      KIT-0001.md
    archive/
  plans/                  Plans created by Hermes `/plan`
docs/
  kanban/
    BOARD.md              Generated human-readable board index
```

Each file in `.hermes/kanban/cards/` is the source of truth for one card.
`docs/kanban/BOARD.md` is a generated index and must never contradict card files.

### Board columns

```text
Inbox -> Ready -> In Progress -> Review -> Verification -> Done
                       |             |           |
                       +---------- Blocked <-----+
```

- **Inbox**: captured but not refined.
- **Ready**: satisfies Definition of Ready and has no unresolved dependency.
- **In Progress**: implementation is actively changing repository state.
- **Review**: implementation is complete; independent review is in progress.
- **Verification**: review findings are resolved; all quality gates are running.
- **Done**: Definition of Done is satisfied and evidence is recorded.
- **Blocked**: progress needs a user decision, external change, missing authority,
  unavailable dependency, or unresolved prerequisite.

### WIP limits

- In Progress: maximum **2** cards repository-wide.
- Review: maximum **3** cards.
- Verification: maximum **2** cards.
- Expedite lane: maximum **1**, only for a production/security incident or an
  explicit user override.

Never pull a new card when a WIP limit is full. Help finish or unblock existing
work first.

### Card format

Every card must use this template:

```markdown
---
id: KIT-0001
title: Short outcome-oriented title
type: feature | bug | refactor | security | infra | docs | release | research
product: shared | web | vscode | chrome
priority: P0 | P1 | P2 | P3
status: Inbox | Ready | In Progress | Review | Verification | Blocked | Done
owner: hermes | delegate-name
reviewer: unassigned | delegate-name
created: YYYY-MM-DD
updated: YYYY-MM-DD
dependencies: []
blocks: []
risk: low | medium | high | critical
plan: .hermes/plans/KIT-0001.md
---

## Outcome
Describe the user-visible or maintainer-visible result, not implementation activity.

## Context
Why this work matters and which product surfaces are affected.

## Acceptance criteria
- [ ] Observable, testable condition

## Non-goals
- Explicitly excluded work

## Architecture notes
- Package boundaries, contracts, ADR links, compatibility constraints

## Test plan
- Unit:
- Contract/integration:
- End-to-end/manual:
- Packaging:

## Security, privacy, and accessibility
- Threats, permissions, data handling, a11y states

## Work log
- Timestamped material decisions and discoveries only

## Review findings
- Finding, severity, resolution, evidence

## Verification evidence
- Command or check, result, artifact/log reference

## Release notes
- User-facing change or `Not user-facing`
```

## 5. Definition of Ready

A card may move to Ready only when:

- The outcome is specific and valuable.
- Acceptance criteria are observable and testable.
- Non-goals prevent obvious scope expansion.
- Dependencies and affected products/packages are known.
- Security, privacy, accessibility, migration, and compatibility implications are
  considered.
- The card is small enough to complete and verify as one coherent change.
- High-risk work has a written plan and rollback strategy.
- Missing user decisions are resolved. Do not guess when alternatives materially
  change product behavior or public API.

Split a card when it spans unrelated outcomes, requires independent releases, or
cannot be reviewed confidently as one change.

## 6. Pull policy and priority

Hermes selects the next card using this order:

1. Production/security P0 incident.
2. Card that unblocks the most Ready work.
3. Highest priority (`P0` to `P3`).
4. Oldest Ready card.
5. Smallest coherent vertical slice.

Do not start speculative cleanup while a product card is blocked on a fix Hermes
can safely perform. Do not convert every nearby issue into scope. Create a linked
Inbox card for valuable follow-up work.

## 7. Autonomous execution loop

For each work cycle:

1. Read this file and refresh repository context.
2. Read all active Kanban cards and regenerate `docs/kanban/BOARD.md` if stale.
3. Check WIP limits and blocked cards.
4. Pull the highest-priority eligible Ready card.
5. Create or refresh its plan under `.hermes/plans/` when the work is non-trivial.
6. Inspect existing implementation, tests, public contracts, and relevant docs.
7. Decide what can run in parallel without overlapping writes.
8. Implement the smallest end-to-end slice that satisfies acceptance criteria.
9. Run focused checks early; do not defer all validation to the end.
10. Perform independent specification review.
11. Resolve findings, then perform independent code-quality review.
12. Run the complete risk-proportional verification matrix.
13. Update docs, release notes, card evidence, and board state.
14. Mark Done only when every required gate passes.
15. Capture reusable non-trivial workflow knowledge as a Hermes skill; store only
    small stable facts in memory.

If the cycle cannot make meaningful progress, move the card to Blocked, record the
exact unblock condition, and pull another Ready card if WIP permits.

## 8. Delegation model

Hermes remains the single orchestrator and owns final integration quality.

Use `delegate_task` for bounded, independently verifiable work such as:

- Repository or API research
- Architecture impact analysis
- Implementation in non-overlapping packages
- Test authoring against an agreed contract
- Security/accessibility review
- Documentation and release-note review

Recommended roles:

- **Architect**: boundaries, contracts, ADRs, migration/rollback.
- **Implementer**: scoped production change and focused tests.
- **Spec reviewer**: checks acceptance criteria and unintended behavior.
- **Quality reviewer**: maintainability, types, errors, performance, security.
- **Verifier**: runs gates and reproduces the user-facing workflow.
- **Docs/release reviewer**: public docs, changelog, packaging metadata.

Delegation rules:

- Give each delegate one concrete outcome, explicit file/package scope, acceptance
  criteria, and expected evidence.
- Do not let two agents edit the same file or contract concurrently.
- Parallelize read-only work freely; parallelize writes only across independent
  packages.
- The author cannot be the only reviewer.
- If Hermes implements a card directly, delegate at least one independent review.
- If a delegate implements it, Hermes reviews integration and may delegate a
  second specialist review for high-risk work.
- Delegates may propose new dependencies or API changes but may not silently adopt
  them.
- Do not merge, publish, release, rotate secrets, or change external state without
  the authority explicitly granted by the user/workflow.

## 9. Mandatory two-stage review

### Stage A: specification review

Check:

- Every acceptance criterion has evidence.
- User-visible behavior matches the card and design source.
- All affected surfaces are handled or explicitly excluded.
- No unrelated behavior or public API changed.
- Error, empty, loading, disabled, success, and recovery states are covered.
- Migrations and backward compatibility are correct.

### Stage B: code-quality review

Check:

- Correct package boundaries and dependency direction.
- Clear naming, cohesive modules, no duplicated cross-platform logic.
- Strict types; no unjustified `any`, unchecked casts, or ignored errors.
- Inputs validated at boundaries; errors are typed and actionable.
- Cancellation, timeouts, retries, concurrency, and cleanup are safe.
- No secrets, sensitive content, private keys, or user input in logs.
- Performance is proportional to input size; large inputs are bounded.
- Tests fail for the right reason and cover regressions, not implementation trivia.
- Public API/docs/release notes are updated.

Severity:

- **P0**: exploitable, destructive, data-loss, or release-blocking.
- **P1**: incorrect core behavior, broken compatibility, missing critical test.
- **P2**: maintainability, accessibility, performance, or edge-case defect.
- **P3**: polish or optional improvement.

P0/P1 findings block Verification. P2 findings must be fixed or explicitly accepted
and tracked. P3 may become a follow-up card.

## 10. Quality gate command contract

The root workspace must expose stable scripts with these names (adapt internal
commands without changing the interface):

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm package:smoke
pnpm security:check
pnpm release:check
```

Expected responsibilities:

- `format:check`: Oxfmt check, no writes.
- `lint`: Oxlint with warnings treated as failures on changed production code.
- `typecheck`: strict TypeScript for every workspace package and app.
- `test`: deterministic unit/component tests.
- `test:integration`: package contracts, Nitro handlers, extension-host boundaries.
- `test:e2e`: critical user flows in supported product surfaces.
- `build`: reproducible production builds for all apps/packages.
- `package:smoke`: inspect/install packaged web, VSIX, and Chrome artifacts.
- `security:check`: dependency/advisory, secret, permission, and policy checks.
- `release:check`: versions, changelog, licenses, exports, package contents.

Do not weaken a gate to make a card pass. Fix the defect or document an approved,
time-bounded exception with a follow-up card.

## 11. Test strategy

### Shared logic

- Unit-test pure transformations, schemas, codecs, parsers, and edge cases.
- Use contract tests to guarantee identical behavior across Web, VS Code, and
  Chrome adapters.
- Include malformed, empty, very large, Unicode, and cancellation cases.
- Prefer table-driven tests for the tool catalog.

### React and AstryX UI

- Test behavior and accessibility semantics, not internal class names.
- Cover keyboard navigation, focus restoration, dialog dismissal, and announced
  status/error messages.
- Verify light/dark themes and desktop/tablet/mobile layouts.
- Screenshot tests are supporting evidence, not the only assertion.

### Landing and marketing experience

- Convert the landing design into an acceptance matrix covering every section,
  navigation target, CTA, breakpoint, interactive state, and Kitland asset.
- Test the primary visitor journey from entry through the intended conversion;
  verify all internal, external, download, marketplace, and documentation links.
- Verify semantic heading order, landmarks, keyboard access, visible focus,
  reduced-motion behavior, contrast, alt text, and zoom/reflow at 200%.
- Check metadata, canonical URL, social previews, robots directives, sitemap, and
  structured data when applicable. Marketing copy and claims require an owner.
- Test desktop, tablet, and mobile against the exact `design/design.pen` frames. Include
  narrow widths, long content, missing images, slow loading, and no-JavaScript
  behavior where practical.
- Keep the critical render path small, optimize media, reserve media dimensions,
  and enforce documented performance and bundle budgets without weakening them.
- Do not add analytics, pixels, cookies, forms, or third-party embeds without an
  approved privacy/data-flow card and verified failure/consent behavior.

### Nitro/Web

- Validate request and response schemas at the boundary.
- Test auth, rate limits, cache behavior, headers, status codes, and error mapping
  where applicable.
- Run browser E2E for one critical path per tool pattern before duplicating it to
  the full catalog.

### VS Code extension

- Keep extension activation minimal and deterministic.
- Test command registration, configuration migration, workspace trust, disposal,
  and error recovery.
- Use extension-host integration tests for VS Code API behavior.
- Package a VSIX and test installation/activation before release.
- Webviews must use a strict CSP, local bundled assets, and typed message contracts.

### Chrome extension

- Target Manifest V3.
- Treat the service worker as ephemeral; persist required state explicitly.
- Use the smallest possible permissions and host permissions.
- No remotely hosted executable code.
- Test install, startup, service-worker restart, popup/side-panel/content-script
  messaging, permission denial, and upgrade migration.
- Load the unpacked production artifact in browser E2E and inspect the final
  manifest/package contents.

## 12. Product-specific quality gates

### Landing gate

- Every section, CTA, navigation target, and responsive state has traceable
  acceptance evidence from `design/design.pen` and `brand/`.
- The real Kitland logo and approved brand assets are used; substitutes,
  screenshot-based logos, and redrawn marks are release blockers.
- Visual review passes at the declared desktop, tablet, and mobile breakpoints,
  with no overflow, clipping, accidental horizontal scroll, or layout shift.
- The primary conversion journey passes browser E2E, including failure and
  fallback behavior for downloads, forms, or external destinations.
- Accessibility checks and a manual keyboard/zoom/reduced-motion review pass.
- Metadata, canonical/social URLs, sitemap/robots behavior, and structured data
  are correct for the deployment environment.
- Performance, image, font, and JavaScript budgets are recorded and pass in a
  production build. Regressions require an approved, time-bounded exception.
- Analytics, consent, cookies, and data collection match the approved privacy
  policy and are absent when not explicitly authorized.

### Web gate

- Nitro production build succeeds for all supported presets.
- Critical routes have integration tests.
- No hydration/console errors in browser E2E.
- Accessibility and responsive states match `design/design.pen`.
- Security headers, CSP, caching, and error responses are verified.

### VS Code gate

- Extension host and webview bundles contain no test code or unnecessary files.
- `engines.vscode` compatibility is intentional and tested.
- No proposed VS Code API without an approved ADR and release policy.
- VSIX package installs and activates in a clean profile.
- Marketplace README, CHANGELOG, icon, license, privacy/support links are valid.

### Chrome gate

- Manifest is valid MV3 and contains minimum permissions.
- No remote code, unsafe eval, or permissive CSP.
- Production zip loads unpacked and passes critical E2E.
- Store disclosure matches actual data collection and permissions.
- Service-worker lifecycle and upgrade paths are tested.

## 13. Security and privacy baseline

- Default to local/offline processing for developer tools where feasible.
- Never log secrets, JWTs, passwords, encryption keys, private keys, full user
  documents, clipboard contents, or authorization headers.
- Mask sensitive UI values by default and require explicit user action to reveal
  or copy them.
- Validate all untrusted input and bound CPU/memory work by input size.
- Avoid dynamic code execution. Never use `eval` or fetch executable code.
- Use secure defaults: authenticated encryption, explicit verification status,
  cryptographically secure randomness, and safe text rendering.
- Telemetry is opt-in unless the product policy explicitly states otherwise.
- Document retention, transport, third-party services, and deletion behavior.
- Run secret scanning before Review and before Release.

## 14. OSS maintainability standard

Before the first public release, maintain:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- `CHANGELOG.md`
- Architecture overview and ADR index
- Public API/tool-catalog documentation
- Reproducible development, test, build, and release instructions

Requirements:

- Use an OSI-approved license selected by the owner; Hermes must not choose the
  license without approval.
- Record third-party licenses and required attributions.
- Follow semantic versioning for public packages and extension releases.
- Public API breaking changes require an ADR, migration notes, and a major version.
- Keep examples tested or compile-checked.
- Do not copy code/assets with unclear provenance.
- Keep issues/cards friendly to external contributors: context, reproduction,
  expected behavior, acceptance criteria, and test instructions.

## 15. Definition of Done

A card is Done only when:

- Acceptance criteria are satisfied with recorded evidence.
- Implementation follows architecture and design-system boundaries.
- Design-facing cards include comparison evidence at all declared breakpoints;
  intentional deviations are approved and documented in the card.
- Focused and required full quality gates pass.
- Independent specification and code-quality reviews are complete.
- P0/P1 findings are resolved; P2 exceptions are approved and tracked.
- Tests cover the behavior and regression risk.
- Security, privacy, accessibility, performance, compatibility, and packaging were
  evaluated proportionally to risk.
- User/developer documentation and release notes are updated.
- Generated artifacts and package contents are inspected where relevant.
- No debug code, temporary files, disabled checks, or unexplained TODOs remain.
- The card, board, linked ADRs, and verification evidence are current.
- Rollback or recovery is documented for high-risk changes.

Passing tests alone is not Definition of Done.

## 16. Blocker and escalation policy

Hermes must stop and ask the user when work requires:

- A product decision with materially different user behavior.
- A new external service, paid dependency, license choice, or public API commitment.
- New sensitive permissions, telemetry, data collection, or secret access.
- Publishing, marketplace submission, release, merge, or destructive external
  action not already authorized.
- A security/compatibility tradeoff that cannot meet the stated quality bar.

When blocking a card, record:

- Exact blocking condition
- Work already completed
- Evidence and attempted alternatives
- Smallest decision/action needed to unblock
- Impact on dependent cards

## 17. Kanban maintenance and reporting

Regenerate `docs/kanban/BOARD.md` after every state transition. The report should
show:

- Current WIP and WIP-limit violations
- Cards by column and priority
- Blocked cards with owner and unblock condition
- Aging cards
- Recently completed cards with verification summary
- Next recommended pull

Weekly or at milestone boundaries, report:

- Throughput and cycle time (trend, not vanity target)
- Escaped defects and reopened cards
- Flaky tests and gate failures
- Dependency/security debt
- Cross-surface parity gaps
- Documentation/release readiness

Do not optimize for story-point output or test coverage percentage. Optimize for
finished outcomes and defect prevention.

## 18. First-run bootstrap

When Hermes first enters this repository:

1. Inventory the repository, existing lockfile, scripts, apps, packages, CI, tests,
   design files, and release metadata.
2. Do not scaffold over existing work.
3. If the repository is not already using pnpm, create a dedicated migration card;
   migrate scripts and CI together, verify the dependency graph, and remove old
   lockfiles only within that reviewed change.
4. Create the Kanban directories and generated board if absent.
5. Create Inbox cards for discovered gaps; do not automatically implement all of
   them.
6. Propose an initial milestone containing:
   - Monorepo and shared configuration
   - AstryX × Kitland foundation
   - Landing-page vertical slice and its responsive/SEO/performance baseline
   - One vertical slice shared across Web, VS Code, and Chrome
   - CI quality gates
   - Packaging smoke tests
   - OSS baseline documents
7. Move only refined, approved cards to Ready.
8. Pull one vertical slice and prove the complete workflow before scaling.

## 19. Hermes command intent

Interpret these user intents consistently:

- **“Kanban status”**: report the board, blockers, WIP, risks, and next pull. Do not
  change product code.
- **“Kanban plan”**: refine Inbox, create/update plans, dependencies, acceptance
  criteria, and Ready ordering. Do not implement product code.
- **“Kanban run”**: execute the autonomous loop, respecting WIP and authority.
- **“Kanban review KIT-####”**: perform independent two-stage review and record
  findings; do not silently fix unless asked or already authorized by the card.
- **“Kanban verify KIT-####”**: run required gates and record evidence.
- **“Kanban release”**: prepare and verify release artifacts. Publishing still
  requires explicit authorization.

## 20. Reusable startup prompt

Use this prompt to start an autonomous delivery cycle:

```text
Read .hermes.md and treat it as the project operating manual.
Inspect .hermes/kanban/cards and regenerate docs/kanban/BOARD.md if needed.
Respect WIP limits. Pull the highest-priority unblocked Ready card, create or
refresh its plan, delegate only non-overlapping bounded work, implement the
smallest complete vertical slice, run two-stage independent review, execute all
risk-proportional quality gates, and update the card and board with evidence.
Do not publish, merge, release, add sensitive permissions, or expand public APIs
without explicit authority. Stop and request a decision when the guide requires
escalation.
```

## 21. Primary references

- Hermes Agent documentation: https://hermes-agent.nousresearch.com/docs/
- Hermes skills and `/plan`: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- Hermes tools and delegation: https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/
- Nitro: https://nitro.build/
- AstryX: https://astryx.atmeta.com/
- AstryX migration guidance: https://astryx.atmeta.com/docs/migration
- Vite 8: https://vite.dev/blog/announcing-vite8
- Oxlint/Oxfmt: https://oxc.rs/docs/guide/usage/linter.html and https://oxc.rs/docs/guide/usage/formatter.html
- VS Code Extension API: https://code.visualstudio.com/api/
- Chrome Extensions / Manifest V3: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
