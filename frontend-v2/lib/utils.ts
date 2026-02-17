import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to readable string
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format date with time
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Calculate days until deadline
export function daysUntilDeadline(deadlineString: string): number {
  const deadline = new Date(deadlineString)
  const now = new Date()
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Get status color
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: "text-muted-foreground",
    submitted: "text-info",
    under_review: "text-warning",
    revision_requested: "text-warning",
    accepted: "text-success",
    rejected: "text-destructive",
    camera_ready: "text-success",
    pending: "text-muted-foreground",
    in_progress: "text-info",
    completed: "text-success",
  }
  return statusColors[status] || "text-foreground"
}

// Get status badge variant
export function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    submitted: "secondary",
    under_review: "default",
    revision_requested: "default",
    accepted: "default",
    rejected: "destructive",
    camera_ready: "default",
    pending: "outline",
    in_progress: "secondary",
    completed: "default",
  }
  return statusVariants[status] || "default"
}

// Calculate average score
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round((sum / scores.length) * 10) / 10
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}
