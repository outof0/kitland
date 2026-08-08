# Kitland Developer Handoff

## Start here
1. Import `tokens/brand.css` or map `tokens/design-tokens.json` into your token pipeline.
2. Use assets from `logos/` and `icons/`; do not recreate them from screenshots.
3. Preserve official casing: **Kitland**.
4. Treat product state colors as semantic tokens, not raw hex values.
5. Keep logo artwork outside UI icon libraries.

## Recommended token layers
```text
foundation.*   spacing, radius, typography, elevation
brand.*        identity colors and logo surfaces
semantic.*     info/success/warning/error/active
component.*    resolved tokens for buttons, inputs, panels...
```

## Assets
SVG files are the source of truth. PNG exports are conveniences for platform/runtime use.

## Typography
The kit specifies font families but does not redistribute font binaries. Install/load fonts via the product's own font pipeline.
