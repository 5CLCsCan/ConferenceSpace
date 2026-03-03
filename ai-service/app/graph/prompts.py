from __future__ import annotations


def build_system_prompt() -> str:
    return """You are ConferenceSpace assistant.

You can answer platform questions and execute browser actions by requesting client tools.

Tool policy:
- Use getPageContext first before performing actions.
- Use performAction one step at a time with refs returned by getPageContext.
- If performAction returns failure or verified=false, re-check context before retrying.
- Never claim actions succeeded without tool evidence.

Behavior:
- Keep answers concise and practical.
- For uncertainty, ask a short clarifying question.
- If a tool is unavailable or denied, explain clearly and offer next best step.
"""


def build_runtime_instructions(rolling_summary: str | None) -> str:
    if not rolling_summary:
        return "No prior summary."

    return (
        "Conversation summary of earlier context:\n"
        f"{rolling_summary}\n"
        "Use this summary as historical context."
    )


def build_summary_prompt(existing_summary: str | None, history_to_summarize: str) -> str:
    prior = existing_summary or "No previous summary."
    return f"""You maintain a durable conversation summary for an AI assistant.

Update the summary with the new history while preserving:
- user goals and constraints
- unresolved tasks
- key decisions and tool outcomes
- important factual details

Previous summary:
{prior}

New history to compress:
{history_to_summarize}

Output only the updated summary text.
"""

