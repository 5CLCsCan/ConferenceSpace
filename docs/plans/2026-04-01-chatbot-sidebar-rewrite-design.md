# Chatbot Sidebar Rewrite Design

## Goal

Replace the current chatbot sidebar with a chat-first scholar-compact interface that fixes assistant-turn fragmentation, separates user and assistant rendering responsibilities, and keeps tool activity visible inside the same assistant turn.

## Problem

The current sidebar has the wrong rendering unit. It treats raw `UIMessage[]` entries as final UI rows, so tool requests and tool results appear as separate assistant responses. The shared message shell also forces user messages and assistant transcript content into the same visual structure even though they have different requirements.

## Product Direction

### Domain

- academic operations console
- working transcript
- inspectable action trail
- browser copilot for form workflows
- evidence-first workspace

### Color World

- paper white
- slate ink
- navy binding
- pale steel separators
- restrained semantic colors only for real success and failure states

### Signature

One assistant turn renders as a continuous transcript with an inline activity spine. Tool execution stays visible as compact disclosures nested inside the same assistant turn instead of appearing as peer messages.

### Rejected Defaults

- Separate conversation list screen replaced by a chat-first shell with slim history controls in the header
- Assistant bubble cards replaced by direct transcript rendering on the canvas
- Tool calls as peer messages replaced by inline tool disclosures within the assistant turn

## Layout

### Shell

- Compact header with conversation title, recent-history switcher, new conversation action, and close action
- Single transcript column as the primary surface
- Pinned composer at the bottom

### Transcript Rules

- User messages stay right-aligned in a contained navy bubble
- Assistant messages render directly on the canvas with no outer bubble container
- Tool activity stays visible within the same assistant turn
- Reasoning blocks remain subordinate and collapsible

## Data Model

The renderer must stop using raw `UIMessage[]` as the final presentation model.

Introduce a local transcript view-model with:

- `user-turn`
- `assistant-turn`

Each `assistant-turn` may contain:

- markdown text blocks
- reasoning blocks
- inline tool activity rows
- tool success or error disclosures

Persisted `tool` role messages remain valid in storage, but the transcript mapper folds them into the preceding assistant turn during rendering.

## Component Split

- `ChatSidebarShell`
- `ConversationSwitcher`
- `ChatTranscript`
- `UserMessage`
- `AssistantTurn`
- `AssistantToolRow`

## Interaction Rules

- Streaming assistant text uses `Streamdown`
- Tool loading appears inline under the current assistant turn
- Tool results and tool errors remain visible and expandable
- `getPageContext` stays summarized by default
- `performAction` shows compact state with expandable payload

## Failure Handling

- Orphaned `tool` messages render in a fallback system-activity slot rather than disappearing
- Malformed tool payloads render as compact error disclosures
- Persisted fragmented history is folded during transcript mapping

## Testing

- transcript mapper groups assistant text and tool rows into one assistant turn
- persisted history with separate `assistant` and `tool` messages folds into one rendered turn
- user messages remain bubbled while assistant messages do not
- loading tool state renders inline during streaming
- multiple tool calls in one logical assistant turn do not render as separate top-level responses
