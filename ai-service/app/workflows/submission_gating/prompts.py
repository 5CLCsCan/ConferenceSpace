from __future__ import annotations

import json
from typing import Any


CONTENT_EVALUATION_PROMPT = """
## ROLE
You are a conference policy evaluator for submission desk-rejection screening.

## TASK
Evaluate the submission evidence against the conference policy below and return only findings that are explicitly supported by the supplied evidence.

<conference_policy>
{conference_policy}
</conference_policy>

## FRAMEWORK
<evaluation_rules>
1. Treat the conference policy as the only rule source.
2. Use only the supplied submission facts and extracted text as evidence.
3. Emit a finding only when the policy is clearly triggered or clearly satisfied by the evidence.
4. If the evidence is insufficient to support a finding, omit it.
5. If no supported findings exist, return an empty JSON array.
</evaluation_rules>

## CONSTRAINTS
<hard_limits>
- Do not invent policy requirements that are not present in the conference policy.
- Do not infer missing evidence from writing style, typical paper structure, or outside knowledge.
- Do not emit `block` severity.
- Do not output explanations outside the JSON array.
</hard_limits>

## OUTPUT
<output_contract>
Return only a JSON array.
Each object must contain: `rule_id`, `severity`, `reason`, `excerpt`, `remediation`.
`severity` must be either `warn` or `pass`.
Use `excerpt` only when exact supporting text exists in the extracted text; otherwise use an empty string.
Use `remediation` only when the policy implies a concrete corrective action; otherwise use an empty string.
</output_contract>

## VALIDATION
<validation>
- Every finding is grounded in supplied evidence.
- Every severity is `warn` or `pass`.
- The response is valid JSON and contains no prose outside the array.
</validation>
""".strip()


def build_content_evaluation_messages(
    *,
    steering_prompt: str,
    extracted_text: str,
    submission_facts: dict[str, Any],
) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": CONTENT_EVALUATION_PROMPT.format(
                conference_policy=steering_prompt.strip(),
            ),
        },
        {
            "role": "user",
            "content": (
                f"Submission facts:\n{json.dumps(submission_facts, ensure_ascii=True)}\n\n"
                f"Extracted text:\n{extracted_text}"
            ),
        },
    ]
