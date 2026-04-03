# AI-001 Live Implementation Note

## Summary

AI-001 is now implemented as a five-part system:

1. a globally mounted, chat-first frontend sidebar shell
2. a transcript-mapping renderer that folds tool activity into assistant turns
3. a Next.js proxy layer for chat transport and session APIs
4. a FastAPI AI runtime with mixed client/server tool execution
5. a backend query engine that exposes guarded read-only resources to the agent

Evidence: `frontend/app/layout.tsx:41-52`, `frontend/components/chatbot/transcript-view-model.ts:49-186`, `frontend/app/api/chat/route.ts:10-12`, `ai-service/app/main.py:40-132`, `backend/internal/agentquery/resources.go:29-470`

## Key Entry Points

### Frontend Shell

- `frontend/app/layout.tsx:41-52`
  - Mounts `ChatbotProvider`, `ChatbotNavigationMask`, and `Chatbot` in the root layout.
- `frontend/components/chatbot/chatbot.tsx:102-633`
  - Implements the chat-first sidebar shell, conversation hydration, recent-history switcher, and delete/new flows.
- `frontend/components/chatbot/chatbot-provider.tsx:10-52`
  - Holds sidebar open state, width, and transient navigation-mask state.
- `frontend/components/chatbot/chatbot-navigation-mask.tsx:9-55`
  - Shows the temporary full-pane mask during agent-triggered route transitions.

### Transcript Rendering

- `frontend/components/chatbot/chat-transcript.tsx:15-27`
  - Renders normalized user and assistant turns instead of raw `UIMessage[]` rows.
- `frontend/components/chatbot/transcript-view-model.ts:49-186`
  - Folds assistant text, reasoning, tool requests, and persisted `role="tool"` messages into assistant turns.
- `frontend/components/chatbot/assistant-turn.tsx`
  - Renders assistant markdown, reasoning blocks, and inline tool rows.
- `frontend/components/chatbot/assistant-tool-row.tsx`
  - Displays tool state, input, output, and errors inline within the assistant turn.

### Frontend API Adapters

- `frontend/app/api/chat/route.ts:10-12,75-121,250-421`
  - Proxies chat and tool results to `ai-service`, skips tool-result reposting for server-managed tools, and remaps internal SSE events to the Vercel AI SDK UI stream format.
- `frontend/app/api/chat/sessions/route.ts:12-38`
  - Proxies session listing.
- `frontend/app/api/chat/sessions/[threadId]/route.ts:14-87`
  - Proxies session history and delete operations.
- `frontend/lib/chatbot/conversations.ts:28-110`
  - Converts session list/history API payloads into frontend conversation models.

### Frontend Tool Implementations

- `frontend/components/chatbot/chat-view.tsx:66-155,228-375`
  - Runs `useChat`, executes client-side tools in `onToolCall`, auto-resubmits after tool completion, and still keeps attachments plus the `agentic` / `standard` mode selector as UI-only state.
- `frontend/lib/chatbot/navigation-executor.ts:26-126`
  - Implements `getCurrentNavigation` and role-aware `navigate`.
- `frontend/lib/chatbot/navigation-routing.ts:13-67`
  - Resolves current routes and builds destination paths from declared params.
- `frontend/lib/chatbot/navigation-sitemap.ts:23-341`
  - Declares the role-scoped sitemap the agent navigates against.
- `frontend/lib/chatbot/page-context.ts:47-51`
  - `capturePageContext()`
- `frontend/lib/chatbot/action-executor.ts:53-168,477-511`
  - `executeAction()` plus batched `executeActions()` with stale-ref abort behavior.

### AI Service

- `ai-service/app/api/routes.py:53-122`
  - `/chat`
- `ai-service/app/api/routes.py:141-195`
  - `/tool-result`
- `ai-service/app/api/routes.py:225-261`
  - `/sessions`
- `ai-service/app/api/routes.py:265-320`
  - session history and delete
- `ai-service/app/services/prompt.py:5-173`
  - Injects the live system prompt that prioritizes `get_skill`, `query_engine`, then page tools.
- `ai-service/app/services/agent_runtime.py:55-132,203-332,376-485`
  - Persists sessions, streams text plus reasoning, executes server tools inline, pauses for client tools, and resumes pending tool calls.
- `ai-service/app/services/tool_registry.py:15-154`
  - Registers six tools: `getCurrentNavigation`, `navigate`, `getPageContext`, `performActions`, `query_engine`, and `get_skill`.
- `ai-service/app/services/query_engine_client.py:15-49`
  - Calls the backend query endpoint with the user bearer token plus `X-Agent-Service-Token`.
- `ai-service/app/services/skill_index.py:18-58`
  - Provides a small server-side skill catalog, currently containing `workload_risk_insight`.
- `ai-service/app/services/agent_tools.py:8-171`
  - Normalizes tool inputs, including query-engine fields and batched action payloads.

### Backend Query Engine

- `backend/internal/agentquery/engine.go:17-78`
  - Implements describe/query execution for the agent query DSL.
- `backend/internal/agentquery/resources.go:29-470`
  - Defines the read-only resource catalog: `conferences`, `public_conferences`, `submissions`, `assignments`, `conference_stats`, and `notifications`.
- `backend/internal/middleware/auth.go:69-88`
  - Requires the shared agent service token for backend agent-query access.
- `backend/internal/agentquery/engine_test.go:9-242`
  - Verifies resource exposure, field rejection, and reviewer-identity redaction rules.

## Current Capability Shape

- Shipped:
  - globally mounted chat sidebar
  - chat-first transcript UI with assistant-turn folding
  - session persistence and listing
  - structured route introspection and role-aware navigation
  - batched DOM actions with stale-ref guardrails
  - mixed tool execution across client and server
  - server-backed read-only data access through `query_engine`
  - server-side skill retrieval through `get_skill`
  - server-side audit and session persistence
  - tool-result resume flow
  - streamed reasoning blocks and inline tool activity
  - navigation-mask UX during agent-triggered route changes
- Not yet visible:
  - server-side business mutation tools
  - approval gates
  - broader workflow/event automation
  - a broad skill catalog beyond `workload_risk_insight`
  - transport wiring for attachments or the `agentic` / `standard` composer mode

See also: [`../../AI-001-conference-agent.md`](../../AI-001-conference-agent.md)
