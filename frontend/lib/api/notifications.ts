import { apiFetch } from "./client"
import type { Notification } from "../types"

// Response types
export interface NotificationListResponse {
  notifications: Notification[]
  total: number
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkAllAsReadResponse {
  marked_count: number
}

// Request types
export interface NotificationListRequest {
  limit?: number
  offset?: number
  unread?: boolean
  type?: string
}

interface BackendNotification extends Partial<Notification> {
  is_read?: boolean
  actionUrl?: string
  conferenceId?: number
  createdAt?: string
}

function normalizeNotification(item: BackendNotification): Notification {
  return {
    id: Number(item.id || 0),
    user_email: item.user_email || "",
    type: (item.type || "status_change") as Notification["type"],
    title: item.title || "",
    message: item.message || "",
    metadata: item.metadata || undefined,
    read: typeof item.read === "boolean" ? item.read : Boolean(item.is_read),
    action_url: item.action_url || item.actionUrl || undefined,
    conference_id: item.conference_id || item.conferenceId || undefined,
    created_at: item.created_at || item.createdAt || new Date().toISOString(),
  }
}

/**
 * Get list of notifications for the authenticated user
 */
export async function getNotifications(
  params?: NotificationListRequest,
): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set("limit", params.limit.toString())
  if (params?.offset) searchParams.set("offset", params.offset.toString())
  if (params?.unread) searchParams.set("unread", "true")
  if (params?.type) searchParams.set("type", params.type)

  const queryString = searchParams.toString()
  const path = queryString ? `/api/v1/notifications?${queryString}` : "/api/v1/notifications"

  const { data } = await apiFetch<{ data: { notifications: BackendNotification[]; total: number } }>(path)
  return {
    notifications: (data.data.notifications || []).map(normalizeNotification),
    total: data.data.total || 0,
  }
}

/**
 * Get unread notification count for the authenticated user
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await apiFetch<{ data: UnreadCountResponse }>(
    "/api/v1/notifications/unread-count",
  )
  console.log("[API] Unread count response:", data)
  return data.data.count
}

/**
 * Get a specific notification by ID
 */
export async function getNotification(id: number): Promise<Notification> {
  const { data } = await apiFetch<{ data: BackendNotification }>(`/api/v1/notifications/${id}`)
  return normalizeNotification(data.data)
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: number): Promise<Notification> {
  const { data } = await apiFetch<{ data: BackendNotification }>(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
  })
  return normalizeNotification(data.data)
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const { data } = await apiFetch<{ data: MarkAllAsReadResponse }>(
    "/api/v1/notifications/read-all",
    {
      method: "PATCH",
    },
  )
  return data.data.marked_count
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: number): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}`, {
    method: "DELETE",
  })
}
