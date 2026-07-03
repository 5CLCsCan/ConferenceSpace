---
name: svg-extract-export
description: Save or hand off the final SVG draft from SVG Extract Canvas. Use when the user asks to export, save, copy, download, or prepare the extracted SVG for Figma/design use.
---

# SVG Extract Export

Export only an SVG that has already passed sanitizer checks and rendered successfully as a preview.

## Workflow

1. Identify the final optimized SVG path from the latest extraction report or result metadata.
2. Call `save_export` with the SVG path and current project directory.
3. Report the saved path and any warnings from the extraction report.

Expected output location:

```text
canvas/pages/default/exports/<name>.svg
```

For Figma, use the exported SVG file or copy the SVG source into a Figma plugin/import flow. Do not promise exact logo cloning; describe the file as an editable SVG draft.
