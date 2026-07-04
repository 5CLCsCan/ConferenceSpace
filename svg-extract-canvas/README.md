# SVG Extract Canvas

SVG Extract Canvas is a Codex-first local plugin for turning screenshot regions into editable SVG drafts.

The plugin provides the deterministic pieces: a local tldraw canvas, project-local files, MCP tools for crop/vectorize/clean/preview/export, and Codex skills. Codex provides the image understanding and visual judgment.

The intended extraction strategy is now:

```text
bound frame -> crop -> isolate background -> vectorize
bound frame -> crop -> rembg cleanup -> vectorize
bound frame -> crop -> isolate background -> recreate clean raster draft -> vectorize
```

Use the rembg and Codex-draft paths as experiments when the crop is visually mixed with the background or the local isolation result is not clean enough. Do not treat either path as the permanent default until previews are compared on real screenshots.

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

`rembg` is optional for cleanup comparison. Install it only when you want to benchmark it against local isolation and Codex-generated clean rasters:

```bash
pip install "rembg[cpu,cli]"
```

If `rembg` is not installed, the comparison workflow records an install hint and continues with the available candidates.

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
Compare rembg and Codex cleanup paths for this crop.
If direct tracing is noisy, recreate a clean raster draft first and then trace it.
Suggest extract boxes for the pasted screenshots.
Refine this SVG.
Export the final SVG.
```

## Output

Step-level output is written under:

```text
canvas/pages/default/crops/
canvas/pages/default/isolated/
canvas/pages/default/masks/
canvas/pages/default/rembg/
canvas/pages/default/drafts/
canvas/pages/default/raw/
canvas/pages/default/previews/
canvas/pages/default/exports/
canvas/pages/default/experiments/
```

Pressing the canvas **Extract** button writes a versioned batch folder:

```text
canvas/pages/default/extractions/v001/
canvas/pages/default/extractions/v001/crops/
canvas/pages/default/extractions/v001/manifest.json
```

Each button press creates the next version, such as `v002` or `v003`. If one or more extract frames are selected, **Extract** crops only those selected frames. If no extract frame is selected, it crops every extract frame on the page. Frames marked `rejected` are always skipped.

Extract boxes are bound to source image shapes. Codex-suggested boxes are included by default when you press **Extract** with no extract-frame selection; select specific boxes first when you only want a subset.

The intended positioning is “editable SVG drafts for design exploration,” not exact cloning of logos or paid icon sets.

## Framing Accuracy

Accurate framing depends on image-relative coordinates:

```text
source image bounds -> icon bounds inside image -> image-relative frame metadata -> crop
```

Do not use viewport pixels as crop coordinates. Frames store `sourceShapeId` plus `sourceRelativeBounds`, and the crop pipeline uses those relative bounds against the source image asset.

See [Accurate Image-Relative Framing](docs/accurate-image-relative-framing.md) for the exact method used to tighten icon frames from source pixels.
