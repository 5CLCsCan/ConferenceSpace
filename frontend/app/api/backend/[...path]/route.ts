"use server"

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME } from "@/lib/config"

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"

async function handler(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const skipAuth = req.headers.get("X-Skip-Auth") === "true"

  const pathname = req.nextUrl.pathname.replace(/^\/api\/backend/, "")
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const targetPath = normalizedPath === "/" ? "" : normalizedPath
  const url = `${BACKEND_API_BASE_URL}${targetPath}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("cookie")
  headers.delete("origin")
  headers.delete("access-control-request-method")
  headers.delete("access-control-request-headers")
  headers.delete("X-Skip-Auth")

  if (token && !skipAuth) {
    headers.set("Authorization", `Bearer ${token}`)
  } else {
    headers.delete("Authorization")
  }

  let body: BodyInit | undefined
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = headers.get("content-type") ?? ""
    if (contentType.includes("multipart/form-data")) {
      // For FormData, we need to read the body as ArrayBuffer and pass it to fetch
      body = await req.arrayBuffer()
    } else if (contentType.includes("application/json") || contentType.includes("text/")) {
      body = await req.text()
    } else {
      const arrayBuffer = await req.arrayBuffer()
      body = arrayBuffer.byteLength ? arrayBuffer : undefined
    }
  }

  const backendResponse = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  })

  const responseHeaders = new Headers(backendResponse.headers)
  const responseBody =
    req.method === "HEAD" ? null : await backendResponse.arrayBuffer().catch(() => null)

  return new NextResponse(responseBody ? responseBody : undefined, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
