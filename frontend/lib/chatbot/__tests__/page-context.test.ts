import { describe, expect, it } from "vitest"
import { capturePageContext } from "@/lib/chatbot/page-context"

function getInteractiveAriaLabels(): string[] {
  const { refMap } = capturePageContext()
  return Array.from(refMap.values())
    .map((element) => element.getAttribute("aria-label") || "")
    .filter(Boolean)
}

describe("capturePageContext", () => {
  it("excludes chatbot sidebar elements from context capture", () => {
    document.body.innerHTML = `
      <main>
        <button aria-label="Main Action">Main Action</button>
      </main>
      <aside data-chatbot-ui="true">
        <button aria-label="Assistant Sidebar Action">Assistant Sidebar Action</button>
      </aside>
    `

    const labels = getInteractiveAriaLabels()

    expect(labels).toContain("Main Action")
    expect(labels).not.toContain("Assistant Sidebar Action")
  })

  it("excludes elements explicitly marked to ignore context capture", () => {
    document.body.innerHTML = `
      <main>
        <button aria-label="Visible Action">Visible Action</button>
      </main>
      <section data-chatbot-ignore-context="true">
        <button aria-label="Ignored Action">Ignored Action</button>
      </section>
    `

    const labels = getInteractiveAriaLabels()

    expect(labels).toContain("Visible Action")
    expect(labels).not.toContain("Ignored Action")
  })
})
