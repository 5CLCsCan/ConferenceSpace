# Agent Skill Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a static, file-backed skill registry and a new `get_skill` server tool so the chatbot can discover and retrieve reusable task-specific instructions from the system prompt while keeping invariant runtime rules intact.

**Architecture:** Keep skills as repo-local markdown files indexed by `skill_index.py`. Extend the Python tool registry and runtime with a `get_skill(skill_name)` server tool, then refactor prompt assembly so the skill index and skill-usage contract are injected into tagged prompt sections. Skills override only sections explicitly marked as overridable; tool routing, privacy, retry, and evidence rules remain invariant.

**Tech Stack:** Python 3.12, FastAPI ai-service runtime, litellm tool-calling, pytest

---

### Task 1: Lock the skill index and prompt contract in tests

**Files:**
- Create: `ai-service/tests/test_skill_index.py`
- Modify: `ai-service/tests/test_agent_runtime_helpers.py`
- Inspect: `ai-service/app/services/skill_index.py`
- Inspect: `ai-service/app/services/prompt.py`
- Inspect: `docs/plans/2026-04-03-agent-skill-registry-design.md`

**Step 1: Write the failing test**

Add tests that prove:
- the skill index exposes a list of skill descriptors
- each descriptor includes `skill_name`, `skill_description`, and `skill_path`
- prompt composition injects the skill index into the system prompt
- prompt sections that must remain invariant are tagged with `can_be_override_by_skill="false"`
- prompt sections intended for skill override are tagged with `can_be_override_by_skill="true"`

Use at least one expected sample skill entry in assertions so the test locks the contract instead of only checking generic shape.

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_index.py tests/test_agent_runtime_helpers.py -q`

Expected: FAIL because the index contract and prompt tagging/injection are not implemented yet.

**Step 3: Write minimal implementation**

Implement:
- a typed/static index in `ai-service/app/services/skill_index.py`
- prompt composition helpers in `ai-service/app/services/prompt.py` that render:
  - invariant prompt sections
  - overridable prompt sections
  - injected skill index
  - explicit skill usage rules

Do not add DB models, API routes, or dynamic loading logic.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_index.py tests/test_agent_runtime_helpers.py -q`

Expected: PASS

### Task 2: Add the `get_skill` tool schema to the registry

**Files:**
- Modify: `ai-service/app/services/tool_registry.py`
- Modify: `ai-service/tests/test_api_schemas.py`

**Step 1: Write the failing test**

Add tests that prove:
- `get_skill` exists in `TOOL_REGISTRY`
- it is a server tool
- it requires `skill_name`
- it rejects extra properties

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_api_schemas.py -q`

Expected: FAIL because `get_skill` is not registered.

**Step 3: Write minimal implementation**

Update `ai-service/app/services/tool_registry.py` to add:
- `name="get_skill"`
- `execution_mode="server"`
- input schema with required `skill_name: string`

Do not add path-based inputs.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_api_schemas.py -q`

Expected: PASS

### Task 3: Add file-backed skill loading with hard failure modes

**Files:**
- Create: `ai-service/tests/test_skill_loader.py`
- Modify: `ai-service/app/services/skill_index.py`
- Create or Modify: `ai-service/app/services/skill_registry/*.md`

**Step 1: Write the failing test**

Add tests that prove:
- loading a known `skill_name` returns the expected markdown content
- unknown skills raise a clear error
- duplicate skill names are rejected
- configured paths must stay within the skill registry directory
- missing markdown files raise a clear error

Prefer testing a small public function such as `load_skill_content(skill_name: str)` rather than only testing through runtime dispatch.

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_loader.py -q`

Expected: FAIL because there is no validated skill-loading helper yet.

**Step 3: Write minimal implementation**

Implement in `ai-service/app/services/skill_index.py`:
- a normalized index constant
- helper lookup by canonical `skill_name`
- path resolution rooted at `ai-service/app/services/skill_registry`
- file read helper returning:
  - `skill_name`
  - `content`

Keep the loader deterministic and explicit. Do not support fuzzy matching or aliases unless they are intentionally added to the index contract.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_loader.py -q`

Expected: PASS

### Task 4: Dispatch `get_skill` as a server tool in the agent runtime

**Files:**
- Modify: `ai-service/app/services/agent_runtime.py`
- Modify: `ai-service/tests/test_agent_runtime_server_tools.py`

