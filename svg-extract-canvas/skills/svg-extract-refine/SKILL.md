---
name: svg-extract-refine
description: Refine a screenshot-to-SVG extraction by changing crop, vectorization, cleanup, or preview settings. Use when an SVG draft is noisy, too complex, missing details, wrong color, or visually different from the source crop.
---

# SVG Extract Refine

Use this after an initial extraction when visual comparison shows issues.

## Adjustment Guide

- Too many tiny paths: increase `filterSpeckle`, reduce color precision, simplify the crop background.
- Wrong monochrome shape: retry `mode: "bw"` and adjust threshold before tracing.
- Rounded corners look jagged: use spline mode and lower path precision only after shape quality is acceptable.
- Color icon has banding/noise: reduce `colorPrecision` or crop closer to the icon.
- Background is included: recrop tighter or preprocess to flatten/remove background before vectorizing.

Always rerun:

```text
crop -> vectorize_crop -> optimize_svg -> render_svg_preview
```

Then visually inspect the crop and preview again before reporting success.
