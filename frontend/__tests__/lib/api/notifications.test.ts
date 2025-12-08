import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getNotifications,
  getUnreadCount,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/api/notifications"
import type { Notification } from "@/lib/types"

// Mock the apiFetch function
vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  getAuthToken: vi.fn(() => "mock-token"),
}))

import { apiFetch } from "@/lib/api/client"

const mockApiFetch = vi.mocked(apiFetch)

// Sample notification data matching backend schema
const mockNotification: Notification = {
  id: 1,
  user_email: "user@example.com",
  type: "submission_received",
  title: "New Submission",
  message: "A new paper has been submitted",
  metadata: { submission_id: 123 },
  read: false,
  action_url: "/dashboard/conference/1/submission/123",
  conference_id: 1,
  created_at: "2025-01-15T10:00:00Z",
}

const mockNotification2: Notification = {
  id: 2,
  user_email: "user@example.com",
  type: "paper_accepted",
  title: "Paper Accepted",
  message: "Your paper has been accepted",
  read: true,
  created_at: "2025-01-14T10:00:00Z",
}

describe("Notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("getNotifications", () => {
    it("should fetch notifications with default params", async () => {
      const mockResponse = {
        data: {
          data: {
            notifications: [mockNotification, mockNotification2],
            total: 2,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getNotifications()

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications")
      expect(result.notifications).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it("should fetch notifications with pagination params", async () => {
      const mockResponse = {
        data: {
          data: {
            notifications: [mockNotification],
            total: 10,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getNotifications({ limit: 5, offset: 5 })

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications?limit=5&offset=5")
      expect(result.notifications).toHaveLength(1)
    })

    it("should fetch only unread notifications", async () => {
      const mockResponse = {
        data: {
          data: {
            notifications: [mockNotification],
            total: 1,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getNotifications({ unread: true })

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications?unread=true")
      expect(result.notifications[0].read).toBe(false)
    })

    it("should filter by notification type", async () => {
      const mockResponse = {
        data: {
          data: {
            notifications: [mockNotification],
            total: 1,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getNotifications({ type: "submission_received" })

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications?type=submission_received")
      expect(result.notifications[0].type).toBe("submission_received")
    })
  })

  describe("getUnreadCount", () => {
    it("should fetch unread notification count", async () => {
      const mockResponse = {
        data: {
          data: {
            count: 5,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getUnreadCount()

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications/unread-count")
      expect(result).toBe(5)
    })

    it("should return 0 when no unread notifications", async () => {
      const mockResponse = {
        data: {
          data: {
            count: 0,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getUnreadCount()

      expect(result).toBe(0)
    })
  })

  describe("getNotification", () => {
    it("should fetch a single notification by ID", async () => {
      const mockResponse = {
        data: {
          data: mockNotification,
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await getNotification(1)

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications/1")
      expect(result.id).toBe(1)
      expect(result.type).toBe("submission_received")
    })
  })

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      const readNotification = { ...mockNotification, read: true }
      const mockResponse = {
        data: {
          data: readNotification,
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await markAsRead(1)

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications/1/read", {
        method: "PATCH",
      })
      expect(result.read).toBe(true)
    })
  })

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      const mockResponse = {
        data: {
          data: {
            marked_count: 3,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await markAllAsRead()

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications/read-all", {
        method: "PATCH",
      })
      expect(result).toBe(3)
    })

    it("should return 0 when no notifications to mark", async () => {
      const mockResponse = {
        data: {
          data: {
            marked_count: 0,
          },
        },
      }
      mockApiFetch.mockResolvedValueOnce(mockResponse)

      const result = await markAllAsRead()

      expect(result).toBe(0)
    })
  })

  describe("deleteNotification", () => {
    it("should delete a notification", async () => {
      mockApiFetch.mockResolvedValueOnce({ data: {}, response: new Response() })

      await deleteNotification(1)

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/notifications/1", {
        method: "DELETE",
      })
    })
  })
})

describe("Notification Types", () => {
  it("should have correct notification type values", () => {
    const validTypes = [
      "submission_received",
      "review_assigned",
      "review_submitted",
      "paper_accepted",
      "paper_rejected",
      "deadline_reminder",
      "status_change",
    ]

    // Verify our mock uses valid types
    expect(validTypes).toContain(mockNotification.type)
    expect(validTypes).toContain(mockNotification2.type)
  })

  it("should have required fields in notification", () => {
    // Verify required fields are present
    expect(mockNotification).toHaveProperty("id")
    expect(mockNotification).toHaveProperty("user_email")
    expect(mockNotification).toHaveProperty("type")
    expect(mockNotification).toHaveProperty("title")
    expect(mockNotification).toHaveProperty("message")
    expect(mockNotification).toHaveProperty("read")
    expect(mockNotification).toHaveProperty("created_at")
  })

  it("should have optional fields when present", () => {
    expect(mockNotification).toHaveProperty("metadata")
    expect(mockNotification).toHaveProperty("action_url")
    expect(mockNotification).toHaveProperty("conference_id")
  })

  it("should handle notification without optional fields", () => {
    const minimalNotification: Notification = {
      id: 3,
      user_email: "test@example.com",
      type: "status_change",
      title: "Status Changed",
      message: "Conference status updated",
      read: false,
      created_at: "2025-01-15T12:00:00Z",
    }

    expect(minimalNotification.metadata).toBeUndefined()
    expect(minimalNotification.action_url).toBeUndefined()
    expect(minimalNotification.conference_id).toBeUndefined()
  })
})

describe("API Response Schema Validation", () => {
  it("should match backend NotificationListResponse schema", async () => {
    const mockResponse = {
      data: {
        data: {
          notifications: [mockNotification],
          total: 1,
        },
      },
    }
    mockApiFetch.mockResolvedValueOnce(mockResponse)

    const result = await getNotifications()

    // Verify response structure matches backend dto.NotificationListResponse
    expect(result).toHaveProperty("notifications")
    expect(result).toHaveProperty("total")
    expect(Array.isArray(result.notifications)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  it("should match backend UnreadCountResponse schema", async () => {
    const mockResponse = {
      data: {
        data: {
          count: 5,
        },
      },
    }
    mockApiFetch.mockResolvedValueOnce(mockResponse)

    const result = await getUnreadCount()

    // Verify response matches backend dto.UnreadCountResponse
    expect(typeof result).toBe("number")
  })

  it("should match backend MarkAllAsReadResponse schema", async () => {
    const mockResponse = {
      data: {
        data: {
          marked_count: 3,
        },
      },
    }
    mockApiFetch.mockResolvedValueOnce(mockResponse)

    const result = await markAllAsRead()

    // Verify response matches backend dto.MarkAllAsReadResponse
    expect(typeof result).toBe("number")
  })

  it("should match backend Notification schema", async () => {
    const mockResponse = {
      data: {
        data: mockNotification,
      },
    }
    mockApiFetch.mockResolvedValueOnce(mockResponse)

    const result = await getNotification(1)

    // Verify all fields match backend dto.Notification
    expect(typeof result.id).toBe("number")
    expect(typeof result.user_email).toBe("string")
    expect(typeof result.type).toBe("string")
    expect(typeof result.title).toBe("string")
    expect(typeof result.message).toBe("string")
    expect(typeof result.read).toBe("boolean")
    expect(typeof result.created_at).toBe("string")

    // Optional fields
    if (result.metadata !== undefined) {
      expect(typeof result.metadata).toBe("object")
    }
    if (result.action_url !== undefined) {
      expect(typeof result.action_url).toBe("string")
    }
    if (result.conference_id !== undefined) {
      expect(typeof result.conference_id).toBe("number")
    }
  })
})

