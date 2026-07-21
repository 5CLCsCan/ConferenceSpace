# ConferenceSpace Two-Poster Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate two print-ready A0 landscape ConferenceSpace posters as editable SVG, vector PDF, and high-resolution PNG files.

**Architecture:** A small Python SVG builder owns shared geometry, typography, charts, logos, and placeholders. Two layout modules compose the common primitives into Product Journey and Evidence Dashboard variants. A Node/Playwright renderer converts the SVGs to exact-size PDF and PNG outputs, followed by automated geometry/data checks and visual PDF inspection.

**Tech Stack:** Python 3, SVG, Node.js, Playwright/Chromium, Poppler, pypdf.

---

### Task 1: Shared poster primitives

**Files:**
- Create: `scripts/poster/poster_common.py`
- Create: `scripts/poster/test_posters.py`

1. Add tests for A0 viewBox, palette constants, required data markers and placeholder labels.
2. Run the tests and confirm they fail because the builder does not exist.
3. Implement XML escaping, text wrapping, card, label, metric, chart, logo and UI-placeholder helpers.
4. Run the tests and confirm the shared checks pass.

### Task 2: Product Journey layout

**Files:**
- Create: `scripts/poster/version_a.py`
- Modify: `scripts/poster/test_posters.py`

1. Add checks for the three-role journey and three named UI placeholders.
2. Implement the header, three-layer model, role journey, evidence cards, limitations and footer.
3. Generate `output/poster/conferencespace-poster-a-product-journey.svg`.
4. Run tests and inspect SVG structure.

### Task 3: Evidence Dashboard layout

**Files:**
- Create: `scripts/poster/version_b.py`
- Modify: `scripts/poster/test_posters.py`

1. Add checks for the central responsibility model and four evidence families.
2. Implement the dashboard grid, vector charts, evidence-scope panel, UI strip and conclusion.
3. Generate `output/poster/conferencespace-poster-b-evidence-dashboard.svg`.
4. Run tests and inspect SVG structure.

### Task 4: Rendering pipeline

**Files:**
- Create: `scripts/poster/generate_posters.py`
- Create: `scripts/poster/render_posters.mjs`

1. Add a deterministic entry point that generates both SVG files.
2. Render each SVG through Chromium to PDF at 1189 × 841 mm.
3. Capture each poster to PNG at 9362 × 6622 px.
4. Store PDFs in `output/pdf/` and SVG/PNG files in `output/poster/`.

### Task 5: Verification and delivery

**Files:**
- Create: `tmp/pdfs/poster-a-render.png`
- Create: `tmp/pdfs/poster-b-render.png`

1. Run unit tests and data-marker checks.
2. Use `pdfinfo` and pypdf to verify one page and A0 dimensions.
3. Render both PDFs with Poppler.
4. Inspect both rendered posters at full composition and selected high-detail crops.
5. Fix any clipping, overlap, weak contrast or unreadable labels and repeat verification.
6. Commit source files and deliver links to all six final artifacts.
