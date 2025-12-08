import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useNotifications } from "@/hooks/use-notifications"
import type { Notification } from "@/lib/types"

// Mock all API functions
vi.mock("@/lib/api/notifications", () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}))

// Mock WebSocket module
const mockWebSocketInstance = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
  isConnected: vi.fn(() => false),
  updateToken: vi.fn(),
}

vi.mock("@/lib/websocket", () => ({
  NotificationWebSocket: vi.fn().mockImplementation(() => mockWebSocketInstance),
  getNotificationWebSocket: vi.fn(() => mockWebSocketInstance),
  disconnectNotificationWebSocket: vi.fn(),
}))

import * as notificationsApi from "@/lib/api/notifications"

const mockGetNotifications = vi.mocked(notificationsApi.getNotifications)
const mockGetUnreadCount = vi.mocked(notificationsApi.getUnreadCount)
const mockMarkAsRead = vi.mocked(notificationsApi.markAsRead)
const mockMarkAllAsRead = vi.mocked(notificationsApi.markAllAsRead)
const mockDeleteNotification = vi.mocked(notificationsApi.deleteNotification)

// Sample notifications
const mockNotifications: Notification[] = [
  {
    id: 1,
    user_email: "user@example.com",
    type: "submission_received",
    title: "New Submission",
    message: "A new paper has been submitted",
    read: false,
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: 2,
    user_email: "user@example.com",
    type: "paper_accepted",
    title: "Paper Accepted",
    message: "Your paper has been accepted",
    read: true,
    created_at: "2025-01-14T10:00:00Z",
  },
]

describe("useNotifications Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNotifications.mockResolvedValue({
      notifications: mockNotifications,
      total: mockNotifications.length,
    })
    mockGetUnreadCount.mockResolvedValue(1)
    mockMarkAsRead.mockResolvedValue({ ...mockNotifications[0], read: true })
    mockMarkAllAsRead.mockResolvedValue(1)
    mockDeleteNotification.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize and fetch notifications on mount", async () => {
      const { result } = renderHook(() => useNotifications({ autoConnect: false }))

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After fetch, should have notifications
      expect(result.current.notifications).toEqual(mockNotifications)
      expect(result.current.total).toBe(2)
      expect(result.current.error).toBeNull()
    })
  })

  describe("fetchNotifications", () => {
    it("should fetch notifications and update state", async () => {
      const { result } = renderHook(() => useNotifications({ autoConnect: false }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.notifications).toEqual(mockNotifications)
      expect(result.current.total).toBe(2)
    })

    it("should handle fetch error", async () => {
      const error = new Error("Network error")
      mockGetNotifications.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useNotifications({ autoConnect: false }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe("Network error")
    })
  })

  describe("markAsRead", () => {
    it("should mark notification as read and update state", async () => {
      const { result } = renderHook(() => useNotifications({ autoConnect: false }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.notifications[0].read).toBe(false)

      await act(async () => {
        await result.current.markAsRead(1)
      })

      expect(mockMarkAsRead).toHaveBeenCalledWith(1)
      expect(result.current.notifications[0].read).toBe(true)
    })
  })

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      const { result } = renderHook(() => useNotifications({ autoConnect: false }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.markAllAsRead()
      })

      expect(mockMarkAllAsRead).toHaveBeenCalled()
      expect(result.current.notifications.every((n) => n.read)).toBe(true)
      expect(result.current.unreadCount).toBe(0)
    })
  })

  describe("deleteNotification", () => {
    it("should delete notification and update state", async () => {
      const { result } = renderHook(() => useNotifications({ autoConnect: false }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.notifications).toHaveLength(2)

      await act(async () => {
        await result.current.deleteNotification(1)
      })

      expect(mockDeleteNotification).toHaveBeenCalledWith(1)
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.total).toBe(1)
    })
  })
})

describe("Notification Type Support", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUnreadCount.mockResolvedValue(0)
  })

  it("should handle all notification types", async () => {
    const allTypes: Notification[] = [
      {
        id: 1,
        user_email: "u@e.com",
        type: "submission_received",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
      {
        id: 2,
        user_email: "u@e.com",
        type: "review_assigned",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
      {
        id: 3,
        user_email: "u@e.com",
        type: "review_submitted",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
      {
        id: 4,
        user_email: "u@e.com",
        type: "paper_accepted",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
      {
        id: 5,
        user_email: "u@e.com",
        type: "paper_rejected",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
      {
        id: 6,
        user_email: "u@e.com",
        type: "deadline_reminder",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
      {
        id: 7,
        user_email: "u@e.com",
        type: "status_change",
        title: "T",
        message: "M",
        read: false,
        created_at: "2025-01-15T10:00:00Z",
      },
    ]

    mockGetNotifications.mockResolvedValueOnce({
      notifications: allTypes,
      total: allTypes.length,
    })

    const { result } = renderHook(() => useNotifications({ autoConnect: false }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.notifications).toHaveLength(7)
    const types = result.current.notifications.map((n) => n.type)
    expect(types).toContain("submission_received")
    expect(types).toContain("review_assigned")
    expect(types).toContain("review_submitted")
    expect(types).toContain("paper_accepted")
    expect(types).toContain("paper_rejected")
    expect(types).toContain("deadline_reminder")
    expect(types).toContain("status_change")
  })
})
