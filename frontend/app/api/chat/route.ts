import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import type { UIMessage } from "ai"
import { AUTH_COOKIE_NAME } from "@/lib/config"

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL ?? "http://localhost:8090"

type ChatRequestBody = {
  id?: string
  messages?: UIMessage[]
  trigger?: "submit-message" | "regenerate-message" | string
  messageId?: string
}

type ToolResultCandidate = {
  toolCallId: string
  toolName: string
  status: "output-available" | "output-error"
  output: unknown
  errorText: string | null
}

function extractLatestToolResult(messages: UIMessage[]): ToolResultCandidate | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== "assistant") continue

    for (let j = msg.parts.length - 1; j >= 0; j--) {
      const part = msg.parts[j] as any

      if (part.type === "dynamic-tool") {
        const state = part.state as string | undefined
        if (state === "output-available" || state === "output-error") {
          const toolCallId = part.toolCallId as string | undefined
          const toolName = part.toolName as string | undefined
          if (!toolCallId || !toolName) continue
          return {
            toolCallId,
            toolName,
            status: state,
            output: part.output ?? null,
            errorText: (part.errorText as string | undefined) ?? null,
          }
        }
      }

      if (typeof part.type === "string" && part.type.startsWith("tool-")) {
        const state = part.state as string | undefined
        if (state !== "output-available" && state !== "output-error") continue
        const toolName = part.type.replace("tool-", "")
        const toolCallId =
          (part.toolCallId as string | undefined) ||
          (part.id as string | undefined) ||
          (part.toolInvocation?.toolCallId as string | undefined)
        if (!toolCallId || !toolName) continue
        return {
          toolCallId,
          toolName,
          status: state,
          output: part.output ?? part.result ?? null,
          errorText: (part.errorText as string | undefined) ?? null,
        }
      }
    }
  }

  return null
}

function hasToolParts(messages: UIMessage[]): boolean {
  return messages.some((msg) =>
    msg.parts.some((part: any) => part.type === "dynamic-tool" || String(part.type).startsWith("tool-")),
  )
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      console.warn("[chat-adapter] missing auth cookie")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as ChatRequestBody
    const threadId = body.id
    const messages = body.messages

    if (!threadId || !Array.isArray(messages)) {
      console.warn("[chat-adapter] invalid payload", { hasThreadId: Boolean(threadId) })
      return NextResponse.json({ error: "id and messages are required" }, { status: 400 })
    }

    console.info("[chat-adapter] start", {
      threadId,
      messageCount: messages.length,
      trigger: body.trigger ?? "submit-message",
    })

    const toolResult = extractLatestToolResult(messages)
    if (toolResult) {
      console.info("[chat-adapter] forwarding tool-result", {
        threadId,
        toolCallId: toolResult.toolCallId,
        toolName: toolResult.toolName,
        status: toolResult.status,
      })
      const toolResultResponse = await fetch(`${AI_SERVICE_BASE_URL}/api/v1/agent/tool-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-conferencespace-proxy": "next-chat-adapter",
        },
        body: JSON.stringify({
          thread_id: threadId,
          tool_call_id: toolResult.toolCallId,
          result: {
            tool_name: toolResult.toolName,
            status: toolResult.status,
            output: toolResult.output,
            error_text: toolResult.errorText,
          },
        }),
        cache: "no-store",
      })

      if (!toolResultResponse.ok) {
        const errText = await toolResultResponse.text().catch(() => "Failed to submit tool result")
        console.error("[chat-adapter] tool-result failed", {
          threadId,
          status: toolResultResponse.status,
          body: errText,
        })
        return new Response(errText, { status: toolResultResponse.status })
      }
    }

    const requestMetadata =
      hasToolParts(messages) || toolResult
        ? {
            client: "web",
            path: req.headers.get("x-pathname") ?? undefined,
            user_agent: req.headers.get("user-agent") ?? undefined,
          }
        : undefined

    const chatResponse = await fetch(`${AI_SERVICE_BASE_URL}/api/v1/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        thread_id: threadId,
        messages,
        trigger: body.trigger ?? "submit-message",
        message_id: body.messageId ?? null,
        request_metadata: requestMetadata,
      }),
      cache: "no-store",
    })

    if (!chatResponse.ok || !chatResponse.body) {
      const errText = await chatResponse.text().catch(() => "Failed to connect to AI service")
      console.error("[chat-adapter] ai-service chat failed", {
        threadId,
        status: chatResponse.status,
        body: errText,
      })
      return new Response(errText, { status: chatResponse.status || 502 })
    }

    console.info("[chat-adapter] stream open", { threadId, status: chatResponse.status })

    const headers = new Headers(chatResponse.headers)
    headers.set("x-vercel-ai-ui-message-stream", "v1")
    headers.set("Cache-Control", "no-cache")
    headers.set("Connection", "keep-alive")
    headers.set("Content-Type", "text/event-stream")

    return new Response(chatResponse.body, {
      status: chatResponse.status,
      headers,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    console.error("[chat-adapter] unexpected error", message)
    return new Response(message, { status: 500 })
  }
}
