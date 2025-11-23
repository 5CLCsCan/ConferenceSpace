"use client"

import * as React from "react"

type ChatbotContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  width: number
  setWidth: (width: number) => void
}

const ChatbotContext = React.createContext<ChatbotContextType | undefined>(undefined)

export function useChatbot() {
  const context = React.useContext(ChatbotContext)
  if (!context) {
    throw new Error("useChatbot must be used within ChatbotProvider")
  }
  return context
}

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [width, setWidth] = React.useState(384) // Default 384px (w-96)

  return (
    <ChatbotContext.Provider value={{ isOpen, setIsOpen, width, setWidth }}>
      {children}
    </ChatbotContext.Provider>
  )
}
