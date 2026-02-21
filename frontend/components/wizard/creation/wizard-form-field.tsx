"use client"

import { ReactNode, InputHTMLAttributes } from "react"

interface WizardFormFieldProps {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export function WizardFormField({ label, required = false, hint, children }: WizardFormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <p className="text-[10px] text-slate-400 font-light">{hint}</p>}
    </div>
  )
}

interface WizardInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  halfWidth?: boolean
}

export function WizardInput({
  icon,
  halfWidth = false,
  className = "",
  ...props
}: WizardInputProps) {
  const baseClasses =
    "h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
  const widthClass = halfWidth ? "w-full md:w-1/2" : "w-full"
  const paddingClass = icon ? "pl-[34px] pr-3.5" : "px-3.5"

  if (icon) {
    return (
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 text-slate-400"
          style={{
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            lineHeight: "16px",
          }}
        >
          {icon}
        </span>
        <input className={`${baseClasses} ${widthClass} ${paddingClass} ${className}`} {...props} />
      </div>
    )
  }

  return (
    <input className={`${baseClasses} ${widthClass} ${paddingClass} ${className}`} {...props} />
  )
}
