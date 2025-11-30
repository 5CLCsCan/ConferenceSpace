"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Users, FileText, UserCheck } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getCOIDashboardStats } from "@/lib/api/coi-mock"
import { COIAnalysisDashboard } from "./coi-analysis-dashboard"

interface COIDashboardProps {
  conferenceId: string
}

export function COIDashboard({ conferenceId }: COIDashboardProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    conference_id: "",
    total_reviewers: 0,
    available_reviewers: 0,
    total_papers: 0,
    papers_under_review: 0,
    coi_detected: 0,
    total_relationships: 0,
    total_assignments: 0,
    completed_assignments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [conferenceId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const result = await getCOIDashboardStats(conferenceId)
      if (result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("Failed to load COI dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.actions.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Analysis Dashboard */}
      <COIAnalysisDashboard conferenceId={conferenceId} stats={stats} />
    </div>
  )
}

interface StatsCardProps {
  label: string
  value: string | number
  sublabel: string
  icon: React.ElementType
  highlight?: "destructive" | "warning"
}

function StatsCard({ label, value, sublabel, icon: Icon, highlight }: StatsCardProps) {
  const highlightClass =
    highlight === "destructive"
      ? "text-destructive"
      : highlight === "warning"
        ? "text-amber-500"
        : "text-muted-foreground"

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${highlightClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      </CardContent>
    </Card>
  )
}
