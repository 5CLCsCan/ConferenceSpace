---
name: svg-extract-icon
description: Extract an editable SVG draft from a selected screenshot/icon region on SVG Extract Canvas. Use when the user asks Codex to extract, vectorize, convert, trace, or make SVG from a selected canvas screenshot region.
---

# SVG Extract Icon

Use Codex as the visual reasoning layer and local MCP tools as the deterministic transformation layer.

## Workflow

1. Read the current selection with `get_svg_extract_selection`.
2. Confirm there is exactly one selected image and one selected extract box.
3. Use visual inspection to understand the target icon/logo and decide whether the crop is directly traceable.
4. Call `export_svg_extract_crop` with `projectDir`; it reads the selected pasted image and extract box when explicit `sourcePath` and `crop` are omitted.
5. Choose the path:
   `Trace Original`: use the crop PNG as the tracing source when edges, fill regions, and separation from background are clear enough.
   `Recreate Then Trace`: when the crop is low-resolution, mixed into the background, noisy, or visually ambiguous, first recreate a clean raster draft with transparent or flat background, then vectorize that cleaned draft instead of the raw crop.
6. Call `vectorize_crop` using VTracer. Start with `mode: "color"` unless the target is clearly monochrome.
7. Call `optimize_svg` to sanitize and reduce the SVG.
8. Call `render_svg_preview` and visually compare the preview to the source crop.
9. If quality is poor, use `svg-extract-refine` before presenting the result.
10. Call `insert_svg_result` to place the preview/result metadata beside the source.

## Decision Rule

- Prefer `Trace Original` for simple icons, logos with clean silhouette, and crops where the foreground is already well separated.
- Switch to `Recreate Then Trace` when direct tracing would mostly capture screenshot artifacts instead of the icon itself.
- Treat the recreated raster as a cleaned draft for vectorization, not as proof of exact reproduction.

## Recreate Then Trace

1. Inspect the crop and restate the icon's important visual structure: silhouette, cutouts, strokes, fill style, color count, and symmetry.
2. Recreate a clean PNG draft with transparent or flat background that preserves the icon's visible structure while removing screenshot noise.
3. Visually compare the recreated raster draft to the crop before tracing it.
4. Vectorize the recreated raster draft, then optimize and preview as usual.

## Guardrails

- Treat output as an editable vector draft for design exploration.
- Use image generation or raster cleanup only as a fallback when direct vectorization is not reliable.
- Do not claim exact reproduction of famous logos or paid icon sets.
- Never delete, move, or hide the source screenshot or annotations unless the user explicitly asks.
- If the crop is too low-resolution or ambiguous, say that quality will be limited and ask for a clearer source only when necessary.
