import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface PlatformMetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: string
}

export function PlatformMetricCard({ title, value, icon: Icon, trend }: PlatformMetricCardProps) {
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  )
}
