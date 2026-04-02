import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL ?? "http://localhost:8090"
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED !== "false"
const AGENT_CHAT_ENDPOINT = `${AI_SERVICE_BASE_URL}/api/v1/agent/chat`
const AGENT_TOOL_RESULT_ENDPOINT = `${AI_SERVICE_BASE_URL}/api/v1/agent/tool-result`
const SERVER_MANAGED_TOOL_NAMES = new Set(["query_engine", "get_skill"])

type ChatTransportRequest = {
  id?: string
  messages?: unknown[]
  trigger?: "submit-message" | "regenerate-message"
  messageId?: string
}

type ToolSubmissionCandidate = {
  thread_id: string
  tool_call_id: string
  result: {
    tool_name: string
    status: "output-available" | "output-error" | "timeout"
    output?: unknown
    error_text?: string
  }
}

type InternalAgentEvent = {
  type:
    | "start"
    | "reasoning_start"
    | "reasoning_token"
    | "reasoning_end"
    | "tool_start"
    | "tool_end"
    | "token"
    | "done"
    | "error"
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
  if (!AI_SERVICE_ENABLED) {
    return NextResponse.json(
      {
        error: "Chat service is temporarily unavailable (maintenance mode).",
      },
      { status: 503 },
    )
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: ChatTransportRequest
  try {
    body = (await req.json()) as ChatTransportRequest
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 })
  }

  const threadId = String(body.id ?? "").trim()
  const messages = Array.isArray(body.messages) ? body.messages : []
  if (!threadId) {
    return NextResponse.json({ error: "Missing chat thread id" }, { status: 400 })
  }

  const toolSubmission = findLatestCompletedToolResult(threadId, messages)
  if (toolSubmission) {
    const toolResultResponse = await fetch(AGENT_TOOL_RESULT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(toolSubmission),
      cache: "no-store",
      signal: req.signal,
    })

    if (!toolResultResponse.ok && ![404, 409, 422].includes(toolResultResponse.status)) {
      const errorText = await safeResponseText(toolResultResponse)
      return NextResponse.json(
        {
          error: "Failed to submit tool result to ai-service",
          details: errorText || toolResultResponse.statusText,
        },
        { status: toolResultResponse.status },
      )
    }
  }

  const requestMetadata = {
    client: "frontend-next",
    path: parsePathname(req),
    user_agent: req.headers.get("user-agent") ?? undefined,
  }

  const upstreamResponse = await fetch(AGENT_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      thread_id: threadId,
      messages,
      trigger: body.trigger,
      message_id: body.messageId,
      request_metadata: requestMetadata,
    }),
    cache: "no-store",
    signal: req.signal,
  })

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    const errorText = await safeResponseText(upstreamResponse)
    return NextResponse.json(
      {
        error: "ai-service chat request failed",
        details: errorText || upstreamResponse.statusText || "Unknown upstream error",
      },
      { status: upstreamResponse.status || 502 },
    )
  }

  const mappedStream = mapInternalEventsToUiStream(upstreamResponse.body)
  return new Response(mappedStream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  })
}

