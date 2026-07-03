---
name: svg-extract-icon
description: Extract an editable SVG draft from a selected screenshot/icon region on SVG Extract Canvas. Use when the user asks Codex to extract, vectorize, convert, trace, or make SVG from a selected canvas screenshot region.
---

# SVG Extract Icon

Use Codex as the visual reasoning layer and local MCP tools as the deterministic transformation layer.

## Workflow

1. Read the current selection with `get_svg_extract_selection`.
2. Confirm there is a selected image and one selected extract box, or a selection payload that clearly identifies a source image and crop target.
3. Use visual inspection to understand the target icon/logo and choose initial tracing settings.
4. Call `export_svg_extract_crop` to create a PNG crop.
5. Call `vectorize_crop` using VTracer. Start with `mode: "color"` unless the target is clearly monochrome.
6. Call `optimize_svg` to sanitize and reduce the SVG.
7. Call `render_svg_preview` and visually compare the preview to the crop.
8. If quality is poor, use `svg-extract-refine` before presenting the result.
9. Call `insert_svg_result` to place the preview/result metadata beside the source.

## Guardrails

- Treat output as an editable vector draft for design exploration.
- Do not claim exact reproduction of famous logos or paid icon sets.
- Never delete, move, or hide the source screenshot or annotations unless the user explicitly asks.
- If the crop is too low-resolution or ambiguous, say that quality will be limited and ask for a clearer source only when necessary.
