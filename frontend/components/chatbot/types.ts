export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: ChatAttachment[]
}

export interface ChatAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  file?: File
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

