import type { TabType } from "./types"

interface EmptyStateProps {
  type: TabType
}

const content: Record<TabType, { icon: string; title: string; description: string }> = {
  "my-conferences": {
    icon: "folder_open",
    title: "No conferences yet",
    description: "Create your first conference to get started managing submissions and reviews.",
  },
  explore: {
    icon: "explore",
    title: "No conferences to explore",
    description: "There are no public conferences available at this time.",
  },
  archived: {
    icon: "archive",
    title: "No archived conferences",
    description: "Completed conferences will appear here for your reference.",
  },
}

export function EmptyState({ type }: EmptyStateProps) {
  const { icon, title, description } = content[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center max-w-xs">{description}</p>
    </div>
  )
}

export function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <span className="material-symbols-outlined text-[28px] text-slate-300 mb-2">search_off</span>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1 tracking-tight">
        No results found
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center">
        Try adjusting your search terms
      </p>
    </div>
  )
}
