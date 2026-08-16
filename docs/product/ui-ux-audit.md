# Kitland UI/UX audit and golden-slice standard

Status: implemented baseline
Scope: 65-tool suite landing, shared tool shell, and Base64 reference implementation across web,
browser extension, and VS Code
Method: source review plus interactive checks at 390×844, 768×900, and 1280×800

## Executive assessment

The Base64 workspace is useful as a contract test: the input and output are clearly separated,
conversion happens continuously, invalid data is announced, destructive actions are small and
reversible, and privacy-sensitive sharing is disclosed next to the action. It is not the product
center; Kitland's release target is a complete 65-tool suite.

The former landing page was visually distinctive but architecturally expensive. It rendered three
large breakpoint-specific React trees, hydrated the whole page on load, repeated multiple links to
the same destination, and described the static web build as offline-capable without an offline
delivery mechanism. That was appropriate as a design prototype, not as the scalable OSS baseline.

The implemented baseline now uses one semantic responsive tree, renders the landing without a
client-side application island, presents six tool families and the 65-tool release target,
distinguishes repository foundations from published extensions, and uses copy that describes
network and privacy behavior precisely. `/explore` is a real registry/status surface rather than a
redirect to whichever reference tool happened to be implemented first.

The production landing artifact dropped from roughly 270 KB raw / 52 KB gzip to 47.5 KB raw /
10.6 KB gzip even after adding all six suite families. Its HTML contains no `<astro-island>` and ships no landing application bundle; only
structured-data script remains in the page itself.

The interactive web workspace now resolves each tool through an exhaustive lazy
registry. Its shared island is about 12 KiB gzip (down from roughly 30 KiB), so
adding tool renderers does not put all 65 implementations on every tool route.

## Findings and decisions

| Area                 | Finding                                                                                                         | Severity | Implemented decision                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| Landing architecture | Desktop, tablet, and mobile trees duplicated content and all shipped in the document.                           | High     | Replace them with one responsive, data-driven tree.                                                     |
| First interaction    | The entire landing hydrated on `client:load` for motion and a hamburger menu.                                   | High     | Render static HTML and use native `<details>` for the mobile disclosure. Motion is CSS-only.            |
| Information scent    | The primary and secondary hero CTAs both opened Base64.                                                         | High     | Route the primary action to the suite registry; make the secondary action explain local-first behavior. |
| False affordance     | Four “popular tool” links used different labels but the same Base64 destination.                                | Medium   | Present supported workflows as non-interactive capability labels.                                       |
| Product truth        | “Offline-capable” was not guaranteed by the current static asset delivery.                                      | High     | Replace it with verifiable local-processing and shared-core claims.                                     |
| Product scope        | The first implementation was visually positioned as if Base64 were the product.                                 | High     | Present six families and 65 tools; label Base64 only as a reference implementation.                     |
| Roadmap honesty      | Web, browser, and VS Code could be read as shipped products.                                                    | High     | Label all repository implementations as “Foundation” until the complete suite is released.              |
| Mobile hierarchy     | The tool repeated “Base64” in both the shell and content heading.                                               | Low      | Keep the shell title “Base64”; use “Encode / Decode” for the task heading.                              |
| Error recovery       | Decode errors were announced correctly but visually truncated to one short footer line.                         | Medium   | Keep fixed editor geometry while allowing a two-line validation message.                                |
| Privacy              | Sharing embeds input in the URL fragment and can expose secrets when a URL is shared.                           | High     | Keep sharing opt-in, fragment-only, length-bounded, and disclose the risk beside the action.            |
| Accessibility        | The workspace already exposed field names, pressed states, live errors, skip navigation, and focus restoration. | Pass     | Preserve those contracts and add responsive/no-overflow regression coverage.                            |

## Landing experience model

The landing follows a deliberate question sequence:

1. **What is it?** A 65-tool, local-first developer workbench.
2. **What exists now?** The primary action opens the registry/status page, not a single tool.
3. **Why trust it?** The hero and proof band state no network uploads, no account, and MIT licensing.
4. **What is actually ready?** Base64 is explicitly a reference slice; every product surface remains
   a repository foundation until the full registry ships.
5. **Will the product scale coherently?** The shared-core section explains which behavior remains
   common and which UI adapts to its host.

The page communicates target breadth through non-interactive family examples. A tool becomes an
interactive registry entry only when its workflow meets the acceptance contract below.

## Suite-wide tool UX

The suite must not scale by cloning one dual-pane converter 64 times. Registry
metadata assigns each tool one reviewed interaction pattern: `transform`,
`generate`, `diff`, or `inspect`. The shared shell owns discovery, navigation,
theme, favorites, responsive behavior, focus return, and host privacy language;
the declared pattern owns execution, state transitions, action placement, and
result semantics.

The normative [interaction pattern contracts](../architecture/tool-patterns.md)
define all four models and how they adapt across web, browser extension, and VS
Code. A wave is not conformant until it includes evidence for every pattern it
uses; visual consistency alone cannot substitute for correct interaction
semantics.

## Reference-tool interaction contract (Base64)

Every platform surface should preserve these user outcomes even when its layout differs:

- Choose Encode or Decode and Standard Base64 or Base64URL explicitly.
- Transform UTF-8 text locally with the same limits and canonical validation rules.
- Keep input editable and result read-only.
- Expose valid, processing, empty, and error states without layout ambiguity.
- Copy the result in one action; offer a platform-appropriate save/download action where possible.
- Make sample/reset behavior reversible and keep focus in the workflow.
- State that Base64 is encoding, not encryption.
- Never send input, telemetry, or history over the network.
- Use the shared core test vectors for Unicode, whitespace, padding, URL-safe alphabet, malformed
  values, empty input, and size limits.

Web-specific sharing is not a universal requirement. The browser and VS Code surfaces should not
copy URL-fragment behavior unless the host provides an equally clear, safe sharing primitive.

## Acceptance gates for each new tool

### Product and content

- One primary job and one primary result.
- Registry metadata names supported platforms and capabilities.
- “Available” means the renderer, tests, documentation, and packaging gate all pass.
- Security and privacy claims describe observable behavior, not roadmap intent.

### Interaction

- Useful empty, sample, success, processing, invalid, and limit-exceeded states.
- Keyboard-complete workflow with visible focus and predictable focus restoration.
- Copy/save actions are disabled or explained when no valid result exists.
- Mobile content has no horizontal document overflow at 390 px.

### Accessibility

- One page-level `h1`, ordered section headings, landmarks, and named fields/actions.
- Errors use an assertive announcement only when immediate correction is needed.
- Status and copy confirmations do not steal focus.
- Color is never the only state signal and reduced-motion preferences are respected.

### Delivery

- Core behavior is framework-independent and covered by shared test vectors.
- Platform adapters validate messages and persisted data at runtime.
- The web route remains statically meaningful before hydration.
- Browser and VS Code packages pass manifest/package smoke checks before a release claim changes
  from “Foundation” to “Available”.

## Follow-up validation

The next UX step is not more visual decoration. Run five short task-based sessions with developers:

1. encode Unicode text and copy the result;
2. diagnose malformed Base64 padding;
3. switch to Base64URL and round-trip the value;
4. explain whether any input left the device;
5. perform the same conversion from the browser extension and VS Code.

Track completion, hesitation, wrong-mode errors, and whether participants can correctly explain the
privacy boundary. With telemetry intentionally absent, publish the script and collect anonymized
qualitative findings through OSS issues or moderated sessions.
