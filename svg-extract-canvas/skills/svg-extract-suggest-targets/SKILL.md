---
name: svg-extract-suggest-targets
description: Suggest extract boxes for likely icons or logos on SVG Extract Canvas. Use when the user asks Codex to find, frame, detect, or mark icons across one or many pasted images.
---

# SVG Extract Suggest Targets

Use Codex as the vision layer. The app does not call an AI API.

## Workflow

1. Call `list_canvas_images` to get pasted image ids, bounds, and asset metadata.
2. For each image, determine the image's canvas bounds first: `{ x, y, width, height }`. Treat this as the source coordinate system.
3. Inspect each image visually in small batches. For large canvases, work in batches of about 10 images so the user can review useful groups instead of a flood of boxes.
4. For each likely icon/logo, determine the icon bounds inside the image, not on the global canvas. The `box` must be local image coordinates, where `x: 0, y: 0` is the image's top-left corner.
5. Prepare a suggestion:
   - `sourceShapeId`: the pasted image shape id
   - `box`: local image coordinates `{ x, y, w, h }`
   - `label`: short visual label such as `settings`, `chevron`, or `logo mark`
   - `confidence`: `0` to `1`
6. Call `suggest_extract_targets` with the candidate suggestions. This normalizes and validates without changing the canvas.
7. Call `apply_extract_target_suggestions` only after the suggestions are reasonable. It inserts boxes with `status: "suggested"` for user review and normal batch extraction.
8. If the user says a box is wrong, delete it or call `set_extract_target_status` with `status: "rejected"`.

## Guardrails

- Suggested boxes are extractable by default when the user presses Extract with no extract-frame selection.
- To extract only a subset, select those extract boxes before pressing Extract.
- Do not extract from `rejected` boxes.
- Prefer slightly larger boxes that contain the complete icon over tight boxes that clip strokes or shadows.
- Do not place boxes by viewport pixels or screenshot-of-the-canvas coordinates. Always convert to local image coordinates first.
- When an icon is mixed into a complex background, label it as likely needing recreate-then-trace.
