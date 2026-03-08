/**
 * Accessibility Tree Snapshot Generator
 * Captures a hierarchical representation of the DOM with refs for element targeting
 */

export interface A11yNode {
  ref: string // Unique identifier for targeting (e.g., "btn-1", "input-2")
  role: string // ARIA/semantic role
  name: string // Accessible name (label, aria-label, text content)
  value?: string // Input value, checkbox state, etc.
  checked?: boolean // Checkbox/radio state
  disabled?: boolean // Disabled state
  expanded?: boolean // Collapsible state
  children?: A11yNode[] // Child nodes
}

export interface PageContext {
  tree: A11yNode
  refMap: Map<string, Element>
}

// Counter for generating unique refs
let refCounter = 0

// Interactive element selectors
const INTERACTIVE_SELECTORS = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="textbox"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

const CONTEXT_EXCLUDED_SELECTOR = '[data-chatbot-ui="true"], [data-chatbot-ignore-context="true"]'

/**
 * Capture the current page's accessibility tree
 */
export function capturePageContext(): PageContext {
  refCounter = 0 // Reset counter
  const refMap = new Map<string, Element>()

  const tree = buildA11yTree(document.body, refMap)

  return { tree, refMap }
}

/**
 * Recursively build the accessibility tree
 */
function buildA11yTree(element: Element, refMap: Map<string, Element>): A11yNode {
  const isInteractive = element.matches(INTERACTIVE_SELECTORS)
  const ref = isInteractive ? generateRef(element) : `elem-${refCounter++}`

  if (isInteractive) {
    refMap.set(ref, element)
  }

  const node: A11yNode = {
    ref,
    role: getRole(element),
    name: getAccessibleName(element),
  }

  // Add state attributes
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    node.value = element.value
  }

  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio")
  ) {
    node.checked = element.checked
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    node.disabled = element.disabled
  }

  const ariaExpanded = element.getAttribute("aria-expanded")
  if (ariaExpanded !== null) {
    node.expanded = ariaExpanded === "true"
  }

  // Traverse children (only visible, non-script elements)
  const children: A11yNode[] = []
  const childElements = Array.from(element.children).filter((child) => {
    if (!(child instanceof HTMLElement)) return false
    if (isExcludedFromContext(child)) return false
    const style = window.getComputedStyle(child)
    return style.display !== "none" && style.visibility !== "hidden"
  })

  for (const child of childElements) {
    children.push(buildA11yTree(child, refMap))
  }

  if (children.length > 0) {
    node.children = children
  }

  return node
}

/**
 * Generate a unique ref for an element
 */
function generateRef(element: Element): string {
  const tagName = element.tagName.toLowerCase()

  if (tagName === "button") return `btn-${refCounter++}`
  if (tagName === "a") return `link-${refCounter++}`
  if (tagName === "input") {
    const type = (element as HTMLInputElement).type
    return `input-${type}-${refCounter++}`
  }
  if (tagName === "select") return `select-${refCounter++}`
  if (tagName === "textarea") return `textarea-${refCounter++}`

  const role = element.getAttribute("role")
  if (role) return `${role}-${refCounter++}`

  return `elem-${refCounter++}`
}

/**
 * Get the semantic role of an element
 */
function getRole(element: Element): string {
  // Explicit ARIA role
  const ariaRole = element.getAttribute("role")
  if (ariaRole) return ariaRole

  // Implicit semantic roles
  const tagName = element.tagName.toLowerCase()

  const roleMap: Record<string, string> = {
    button: "button",
    a: "link",
    input: "textbox",
    select: "combobox",
    textarea: "textbox",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    nav: "navigation",
    main: "main",
    aside: "complementary",
    header: "banner",
    footer: "contentinfo",
    form: "form",
    img: "img",
  }

  if (element instanceof HTMLInputElement) {
    const inputType = element.type
    if (inputType === "checkbox") return "checkbox"
    if (inputType === "radio") return "radio"
    if (inputType === "submit") return "button"
    if (inputType === "button") return "button"
    return "textbox"
  }

  return roleMap[tagName] || "generic"
}

/**
 * Get the accessible name of an element
 */
function getAccessibleName(element: Element): string {
  // aria-label takes precedence
  const ariaLabel = element.getAttribute("aria-label")
  if (ariaLabel) return ariaLabel

  // aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby")
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy)
    if (labelElement) return labelElement.textContent?.trim() || ""
  }

  // Label element (for inputs and textareas)
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const id = element.id
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) return label.textContent?.trim() || ""
    }

    // Parent label
    const parentLabel = element.closest("label")
    if (parentLabel) {
      const labelText = parentLabel.textContent?.trim() || ""
      // For textareas, also check if there's a sibling label or description
      if (labelText) return labelText
    }

    // For textareas, check for associated description or helper text
    if (element instanceof HTMLTextAreaElement) {
      const ariaDescribedBy = element.getAttribute("aria-describedby")
      if (ariaDescribedBy) {
        const descElement = document.getElementById(ariaDescribedBy)
        if (descElement) {
          const descText = descElement.textContent?.trim()
          if (descText) return descText
        }
      }
    }
  }

  // Text content
  const textContent = element.textContent?.trim()
  if (textContent && textContent.length < 100) return textContent

  // Placeholder for inputs
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const placeholder = element.placeholder
    if (placeholder) return placeholder
  }

  // Alt text for images
  if (element instanceof HTMLImageElement) {
    return element.alt || ""
  }

  // Title attribute
  const title = element.getAttribute("title")
  if (title) return title

  return ""
}

function isExcludedFromContext(element: Element): boolean {
  return Boolean(element.closest(CONTEXT_EXCLUDED_SELECTOR))
}
