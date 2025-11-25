/**
 * Browser Action Executor
 * Executes actions on DOM elements using refs from the page context
 */

export type ActionType = "click" | "type" | "press" | "select" | "clear"

export interface ActionParams {
  ref?: string // Element ref from page context
  text?: string // Text to type
  key?: string // Keyboard key to press
  value?: string // Select option value
}

export interface ActionResult {
  success: boolean
  message: string
  verified?: boolean // Whether we verified the change actually took effect
  previousValue?: string // Previous value before action
  currentValue?: string // Current value after action
}

/**
 * Execute a browser action on an element
 */
export async function executeAction(
  action: ActionType,
  refMap: Map<string, Element>,
  params: ActionParams,
): Promise<ActionResult> {
  try {
    switch (action) {
      case "click":
        return handleClick(refMap, params)
      case "type":
        return await handleType(refMap, params)
      case "press":
        return handlePress(params)
      case "select":
        return handleSelect(refMap, params)
      case "clear":
        return handleClear(refMap, params)
      default:
        return { success: false, message: `Unknown action: ${action}` }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, message: `Action failed: ${message}` }
  }
}

/**
 * Click an element
 */
function handleClick(refMap: Map<string, Element>, params: ActionParams): ActionResult {
  if (!params.ref) {
    return { success: false, message: "Missing ref parameter for click action" }
  }

  const element = refMap.get(params.ref)
  if (!element) {
    return { success: false, message: `Element not found: ${params.ref}` }
  }

  if (!(element instanceof HTMLElement)) {
    return { success: false, message: `Element ${params.ref} is not clickable` }
  }

  // Get element info before clicking
  const elementName = element.getAttribute("aria-label") || 
    element.textContent?.trim().slice(0, 50) || 
    element.tagName.toLowerCase()

  element.click()
  
  // Small delay to allow any async handlers to process
  return { 
    success: true, 
    message: `Clicked ${params.ref} (${elementName})` 
  }
}

/**
 * Type text into an input element
 */
async function handleType(refMap: Map<string, Element>, params: ActionParams): Promise<ActionResult> {
  if (!params.ref) {
    return { success: false, message: "Missing ref parameter for type action" }
  }

  if (!params.text) {
    return { success: false, message: "Missing text parameter for type action" }
  }

  const element = refMap.get(params.ref)
  if (!element) {
    // Provide helpful debugging info
    const availableRefs = Array.from(refMap.keys())
      .filter((ref) => ref.includes("textarea") || ref.includes("input"))
      .slice(0, 10)
      .join(", ")
    return { 
      success: false, 
      message: `Element not found: ${params.ref}. Available text input refs: ${availableRefs || "none"}` 
    }
  }

  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
    return { 
      success: false, 
      message: `Element ${params.ref} is not a text input (found: ${element.tagName.toLowerCase()}, id: ${element.id || "none"})` 
    }
  }

  const previousValue = element.value

  // Focus the element first
  element.focus()

  // Get the correct native value setter based on element type
  let nativeValueSetter: ((value: string) => void) | null = null
  
  if (element instanceof HTMLInputElement) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
    nativeValueSetter = descriptor?.set as ((value: string) => void) | undefined || null
  } else if (element instanceof HTMLTextAreaElement) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")
    nativeValueSetter = descriptor?.set as ((value: string) => void) | undefined || null
  }

  // Set the value using native setter to bypass React's controlled component restrictions
  if (nativeValueSetter) {
    nativeValueSetter.call(element, params.text)
  } else {
    // Fallback: directly set value
    element.value = params.text
  }

  // For React controlled components, we need to create proper synthetic events
  // React expects InputEvent and ChangeEvent with specific properties
  const inputEventInit: InputEventInit = {
    bubbles: true,
    cancelable: true,
    data: params.text,
    inputType: "insertText",
    isComposing: false,
  }

  const changeEventInit: EventInit = {
    bubbles: true,
    cancelable: true,
  }

  // Create and dispatch InputEvent (more specific than Event for inputs)
  const inputEvent = new InputEvent("input", inputEventInit)
  const changeEvent = new Event("change", changeEventInit)

  // Set target property (read-only, so we need to define it)
  Object.defineProperty(inputEvent, "target", {
    writable: false,
    value: element,
  })
  Object.defineProperty(changeEvent, "target", {
    writable: false,
    value: element,
  })

  // Dispatch events in the correct order
  element.dispatchEvent(inputEvent)
  element.dispatchEvent(changeEvent)

  // Try to trigger React's onChange handler directly if available
  // This is for React 16-18 compatibility
  const reactFiber = (element as any)._reactInternalFiber || 
                     (element as any)._reactInternalInstance ||
                     (element as any).__reactFiber ||
                     (element as any).__reactInternalInstance

  if (reactFiber) {
    // React 18+ uses memoizedProps
    const props = reactFiber.memoizedProps || 
                  reactFiber.currentProps || 
                  reactFiber.pendingProps ||
                  reactFiber.memoizedState?.props

    if (props?.onChange) {
      // Create a synthetic event object that React expects
      const syntheticEvent = {
        target: element,
        currentTarget: element,
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        eventPhase: 2, // AT_TARGET
        isTrusted: false,
        nativeEvent: inputEvent,
        preventDefault: () => {},
        stopPropagation: () => {},
        type: "change",
        timeStamp: Date.now(),
      }
      
      try {
        props.onChange(syntheticEvent as any)
      } catch (e) {
        // Ignore errors from onChange handler
      }
    }

    // Also try onInput for textareas
    if (element instanceof HTMLTextAreaElement && props?.onInput) {
      const syntheticInputEvent = {
        target: element,
        currentTarget: element,
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        eventPhase: 2,
        isTrusted: false,
        nativeEvent: inputEvent,
        preventDefault: () => {},
        stopPropagation: () => {},
        type: "input",
        timeStamp: Date.now(),
      }
      
      try {
        props.onInput(syntheticInputEvent as any)
      } catch (e) {
        // Ignore errors
      }
    }
  }

  // Wait a tick for React to process, then verify
  await new Promise((resolve) => setTimeout(resolve, 10))

  // Verify the change took effect
  const currentValue = element.value
  const verified = currentValue === params.text || currentValue.includes(params.text)

  return {
    success: true,
    message: verified
      ? `Successfully typed "${params.text}" into ${params.ref}. Value confirmed: "${currentValue}"`
      : `Typed "${params.text}" into ${params.ref}. Current DOM value: "${currentValue}". If this is a React controlled input, the value may be in React state.`,
    verified,
    previousValue,
    currentValue,
  }
}

