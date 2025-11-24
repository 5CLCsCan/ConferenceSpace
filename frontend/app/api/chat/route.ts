import { openrouter } from "@openrouter/ai-sdk-provider"
import { convertToModelMessages, streamText } from "ai"
import type { UIMessage } from "ai"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = "x-ai/grok-4.1-fast"

if (!OPENROUTER_API_KEY) {
  console.warn("OPENROUTER_API_KEY is not set. Chat functionality will not work.")
}

export async function POST(req: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return new Response("OpenRouter API key is not configured", { status: 500 })
    }

    const { messages }: { messages: UIMessage[] } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("Messages array is required", { status: 400 })
    }

    // Check if this is the first message (no assistant messages with reasoning)
    const hasReasoning = messages.some(
      (msg) => msg.parts?.some((part) => part.type === "reasoning"),
    )

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openrouter(MODEL, {
        apiKey: OPENROUTER_API_KEY,
      }),
      messages: modelMessages,
      // Enable reasoning only for the first API call
      ...(!hasReasoning && {
        experimental_providerMetadata: {
          openrouter: {
            body: {
              reasoning: { enabled: true },
            },
          },
        },
      }),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return new Response(message, { status: 500 })
  }
}

