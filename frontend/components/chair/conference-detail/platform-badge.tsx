"use client"

import { cn } from "@/lib/utils"

export function BadgeIcon({
  name,
  size = 16,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {name}
    </span>
  )
}

export function PlatformBadge({
  onPlatform,
  T,
}: {
  onPlatform: boolean
  T: (key: string) => string
}) {
  if (onPlatform) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
        <BadgeIcon name="verified_user" size={11} />
        {T("text_on_platform")}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
      <BadgeIcon name="mail" size={11} />
      {T("text_not_on_platform")}
    </span>
  )
}
