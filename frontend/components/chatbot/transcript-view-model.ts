import type { UIMessage } from "ai"

type MessagePart = UIMessage["parts"][number]

export type TranscriptToolItem = {
  kind: "tool"
  messageId: string
  toolCallId: string
  toolName: string
  state: string
  input?: unknown
  output?: unknown
  errorText?: string
  rawPart: MessagePart
}

export type TranscriptTextItem = {
  kind: "text"
  messageId: string
  text: string
  rawPart: MessagePart
}

export type TranscriptReasoningItem = {
  kind: "reasoning"
  messageId: string
  text: string
  rawPart: MessagePart
}

export type TranscriptTurnItem = TranscriptTextItem | TranscriptReasoningItem | TranscriptToolItem

export type UserTurn = {
  kind: "user-turn"
  messageId: string
  message: UIMessage
  items: TranscriptTextItem[]
}

export type AssistantTurn = {
  kind: "assistant-turn"
  messageIds: string[]
  items: TranscriptTurnItem[]
  isOrphanActivity?: boolean
}

export type TranscriptTurn = UserTurn | AssistantTurn

export function buildTranscriptTurns(messages: UIMessage[]): TranscriptTurn[] {
  const turns: TranscriptTurn[] = []
  let currentAssistantTurn: AssistantTurn | null = null

  const flushAssistantTurn = () => {
    if (!currentAssistantTurn) {
      return
    }
    if (currentAssistantTurn.items.length > 0) {
      turns.push(currentAssistantTurn)
    }
    currentAssistantTurn = null
  }

  for (const message of messages) {
    if (message.role === "user") {
      flushAssistantTurn()
      turns.push({
        kind: "user-turn",
        messageId: message.id,
        message,
        items: message.parts
          .map((part) => normalizePart(message.id, part))
          .filter((part): part is TranscriptTextItem => part?.kind === "text"),
      })
      continue
    }

    if (message.role === "assistant") {
      if (!currentAssistantTurn) {
        currentAssistantTurn = createAssistantTurn()
      }
      currentAssistantTurn.messageIds.push(message.id)
      for (const part of message.parts) {
        const normalized = normalizePart(message.id, part)
        if (normalized) {
          currentAssistantTurn.items.push(normalized)
        }
      }
      continue
    }

    if (message.role === "tool") {
      if (!currentAssistantTurn) {
        currentAssistantTurn = createAssistantTurn({ isOrphanActivity: true })
      }
      currentAssistantTurn.messageIds.push(message.id)
      for (const part of message.parts) {
        const normalized = normalizePart(message.id, part)
        if (normalized) {
          currentAssistantTurn.items.push(normalized)
        }
      }
    }
  }

  flushAssistantTurn()
  return turns
}

function createAssistantTurn(options?: { isOrphanActivity?: boolean }): AssistantTurn {
  return {
    kind: "assistant-turn",
    messageIds: [],
    items: [],
    isOrphanActivity: options?.isOrphanActivity,
  }
}

function normalizePart(messageId: string, part: MessagePart): TranscriptTurnItem | null {
  if (part.type === "text") {
    return {
      kind: "text",
      messageId,
      text: part.text,
      rawPart: part,
    }
  }

  if (part.type === "reasoning") {
    return {
      kind: "reasoning",
      messageId,
      text: part.text,
      rawPart: part,
    }
  }

  const toolName = getToolName(part)
  if (!toolName) {
    return null
  }

  const toolPart = part as MessagePart & {
    toolCallId?: string
    state?: string
    input?: unknown
    output?: unknown
    errorText?: string
  }

  return {
    kind: "tool",
    messageId,
    toolCallId: String(toolPart.toolCallId ?? ""),
    toolName,
    state: String(toolPart.state ?? ""),
    input: toolPart.input,
    output: toolPart.output,
    errorText: toolPart.errorText,
    rawPart: part,
  }
}

function getToolName(part: MessagePart): string {
  if (part.type === "dynamic-tool") {
    return part.toolName
  }

  if (part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length)
  }

  return ""
}
