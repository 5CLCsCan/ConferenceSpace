# ConferenceSpace Presentation Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install a private ConferenceSpace presentation template that preserves the supplied PowerPoint and requires Vietnamese academic-writing review for all Vietnamese slide prose.

**Architecture:** Use the official Template Creator script to package the unchanged reference deck and inspected preview into a personal artifact-template skill. Add one focused runtime section to the generated `SKILL.md`; keep the manifest, preview, and retained reference aligned with the generated package.

**Tech Stack:** Bundled Node.js runtime, Template Creator packaging script, PowerPoint reference asset, Markdown skill instructions, PowerShell verification.

---

### Task 1: Package the reference-backed template

**Files:**
- Read: `E:\Download\Conference Management.pptx`
- Read: `C:\Users\ADMIN\AppData\Local\Temp\codex-presentations\manual-20260721\conference-management-template\tmp\Conference Management\slide-1.png`
- Create: `C:\Users\ADMIN\.codex\skills\artifact-template-conferencespace-progress-thesis*\`

**Step 1:** Run the official Template Creator script with the bundled Node.js executable, the source PowerPoint, the inspected first-slide preview, the approved display name, and the specialized intended-use description.

**Step 2:** Read the JSON result and record the exact generated skill name and directory.

**Step 3:** Verify that `SKILL.md`, `artifact-template.json`, `agents/openai.yaml`, `assets/reference.pptx`, and `assets/preview.png` exist.

### Task 2: Add the mandatory Vietnamese writing contract

**Files:**
- Modify: `<generated-skill-directory>\SKILL.md`

**Step 1:** Run a baseline assertion against the freshly generated `SKILL.md` and verify that it fails because `vietnamese-academic-writing` is absent.

**Step 2:** Add a concise mandatory runtime section covering Vietnamese titles, sentences, paragraphs, tables, captions, notes, creation, revision, review, and translation.

**Step 3:** Require the operator to invoke `vietnamese-academic-writing` before drafting or changing Vietnamese content and to preserve evidence, numbers, terminology, scope, and uncertainty.

**Step 4:** Run the assertion again and verify that all required triggers and scope terms are present.

### Task 3: Review and close instruction loopholes

**Files:**
- Review: `<generated-skill-directory>\SKILL.md`

**Step 1:** Ask a senior prompt-engineering peer to test the runtime wording against time pressure, partial-edit requests, and mixed Vietnamese-English slides.

**Step 2:** Apply only changes that close a demonstrated loophole without duplicating the referenced Vietnamese writing skill.

**Step 3:** Re-run the static contract assertions.

### Task 4: Verify the installed template

**Files:**
- Verify: `<generated-skill-directory>\artifact-template.json`
- Verify: `<generated-skill-directory>\agents\openai.yaml`
- Verify: `<generated-skill-directory>\assets\reference.pptx`
- Verify: `<generated-skill-directory>\assets\preview.png`

**Step 1:** Compare the retained reference hash with the supplied PowerPoint hash.

**Step 2:** Inspect the final preview and confirm that it is representative, unclipped, and uncorrupted.

**Step 3:** Check metadata values, package file inventory, and absence of staging or backup directories.

**Step 4:** Run a final requirements checklist and report the exact skill name and usage instructions.
