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

  const pathname = req.nextUrl.pathname.replace(/^\/api\/backend/, "")
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const targetPath = normalizedPath === "/" ? "" : normalizedPath

  let baseUrl = BACKEND_API_BASE_URL
  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1)

  const pathHasPrefix = targetPath.startsWith("/api/v1")
  const baseHasPrefix = baseUrl.endsWith("/api/v1")

  let finalUrl = baseUrl
  if (!baseHasPrefix && !pathHasPrefix) {
    finalUrl = `${baseUrl}/api/v1`
  }

  const url = `${finalUrl}${targetPath}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("cookie")
  headers.delete("content-length") // Let fetch calculate this

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  } else {
    headers.delete("Authorization")
  }

  let body: BodyInit | undefined
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = headers.get("content-type") ?? ""
    console.log("[Proxy] Processing request:", { method: req.method, url, contentType })

    if (contentType.includes("multipart/form-data")) {
      body = await req.arrayBuffer()
    } else if (contentType.includes("application/json") || contentType.includes("text/")) {
      const textBody = await req.text()
      console.log("[Proxy] Text body:", textBody.substring(0, 200)) // Log first 200 chars
      body = textBody
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
