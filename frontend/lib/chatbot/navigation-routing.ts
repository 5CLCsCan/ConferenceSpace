import {
  CHATBOT_NAVIGATION_SITEMAP,
  getNavigationDestination,
  type NavigationDestination,
} from "@/lib/chatbot/navigation-sitemap"

export interface ResolvedCurrentNavigation {
  destinationId: string | null
  matchStatus: "matched" | "unmapped"
  params: Record<string, string>
}

export function resolveCurrentNavigation({
  pathname,
  searchParams,
}: {
  pathname: string
  searchParams: URLSearchParams
}): ResolvedCurrentNavigation {
  for (const destination of getDestinationsForMatching()) {
    const pathParams = matchPathTemplate(destination.pathTemplate, pathname)
    if (!pathParams) {
      continue
    }

    const queryParams = extractDeclaredQueryParams(destination, searchParams)
    return {
      destinationId: destination.id,
      matchStatus: "matched",
      params: {
        ...pathParams,
        ...queryParams,
      },
    }
  }

  return {
    destinationId: null,
    matchStatus: "unmapped",
    params: {},
  }
}

export function buildNavigationPath(
  destinationId: string,
  params: Record<string, string>,
): string {
  const destination = getNavigationDestination(destinationId)
  if (!destination) {
    throw new Error(`Unknown destinationId: ${destinationId}`)
  }

  const missing = destination.requiredParams.filter((param) => !normalizeParamValue(params[param]))
  if (missing.length > 0) {
    throw new Error(`Missing required params for ${destinationId}: ${missing.join(", ")}`)
  }

  let path = destination.pathTemplate
  for (const requiredParam of destination.requiredParams) {
    if (destination.paramLocations[requiredParam] !== "path") {
      continue
    }
    path = path.replace(`:${requiredParam}`, encodeURIComponent(params[requiredParam]))
  }

  if (path.includes(":")) {
    throw new Error(`Unresolved path params for ${destinationId}: ${path}`)
  }

  const queryParams = new URLSearchParams()
  for (const optionalParam of destination.optionalParams) {
    if (destination.paramLocations[optionalParam] !== "query") {
      continue
    }
    const value = normalizeParamValue(params[optionalParam])
    if (value) {
      queryParams.set(optionalParam, value)
    }
  }

  const query = queryParams.toString()
  return query ? `${path}?${query}` : path
}

function getDestinationsForMatching(): NavigationDestination[] {
  return [...CHATBOT_NAVIGATION_SITEMAP.destinations].sort((left, right) => {
    const dynamicDelta =
      countDynamicSegments(left.pathTemplate) - countDynamicSegments(right.pathTemplate)
    if (dynamicDelta !== 0) {
      return dynamicDelta
    }

    return right.pathTemplate.length - left.pathTemplate.length
  })
}

function matchPathTemplate(
  pathTemplate: string,
  pathname: string,
): Record<string, string> | null {
  const templateSegments = splitPath(pathTemplate)
  const pathSegments = splitPath(pathname)

  if (templateSegments.length !== pathSegments.length) {
    return null
  }

  const params: Record<string, string> = {}
  for (let index = 0; index < templateSegments.length; index += 1) {
    const templateSegment = templateSegments[index]
    const pathSegment = pathSegments[index]

    if (!templateSegment || !pathSegment) {
      return null
    }

    if (templateSegment.startsWith(":")) {
      params[templateSegment.slice(1)] = decodeURIComponent(pathSegment)
      continue
    }

    if (templateSegment !== pathSegment) {
      return null
    }
  }

  return params
}

function splitPath(pathname: string): string[] {
  return pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function countDynamicSegments(pathTemplate: string): number {
  return splitPath(pathTemplate).filter((segment) => segment.startsWith(":")).length
}

function extractDeclaredQueryParams(
  destination: NavigationDestination,
  searchParams: URLSearchParams,
): Record<string, string> {
  const params: Record<string, string> = {}
  for (const optionalParam of destination.optionalParams) {
    if (destination.paramLocations[optionalParam] !== "query") {
      continue
    }
    const value = normalizeParamValue(searchParams.get(optionalParam))
    if (value) {
      params[optionalParam] = value
    }
  }
  return params
}

function normalizeParamValue(value: string | null | undefined): string {
  return String(value ?? "").trim()
}
