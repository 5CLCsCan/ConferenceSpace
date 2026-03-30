# AI-003 Spec And Recon

## Roadmap Scope

After re-evaluation, AI-003 is defined as a reviewer-triggered submission pre-read workflow. It starts only when the reviewer selects the feature and clicks `Start generating`, consumes reviewer-visible submission material only, and produces a neutral structured briefing that helps the reviewer know what the paper claims, what is notable, and what deserves careful manual attention (`docs/ai-integration.md:80-103`).

## Recon Constraints

- Reviewer workflow in the current platform is assignment-centric: reviewers open accepted assignments, author reviews in-place, save drafts, submit finals, and participate in discussion from the same submission detail surface (`docs/platform-recon.md:41-47`, `docs/platform-recon.md:142-159`).
- Review execution is already a bounded workflow with draft-save, final-submit, and validation rules. AI-003 must support that workflow rather than introduce an alternate review surface (`docs/platform-recon.md:152-159`).
- The feature story is about reducing reviewer reading effort on the submission itself. Therefore the model input must include actual manuscript content; abstract-only input is not enough to justify the product promise.
- To reduce anchoring risk, AI-003 must stay descriptive rather than evaluative. It should not emit recommendations, predicted scores, or accept or reject priors.
- Discussion and rebuttal are real reviewer workflow surfaces, but they are not part of the corrected AI-003 contract. Using them would change the feature from a submission pre-read into a process-context interpreter.
- The roadmap positions AI-003 as more than ad hoc chat assistance. That means the current mock card behavior must be replaced with a persisted structured artifact and cache model rather than a prompt-driven markdown result.

## Scope Boundaries Locked For V1

- AI-003 is a standalone workflow in `ai-service`, not part of AI-001 chat state.
- The entry point remains the existing reviewer sidebar card in submission detail.
- Generation is reviewer-triggered only. No automatic generation on assignment open.
- Browser traffic remains `frontend -> Go backend -> ai-service -> Go backend -> frontend`.
- Go backend owns authorization, assignment resolution, and reviewer-safe manuscript loading.
- `ai-service` owns extraction, normalization, structured generation, caching, and persistence.
- V1 prioritizes compatibility and minimal modification of the current system:
  - reuse existing reviewer page placement
  - reuse assignment-scoped Go route shape
  - reuse the existing manuscript extraction precedent in `ai-service`
  - avoid adding a new worker stack or browser-to-service path
- Submission-only means:
  - manuscript content is in scope
  - title, abstract, keywords, and track are in scope when reviewer-visible
  - discussion, rebuttal, and precheck are out of scope
- Caching must be tied to real submission state, not to a fictional `submission_version` field. The cache identity must be built from actual reviewer-visible submission state plus internal extraction and prompt versions.
