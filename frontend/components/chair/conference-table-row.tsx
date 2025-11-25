import { useRouter } from "next/navigation"
import { typography, spacing } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceTableRowProps {
  id: string
  name: string
  acronym: string
  dates: string
  status: "open" | "reviewing" | "completed"
  submissions: number
}

export function ConferenceTableRow({
  id,
  name,
  acronym,
  dates,
  status,
  submissions,
}: ConferenceTableRowProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const statusStyles = {
    open: "bg-success/10 text-success",
    reviewing: "bg-primary/10 text-primary",
    completed: "bg-secondary/10 text-secondary",
  }

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4">
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/dashboard/conference/${id}`)}
        >
          <div className={`${typography.semibold} text-foreground`}>{name}</div>
          <div className={`${typography.body} text-muted-foreground`}>{acronym}</div>
        </div>
      </td>
      <td className={`py-3 px-4 ${typography.body} text-foreground`}>{dates}</td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full ${typography.bodySmall} ${typography.medium} ${statusStyles[status]}`}
        >
          {t(`common.conferenceStatus.${status}`)}
        </span>
      </td>
      <td className={`py-3 px-4 ${typography.body} text-foreground`}>{submissions}</td>
    </tr>
  )
}

export function ConferenceCard({
  id,
  name,
  acronym,
  dates,
  status,
  submissions,
}: ConferenceTableRowProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const statusStyles = {
    open: "bg-success/10 text-success",
    reviewing: "bg-primary/10 text-primary",
    completed: "bg-secondary/10 text-secondary",
  }

  return (
    <div className={`mb-4 ${spacing.padding.card} bg-card border border-border rounded-lg shadow-sm`}>
      <div className={`flex items-start justify-between mb-3`}>
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/dashboard/conference/${id}`)}
        >
          <h3 className={`${typography.semibold} text-foreground`}>{name}</h3>
          <p className={`${typography.body} text-muted-foreground`}>{acronym}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full ${typography.bodySmall} ${typography.medium} ${statusStyles[status]}`}
        >
          {t(`common.conferenceStatus.${status}`)}
        </span>
      </div>
      <div className={`${spacing.item} mb-4`}>
        <div className={`flex items-center justify-between ${typography.body}`}>
          <span className="text-muted-foreground">Dates:</span>
          <span className="text-foreground">{dates}</span>
        </div>
        <div className={`flex items-center justify-between ${typography.body}`}>
          <span className="text-muted-foreground">Submissions:</span>
          <span className="text-foreground">{submissions}</span>
        </div>
      </div>
    </div>
  )
}
