# @kitland/tools

Host-neutral tool identity, presentation metadata, platform exposure, and
capability contracts for Kitland applications.

This package is private while the public API and compiled distribution format
are being stabilized. Workspace consumers may use:

```ts
import { getToolPlatformContract, listToolsByPlatform, supportsToolPlatform } from "@kitland/tools";

const webTools = listToolsByPlatform("web");
const vscodeContract = getToolPlatformContract("base64", "vscode-extension");
const mayExposeOnWeb = supportsToolPlatform("base64", "web");
```

Do not infer extension or automation exposure from web availability. See the
[platform capability contract](../../docs/architecture/platform-capabilities.md)
and the root [release policy](../../RELEASING.md).

Base64 is a `reference` entry. Use `getRegistryReleaseReadiness()` for the
machine-readable 64-tool production gate; never treat `listAvailableTools()` as
a release decision. `CANONICAL_TOOL_INVENTORY` is the ordered set of 64 tool
artboards approved in `design/design.pen`; tool count alone cannot pass the
release gate.
