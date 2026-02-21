"use client"

import { confidenceOptions } from "./types"

// =============================================================================
// Confidence Radio Component
// =============================================================================

interface ConfidenceRadioProps {
  value: number
  onChange: (value: number) => void
}

export function ConfidenceRadio({ value, onChange }: ConfidenceRadioProps) {
  return (
    <div className="space-y-3">
      {confidenceOptions.map((option) => (
        <div key={option.value} className="flex items-center">
          <input
            type="radio"
            id={`conf-${option.value}`}
            name="confidence"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="w-4 h-4 text-[#2563eb] bg-slate-100 border-slate-300 focus:ring-[#2563eb]"
          />
          <label htmlFor={`conf-${option.value}`} className="ml-2 text-sm text-slate-700">
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}
