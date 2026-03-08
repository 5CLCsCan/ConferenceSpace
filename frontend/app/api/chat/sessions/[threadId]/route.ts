import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL ?? "http://localhost:8090"
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED !== "false"
const AGENT_SESSIONS_ENDPOINT = `${AI_SERVICE_BASE_URL}/api/v1/agent/sessions`

type RouteContext = { params: Promise<{ threadId: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  if (!AI_SERVICE_ENABLED) {
    return NextResponse.json({ error: "Chat service is temporarily unavailable." }, { status: 503 })
  }

  const token = await getToken()
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { threadId: rawThreadId } = await context.params
  const threadId = String(rawThreadId || "").trim()
  if (!threadId) {
    return NextResponse.json({ error: "Missing thread id" }, { status: 400 })
  }

  const upstreamResponse = await fetch(
    `${AGENT_SESSIONS_ENDPOINT}/${encodeURIComponent(threadId)}/history`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  )

  const payload = await safeJson(upstreamResponse)
  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        error: "ai-service history request failed",
        details: readErrorMessage(payload, upstreamResponse.statusText),
      },
      { status: upstreamResponse.status || 502 },
    )
  }

  return NextResponse.json(payload, { status: upstreamResponse.status || 200 })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!AI_SERVICE_ENABLED) {
    return NextResponse.json({ error: "Chat service is temporarily unavailable." }, { status: 503 })
  }

  const token = await getToken()
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { threadId: rawThreadId } = await context.params
  const threadId = String(rawThreadId || "").trim()
  if (!threadId) {
    return NextResponse.json({ error: "Missing thread id" }, { status: 400 })
  }

  const upstreamResponse = await fetch(
    `${AGENT_SESSIONS_ENDPOINT}/${encodeURIComponent(threadId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  )

  if (!upstreamResponse.ok) {
    const payload = await safeJson(upstreamResponse)
    return NextResponse.json(
      {
        error: "ai-service delete session request failed",
        details: readErrorMessage(payload, upstreamResponse.statusText),
      },
      { status: upstreamResponse.status || 502 },
    )
  }

  return new NextResponse(null, { status: 204 })
}

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback || "Unknown upstream error"
  }
  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail
  }
  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }
  if ("details" in payload && typeof payload.details === "string") {
    return payload.details
  }
  return fallback || "Unknown upstream error"
}
