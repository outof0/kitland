# Tool interaction pattern contracts

**Status:** required product contract for the 64-tool rollout
**Scope:** web, browser extension, and VS Code host adaptations
**Related:** [Tool UI design-system contract](./tool-ui-contract.md)

Kitland tools share a shell, but they do not all share one interaction model.
Every catalog definition declares one of four patterns. That declaration is a
reviewable UX contract, not a styling hint, and host adapters must preserve the
same user outcome even when their controls differ.

## Common shell contract

Every pattern keeps these invariants:

- one obvious primary job and one authoritative result;
- a useful empty state plus sample, valid, invalid, processing, and limit states;
- input remains on the device unless a separately reviewed capability says
  otherwise;
- errors are typed, actionable, adjacent to the affected control, and announced
  without stealing focus;
- copy, save, clear, swap, and rerun actions have one visible owner rather than
  appearing in multiple toolbars;
- keyboard use is complete, focus is visible, and the workflow has no horizontal
  document overflow at 390 px;
- input and output payloads are not persisted by default;
- platform adapters preserve core semantics and deterministic test vectors;
  host transport or editor limits may be tighter when they are explicit, tested,
  and visible to users.

## Pattern matrix

| Pattern     | Primary job                                  | Required structure                                                                   | Execution model                                                                            | Key failure risks                                                   |
| ----------- | -------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `transform` | Convert one representation into another      | Editable source, direction/options, derived read-only result                         | Live for bounded deterministic work; explicit Run only when the specification justifies it | Ambiguous direction, destructive swap, stale output                 |
| `generate`  | Create a new value from explicit constraints | Option groups, primary Generate action, result with copy/save, regenerate affordance | Explicit user action; never regenerate because an option merely received focus             | Accidental secret replacement, weak entropy claims, hidden defaults |
| `diff`      | Compare two peer inputs                      | Named A/B inputs, swap, comparison options, navigable annotated result               | Debounced or explicit Compare according to cost; the chosen policy is stable               | Color-only changes, lost line context, unusable large results       |
| `inspect`   | Parse one value into trustworthy fields      | Source input, parse status, structured output sections, field-level copy             | Live for safe parsers; explicit Inspect for expensive or capability-bearing work           | Treating unverified data as trusted, hiding partial/invalid state   |

## Transform

- Source and result keep stable geometry while status text changes.
- Direction controls describe the transformation; they must never be disguised
  copy buttons.
- Swap moves a valid, fitting visible result into the source and changes
  direction atomically. A blocked swap leaves the safe state unchanged.
- Source owns upload/copy/clear; result owns copy/save; the center rail owns only
  the transformation relationship.
- Derived output is cleared or marked stale immediately when inputs/options no
  longer support it.

## Generate

- All defaults are visible and reproducible except deliberate cryptographic
  entropy. Security-sensitive tools state their entropy source and never call a
  decorative random function “secure.”
- Generate is the single primary action. Changing an option does not silently
  destroy a result the user may still be copying.
- Regeneration is explicit and receives a new result; Reset restores documented
  defaults without generating.
- Quantity, length, and output-size limits are validated before work begins.
- Secret-like output is not placed in history, logs, URLs, analytics, or
  persistent storage.

## Diff

- Inputs have durable names such as Original/Changed or A/B. Their meaning
  cannot depend only on left/right placement because mobile stacks them.
- JSON Diff uses one route with labelled **Editor** and **Compare** modes.
  Editor owns A/B inputs; Compare owns one derived structural result. Mode
  switching preserves both documents. An edit after Compare returns to Editor
  (or must visibly mark Compare stale); a stale result is never presented as
  current.
- Swap changes the named inputs and result together; it is undoable with a
  second swap.
- Insertions, deletions, and changes use text/icon semantics in addition to
  color. The result exposes a summary and keyboard-navigable change regions.
- Whitespace, case, normalization, and line-ending options are explicit and
  repeated in the result summary.
- Large inputs use bounded algorithms or workers and show progress/cancel where
  latency can exceed an interaction frame.

## Transform execution policy (bounded local tools)

Default for bounded deterministic transforms is **live** local derivation
(optionally debounced or off-main-thread). Explicit Run needs a written
per-tool cost or safety reason.

| Tool / workspace                                                              | Policy                | Transport         | Reason                                                             |
| ----------------------------------------------------------------------------- | --------------------- | ----------------- | ------------------------------------------------------------------ |
| Binary Text, Hex Text, HTML Entities, Unicode, ROT13, URL Encode, JSON Escape | live                  | worker            | Bounded codec; worker avoids main-thread stalls on large paste     |
| Text Reverser, Case Converter, Sort Lines, Dedupe Lines                       | live                  | worker / deferred | Bounded text ops; no deliberate result preservation                |
| Beautify/Minify, JSON→YAML/CSV/TOML, YAML→JSON, XML Formatter, SQL Formatter  | live                  | deferred / worker | Structured parse is cheap within input caps                        |
| JSON Formatter                                                                | live                  | worker            | Inspect + format; Share is fragment-only after explicit click      |
| Base64                                                                        | live                  | worker            | Golden-path transform; Share is fragment-only after explicit click |
| JSON Diff                                                                     | explicit Compare mode | deferred on enter | Diff pattern: Editor edits freely; Compare owns one derived result |

Invalid or processing states clear the authoritative output pane. Direction
labels (Encode/Decode/Beautify) are never disguised Copy actions.

## Inspect

- The source remains visible while fields are inspected so users can verify the
  interpretation.
- Parsed, valid, verified, expired, malformed, and unsupported are distinct
  states. Parsing a JWT, certificate, URL, or header never implies trust or
  verification.
- Structured fields have stable labels, raw-value access where relevant, and
  field-local copy actions.
- Partial results clearly identify what was decoded and what failed; they do not
  silently substitute defaults.
- Time, byte, locale, and encoding interpretations state the unit or convention.

## Host adaptation

| Concern           | Web                                                   | Browser extension                                            | VS Code                                                          |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Discovery         | Static `/explore` catalog and route per runnable tool | Searchable extension catalog; lazy renderer per exposed tool | Quick Pick plus contributed commands where justified             |
| Input             | Paste/upload inside the workspace                     | Paste/upload inside the popup; no page access by default     | Panel input or explicit editor selection                         |
| Output            | Copy/download and reviewed fragment sharing           | Copy/download; no implicit tab/page access                   | Copy or one atomic editor edit with an undo stop                 |
| Navigation        | URL route                                             | Hash route inside extension pages                            | Command id/tool id; panel lifecycle                              |
| Security boundary | Strict static CSP and no payload persistence          | Explicit manifest capabilities; no remote code               | Nonced webview CSP, validated messages, bounded editor mutations |

An unavailable host is declared `unsupported`; a missing renderer must never be
inferred from availability on another host. A tool becomes `release-ready` only
after its declared host contracts and package checks are exhaustive.

## Pattern conformance evidence

Each tool pull request includes:

1. core vectors for empty, valid, malformed, Unicode, boundary, and oversize
   cases;
2. a pattern-state test covering the transitions relevant to that tool;
3. keyboard and screen-reader names for every action and status;
4. screenshots or browser evidence at mobile, tablet, and desktop for web UI;
5. host adapter tests for message validation, limits, capabilities, and cleanup;
6. bundle/package evidence showing that adding the tool does not preload every
   other renderer.
