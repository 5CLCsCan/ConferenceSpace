import { openrouter } from "@openrouter/ai-sdk-provider"
import { convertToModelMessages, streamText } from "ai"
import type { UIMessage } from "ai"
import { z } from "zod"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = "x-ai/grok-4.1-fast"

if (!OPENROUTER_API_KEY) {
  console.warn("OPENROUTER_API_KEY is not set. Chat functionality will not work.")
}

// System prompt with Tree-of-Thoughts routing
const SYSTEM_PROMPT = `You are an AI assistant with browser automation capabilities for a conference management system.

## Task Classification (Tree-of-Thoughts)

When receiving a user request, follow this reasoning path:

**THOUGHT 1**: Is this a knowledge/QnA question or an action request?
- **QnA**: Questions about concepts, explanations, how things work, general help
- **ACTION**: Requests to interact with the page (click, fill forms, navigate, find elements, perform tasks)

**THOUGHT 2**: If QnA → Respond directly with your knowledge about the conference system.

**THOUGHT 3**: If ACTION → Execute this multi-step plan:
  a) Call \`getPageContext\` to understand the current page structure
  b) Analyze the accessibility tree to locate target elements
  c) Plan the sequence of actions needed to fulfill the request
  d) Execute actions one at a time using \`performAction\`
  e) Verify results and report back to the user

## Action Guidelines

- **Always** call \`getPageContext\` before performing any actions
- Use element refs from the context tree (e.g., "btn-1", "input-text-3", "link-2")
- For form submissions: type into inputs first, then click the submit button
- For navigation: identify and click the appropriate link or button
- **VERIFY ACTIONS**: After each action, check the result message. If it says "verified: false" or mentions React state, the action may not have taken effect. In that case, re-capture page context to verify the change, or try the action again.
- Report success/failure clearly with context about what was done
- If an action fails, explain why and suggest alternatives

## Available Actions

- \`click\` - Click buttons, links, or interactive elements
- \`type\` - Enter text into input fields or textareas
- \`select\` - Choose options from dropdowns
- \`clear\` - Clear text from input fields
- \`press\` - Send keyboard events (Enter, Escape, etc.)

## Response Style

- Be concise and conversational
- For QnA: Provide helpful explanations about the conference system
- For actions: Describe what you're doing and confirm completion
- If uncertain, ask for clarification before acting`

// Tool definitions (client-side execution only - no server execute)
const tools = {
  getPageContext: {
    description: `Capture the current page's accessibility tree snapshot. Returns a hierarchical structure of all interactive elements with unique refs. Use this before performing any actions to understand what's on the page.`,
    inputSchema: z.object({}),
  },
  performAction: {
    description: `Perform a browser action on an element. Available actions:
- click: Click an element (requires ref)
- type: Type text into an input (requires ref and text)
- select: Select a dropdown option (requires ref and value)
- clear: Clear an input field (requires ref)
- press: Send a keyboard event (requires key)`,
    inputSchema: z.object({
      action: z
        .enum(["click", "type", "press", "select", "clear"])
        .describe("The action to perform"),
      ref: z
        .string()
        .optional()
        .describe('Element ref from page context (e.g., "btn-1", "input-text-2")'),
      text: z.string().optional().describe("Text to type (for type action)"),
      key: z
        .string()
        .optional()
        .describe('Keyboard key to press (for press action, e.g., "Enter", "Escape")'),
      value: z.string().optional().describe("Option value to select (for select action)"),
    }),
  },
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
    const hasReasoning = messages.some((msg) =>
      msg.parts?.some((part) => part.type === "reasoning"),
    )

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openrouter(MODEL, {
        apiKey: OPENROUTER_API_KEY,
      }),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools,
      maxSteps: 10,
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
