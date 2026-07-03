---
name: svg-extract-open-canvas
description: Open the SVG Extract Canvas local web service for a Codex project. Use when the user asks to open, launch, view, or work in the SVG extraction canvas.
---

# SVG Extract Open Canvas

Start the local canvas service from the plugin repository root:

```bash
./scripts/start-canvas.sh /absolute/path/to/user/project
```

Use the current Codex workspace as the user project directory. Do not pass the plugin repository unless the user is developing the plugin itself.

Open the printed local URL, usually:

```text
http://127.0.0.1:43227/
```

Canvas data belongs to the user project:

```text
canvas/pages/default/svg-extract-canvas.json
canvas/pages/default/svg-extract-selection.json
canvas/pages/default/svg-extract-view-state.json
```

If browser control is unavailable, report the local URL and keep the server running.
