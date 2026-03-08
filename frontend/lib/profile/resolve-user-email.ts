import { apiFetch } from "@/lib/api/client"

interface UserSearchResult {
  id: number | string
  email: string
}

interface ResolveUserEmailResult {
  mode: "me" | "email" | "not_found"
  email?: string
}

const isEmailLike = (value: string) => value.includes("@")

export async function resolveUserEmail(
  userId: string,
  currentUserId?: string,
): Promise<ResolveUserEmailResult> {
  if (!userId) {
    return { mode: "not_found" }
  }

  if (userId === "me") {
    return { mode: "me" }
  }

  if (currentUserId && String(userId) === String(currentUserId)) {
    return { mode: "me" }
  }

  if (isEmailLike(userId)) {
    return { mode: "email", email: userId }
  }

  try {
    const { data } = await apiFetch<{ data: { users: UserSearchResult[] } }>(
      `/api/v1/users/search?q=${encodeURIComponent(userId)}&limit=10`,
    )

    const users = data?.data?.users || []
    const exactMatch = users.find((user) => String(user.id) === String(userId))

    if (exactMatch?.email) {
      return { mode: "email", email: exactMatch.email }
    }
  } catch {
    return { mode: "not_found" }
  }

  return { mode: "not_found" }
}
