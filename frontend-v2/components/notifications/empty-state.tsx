"use client"

import { BellOff } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-200/50 dark:border-neutral-700/50">
        <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
        You&apos;re all caught up!
      </h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
        No new notifications at the moment. Check back later for updates on your submissions and
        reviews.
      </p>
    </div>
  )
}
