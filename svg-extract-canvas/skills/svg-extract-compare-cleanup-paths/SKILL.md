---
name: svg-extract-compare-cleanup-paths
description: Compare background-removal cleanup paths for a selected SVG Extract Canvas crop. Use when the user wants to test rembg versus Codex-created clean rasters before choosing an SVG extraction path.
---

# SVG Extract Compare Cleanup Paths

Use this skill to compare cleanup quality before choosing a default extraction path.

## Workflow

1. Read the current selection with `get_svg_extract_selection`.
2. Crop the selected bound extract frame with `export_svg_extract_crop`, or use the latest crop path if the user already created one.
3. Call `compare_cleanup_paths` without a Codex draft first. This records local isolation and rembg, or a rembg install hint if rembg is unavailable.
4. Inspect the original crop, local isolated PNG, rembg PNG when present, and rendered SVG previews.
5. If both local and rembg cleanup are poor, create a clean transparent raster draft with Codex image generation:
   - preserve the visible icon structure, colors, cutouts, stroke weight, and essential shadows
   - remove screenshot noise, text that is not part of the icon, and app background
   - keep transparent background
6. Save the Codex-created raster through `save_clean_raster_draft`, or call `compare_cleanup_paths` again with `codexDraftDataUrl` / `codexDraftImageBytes`.
7. Compare all previews and report which candidate is best for editable SVG drafting.

## Guardrails

- Treat the Codex draft as an editable vectorization source, not exact reproduction.
- Do not claim the SVG is production-identical to a logo or paid icon.
- Do not make rembg a hard dependency; missing rembg should produce install guidance and continue with other candidates.
- Keep all generated files inside the project-local `canvas/pages/<page-id>/` tree.
