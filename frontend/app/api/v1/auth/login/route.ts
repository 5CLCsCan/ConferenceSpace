"use server"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/config"

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"

const COOKIE_MAX_AGE = Number(process.env.JWT_EXPIRY_SECONDS ?? 60 * 60 * 24)

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: data?.error || data?.message || "Unable to log in",
        },
        { status: backendResponse.status },
      )
    }

    const payloadData = data?.data ?? data ?? {}
    const token: string | undefined = payloadData.token
    const user = payloadData.user

    if (!token || !user) {
      return NextResponse.json({ error: "Invalid login response from server" }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })

    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error during login"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
