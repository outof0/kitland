# Design source

- `design.pen` — canonical Pencil design (landing, tools, responsive frames)
- `export/` — HTML exports from Pencil MCP for implementation reference

Do not edit exported HTML by hand as a product surface; regenerate via:

```bash
python3 scripts/export-landing-from-pencil.py
```

Requires Pen.app with `design/design.pen` open.