**Step 1: Write the failing test**

Add tests that prove:
- when the model emits a `get_skill` tool call, the runtime dispatches it server-side
- the tool message appended to model context includes `skill_name` and `content`
- the `tool_end` event exposed to the UI contains only `skill_name` and `status`
- unknown skills surface as `output-error`

Keep these tests focused on runtime behavior, not prompt assembly.

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_server_tools.py -q`

Expected: FAIL because runtime dispatch does not support `get_skill`.

**Step 3: Write minimal implementation**

Update `ai-service/app/services/agent_runtime.py` to:
- dispatch `get_skill` in `_dispatch_server_tool`
- load markdown content from the skill registry
- preserve the model-visible tool message payload with:
  - `skill_name`
  - `content`
- trim user-visible `tool_end` result payload for `get_skill` to:
  - `skill_name`
  - `status`

Do not change the payload contract for other tools.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_server_tools.py -q`

Expected: PASS

### Task 5: Refactor the prompt into tagged invariant and overridable sections

**Files:**
- Modify: `ai-service/app/services/prompt.py`
- Modify: `ai-service/tests/test_agent_runtime_helpers.py`

**Step 1: Write the failing test**

Add assertions that prove:
- the prompt includes the serialized skill index
- the prompt includes explicit instructions for when to call `get_skill`
- invariant sections carry `can_be_override_by_skill="false"`
- behavior/output sections carry `can_be_override_by_skill="true"`
- the prompt explicitly states that retrieved skill instructions cannot override invariant sections

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py -q`

Expected: FAIL because the prompt is still a flat constant.

**Step 3: Write minimal implementation**

Refactor `ai-service/app/services/prompt.py` to:
- build the final prompt from explicit section helpers or constants
- inject the serialized skill index into a dedicated prompt section
- add `get_skill` usage guidance
- keep all existing query/page tool routing constraints intact

Do not weaken or delete the existing invariant behavior while refactoring.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_agent_runtime_helpers.py -q`

Expected: PASS

### Task 6: Add a real sample skill and lock its intended usage

**Files:**
- Modify: `ai-service/app/services/skill_registry/example_skill.md`
- Modify or Create: `ai-service/app/services/skill_registry/summarize_conference.md`
- Modify: `ai-service/app/services/skill_index.py`
- Optionally Modify: `ai-service/tests/test_skill_loader.py`

**Step 1: Write the failing test**

Add a test that proves at least one real skill from the index resolves to non-empty content and includes the expected task instructions.

Prefer a sample that is actually useful, such as `summarize_conference`, rather than leaving only a placeholder.

**Step 2: Run test to verify it fails**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_loader.py -q`

Expected: FAIL because the real indexed skill file is missing or still placeholder-only.

**Step 3: Write minimal implementation**

Add one concrete markdown skill that documents:
- when it applies
- which tools to use
- the expected output format
- any mandatory caveats

Keep the skill explicit and product-scoped. Do not write generic prompting filler.

**Step 4: Run test to verify it passes**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_loader.py -q`

Expected: PASS

### Task 7: Run focused verification and review the diff

**Files:**
- Modify: only files introduced above as needed for cleanup

**Step 1: Run focused backend tests**

Run: `.venv\\Scripts\\python.exe -m pytest tests/test_skill_index.py tests/test_skill_loader.py tests/test_api_schemas.py tests/test_agent_runtime_helpers.py tests/test_agent_runtime_server_tools.py -q`

Expected: PASS

**Step 2: Run the broader ai-service test suite if the focused tests pass**

Run: `.venv\\Scripts\\python.exe -m pytest tests -q`

Expected: PASS, or any unrelated pre-existing failures are identified explicitly.

**Step 3: Review the diff**

Run: `git diff -- ai-service/app/services/skill_index.py ai-service/app/services/prompt.py ai-service/app/services/tool_registry.py ai-service/app/services/agent_runtime.py ai-service/app/services/skill_registry docs/plans/2026-04-03-agent-skill-registry-design.md docs/plans/2026-04-03-agent-skill-registry.md ai-service/tests/test_skill_index.py ai-service/tests/test_skill_loader.py ai-service/tests/test_api_schemas.py ai-service/tests/test_agent_runtime_helpers.py ai-service/tests/test_agent_runtime_server_tools.py`

Expected: only the skill registry, prompt contract, server tool, skill markdown, tests, and plan docs are changed.
