export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"

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

  const targetUrl = skipAuth ? `${API_BASE_URL}${normalizedPath}` : `/api/backend${normalizedPath}`

  const response = await fetch(targetUrl, {
    ...rest,
    headers: requestHeaders,
    credentials: skipAuth ? "same-origin" : "include",
  })

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
