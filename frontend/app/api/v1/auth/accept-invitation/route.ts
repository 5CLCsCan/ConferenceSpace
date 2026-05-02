"use server"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/config"

const BACKEND =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"

// 30 days — matches the invitation token TTL
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const backendResp = await fetch(`${BACKEND}/api/v1/external-invitations/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await backendResp.json()

    if (!backendResp.ok) {
      return NextResponse.json(
        { error: data?.error ?? data?.message ?? "Failed to accept invitation" },
        { status: backendResp.status },
      )
    }

    const payloadData = data?.data ?? data ?? {}
    const token: string | undefined = payloadData.token
    const user = payloadData.user

    if (!token || !user) {
      return NextResponse.json(
        { error: "Invalid accept response from server" },
        { status: 500 },
      )
    }

    const cookieStore = await cookies()

    // HTTP-only cookie for API requests (secure)
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })

    // Non-HTTP-only cookie for WebSocket authentication
    cookieStore.set({
      name: "conference_ws_token",
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })

    return NextResponse.json({
      user,
      conference_id: payloadData.conference_id,
      role: payloadData.role,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
