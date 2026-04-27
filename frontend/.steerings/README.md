# Steering Docs

These files are the canonical UI guidance for ConferenceSpace product surfaces.

Use them in this order:
1. [insights.md](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/.steerings/insights.md)
2. [sizings.md](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/.steerings/sizings.md)

Purpose:
- Keep new product UI aligned with the current scholar-compact baseline
- Reduce visual drift between chair, reviewer, author, and shared operational surfaces
- Prevent local feature work from inventing new chrome, spacing systems, or status treatments without reason

Scope:
- Product UI baseline only

Explicit exclusions:
- `AI-002`
- `AI-003`

Working rule:
- Follow these docs before introducing new UI patterns
- Reuse shared components and owned patterns before building one-off structures
- If an area already has a coherent local pattern, preserve it unless the work is intentionally standardizing that area
- If a feature needs a real deviation, document the reason in the feature design instead of silently redefining the baseline
