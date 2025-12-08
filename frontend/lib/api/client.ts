export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null

  // Try different methods to get the token
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === "conference_auth_token") {
      console.log("Found auth token cookie:", { name, valueLength: value.length })
      try {
        const decoded = decodeURIComponent(value)
        console.log("Decoded token:", decoded.substring(0, 20) + "...")
        return decoded
      } catch (e) {
        console.error("Failed to decode token:", e)
        return value // Return as-is if decode fails
      }
    }
  }

  console.warn("No conference_auth_token cookie found")
  console.log(
    "Available cookies:",
    cookies.map((c) => c.trim().split("=")[0]),
  )
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

  const normalizedPath = normalizePath(path)

  // Use proxy for all requests to maintain consistent auth handling
  const targetUrl = skipAuth ? `${API_BASE_URL}${normalizedPath}` : `/api/backend${normalizedPath}`

  console.log("Making API request:", {
    url: targetUrl,
    method: rest.method || "GET",
    usingProxy: !skipAuth,
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
    throw new ApiError(message, response.status, body)
  }

  return {
    data: body as TResponse,
    response,
  }
}
