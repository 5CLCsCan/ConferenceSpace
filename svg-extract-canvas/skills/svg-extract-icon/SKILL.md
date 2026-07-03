---
name: svg-extract-icon
description: Extract an editable SVG draft from a selected screenshot/icon region on SVG Extract Canvas. Use when the user asks Codex to extract, vectorize, convert, trace, or make SVG from a selected canvas screenshot region.
---

# SVG Extract Icon

Use Codex as the visual reasoning layer and local MCP tools as the deterministic transformation layer.

## Workflow

1. Read the current selection with `get_svg_extract_selection`.
2. Confirm the selected extract boxes are bound targets with `svgExtractTarget: true`, `svgExtractTargetVersion: 2`, and `sourceShapeId`. Legacy v1 targets are acceptable only when the MCP crop tool can unambiguously migrate by overlap.
3. Check each target's `sourceRelativeBounds` when present. The crop should be understood as image-local coordinates, not viewport or canvas screenshot coordinates.
4. Call `export_svg_extract_crop` with `projectDir`; it crops all selected `manual` or `accepted` targets from their bound source images.
5. Call `isolate_crop_background` for each crop before vectorization.
6. Choose the tracing source:
   `Trace Isolated`: use the isolated PNG when `quality.recommendedAction` is `trace-isolated` and visual inspection confirms the icon separated cleanly.
   `Recreate Then Trace`: when isolation is low-confidence, background is mixed into the icon, or visual quality is poor, create a clean transparent raster draft and save it with `save_clean_raster_draft`.
7. Call `vectorize_crop` using the isolated PNG or saved clean raster draft. Start with `mode: "color"` unless the target is clearly monochrome.
8. Call `optimize_svg` to sanitize and reduce the SVG.
9. Call `render_svg_preview` and visually compare the preview to the source crop and raster source.
10. If quality is poor, use `svg-extract-refine` before presenting the result.
11. Call `insert_svg_result` to place the preview/result metadata beside the source.

## Decision Rule

- Prefer `Trace Isolated` for simple icons, logos with clean silhouette, and crops where the foreground separates cleanly after local isolation.
- Switch to `Recreate Then Trace` when direct tracing would mostly capture screenshot artifacts instead of the icon itself.
- Treat the recreated raster as a cleaned draft for vectorization, not as proof of exact reproduction.

## Recreate Then Trace

1. Inspect the crop and restate the icon's important visual structure: silhouette, cutouts, strokes, fill style, color count, and symmetry.
2. Recreate a clean PNG draft with transparent or flat background that preserves the icon's visible structure while removing screenshot noise.
3. Save the recreated raster draft with `save_clean_raster_draft`.
4. Visually compare the recreated raster draft to the crop before tracing it.
5. Vectorize the recreated raster draft, then optimize and preview as usual.

## Guardrails

- Treat output as an editable vector draft for design exploration.
- Use image generation or raster cleanup only as a fallback when direct vectorization is not reliable.
- Do not claim exact reproduction of famous logos or paid icon sets.
- Never delete, move, or hide the source screenshot or annotations unless the user explicitly asks.
- If the crop is too low-resolution or ambiguous, say that quality will be limited and ask for a clearer source only when necessary.
