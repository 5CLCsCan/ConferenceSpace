"use client"
import type React from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { typography } from "@/lib/typography"

interface ChecklistItemProps {
  checked: boolean
  label: string
}

export function ChecklistItem({ checked, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="size-5 text-green-600 flex-shrink-0" />
      ) : (
        <Circle className="size-5 text-[#ADB5BD] flex-shrink-0" />
      )}
      <span
        className={`${typography.bodySmall} font-arial ${
          checked ? "text-[#212529]" : "text-[#6C757D]"
        }`}
      >
        {label}
      </span>
    </div>
  )
}
