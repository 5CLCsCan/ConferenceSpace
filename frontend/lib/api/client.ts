import { trackApiSuccess } from "@/lib/analytics"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null

  // Try to get the WebSocket token cookie (non-httpOnly)
  const cookies = document.cookie.split(";")

  // Debug: log all available cookies
  console.log(
    "[Auth] Available cookies:",
    cookies.map((c) => c.trim().split("=")[0]),
  )

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    // Look for WebSocket token first, then fall back to regular auth token
    if (name === "conference_ws_token" || name === "conference_auth_token") {
      console.log("[Auth] Found token cookie:", name)
      try {
        return decodeURIComponent(value)
      } catch (e) {
        return value // Return as-is if decode fails
      }
    }
  }

  console.log("[Auth] No token cookie found")
  return null
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401)
    this.name = "UnauthorizedError"
  }
}

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean
}

const SKIP_AUTH_HEADER = "X-Skip-Auth"

const TECHNICAL_ERROR_PATTERN =
  /(pq:|sqlstate|duplicate key value|violates unique constraint|constraint\s+"[^"]+"|database|syntax error at or near|failed to [a-z_ ]+:)/i

function sanitizeApiErrorMessage(message: string, status: number): string {
  if (status >= 500) {
    return "Something went wrong. Please try again later."
  }

  if (!message.trim()) {
    return "Request could not be completed. Please try again."
  }

  if (/duplicate key value|unique constraint/i.test(message)) {
    return "This value is already in use."
  }

  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return "Request could not be completed. Please try again."
  }

  return message
}

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`
  }
  return path
}

export async function apiFetch<TResponse = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<{ data: TResponse; response: Response }> {
  const { skipAuth = false, headers, ...rest } = options
  const requestHeaders = new Headers(headers ?? {})

  if (!requestHeaders.has("Content-Type") && !(rest.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (skipAuth) {
    requestHeaders.set(SKIP_AUTH_HEADER, "true")
  }

  const normalizedPath = normalizePath(path)

  const targetUrl = `/api/backend${normalizedPath}`

  console.log("Making API request:", {
    url: targetUrl,
    method: rest.method || "GET",
    usingProxy: true,
    contentType: requestHeaders.get("Content-Type"),
    bodyType: rest.body instanceof FormData ? "FormData" : typeof rest.body,
  })

  const response = await fetch(targetUrl, {
    ...rest,
    headers: requestHeaders,
    credentials: skipAuth ? "same-origin" : "include",
  })

  console.log("API response:", { status: response.status, ok: response.ok })

  const contentType = response.headers.get("Content-Type") ?? ""
  const isJson = contentType.includes("application/json")
  const body = isJson ? await response.json() : await response.text()

  if (response.status === 401) {
    throw new UnauthorizedError(
      typeof body === "string" ? body : (body?.error ?? body?.message ?? "Unauthorized"),
    )
  }

  if (!response.ok) {
    const message =
      typeof body === "string"
        ? body || response.statusText
        : body?.error || body?.message || response.statusText
    throw new ApiError(
      sanitizeApiErrorMessage(String(message ?? ""), response.status),
      response.status,
      body,
    )
  }

  trackApiSuccess(normalizedPath, rest.method || "GET")

  return {
    data: body as TResponse,
    response,
  }
}