/**
 * Press a keyboard key
 */
function handlePress(params: ActionParams): ActionResult {
  if (!params.key) {
    return { success: false, message: "Missing key parameter for press action" }
  }

  const event = new KeyboardEvent("keydown", {
    key: params.key,
    bubbles: true,
    cancelable: true,
  })

  const activeElement = document.activeElement
  if (activeElement) {
    activeElement.dispatchEvent(event)
  } else {
    document.dispatchEvent(event)
  }

  return { success: true, message: `Pressed key: ${params.key}` }
}

/**
 * Select an option from a dropdown
 */
function handleSelect(refMap: Map<string, Element>, params: ActionParams): ActionResult {
  if (!params.ref) {
    return { success: false, message: "Missing ref parameter for select action" }
  }

  if (!params.value) {
    return { success: false, message: "Missing value parameter for select action" }
  }

  const element = refMap.get(params.ref)
  if (!element) {
    return { success: false, message: `Element not found: ${params.ref}` }
  }

  if (!(element instanceof HTMLSelectElement)) {
    return { success: false, message: `Element ${params.ref} is not a select element` }
  }

  const previousValue = element.value

  // Set the value
  element.value = params.value

  // Dispatch change event for React/frameworks
  const changeEvent = new Event("change", { bubbles: true, cancelable: true })
  Object.defineProperty(changeEvent, "target", {
    writable: false,
    value: element,
  })
  element.dispatchEvent(changeEvent)

  // Verify the change
  const currentValue = element.value
  const verified = currentValue === params.value

  return { 
    success: true, 
    message: verified
      ? `Selected "${params.value}" in ${params.ref}. Value confirmed.`
      : `Attempted to select "${params.value}" in ${params.ref}. Current value: "${currentValue}"`,
    verified,
    previousValue,
    currentValue,
  }
}

/**
 * Clear an input element
 */
function handleClear(refMap: Map<string, Element>, params: ActionParams): ActionResult {
  if (!params.ref) {
    return { success: false, message: "Missing ref parameter for clear action" }
  }

  const element = refMap.get(params.ref)
  if (!element) {
    return { success: false, message: `Element not found: ${params.ref}` }
  }

  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
    return { success: false, message: `Element ${params.ref} is not a text input` }
  }

  // Clear the value
  element.value = ""

  // Dispatch input and change events for React/frameworks
  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))

  return { success: true, message: `Cleared ${params.ref}` }
}
