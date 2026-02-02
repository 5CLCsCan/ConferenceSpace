"use client"

interface WizardHeaderProps {
  title: string
  description: string
  breadcrumbs?: string[]
  showAutosave?: boolean
  autosaveStatus?: "saving" | "saved" | "error"
}

export function WizardHeader({
  title,
  description,
  breadcrumbs = ["Conferences", "Create New"],
  showAutosave = true,
  autosaveStatus = "saving",
}: WizardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
      <div className="flex flex-col gap-1">
        {/* Title */}
        <h1 className="text-[#141414] dark:text-white text-[32px] font-bold tracking-tight leading-[1.1]">
          {title}
        </h1>

        {/* Description */}
        <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 max-w-xl">
          {description}
        </p>
      </div>

      {/* Autosave Indicator */}
      {showAutosave && (
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
          <div
            className={`size-1.5 rounded-full ${
              autosaveStatus === "saving"
                ? "bg-green-500 animate-pulse"
                : autosaveStatus === "saved"
                  ? "bg-green-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {autosaveStatus === "saving"
              ? "Autosaving..."
              : autosaveStatus === "saved"
                ? "Saved"
                : "Error"}
          </span>
        </div>
      )}
    </div>
  )
}
