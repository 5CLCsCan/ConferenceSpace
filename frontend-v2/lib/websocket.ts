import type { Notification } from "./types"

export type NotificationHandler = (notification: Notification) => void

interface WebSocketMessage {
  type: string
  payload: Notification
}

export class NotificationWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private handlers: Set<NotificationHandler> = new Set()
  private token: string
  private url: string
  private intentionalDisconnect = false
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(token: string) {
    this.token = token
    // Determine WebSocket URL based on environment
    const wsProtocol =
      typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:"
    const apiHost = process.env.NEXT_PUBLIC_API_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).host
      : "localhost:8080"
    this.url = `${wsProtocol}//${apiHost}/ws/notifications?token=${encodeURIComponent(token)}`
  }

  connect(): void {
    // Reset intentional disconnect flag when connecting
    this.intentionalDisconnect = false

    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log("[WebSocket] Already connected or connecting, skipping")
      return
    }

    try {
      console.log("[WebSocket] Creating new connection...")
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected successfully")
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage
          if (data.type === "notification" && data.payload) {
            console.log("[WebSocket] Received notification:", data.payload.title)
            this.handlers.forEach((handler) => {
              try {
                handler(data.payload)
              } catch (err) {
                console.error("Error in notification handler:", err)
              }
            })
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err)
        }
      }

      this.ws.onclose = (event) => {
        console.log("[WebSocket] Closed:", event.code, event.reason)
        // Only reconnect if this wasn't an intentional disconnect
        if (!this.intentionalDisconnect) {
          this.attemptReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error)
      }
    } catch (err) {
      console.error("[WebSocket] Failed to create:", err)
      if (!this.intentionalDisconnect) {
        this.attemptReconnect()
      }
    }
  }

  private attemptReconnect(): void {
    if (this.intentionalDisconnect) {
      console.log("[WebSocket] Intentional disconnect, not reconnecting")
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WebSocket] Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, delay)
  }

  disconnect(): void {
    console.log("[WebSocket] Disconnect called")
    this.intentionalDisconnect = true

    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      // Only close if actually open
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  subscribe(handler: NotificationHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  updateToken(token: string): void {
    this.token = token
    const wsProtocol =
      typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:"
    const apiHost = process.env.NEXT_PUBLIC_API_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).host
      : "localhost:8080"
    this.url = `${wsProtocol}//${apiHost}/ws/notifications?token=${encodeURIComponent(token)}`

    // Reconnect with new token
    if (this.ws) {
      this.reconnectAttempts = 0
      this.ws.close()
      this.connect()
    }
  }
}

// Singleton instance (will be initialized when needed)
let notificationWs: NotificationWebSocket | null = null

export function getNotificationWebSocket(token: string): NotificationWebSocket {
  if (!notificationWs) {
    notificationWs = new NotificationWebSocket(token)
  } else if (notificationWs) {
    // Update token if it changed
    notificationWs.updateToken(token)
  }
  return notificationWs
}

export function disconnectNotificationWebSocket(): void {
  if (notificationWs) {
    notificationWs.disconnect()
    notificationWs = null
  }
}
