/**
 * Page context snapshot generator.
 * Captures a pruned, semantically useful tree plus executable refs for actionable elements.
 */

export interface A11yNode {
  role: string
  ref?: string
  accessibleName?: string
  visibleText?: string
  value?: string
  checked?: boolean
  disabled?: boolean
  expanded?: boolean
  level?: number
  children?: A11yNode[]
}

export interface PageContext {
  tree: A11yNode
  refMap: Map<string, Element>
}

let refCounter = 0

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
const HIDDEN_SELECTOR = '[aria-hidden="true"], [hidden], [inert], [role="presentation"], [role="none"]'
const NON_CONTENT_TAGS = new Set(["script", "style", "template", "noscript"])
const NAME_FROM_CONTENT_ROLES = new Set([
  "button",
  "checkbox",
  "heading",
  "link",
  "menuitem",
  "option",
  "radio",
  "tab",
])

export function capturePageContext(): PageContext {
  refCounter = 0
  const refMap = new Map<string, Element>()
  const tree = buildA11yTree(document.body, refMap) ?? { role: "generic" }

  return { tree, refMap }
}

function buildA11yTree(element: Element, refMap: Map<string, Element>): A11yNode | null {
  const isRoot = element === document.body

  if (element !== document.body && isExcludedFromContext(element)) {
    return null
  }

  const children = Array.from(element.children)
    .map((child) => buildA11yTree(child, refMap))
    .filter((child): child is A11yNode => Boolean(child))

  const role = getRole(element)
  const accessibleName = getAccessibleName(element, role)
  const visibleText = getVisibleText(element, children, accessibleName)
  const actionable = isActionableElement(element)
  const node: A11yNode = { role }

  if (actionable) {
    const ref = generateRef(element)
    node.ref = ref
    refMap.set(ref, element)
  }

  if (accessibleName) {
    node.accessibleName = accessibleName
  }

  if (visibleText) {
    node.visibleText = visibleText
  }

  const value = getElementValue(element)
  if (value) {
    node.value = value
  }

  const checked = getCheckedState(element)
  if (checked !== undefined) {
    node.checked = checked
  }

  if (isDisabledElement(element)) {
    node.disabled = true
  }

  const ariaExpanded = element.getAttribute("aria-expanded")
  if (ariaExpanded === "true" || ariaExpanded === "false") {
    node.expanded = ariaExpanded === "true"
  }

  const level = getHeadingLevel(element)
  if (level !== undefined) {
    node.level = level
  }

  if (children.length > 0) {
    node.children = children
  }

  if (!isRoot && shouldDropNode(node)) {
    return null
  }

  if (!isRoot && shouldCollapseNode(node)) {
    return node.children?.[0] ?? null
  }

  return node
}

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

function getRole(element: Element): string {
  const ariaRole = element.getAttribute("role")
  if (ariaRole) return ariaRole

  const tagName = element.tagName.toLowerCase()

  if (element instanceof HTMLInputElement) {
    const inputType = element.type
    if (inputType === "checkbox") return "checkbox"
    if (inputType === "radio") return "radio"
    if (inputType === "submit" || inputType === "button" || inputType === "reset") {
      return "button"
    }
    return "textbox"
  }

  const roleMap: Record<string, string> = {
    a: "link",
    aside: "complementary",
    button: "button",
    footer: "contentinfo",
    form: "form",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    header: "banner",
    img: "img",
    li: "listitem",
    main: "main",
    nav: "navigation",
    ol: "list",
    select: "combobox",
    textarea: "textbox",
    ul: "list",
  }

  return roleMap[tagName] || "generic"
}

