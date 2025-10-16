"use client"
import type React from "react"
import { CheckCircle2 } from "lucide-react"

interface ChecklistItemProps {
  checked: boolean
  label: string
}

export function ChecklistItem({ checked, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
      ) : (
        <div className="size-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
      )}
      <span className={`text-sm ${checked ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
    </div>
  )
}