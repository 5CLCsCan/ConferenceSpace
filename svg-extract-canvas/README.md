# SVG Extract Canvas

SVG Extract Canvas is a Codex-first local plugin for turning screenshot regions into editable SVG drafts.

The plugin provides the deterministic pieces: a local tldraw canvas, project-local files, MCP tools for crop/vectorize/clean/preview/export, and Codex skills. Codex provides the image understanding and visual judgment.

The intended extraction strategy is:

```text
manual crop -> direct trace when possible
manual crop -> recreate clean raster draft -> trace when the crop is too noisy
```

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
Refine this SVG.
Export the final SVG.
```

## Output

Project-local output is written under:

```text
canvas/pages/default/crops/
canvas/pages/default/raw/
canvas/pages/default/previews/
canvas/pages/default/exports/
```

The intended positioning is “editable SVG drafts for design exploration,” not exact cloning of logos or paid icon sets.
