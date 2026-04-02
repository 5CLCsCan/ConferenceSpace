import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const cookiesMock = vi.fn()

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}))

function makeInternalSse(events: unknown[]): string {
  return `${events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")}data: [DONE]\n\n`
}

async function importRouteModule() {
  vi.resetModules()
  return import("./route")
}

describe("chat api route", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    cookiesMock.mockReset()
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "session-token" })),
    })
  })

  it("streams query_engine server tool events as live tool activity", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith("/api/v1/agent/chat")) {
        return new Response(
          makeInternalSse([
            { type: "start", message_id: "assistant-1" },
            {
              type: "tool_start",
              tool_call_id: "call_query_1",
              tool: "query_engine",
              input: { op: "describe", resource: "public_conferences" },
            },
            {
              type: "tool_end",
              tool_call_id: "call_query_1",
              tool: "query_engine",
              status: "output-available",
              result: { resource: "public_conferences" },
            },
            { type: "token", content: "Recommended conferences." },
            { type: "done" },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          },
        )
      }

      throw new Error(`Unexpected fetch to ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await importRouteModule()

    const response = await POST(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          id: "thread-1",
          messages: [],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    )

    const payload = await response.text()

    expect(payload).toContain('"type":"text-start"')
    expect(payload).toContain("Recommended conferences.")
    expect(payload).toContain('"type":"tool-input-start"')
    expect(payload).toContain('"toolCallId":"call_query_1"')
    expect(payload).toContain('"type":"tool-output-available"')
    expect(payload).toContain('"providerExecuted":true')
  })

  it("does not resubmit completed query_engine results to the ai-service tool-result endpoint", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith("/api/v1/agent/chat")) {
        return new Response(makeInternalSse([{ type: "start" }, { type: "done" }]), {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      }

      if (url.endsWith("/api/v1/agent/tool-result")) {
        return new Response(JSON.stringify({ status: "accepted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }

      throw new Error(`Unexpected fetch to ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await importRouteModule()

    const response = await POST(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          id: "thread-1",
          messages: [
            {
              id: "tool-1",
              role: "tool",
              parts: [
                {
                  type: "tool-query_engine",
                  toolCallId: "call_query_1",
                  state: "output-available",
                  output: { resource: "public_conferences" },
                },
              ],
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0] ?? "")).toContain("/api/v1/agent/chat")
  })

  it("does not resubmit completed get_skill results to the ai-service tool-result endpoint", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith("/api/v1/agent/chat")) {
        return new Response(makeInternalSse([{ type: "start" }, { type: "done" }]), {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      }

      if (url.endsWith("/api/v1/agent/tool-result")) {
        return new Response(JSON.stringify({ status: "accepted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }

      throw new Error(`Unexpected fetch to ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)
    const { POST } = await importRouteModule()

    const response = await POST(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          id: "thread-1",
          messages: [
            {
              id: "tool-1",
              role: "tool",
              parts: [
                {
                  type: "tool-get_skill",
                  toolCallId: "call_skill_1",
                  state: "output-available",
                  output: {
                    skill_name: "workload_risk_insight",
                    content: "# skill",
                  },
                },
              ],
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0] ?? "")).toContain("/api/v1/agent/chat")
  })
})
