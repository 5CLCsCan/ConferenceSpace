---
name: svg-extract-suggest-targets
description: Suggest extract boxes for likely icons or logos on SVG Extract Canvas. Use when the user asks Codex to find, frame, detect, or mark icons across one or many pasted images.
---

# SVG Extract Suggest Targets

Use Codex as the vision layer. The app does not call an AI API.

## Workflow

1. Call `list_canvas_images` to get pasted image ids, bounds, and asset metadata.
2. Inspect images visually in small batches. For large canvases, work in batches of about 10 images so the user can review useful groups instead of a flood of boxes.
3. For each likely icon/logo, prepare a suggestion:
   - `sourceShapeId`: the pasted image shape id
   - `box`: local image coordinates `{ x, y, w, h }`
   - `label`: short visual label such as `settings`, `chevron`, or `logo mark`
   - `confidence`: `0` to `1`
4. Call `suggest_extract_targets` with the candidate suggestions. This normalizes and validates without changing the canvas.
5. Call `apply_extract_target_suggestions` only after the suggestions are reasonable. It inserts boxes with `status: "suggested"` for user review.
6. When the user approves or rejects suggestions, call `set_extract_target_status` with `status: "accepted"` or `status: "rejected"`.

## Guardrails

- Do not mark suggestions as accepted automatically.
- Do not extract from `suggested` or `rejected` boxes.
- Prefer slightly larger boxes that contain the complete icon over tight boxes that clip strokes or shadows.
- When an icon is mixed into a complex background, label it as likely needing recreate-then-trace.
