export function getProfileInitials(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function stringToColor(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash)
  }

  const color = (hash & 0x00ffffff).toString(16).toUpperCase()
  return `#${"000000".slice(color.length)}${color}`
}

export function getProfileGradient(seed: string): string {
  const safeSeed = seed || "profile"
  const start = stringToColor(safeSeed)
  const end = stringToColor(safeSeed.split("").reverse().join(""))
  return `radial-gradient(circle at 30% 30%, ${start} 0%, ${end} 100%)`
}
