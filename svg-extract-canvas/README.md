# SVG Extract Canvas

SVG Extract Canvas is a Codex-first local plugin for turning screenshot regions into editable SVG drafts.

The plugin provides the deterministic pieces: a local tldraw canvas, project-local files, MCP tools for crop/vectorize/clean/preview/export, and Codex skills. Codex provides the image understanding and visual judgment.

## Install

```bash
npm install
```

Install the external VTracer binary and make it available as `vtracer`, or set:

```bash
export VTRACER_BIN=/absolute/path/to/vtracer
```

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

## Codex Prompts

```text
Open the SVG extraction canvas.
Extract the selected icon as SVG.
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
