#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-${SVG_EXTRACT_PROJECT_DIR:-$(pwd)}}"
export SVG_EXTRACT_PROJECT_DIR="$PROJECT_DIR"
export SVG_EXTRACT_PORT="${SVG_EXTRACT_PORT:-43227}"

node server/canvas-server.mjs
