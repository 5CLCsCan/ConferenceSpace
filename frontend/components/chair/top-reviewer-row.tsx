interface TopReviewerRowProps {
  name: string
  affiliation: string
  completedReviews: number
  isLast?: boolean
}

export function TopReviewerRow({ name, affiliation, completedReviews, isLast }: TopReviewerRowProps) {
  return (
    <div className={`py-4 ${!isLast ? "border-b border-border" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground text-sm">{name}</h4>
          <p className="text-sm text-muted-foreground">{affiliation}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{completedReviews}</p>
          <p className="text-xs text-muted-foreground">reviews</p>
        </div>
      </div>
    </div>
  )
}
