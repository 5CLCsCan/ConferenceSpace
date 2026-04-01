"use client"

import * as React from "react"

type ChatbotContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  width: number
  setWidth: (width: number) => void
  navigationMask: NavigationMaskState | null
  showNavigationMask: (mask: NavigationMaskState) => void
  clearNavigationMask: () => void
}

export type NavigationMaskState = {
  destinationLabel: string
  targetPath: string
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
  const [navigationMask, setNavigationMask] = React.useState<NavigationMaskState | null>(null)

  const showNavigationMask = React.useCallback((mask: NavigationMaskState) => {
    setNavigationMask(mask)
  }, [])

  const clearNavigationMask = React.useCallback(() => {
    setNavigationMask(null)
  }, [])

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        width,
        setWidth,
        navigationMask,
        showNavigationMask,
        clearNavigationMask,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  )
}
