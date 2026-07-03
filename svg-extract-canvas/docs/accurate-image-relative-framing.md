# Accurate Image-Relative Framing

This document describes the framing workflow used for precise SVG extraction targets on a tldraw canvas.

## Core Rule

Always frame icons in the source image coordinate system, not in viewport pixels and not as free-floating canvas rectangles.

The correct order is:

1. Determine the source image shape and its canvas bounds.
2. Determine each icon's bounds inside that image.
3. Store the icon bounds as image-relative metadata.
4. Render the frame from the current image bounds plus the stored relative bounds.
5. Crop from the original image using the same relative bounds.

This prevents drift when the user moves or resizes a screenshot.

## Stored Target Metadata

Each extract target is a tldraw shape with v2 metadata:

```json
{
  "svgExtractTarget": true,
  "svgExtractTargetVersion": 2,
  "sourceShapeId": "shape:image-id",
  "status": "accepted",
  "label": "settings-tab-icon",
  "confidence": 0.9,
  "sourceRelativeBounds": { "x": 993, "y": 2308, "width": 92, "height": 86 },
  "sourceLastBounds": { "x": 783.4, "y": -771.4, "width": 1154.6, "height": 2566.6 },
  "targetLastBounds": { "x": 1776.4, "y": 1536.6, "width": 92, "height": 86 }
}
```

`sourceRelativeBounds` is the important crop contract. `sourceLastBounds` and `targetLastBounds` let the app distinguish between the image moving and the user manually refining the frame.

## Coordinate Conversion

Given a source image:

```js
const sourceBounds = {
  x: image.x,
  y: image.y,
  width: image.props.w,
  height: image.props.h,
}
```

Convert a canvas frame to image-relative bounds:

```js
const sourceRelativeBounds = {
  x: frame.x - sourceBounds.x,
  y: frame.y - sourceBounds.y,
  width: frame.props.w,
  height: frame.props.h,
}
```

Render the frame from image-relative bounds:

```js
const frameBounds = {
  x: sourceBounds.x + sourceRelativeBounds.x,
  y: sourceBounds.y + sourceRelativeBounds.y,
  width: sourceRelativeBounds.width,
  height: sourceRelativeBounds.height,
}
```

When cropping the original asset, scale from displayed image units to asset pixels:

```js
const scaleX = assetWidth / sourceBounds.width
const scaleY = assetHeight / sourceBounds.height

const crop = {
  x: sourceRelativeBounds.x * scaleX,
  y: sourceRelativeBounds.y * scaleY,
  width: sourceRelativeBounds.width * scaleX,
  height: sourceRelativeBounds.height * scaleY,
}
```

## Pixel-Based Refinement

For accurate auto-framing, start with a rough icon frame, then refine it from the source image pixels.

1. Read the source image asset, preferably from its `data:` URL or project-local asset path.
2. Convert the rough frame to image-relative bounds.
3. Expand the rough bounds by a small search margin.
4. Scan pixels inside the expanded region.
5. Treat non-white, non-background pixels as foreground.
6. Compute the foreground bounding box.
7. Add padding so strokes, shadows, and rounded edges are not clipped.
8. Save the padded foreground box as `sourceRelativeBounds`.

The foreground heuristic used for the right screenshot was:

```js
function isForeground(r, g, b, a) {
  if (a < 20) return false
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max - min
  return max < 238 || saturation > 18
}
```

This works well for UI screenshots with white or off-white backgrounds. It should be treated as a refinement heuristic, not a universal segmentation model.

## Padding Defaults

Use different padding by icon type:

```text
bottom navigation icon: expand 18, padding 8
product/list icon: expand 24, padding 10
complex badge icon: expand 28, padding 10
```

Bias toward not clipping the icon. A few pixels of white background are cheaper to clean later than a cropped shadow, stroke, or badge edge.

## Current Right-Screenshot Example

The refined frames were generated against this source image shape:

```json
{
  "id": "shape:EslZ9Ti7jf5ky33BlpIXI",
  "x": 783.400554383978,
  "y": -771.4176709641251,
  "width": 1154.5751638054833,
  "height": 2566.563806754484
}
```

The final right-screen targets were stored as image-local boxes:

```json
[
  { "label": "open-account-choice-product-icon", "box": { "x": 78, "y": 395, "width": 158, "height": 161 } },
  { "label": "tai-loc-product-icon", "box": { "x": 73, "y": 936, "width": 177, "height": 179 } },
  { "label": "asset-estimate-product-icon", "box": { "x": 71, "y": 1506, "width": 173, "height": 161 } },
  { "label": "sms-banking-product-icon", "box": { "x": 76, "y": 2049, "width": 176, "height": 177 } },
  { "label": "home-tab-icon", "box": { "x": 68, "y": 2304, "width": 95, "height": 95 } },
  { "label": "qr-tab-icon", "box": { "x": 301, "y": 2305, "width": 92, "height": 92 } },
  { "label": "transfer-tab-icon", "box": { "x": 532, "y": 2305, "width": 90, "height": 92 } },
  { "label": "utilities-tab-icon", "box": { "x": 757, "y": 2301, "width": 104, "height": 99 } },
  { "label": "settings-tab-icon", "box": { "x": 993, "y": 2308, "width": 92, "height": 86 } }
]
```

## Codex Workflow

When Codex frames icons:

1. Call `list_canvas_images`.
2. Pick the source image by visual context and image bounds.
3. Propose rough icon boxes in local image coordinates.
4. Apply suggestions as review frames.
5. Refine frames with source-pixel foreground detection.
6. Keep frames as `suggested` unless the user explicitly rejects or deletes them.
7. Batch extract every non-rejected target when the user presses Extract.

Do not silently convert viewport coordinates into final crop coordinates. If a coordinate came from a screenshot of the canvas, first convert it back through the source image bounds.
