# Agent Skill Registry Design

**Date:** 2026-04-03

**Goal**

Add a static, repo-local skill system to the chatbot so the agent can discover reusable task-specific instructions from a shipped skill index, fetch the full markdown instructions through a new `get_skill` server tool, and follow those instructions without forcing users to restate the same workflow and output format on every request.

This must improve task execution consistency without weakening the existing platform contract around tool routing, privacy, retries, and evidence-based answers.

**Approved Constraints**

- Skills are static files shipped with `ai-service`
- Developers edit skills in-repo; there is no DB or admin UI
- The agent sees an injected skill index in the system prompt
- Skill retrieval is model-driven; the server does not judge applicability
- `get_skill` accepts `skill_name`, not file path
- The tool returns full skill content to the model context
- User-visible tool/result telemetry should expose only `skill_name` and `status`
- Skills may override only prompt sections explicitly marked as overridable
- Invariant core rules must remain non-overridable

**Problem**

The current chatbot has one monolithic system prompt in [prompt.py](E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\services\prompt.py). That works for general routing and safety, but it is weak for repeated domain-specific tasks that need:

- fixed execution workflows
- stable output formats
- explicit sequencing of tool usage
- reusable behavioral instructions

Without a skill layer, the model has to infer the workflow again from each user message. That creates three failure modes:

- inconsistent output shape across similar requests
- duplicated prompt engineering in user messages
- avoidable trial-and-error before the model converges on the expected flow

Your `summarize_conference` example is exactly this class of problem.

**Recommended Approach**

Use a file-backed skill registry with explicit prompt layering.

The base prompt should be split into two categories:

- invariant core sections, which define platform rules and cannot be overridden
- behavior sections, which can be overridden by a retrieved skill

The skill index is injected into the system prompt so the model can discover available skills. When the model decides a skill applies, it calls `get_skill(skill_name)`. The runtime reads the markdown file, returns the full skill content into model context, and advertises only `{skill_name, status}` to the user-facing telemetry.

This keeps the registry deterministic, audit-friendly, and easy to evolve, while avoiding the bad architecture of a skill replacing the entire system prompt.

**Why Full Prompt Override Is Wrong**

A full prompt override would let a markdown file replace rules that are not optional:

- when to use `query_engine`
- retry ceilings
- privacy boundaries
- evidence requirements
- page tool sequencing

Those are platform invariants, not style preferences. If a skill can replace them, one bad markdown file can silently break safety and operational correctness.

The correct boundary is: skill overrides task behavior, not the product contract.

**Architecture**

### 1. Static skill catalog

Keep the registry in [skill_index.py](E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\services\skill_index.py) as a checked-in JSON-like Python structure:

- `skill_name`
- `skill_description`
- `skill_path`

Each skill points to a markdown file under [skill_registry](E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\services\skill_registry).

The index is the only discoverability surface the model needs. It should stay small, explicit, and human-reviewed.

### 2. New server tool: `get_skill`

Register `get_skill` in [tool_registry.py](E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\services\tool_registry.py) as a server tool with this input:

- `skill_name: string`

Dispatch it in [agent_runtime.py](E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\services\agent_runtime.py).

Server-side behavior:

- validate that `skill_name` exists in the static index
- resolve the configured markdown path
- read the file content
- return tool output to model context as:
  - `skill_name`
  - `content`

If resolution fails, the tool must fail hard with a structured error. Do not silently return empty content.

### 3. Split prompt into invariant and overridable sections

Refactor [prompt.py](E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\services\prompt.py) from one flat string into a composed prompt with tagged sections.

Recommended shape:

- `<role can_be_override_by_skill="false">`
- `<task can_be_override_by_skill="false">`
- `<tool_selection can_be_override_by_skill="false">`
- `<query_engine_rules can_be_override_by_skill="false">`
- `<page_workflow can_be_override_by_skill="false">`
- `<constraints can_be_override_by_skill="false">`
- `<retry_policy can_be_override_by_skill="false">`
- `<scope_control can_be_override_by_skill="false">`
- `<response_style can_be_override_by_skill="true">`
- `<answer_synthesis can_be_override_by_skill="true">`
- `<skill_index can_be_override_by_skill="false">`
- `<skill_usage_rules can_be_override_by_skill="false">`

The point of the tag metadata is not for the server to parse later. It is for the model to understand which prompt regions are legally superseded by a skill and which are not.

### 4. Skill usage contract inside the system prompt

The injected prompt should tell the model:

- the skill index is an available catalog of optional, task-specific instruction packs
- if a request matches a skill description, or the model determines a skill is applicable, it may call `get_skill`
- after retrieval, the model must follow the skill instructions strictly for the task-specific workflow and output format
- skill instructions may override only sections whose prompt tags declare `can_be_override_by_skill="true"`
- skill instructions must not override invariant sections tagged `false`

This gives the model a clear precedence model instead of leaving prompt conflict resolution implicit.

**Tool Contracts**

### `get_skill`

**Input**

- `skill_name: string`

**Tool output seen by the model**

- `skill_name`
- `content`

**User-visible telemetry/result summary**

- `skill_name`
- `status`

The runtime already separates tool events from model-visible tool messages. That split should be preserved rather than forcing one payload to satisfy both concerns.

**Failure Handling**

`get_skill` must fail clearly for:

- unknown `skill_name`
- duplicate `skill_name` entries in the index
- unreadable or missing markdown file
- skill path escaping outside the allowed registry directory

These are configuration errors, not soft misses. Do not downgrade them into empty responses.

**Operational Rules**

- Skills are optional. The model should not fetch one unless it materially improves the answer.
- The model may use at most the minimum number of skills needed for the request.
- Skills do not create new backend capabilities. They only change how the agent behaves with the tools it already has.
- A skill must not be treated as a substitute for missing evidence. If a task needs current product state, the agent still has to call the correct data/page tool.

**Examples**

For a skill like `summarize_conference`, the markdown can define:

- required `query_engine` calls
- the exact report structure
- ordering of sections
- wording or formatting requirements
- any mandatory caveats

Then the user can say "summarize my conferences progress" and the agent can:

1. recognize the matching skill from the injected index
2. call `get_skill("summarize_conference")`
3. receive the markdown instructions in tool context
4. follow the skill workflow while still obeying invariant tool/safety rules

That is the correct leverage point for skills.

**Testing**

Minimum required coverage:

- `skill_index.py` exposes the expected static entries
- `get_skill` is registered as a server tool with the correct input schema
- server dispatch reads a known skill file and returns model-visible content
- unknown skill names fail with a clear error
- path validation prevents reading outside the skill registry root
- prompt composition injects the serialized skill index
- prompt composition documents the skill usage contract
- prompt sections intended to remain invariant are tagged with `can_be_override_by_skill="false"`
- prompt sections intended for skill override are tagged with `can_be_override_by_skill="true"`

**Out of Scope**

- database-backed skill storage
- user-authored skills
- automatic skill recommendation on the server
- server-side applicability checking
- full prompt replacement by a skill
- frontend UI for skill management

Those would add complexity without helping the core problem you described.
