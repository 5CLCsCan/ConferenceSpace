import type { UIMessage } from "ai"

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
  messages: UIMessage[]
  createdAt: Date
  updatedAt: Date
  turnCount?: number
  model?: string
  status?: string
}
