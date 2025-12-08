"use client"

import { useCallback, useEffect, useState } from "react"
import type { Notification } from "@/lib/types"
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  type NotificationListRequest,
} from "@/lib/api/notifications"
import { getNotificationWebSocket, disconnectNotificationWebSocket } from "@/lib/websocket"
import { getAuthToken } from "@/lib/api/client"

interface UseNotificationsOptions {
  autoConnect?: boolean
  limit?: number
  unreadOnly?: boolean
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null
  total: number
  // Actions
  fetchNotifications: (params?: NotificationListRequest) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoConnect = true, limit = 20, unreadOnly = false } = options

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  // Fetch notifications
  const fetchNotifications = useCallback(async (params?: NotificationListRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getNotifications({
        limit: params?.limit ?? limit,
        offset: params?.offset ?? 0,
        unread: params?.unread ?? unreadOnly,
        type: params?.type,
      })
      setNotifications(response.notifications || [])
      setTotal(response.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch notifications"))
    } finally {
      setIsLoading(false)
    }
  }, [limit, unreadOnly])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error("Failed to fetch unread count:", err)
    }
  }, [])

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiMarkAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
      throw err
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
      throw err
    }
  }, [])

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notificationToDelete = notifications.find((n) => n.id === id)
      await apiDeleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setTotal((prev) => prev - 1)
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Failed to delete notification:", err)
      throw err
    }
  }, [notifications])

  // Refresh notifications
  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  // Handle incoming WebSocket notifications
  const handleWebSocketNotification = useCallback((notification: Notification) => {
    // Add new notification to the top of the list
    setNotifications((prev) => [notification, ...prev])
    setTotal((prev) => prev + 1)
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1)
    }
  }, [])

  // Initialize and connect WebSocket
  useEffect(() => {
    if (!autoConnect) return

    let unsubscribe: (() => void) | null = null

    const initializeWebSocket = async () => {
      try {
        const token = await getAuthToken()
        if (token) {
          const ws = getNotificationWebSocket(token)
          ws.connect()
          unsubscribe = ws.subscribe(handleWebSocketNotification)
        }
      } catch (err) {
        console.error("Failed to initialize WebSocket:", err)
      }
    }

    initializeWebSocket()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [autoConnect, handleWebSocketNotification])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      disconnectNotificationWebSocket()
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    total,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  }
}