function getAccessibleName(element: Element, role: string): string {
  const ariaLabel = normalizeText(element.getAttribute("aria-label"))
  if (ariaLabel) {
    return ariaLabel
  }

  const ariaLabelledBy = element.getAttribute("aria-labelledby")
  if (ariaLabelledBy) {
    const labelledText = getTextFromIds(ariaLabelledBy)
    if (labelledText) {
      return labelledText
    }
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const labelText = getLabelText(element)
    if (labelText) {
      return labelText
    }

    if (element instanceof HTMLInputElement) {
      if (["button", "submit", "reset"].includes(element.type)) {
        const buttonValue = normalizeText(element.value)
        if (buttonValue) {
          return buttonValue
        }
      }
    }

    const placeholder = normalizeText(element.getAttribute("placeholder"))
    if (placeholder) {
      return placeholder
    }
  }

  if (element instanceof HTMLImageElement) {
    const alt = normalizeText(element.alt)
    if (alt) {
      return alt
    }
  }

  if (NAME_FROM_CONTENT_ROLES.has(role)) {
    const textContent = getElementText(element)
    if (textContent) {
      return textContent
    }
  }

  const title = normalizeText(element.getAttribute("title"))
  if (title) {
    return title
  }

  return ""
}

function getVisibleText(
  element: Element,
  children: A11yNode[],
  accessibleName?: string,
): string {
  const candidate =
    children.length === 0 ? getElementText(element) : getDirectTextContent(element)

  if (!candidate || candidate === accessibleName) {
    return ""
  }

  return truncateText(candidate, 200)
}

function getElementValue(element: Element): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return normalizeText(element.value)
  }

  if (element instanceof HTMLSelectElement) {
    return normalizeText(element.selectedOptions[0]?.textContent)
  }

  return ""
}

function getCheckedState(element: Element): boolean | undefined {
  if (
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio")
  ) {
    return element.checked
  }

  return undefined
}

function getHeadingLevel(element: Element): number | undefined {
  const tagName = element.tagName.toLowerCase()
  if (!/^h[1-6]$/.test(tagName)) {
    return undefined
  }

  return Number.parseInt(tagName.slice(1), 10)
}

function getLabelText(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): string {
  if (element.id) {
    const explicitLabel = Array.from(document.querySelectorAll("label[for]")).find(
      (label) => label.getAttribute("for") === element.id,
    )
    const explicitText = normalizeText(explicitLabel?.textContent)
    if (explicitText) {
      return explicitText
    }
  }

  const parentLabel = element.closest("label")
  return normalizeText(parentLabel?.textContent)
}

function getTextFromIds(ids: string): string {
  const text = ids
    .split(/\s+/)
    .map((id) => document.getElementById(id))
    .map((element) => normalizeText(element?.textContent))
    .filter(Boolean)
    .join(" ")

  return normalizeText(text)
}

function getElementText(element: Element): string {
  return truncateText(normalizeText(element.textContent), 200)
}

function getDirectTextContent(element: Element): string {
  const text = Array.from(element.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent || "")
    .join(" ")

  return truncateText(normalizeText(text), 200)
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}

function isActionableElement(element: Element): boolean {
  return element.matches(INTERACTIVE_SELECTORS) && !isDisabledElement(element)
}

function isDisabledElement(element: Element): boolean {
  if (element.getAttribute("aria-disabled") === "true") {
    return true
  }

  return Boolean(
    (element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement) &&
      element.disabled,
  )
}

function shouldDropNode(node: A11yNode): boolean {
  if (node.role === "img" && !node.accessibleName && !node.visibleText) {
    return true
  }

  return !hasNodeDetails(node) && !node.children?.length
}

function shouldCollapseNode(node: A11yNode): boolean {
  return node.role === "generic" && !hasNodeDetails(node) && (node.children?.length ?? 0) === 1
}

function hasNodeDetails(node: A11yNode): boolean {
  return Boolean(
    node.ref ||
      node.accessibleName ||
      node.visibleText ||
      node.value ||
      node.checked !== undefined ||
      node.disabled ||
      node.expanded !== undefined ||
      node.level !== undefined,
  )
}

function isExcludedFromContext(element: Element): boolean {
  if (NON_CONTENT_TAGS.has(element.tagName.toLowerCase())) {
    return true
  }

  if (element.closest(CONTEXT_EXCLUDED_SELECTOR) || element.closest(HIDDEN_SELECTOR)) {
    return true
  }

  if (!(element instanceof HTMLElement)) {
    return false
  }

  const style = window.getComputedStyle(element)
  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.visibility === "collapse"
  )
}
