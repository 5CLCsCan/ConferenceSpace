# Chatbot Batch Actions Design

**Date:** 2026-04-03

**Goal**

Replace the chatbot's single-step `performAction` page tool with a list-based `performActions` contract so the agent can execute a short, deterministic sequence of same-page UI interactions without issuing one tool call per step.

This must increase capability without weakening the existing safety model around confirmed refs, page-context refresh, and explicit failure handling.

**Approved Constraints**

- `performAction` is replaced outright by `performActions`
- The tool accepts a list of actions and executes them sequentially
- Batching is limited to same-page, ref-based interactions
- Execution aborts on the first failure
- Execution aborts when the DOM changes enough to invalidate the captured refs
- The tool does not re-fetch page context internally

**Problem**

The current page-action contract is too narrow for short, obvious interaction sequences. The agent can already:

- inspect the current page with `getPageContext`
- identify target refs from that page snapshot
- execute one interaction with `performAction`

But it cannot express a bounded sequence like:

- clear input
- type text
- click submit

without multiple LLM iterations and repeated tool plumbing.

That creates three concrete problems:

- unnecessary latency for simple interaction chains
- brittle prompt behavior because the model must plan around one-action granularity
- noisy chat transcripts and tool audit logs for operations that are logically one page task

The wrong fix would be a generic automation engine. The correct fix is a constrained batch tool that stays inside the existing page-context contract.

**Recommended Approach**

Replace `performAction` with `performActions` and keep the execution model intentionally narrow:

- one tool call
- one captured page context
- one sequential action list
- no navigation
- no implicit retries
- no silent recovery from stale refs

The frontend should own batch execution because the DOM, element references, and liveness checks all exist on the client. The Python runtime should expose the schema, normalize malformed model output, and teach the model when batching is allowed and when it must re-read page context.

**Tool Contract**

### `performActions`

**Input**

```json
{
  "actions": [
    { "action": "click", "ref": "btn-1" },
    { "action": "type", "ref": "input-2", "text": "NeurIPS draft" },
    { "action": "press", "key": "Enter" }
  ]
}
```

Rules:

- `actions` is required
- `actions` must be a non-empty array
- every item must include `action`
- each item may use only the existing per-action fields:
  - `action`
  - `ref`
  - `text`
  - `key`
  - `value`
- no batch-level control flags such as `continueOnError`, `delayMs`, or conditional logic

This keeps the tool inspectable and deterministic.

**Execution Rules**

The batch executor must:

1. normalize the input into a list of action steps
2. execute steps in order
3. validate any required `ref` before each step
4. abort immediately on the first unsuccessful step
5. abort immediately if a referenced element is no longer connected to the DOM
6. return aggregated per-step results plus batch-level status

The batch executor must not:

- navigate
- call `getPageContext`
- guess replacement refs
- skip failed steps
- continue after stale DOM evidence

**Output**

Return structured batch output with both summary and per-step detail:

```json
{
  "success": false,
  "completedCount": 1,
  "abortedAt": 1,
  "message": "Aborted because ref input-2 is stale before step 2",
  "results": [
    {
      "index": 0,
      "action": "click",
      "ref": "btn-1",
      "success": true,
      "message": "Clicked btn-1"
    },
    {
      "index": 1,
      "action": "type",
      "ref": "input-2",
      "success": false,
      "message": "Element is stale",
      "stale": true
    }
  ]
}
```

Required top-level fields:

- `success`
- `completedCount`
- `message`
- `results`

Optional top-level fields:

- `abortedAt`

Per-step fields should include:

- `index`
- `action`
- `success`
- `message`
- `ref` when applicable
- existing verification fields when relevant:
  - `verified`
  - `previousValue`
  - `currentValue`
- `stale` when a ref liveness failure caused the abort

The output must be explicit enough for the model to recover by calling `getPageContext` again when needed.

**DOM Invalidation Model**

The critical safety boundary is stale refs.

The batch executor should treat a step as invalid when:

- the stored ref is missing from the captured `refMap`
- the mapped element is no longer `isConnected`
- a later step references an element that existed in the original snapshot but has since been detached

This is stricter than "clicks are always unsafe" and safer than "keep going unless an exception is thrown."

The correct rule is:

- continue only while the next referenced element still resolves to a live, connected DOM node

That permits useful short chains while still failing hard when the page has materially changed.

**Compatibility and Migration**

The public agent contract should move to `performActions` only.

Implementation details:

- remove `performAction` from the tool registry
- update prompt instructions, runtime tests, and UI tool labels to use `performActions`
- update frontend tool-call handling to execute only the new tool name

One limited compatibility shim is still justified during normalization:

- if the model nests values under `properties`
- or nests `actions` under `properties.actions`

normalize that malformed payload into the canonical `actions` array.

This is not dual-tool support. It is defensive argument normalization.

**Frontend / Backend Boundary**

### Frontend responsibilities

- maintain the actual batch executor
- reuse existing single-action handlers
- check DOM liveness before each step
- aggregate batch output
- report structured success or failure through the chat tool result channel

### Backend responsibilities

- expose the `performActions` schema
- normalize malformed tool input
- update the model instructions from single-step action guidance to batch guidance
- keep tool audit and transcript behavior aligned with the renamed tool

The backend should not try to simulate DOM safety. It does not have the DOM.

**Prompt / Runtime Guidance**

Runtime instructions must be updated to say:

- use `getPageContext` before `performActions`
- batch only same-page interactions using refs confirmed from the latest page context
- use `performActions` when multiple consecutive steps are needed on the current page
- re-read page context after any failed batch or stale-ref abort
- never use `performActions` to navigate or to continue after DOM invalidation

The existing line "execute one interaction at a time" becomes wrong once batching exists and must be removed.

**Testing**

Minimum required coverage:

- tool registry exposes `performActions` and no longer exposes `performAction`
- input normalization unwraps malformed `properties.actions`
- runtime prompt text mentions `performActions` and the batch abort rules
- batch executor succeeds for a simple sequential chain
- batch executor aborts on the first action failure
- batch executor aborts when a later referenced element is disconnected
- `ChatView` routes `performActions` tool calls and returns aggregated output
- transcript/UI labels render the renamed tool correctly

**Out of Scope**

- conditional actions
- retries inside a batch
- cross-page workflows
- navigation inside a batch
- implicit page-context refresh
- assertion DSLs or postconditions
- parallel action execution

Those would turn a bounded page-action helper into a general automation framework, which is not justified here.
