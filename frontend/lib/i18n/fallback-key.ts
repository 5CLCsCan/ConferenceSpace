export function humanizeTranslationFallback(path: string): string {
  if (typeof path !== "string" || path.trim().length === 0) {
    return ""
  }

  const lastSegment = path.split(".").pop() ?? path
  const normalized = lastSegment
    .replace(/_apos_/g, "'")
    .replace(/_rarr\b/g, " ->")
    .replace(/_larr\b/g, " <-")
    .replace(
      /^(text|title|label|placeholder|message|description|tooltip|hint|caption|button|heading|aria_label|prop_text|prop_title|prop_label|prop_description|prop_placeholder|prop_message|prop_)/,
      "",
    )
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) {
    return path
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
