import type { ConferenceStatus } from "./types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: ConferenceStatus
}

const styles: Record<ConferenceStatus, string> = {
  active: "badge-semantic-success",
  planning: "badge-neutral text-[var(--color-primary-ink)]",
  draft: "badge-neutral",
  completed: "badge-neutral",
}

const labels: Record<ConferenceStatus, string> = {
  active: "Active",
  planning: "Planning",
  draft: "Draft",
  completed: "Completed",
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={cn("text-tiny-label", styles[status])}>{labels[status]}</span>
}
