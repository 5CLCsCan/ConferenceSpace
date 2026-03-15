# AI-002 Spec And Recon

## Roadmap Scope

The roadmap defines AI-002 as a high-impact workflow integration named "Submission Material Gating (Pre-ingestion Compliance & Integrity)." It is triggered by upload and publish events before review intake, consumes submission files plus extracted content, conference policies, and precheck signals, and must return a `pass/warn/block` result with remediation guidance. The roadmap also calls out false positives, deadline friction, and dependency on policy persistence plus enforcement hooks (`docs/ai-integration.md:53-73`).

## Recon Constraints

- The author workflow explicitly branches between saving drafts and publishing submissions, so AI-002 should gate publish/review-intake transitions rather than draft save (`docs/platform-recon.md:100-109`).
- Conference setup already persists several policy-oriented fields, but recon notes that some setup controls are only partially mapped to backend persistence, so AI-002 must normalize on authoritative backend state instead of trusting raw UI state (`docs/platform-recon.md:94-98`, `docs/platform-recon.md:194-200`).
- The recon document explicitly calls out inferred gaps around submission window enforcement and blind-review identity visibility. Those gaps matter because AI-002 must not assume every chair-configurable policy already exists as a durable backend contract (`docs/platform-recon.md:209-212`).
- Feature mapping confirms that "Precheck Manuscript Quality" already exists in the author flow and uses the upload step plus `precheckPaper`, which means AI-002 should retain the existing frontend endpoint surface but replace the Go-side precheck logic entirely by proxying to `ai-service` (`docs/feature-mapping.md:244-252`).
- The chair wizard already advertises `PDF`, `LaTeX`, and `Word` as accepted manuscript formats, but the backend file storage currently enforces PDF-only for paper uploads. AI-002 extends the operational surface to handle all three format families (PDF, DOCX, LaTeX/TeX), and the Go storage layer must be updated accordingly (`frontend/components/wizard/creation/steps/policy-guidelines.tsx:15-27`, `backend/internal/storage/file/file.go:39-49`).
- The backend already persists `DeskRejectionSettings` with rule-oriented fields (`min_references`, `required_sections`, `title_max_words`, `scope_keywords`, `banned_phrases`) and an LLM steering surface (`prompt_fragments`), but the wizard does not expose any of these fields to the chair (`backend/internal/dto/conference.go:5-29`, `frontend/components/wizard/creation/steps/policy-guidelines.tsx`).

## Scope Boundaries Locked For V1

- AI-002 is a standalone deterministic workflow in `ai-service`, not part of the AI-001 conversational agent.
- The legacy Go precheck implementation (desk-rejection pipeline, `PaperRuleConfig` conversion, optional Gemini evaluation) is marked for removal. All precheck logic moves to `ai-service` (`backend/internal/controller/submission/precheck.go:65-86`, `backend/internal/deskrejection/pipeline/pipeline.go:17-99`).
- The existing frontend endpoint `POST /api/v1/conferences/{conference_id}/submissions/precheck` stays unchanged. The Go backend retains this route but becomes a proxy: it enriches the request with conference policy and submission metadata, forwards the call to `ai-service`, and maps the response back to the current frontend contract. This avoids a frontend-to-ai-service round-trip (`frontend -> go-backend -> ai-service -> go-backend -> frontend`).
- V1 supports PDF, DOCX, and LaTeX (`.tex`) submissions. The backend paper upload storage layer must be updated to accept `.docx` and `.tex` files alongside `.pdf` (`backend/internal/storage/file/file.go:39-49`).
- V1 blocks unreadable, encrypted, corrupt, or image-only files instead of introducing OCR or external document services. Format-specific integrity checks apply: PDF header and parseability, DOCX zip structure and XML validity, LaTeX compilability is not checked but basic structural parsing is required.
- The conference creation wizard exposes a "Submission Gating" section where the chair configures deterministic rules (min references, required sections, anonymization, banned phrases, scope keywords) and provides an optional LLM steering prompt for content evaluation (`references/AI-002/05-chair-configuration-ui.md`).
- Deterministic rules control hard verdicts (`pass | warn | block`). The LLM-steered content evaluation can produce `warn` findings but cannot unilaterally `block` a submission, preserving the deterministic guarantee for blocking decisions.
- V1 returns canonical `pass | warn | block` internally, with legacy compatibility mapping for current frontend consumers.
