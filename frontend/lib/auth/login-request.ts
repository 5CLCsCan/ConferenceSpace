export interface LoginPayload {
  email?: string
  password?: string
  rememberMe?: boolean
  [key: string]: unknown
}

export function extractLoginRequestPayload(payload: LoginPayload = {}) {
  const { rememberMe = false, ...backendPayload } = payload

  return {
    rememberMe: Boolean(rememberMe),
    backendPayload,
  }
}

export function resolveAuthCookieMaxAge(rememberMe: boolean, maxAge: number): number | undefined {
  return rememberMe ? maxAge : undefined
}
