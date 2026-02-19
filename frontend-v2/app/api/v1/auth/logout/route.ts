"use server"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/config"

export async function POST() {
  const cookieStore = await cookies()

  // Clear main auth cookie
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  // Clear WebSocket token cookie
  cookieStore.set({
    name: "conference_ws_token",
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return NextResponse.json({ success: true })
}
