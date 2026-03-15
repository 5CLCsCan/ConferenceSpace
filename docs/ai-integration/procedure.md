# AI Integration Documentation Procedure

## Purpose

`docs/ai-integration/` is the canonical home for per-integration lifecycle records in ConferenceSpace. The folder is meant to let a human or agent answer three questions quickly:

1. What does this integration mean in the roadmap?
2. What has actually been researched, designed, implemented, verified, and finalized?
3. Which supporting documents should be read next?

The main `AI-xxx` document is the authoritative lifecycle ledger for that integration. Supporting notes in `references/AI-xxx/` exist to make navigation and evidence review easier; they do not replace the original source files.

## Folder Structure

- `procedure.md`
  - Operating manual for the folder.
  - Defines naming, lifecycle rules, citation standards, and update procedure.
- `_template.md`
  - Required template for new integration lifecycle documents.
- `AI-<NNN>-<kebab-title>.md`
  - Canonical lifecycle record for one integration.
  - Must cover the whole lifecycle that is known so far: spec, research, design, plans, implementation evidence, verification, risks, and status.
- `references/AI-<NNN>/`
  - Curated reference notes for one integration.
  - Each note should help an agent find and understand the relevant original sources without duplicating large documents.

## Naming Rules

- Main document: `AI-<NNN>-<kebab-title>.md`
  - Example: `AI-001-conference-agent.md`
- Reference folder: `references/AI-<NNN>/`
  - Example: `references/AI-001/`
- Reference notes: ordered and purpose-driven
  - Example: `00-index.md`, `01-spec-and-roadmap.md`, `02-live-implementation.md`, `03-existing-related-docs.md`

Use ASCII names only. Keep filenames stable once published so other docs can link to them safely.

## Document Roles

### Main `AI-xxx` Document

The main lifecycle document is the source of truth for the current state of one integration. It must:

- state the current verdict using only `complete`, `partial`, or `needs work`
- include a lifecycle status table
- include a linked artifact index
- summarize implementation state with evidence
- compare shipped behavior to the original roadmap/spec
- record current gaps, risks, and follow-ups
- record the last-reviewed date

It should link out to reference notes instead of embedding every supporting detail inline.

### Reference Notes

Reference notes are curated navigation aids. They should:

- point to original source files and docs
- explain why each source matters
- normalize terminology when the source material is inconsistent
- call out draft vs shipped vs supporting material clearly

Reference notes should not become shadow copies of existing documents. If a long source already exists elsewhere, link it and summarize it instead of copying it.

## Lifecycle States

Every main `AI-xxx` document should track these states:

| State | Meaning | Minimum Expectation |
| --- | --- | --- |
| `create` | The integration record is first established. | Main doc exists, reference folder exists, initial reference index exists. |
| `research` | Inputs, roadmap scope, and existing surfaces are being discovered. | Spec sources and source-of-truth files are linked. |
| `design` | Architecture or target-state design is documented. | Related design docs are indexed and their status is labeled. |
| `plan` | Implementation or remediation work is planned. | Relevant plan docs are linked with short descriptions. |
| `implement` | Shipped code or docs exist. | Implementation summary cites actual source files and locations. |
| `verify` | Evidence has been reviewed against the spec. | Tests, validation notes, and explicit gaps are recorded. |
| `finalize` | A stable current verdict is published. | Verdict, delivered/missing summary, and carried risks are locked in. |
| `supersede` | The record is replaced by a newer canonical record. | Replacement doc is linked and supersession is explicit. |

Not every integration will have every state completed immediately, but every state should appear in the lifecycle table with its current status.

## Required Main Document Sections

Every `AI-xxx` main document must contain these sections, in this order unless a strong reason exists to deviate:

1. `Overview`
2. `Verdict`
3. `Lifecycle Status`
4. `Artifact Index`
5. `Architecture / Data Flow`
6. `Interfaces / Tools / Dependencies`
7. `Delivered vs Partial vs Missing vs Deviations`
8. `Risks / Follow-ups`
9. `Evidence Map`

## Procedures

### Create

Use this when an integration gets its first lifecycle record.

Required actions:

1. Create the main `AI-xxx` document from `_template.md`.
2. Create `references/AI-xxx/`.
3. Create `references/AI-xxx/00-index.md`.
4. Populate the main document with:
   - current verdict
   - lifecycle table
   - initial artifact index
   - initial evidence-backed summary
   - known gaps and risks
   - last-reviewed date

### Update

Use this whenever the integration state changes or the record is refreshed.

Required actions:

1. Re-read the roadmap/spec and current implementation evidence.
2. Refresh the verdict if the evidence changed.
3. Update the lifecycle table.
4. Append new plans, designs, implementation notes, or verification artifacts to the artifact index.
5. Update reference notes when new source files or related docs matter.
6. Re-check gaps, risks, and deviations.
7. Update the last-reviewed date.

### Finalize

Use this when the current record is mature enough to publish a stable verdict.

Required actions:

1. Lock the current verdict based on evidence.
2. Summarize delivered, partial, missing, and deviating items against the roadmap/spec.
3. Confirm open risks that carry forward.
4. Confirm the artifact index includes the major lifecycle documents and implementation evidence.
5. Confirm reference notes still point to the correct supporting material.

### Supersede

Use this when one lifecycle record is replaced by a newer canonical record.

Required actions:

1. Add a supersession note at the top of the old document.
2. Link the replacement record directly.
3. Preserve the old record for history; do not silently overwrite history that other documents may cite.

## Citation Rules

Every substantive claim must be traceable.

- Cite concrete source files and locations for implementation claims.
  - Example: `frontend/app/api/chat/route.ts:74-138`
- Cite roadmap/spec locations for scope claims.
  - Example: `docs/ai-integration.md:22-42`
- Use `Inference:` when a conclusion is derived from multiple sources rather than directly stated in one place.
- Do not claim hidden capabilities, future work, or implied behavior unless the source says so or the document marks the statement as inference.

## Maintenance Rules

- Keep the main `AI-xxx` doc short enough to scan, but detailed enough to stand on its own.
- Push bulk context into `references/AI-xxx/` notes.
- Prefer linking to existing source docs over copying them.
- When a draft architecture document conflicts with shipped code, say so explicitly and treat shipped code as authoritative for current-state claims.
- Update the roadmap/index when a new canonical lifecycle document is created or superseded.
