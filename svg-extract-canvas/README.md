# SVG Extract Canvas

SVG Extract Canvas is a Codex-first local plugin for turning screenshot regions into editable SVG drafts.

The plugin provides the deterministic pieces: a local tldraw canvas, project-local files, MCP tools for crop/vectorize/clean/preview/export, and Codex skills. Codex provides the image understanding and visual judgment.

The intended extraction strategy is now:

```text
bound frame -> crop -> isolate background -> vectorize
bound frame -> crop -> isolate background -> recreate clean raster draft -> vectorize
```

Use the second path when the crop is visually mixed with the background or the local isolation result is not clean enough.

## Install

```bash
npm install
```

`npm install` now attempts to vendor an official `vtracer` binary into the project. To force or re-run that setup:

```bash
npm run install:vtracer
```

If automatic install is not available on your machine, you can still install the external VTracer binary and make it available as `vtracer`, or set:

```bash
export VTRACER_BIN=/absolute/path/to/vtracer
```

The default trace profile is tuned for UI icons first, not photographs. It uses lower speckle filtering, higher precision, and cutout layering by default.

## Run

```bash
npm run build
./scripts/start-canvas.sh /path/to/user/project
```

Default local URL:

```text
http://127.0.0.1:43227/
```

The canvas server serves the built Vite app from `dist/` and the local API endpoints from the same port.

For the intended Codex workflow, open this URL in the Codex in-app browser side pane. That keeps chat and canvas visible together, and lets Codex visually inspect the canvas while you select regions.

## Codex Prompts

```text
Open the SVG extraction canvas.
Extract the selected icon as SVG.
If direct tracing is noisy, recreate a clean raster draft first and then trace it.
Suggest extract boxes for the pasted screenshots.
Accept these suggested boxes.
Refine this SVG.
Export the final SVG.
```

## Output

Step-level output is written under:

```text
canvas/pages/default/crops/
canvas/pages/default/isolated/
canvas/pages/default/masks/
canvas/pages/default/drafts/
canvas/pages/default/raw/
canvas/pages/default/previews/
canvas/pages/default/exports/
```

Pressing the canvas **Extract** button writes a versioned batch folder:

```text
canvas/pages/default/extractions/v001/
canvas/pages/default/extractions/v001/crops/
canvas/pages/default/extractions/v001/manifest.json
```

Each button press creates the next version, such as `v002` or `v003`. Batch extraction crops only `manual` and `accepted` frames. `suggested` and `rejected` frames are ignored.

Extract boxes are bound to source image shapes. Suggested boxes are review-only until marked accepted.

The intended positioning is “editable SVG drafts for design exploration,” not exact cloning of logos or paid icon sets.

## Framing Accuracy

Accurate framing depends on image-relative coordinates:

```text
source image bounds -> icon bounds inside image -> image-relative frame metadata -> crop
```

Do not use viewport pixels as crop coordinates. Frames store `sourceShapeId` plus `sourceRelativeBounds`, and the crop pipeline uses those relative bounds against the source image asset.

See [Accurate Image-Relative Framing](docs/accurate-image-relative-framing.md) for the exact method used to tighten icon frames from source pixels.
