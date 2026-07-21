# ConferenceSpace Defense Deck Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a Vietnamese thesis-defense presentation for ConferenceSpace from the approved 20-slide outline, using the retained ConferenceSpace Progress & Thesis reference deck.

**Architecture:** Treat the current LaTeX chapters as the narrative source of truth, `docs/report/statistics` as the numeric source of truth, and project screenshots as product evidence. Duplicate mapped slides from the retained reference deck, edit inherited objects with `@oai/artifact-tool`, and preserve the template's typography, geometry, and recurring chrome.

**Tech Stack:** PowerPoint, `@oai/artifact-tool`, bundled presentation template-following scripts, project LaTeX/statistics/PNG sources.

---

### Task 1: Audit the retained template

**Files:**
- Read: `C:/Users/ADMIN/.codex/skills/artifact-template-conferencespace-progress-thesis/assets/reference.pptx`
- Create in scratch: `template-audit.txt`, `template-manifest.json`, rendered template previews

**Steps:**
1. Initialize the artifact-tool workspace outside the repository.
2. Inspect and render every source slide.
3. Record reusable layouts, typography, editable inherited objects, placeholders, and recurring chrome.
4. Verify that the reference file remains unchanged.

### Task 2: Build the content and source map

**Files:**
- Read: `docs/report/compiled/latex/Chapter1/chapter1.tex`
- Read: `docs/report/compiled/latex/Chapter2/chapter2.tex`
- Read: `docs/report/compiled/latex/Chapter3/chapter3.tex`
- Read: `docs/report/compiled/latex/Chapter4/chapter4.tex`
- Read: `docs/report/compiled/latex/Chapter5/chapter5.tex`
- Read: `docs/report/statistics/**/exports/*`
- Create in scratch: `content-plan.txt`, `source-notes.txt`, `template-frame-map.json`, `deviation-log.txt`

**Steps:**
1. Write one takeaway title and one narrative job for each of the 20 slides.
2. Bind every quantitative claim to its exact statistics source and caveat.
3. Select project screenshots and exported figures for each evidence slide.
4. Map every output slide to a compatible source slide and inherited edit targets.
5. Validate the map.

### Task 3: Prepare the starter deck

**Files:**
- Create in scratch: `template-starter.pptx`, starter previews and layouts

**Steps:**
1. Duplicate mapped source slides using the template-following helper.
2. Render the starter deck and verify slide order, inherited chrome, and placeholders.
3. Remap any slide whose inherited structure cannot support the intended content.

### Task 4: Author the defense deck

**Files:**
- Create in scratch: `build-defense-deck.mjs`
- Create: `outputs/ConferenceSpace_Thesis_Defense.pptx`

**Steps:**
1. Import the starter deck with `@oai/artifact-tool`.
2. Replace inherited title and body content with concise Vietnamese academic copy.
3. Replace inherited media slots with project screenshots and benchmark figures.
4. Use exact values from statistics exports; preserve uncertainty and scope labels.
5. Add speaker notes only where a caveat or transition is necessary.
6. Export the PPTX.

### Task 5: Verify and polish

**Files:**
- Create in scratch: final slide PNGs, layout JSON, montage, QA ledger

**Steps:**
1. Render every final slide and inspect each slide at full size.
2. Run overflow/overlap checks and fix unintended issues.
3. Scan the exported PPTX for empty inherited placeholders.
4. Run template fidelity validation against the starter deck.
5. Check terminology, numbers, units, sample sizes, and claim strength against sources.
6. Confirm the final output opens and contains exactly the intended slides.