function mapInternalEventsToUiStream(upstream: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const state = {
        started: false,
        stepStarted: false,
        textBlockId: "",
        reasoningOpenId: "",
        hasError: false,
        finishEmitted: false,
      }

      const emit = (chunk: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }

      const ensureStart = (event: InternalAgentEvent) => {
        if (!state.started) {
          const messageId =
            typeof event.message_id === "string" && event.message_id.trim().length > 0
              ? event.message_id
              : undefined
          emit({ type: "start", messageId })
          state.started = true
        }
        if (!state.stepStarted) {
          emit({ type: "start-step" })
          state.stepStarted = true
        }
      }

      const closeOpenBlocks = () => {
        if (state.textBlockId) {
          emit({ type: "text-end", id: state.textBlockId })
          state.textBlockId = ""
        }
        if (state.reasoningOpenId) {
          emit({ type: "reasoning-end", id: state.reasoningOpenId })
          state.reasoningOpenId = ""
        }
      }

      const emitFinish = () => {
        if (state.finishEmitted) return
        closeOpenBlocks()
        if (state.stepStarted) {
          emit({ type: "finish-step" })
          state.stepStarted = false
        }
        emit({ type: "finish", finishReason: state.hasError ? "error" : "stop" })
        state.finishEmitted = true
      }

      try {
        for await (const event of parseSseJsonEvents(upstream)) {
          switch (event.type) {
            case "start": {
              ensureStart(event)
              break
            }
            case "token": {
              ensureStart(event)
              if (!state.textBlockId) {
                state.textBlockId = `txt_${crypto.randomUUID()}`
                emit({ type: "text-start", id: state.textBlockId })
              }
              const delta = String(event.content ?? "")
              if (delta) emit({ type: "text-delta", id: state.textBlockId, delta })
              break
            }
            case "reasoning_start": {
              ensureStart(event)
              const id =
                typeof event.id === "string" && event.id.trim().length > 0
                  ? event.id
                  : `reasoning_${crypto.randomUUID()}`
              state.reasoningOpenId = id
              emit({ type: "reasoning-start", id })
              break
            }
            case "reasoning_token": {
              ensureStart(event)
              if (!state.reasoningOpenId) {
                state.reasoningOpenId = `reasoning_${crypto.randomUUID()}`
                emit({ type: "reasoning-start", id: state.reasoningOpenId })
              }
              const delta = String(event.content ?? "")
              if (delta) emit({ type: "reasoning-delta", id: state.reasoningOpenId, delta })
              break
            }
            case "reasoning_end": {
              if (state.reasoningOpenId) {
                emit({ type: "reasoning-end", id: state.reasoningOpenId })
                state.reasoningOpenId = ""
              }
              break
            }
            case "tool_start": {
              ensureStart(event)
              const toolCallId = String(event.tool_call_id ?? "")
              const toolName = String(event.tool ?? "")
              if (!toolCallId || !toolName) break
              const providerExecuted = isServerManagedTool(toolName) ? true : undefined
              emit({
                type: "tool-input-start",
                toolCallId,
                toolName,
                providerExecuted,
              })
              emit({
                type: "tool-input-available",
                toolCallId,
                toolName,
                input: event.input ?? {},
                providerExecuted,
              })
              break
            }
            case "tool_end": {
              ensureStart(event)
              const toolCallId = String(event.tool_call_id ?? "")
              if (!toolCallId) break
              const toolName = String(event.tool ?? "").trim()
              const providerExecuted = isServerManagedTool(toolName) ? true : undefined
              const status = String(event.status ?? "")
              if (status === "output-available") {
                emit({
                  type: "tool-output-available",
                  toolCallId,
                  output: event.result ?? null,
                  providerExecuted,
                })
              } else {
                emit({
                  type: "tool-output-error",
                  toolCallId,
                  errorText: String(event.error ?? "Tool execution failed"),
                  providerExecuted,
                })
              }
              break
            }
            case "error": {
              ensureStart(event)
              state.hasError = true
              emit({
                type: "error",
                errorText: String(event.message ?? "ai-service runtime error"),
              })
              break
            }
            case "done": {
              ensureStart(event)
              emitFinish()
              break
            }
            default:
              break
          }
        }
      } catch (error) {
        state.hasError = true
        emit({
          type: "error",
          errorText: error instanceof Error ? error.message : "Stream processing failed",
        })
      } finally {
        emitFinish()
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      }
    },
  })
}

async function* parseSseJsonEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<InternalAgentEvent> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    while (true) {
      const separatorIndex = buffer.indexOf("\n\n")
      if (separatorIndex === -1) break

      const rawEvent = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      const dataLines = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())

      if (dataLines.length === 0) continue
      const data = dataLines.join("\n").trim()
      if (!data || data === "[DONE]") continue

      try {
        const payload = JSON.parse(data) as InternalAgentEvent
        if (payload && typeof payload.type === "string") {
          yield payload
        }
      } catch {
        continue
      }
    }
  }
}

function findLatestCompletedToolResult(
  threadId: string,
  messages: unknown[],
): ToolSubmissionCandidate | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message || typeof message !== "object") continue
    const parts = (message as { parts?: unknown[] }).parts
    if (!Array.isArray(parts)) continue

    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex--) {
      const part = parts[partIndex]
      if (!part || typeof part !== "object") continue

      const state = (part as { state?: string }).state
      if (state !== "output-available" && state !== "output-error" && state !== "timeout") continue

      const toolCallId = String(
        (part as { toolCallId?: string; id?: string }).toolCallId ??
          (part as { id?: string }).id ??
          "",
      ).trim()
      if (!toolCallId) continue

      const partType = String((part as { type?: string }).type ?? "")
      const toolName = String(
        (part as { toolName?: string }).toolName ??
          (partType.startsWith("tool-") ? partType.slice("tool-".length) : ""),
      ).trim()
      if (!toolName) continue
      if (isServerManagedTool(toolName)) continue

      const output =
        (part as { output?: unknown; result?: unknown }).output ??
        (part as { result?: unknown }).result
      const errorText = (part as { errorText?: string }).errorText

      const result: ToolSubmissionCandidate["result"] = {
        tool_name: toolName,
        status: state,
      }
      if (state === "output-available") {
        result.output = output
      } else {
        result.error_text = errorText || "Tool execution failed"
      }

      return {
        thread_id: threadId,
        tool_call_id: toolCallId,
        result,
      }
    }
  }
  return null
}

function isServerManagedTool(toolName: string): boolean {
  return SERVER_MANAGED_TOOL_NAMES.has(toolName)
}

function parsePathname(req: NextRequest): string | undefined {
  const referer = req.headers.get("referer")
  if (!referer) return undefined
  try {
    return new URL(referer).pathname
  } catch {
    return undefined
  }
}

async function safeResponseText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ""
  }
}
