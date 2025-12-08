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

  constructor(token: string) {
    this.token = token
    // Determine WebSocket URL based on environment
    const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:"
    const apiHost = process.env.NEXT_PUBLIC_API_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).host
      : "localhost:8080"
    this.url = `${wsProtocol}//${apiHost}/ws/notifications?token=${encodeURIComponent(token)}`
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage
          if (data.type === "notification" && data.payload) {
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
        console.log("WebSocket closed:", event.code, event.reason)
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }
    } catch (err) {
      console.error("Failed to create WebSocket:", err)
      this.attemptReconnect()
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent reconnect
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
    const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:"
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

