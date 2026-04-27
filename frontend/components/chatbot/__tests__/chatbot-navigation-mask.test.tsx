import { render, screen } from "@testing-library/react"
import * as React from "react"
import { act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChatbotProvider, useChatbot } from "../chatbot-provider"
import { ChatbotNavigationMask } from "../chatbot-navigation-mask"

let mockPathname = "/notifications"
let mockSearchParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}))

vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({
      t: tStatic,
    }),
  }
})

function TriggerMask() {
  const { showNavigationMask } = useChatbot()

  React.useEffect(() => {
    showNavigationMask({
      destinationLabel: "Chair Conferences",
      targetPath: "/role/chair/conferences",
    })
  }, [showNavigationMask])

  return null
}

describe("ChatbotNavigationMask", () => {
  beforeEach(() => {
    mockPathname = "/notifications"
    mockSearchParams = new URLSearchParams()
  })

  it("shows the content mask until navigation reaches the target route", () => {
    const view = render(
      <ChatbotProvider>
        <ChatbotNavigationMask />
        <TriggerMask />
      </ChatbotProvider>,
    )

    expect(screen.getByText("Navigating to Chair Conferences...")).toBeInTheDocument()

    act(() => {
      mockPathname = "/role/chair/conferences"
    })

    view.rerender(
      <ChatbotProvider>
        <ChatbotNavigationMask />
        <TriggerMask />
      </ChatbotProvider>,
    )

    expect(screen.queryByText("Navigating to Chair Conferences...")).not.toBeInTheDocument()
  })
})
