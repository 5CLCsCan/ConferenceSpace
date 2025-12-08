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

  const { data } = await apiFetch<{ data: NotificationListResponse }>(path)
  return data.data
}

/**
 * Get unread notification count for the authenticated user
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await apiFetch<{ data: UnreadCountResponse }>("/api/v1/notifications/unread-count")
  return data.data.count
}

/**
 * Get a specific notification by ID
 */
export async function getNotification(id: string): Promise<Notification> {
  const { data } = await apiFetch<{ data: Notification }>(`/api/v1/notifications/${id}`)
  return data.data
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  const { data } = await apiFetch<{ data: Notification }>(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
  })
  return data.data
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const { data } = await apiFetch<{ data: MarkAllAsReadResponse }>("/api/v1/notifications/read-all", {
    method: "PATCH",
  })
  return data.data.marked_count
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}`, {
    method: "DELETE",
  })
}

