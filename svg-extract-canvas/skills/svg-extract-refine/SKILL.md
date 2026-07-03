---
name: svg-extract-refine
description: Refine a screenshot-to-SVG extraction by changing crop, vectorization, cleanup, or preview settings. Use when an SVG draft is noisy, too complex, missing details, wrong color, or visually different from the source crop.
---

# SVG Extract Refine

Use this after an initial extraction when visual comparison shows issues.

## Adjustment Guide

- Too many tiny paths: improve the raster source first with `isolate_crop_background` or a clean raster draft, then increase `filterSpeckle` only if needed.
- Wrong monochrome shape: retry `mode: "bw"` and adjust threshold before tracing.
- Rounded corners look jagged: use spline mode and lower path precision only after shape quality is acceptable.
- Color icon has banding/noise: reduce `colorPrecision` or crop closer to the icon.
- Background is included: rerun `isolate_crop_background`; if it still fails, recreate a clean raster draft and trace that.
- Background and icon are visually entangled: switch from direct trace to a recreated clean raster draft, then trace that draft.
- The generated SVG matches screenshot artifacts more than the icon: go back one step and improve the raster source before changing vector settings again.

Prefer improving the raster input before changing vectorization settings. Then rerun:

```text
crop -> isolate_crop_background -> vectorize_crop -> optimize_svg -> render_svg_preview
```

If the raster source changes because Codex recreated a clean draft, use that recreated raster as the new input to the same loop.

Then visually inspect the crop and preview again before reporting success.
