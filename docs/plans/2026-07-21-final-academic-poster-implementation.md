# ConferenceSpace Final Academic Poster Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Produce one print-ready A0 landscape academic poster that communicates the ConferenceSpace thesis through a central peer-review lifecycle, real product figures, and correctly scoped evidence.

**Architecture:** Keep the final poster independent from the two archived variants. A Python module composes an editable SVG from shared vector primitives and embedded report images; a dedicated Playwright renderer converts that SVG into a single-page A0 PDF and a high-resolution PNG. Tests inspect the SVG contract before any rendering work.

**Tech Stack:** Python 3, SVG, embedded PNG figures, Node.js, Playwright/Chromium, Poppler, unittest.

---

### Task 1: Lock the final-poster contract

**Files:**
- Create: `scripts/poster/test_final_poster.py`

**Step 1: Write the failing availability test**

Assert that `scripts.poster.final_poster` exists. Keep content tests skipped until the module is present so the red result is a deliberate assertion failure.

**Step 2: Run the test to verify it fails**

Run: `python -m unittest scripts.poster.test_final_poster -v`

Expected: `FAIL` because the final poster module does not exist.

**Step 3: Add contract tests**

Require A0 landscape dimensions, the approved take-home message, exact report metrics, all three screenshot source names, embedded raster data, academic figure labels, and the absence of UI placeholders or dashboard language.

### Task 2: Create the visual philosophy and SVG composer

**Files:**
- Create: `output/poster/evidence-in-motion.md`
- Create: `scripts/poster/final_poster.py`

**Step 1: Write the design philosophy**

Define “Evidence in Motion”: warm-paper editorial composition, institutional navy and teal as ink, a monumental lifecycle, sparse captions, and evidence encoded as scientific figures rather than interface cards.

**Step 2: Implement the minimal SVG composer**

Compose four spatial regions: identity and takeaway; problem/reference context; central lifecycle with three report screenshots; evidence figures; conclusion and limits. Embed every raster as a data URI and label every product crop as a numbered figure.

**Step 3: Run the contract tests**

Run: `python -m unittest scripts.poster.test_final_poster -v`

Expected: all tests pass.

### Task 3: Render the print artifacts

**Files:**
- Create: `scripts/poster/render_final_poster.mjs`
- Generate: `output/poster/conferencespace-academic-poster.svg`
- Generate: `output/pdf/conferencespace-academic-poster.pdf`
- Generate: `output/poster/conferencespace-academic-poster.png`

**Step 1: Generate the SVG**

Run: `python -m scripts.poster.final_poster`

**Step 2: Render PDF and PNG**

Run: `node scripts/poster/render_final_poster.mjs`

Expected: one A0 PDF page and one 9362 × 6622 PNG preview.

### Task 4: Verify and refine

**Files:**
- Modify: `scripts/poster/final_poster.py`
- Regenerate: final SVG, PDF, and PNG artifacts

**Step 1: Inspect mechanically**

Use `pdfinfo`, `pypdf`, and image dimensions to verify one page, A0 landscape size, extractable title text, and expected PNG resolution.

**Step 2: Inspect visually**

Render the PDF with Poppler and review the page image for clipping, overlap, image crop quality, legibility, hierarchy, and excess dashboard styling.

**Step 3: Refine without adding density**

Improve spacing, crop, typography, or alignment. Re-render and repeat the visual check until no defects remain.

### Task 5: Confirm scope and commit

**Files:**
- Create/modify only the poster plan, philosophy, generator, renderer, tests, and final artifacts listed above.

**Step 1: Run verification**

Run the final-poster tests, artifact metadata checks, and GitNexus change detection.

**Step 2: Stage explicit paths**

Do not stage the user's modified report chapters, `docs/report/poster-structure/`, or unrelated `tmp/` files.

**Step 3: Commit**

Run: `git commit -m "feat: build final ConferenceSpace academic poster"`

