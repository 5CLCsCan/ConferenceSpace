import { capturePageContext, type A11yNode } from "@/lib/chatbot/page-context"
import { describe, expect, it } from "vitest"

function flattenTree(node: A11yNode): A11yNode[] {
  return [node, ...(node.children?.flatMap(flattenTree) ?? [])]
}

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

  it("only exposes refs for actionable elements and collapses anonymous wrappers", () => {
    document.body.innerHTML = `
      <main>
        <div>
          <div>
            <button>Enter Dashboard</button>
          </div>
        </div>
      </main>
    `

    const { tree } = capturePageContext()

    expect(tree.ref).toBeUndefined()
    expect(tree.children).toHaveLength(1)
    expect(tree.children?.[0]).toMatchObject({
      role: "main",
      children: [
        {
          role: "button",
          accessibleName: "Enter Dashboard",
        },
      ],
    })
    expect(tree.children?.[0]?.children?.[0]?.ref).toMatch(/^btn-/)
  })

  it("keeps direct visible text separate from accessible names", () => {
    document.body.innerHTML = `
      <main>
        <div>
          Helpful wrapper text
          <button>Continue</button>
        </div>
      </main>
    `

    const { tree } = capturePageContext()
    const main = tree.children?.[0]
    const wrapper = main?.children?.[0]

    expect(wrapper).toMatchObject({
      role: "generic",
      visibleText: "Helpful wrapper text",
      children: [
        {
          role: "button",
          accessibleName: "Continue",
        },
      ],
    })
    expect(wrapper?.accessibleName).toBeUndefined()
  })

  it("does not treat aria-describedby text as an accessible name", () => {
    document.body.innerHTML = `
      <main>
        <textarea aria-describedby="message-help"></textarea>
        <p id="message-help">Explain your decision.</p>
      </main>
    `

    const { tree } = capturePageContext()
    const nodes = flattenTree(tree)
    const textbox = nodes.find((node) => node.role === "textbox")

    expect(textbox?.accessibleName).toBeUndefined()
    expect(nodes).toContainEqual(
      expect.objectContaining({
        visibleText: "Explain your decision.",
      }),
    )
  })

  it("drops hidden and decorative nodes from the captured tree", () => {
    document.body.innerHTML = `
      <main>
        <button aria-label="Visible Action">Visible Action</button>
        <div aria-hidden="true">
          <button aria-label="Hidden Action">Hidden Action</button>
        </div>
        <div role="presentation">
          Decorative copy
        </div>
      </main>
    `

    const labels = getInteractiveAriaLabels()
    const { tree } = capturePageContext()
    const nodes = flattenTree(tree)

    expect(labels).toContain("Visible Action")
    expect(labels).not.toContain("Hidden Action")
    expect(nodes).not.toContainEqual(
      expect.objectContaining({
        visibleText: "Decorative copy",
      }),
    )
  })
})
