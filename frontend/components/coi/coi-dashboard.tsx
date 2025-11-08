"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewerToAuthorCOI } from "./reviewer-to-author-coi"
import { ReviewerToPaperCOI } from "./reviewer-to-paper-coi"
import { AssignReviewerFlow } from "./assign-reviewer-flow"
import { AllCOIRelationships } from "./all-coi-relationships"
import { AlertTriangle, Users, FileText, UserCheck, ExternalLink } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getCOIDashboardStats } from "@/lib/api/coi-mock"

export function COIDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("assign")
  const [showAllRelationships, setShowAllRelationships] = useState(false)
  const [stats, setStats] = useState({
    total_reviewers: 0,
    available_reviewers: 0,
    total_papers: 0,
    papers_under_review: 0,
    coi_detected: 0,
    total_relationships: 0,
    total_assignments: 0,
    completed_assignments: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const result = await getCOIDashboardStats()
      if (result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("Failed to load COI dashboard stats:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("coi.dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("coi.dashboard.description")}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.totalReviewers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_reviewers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.available")} ({stats.available_reviewers})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.totalPapers")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_papers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.underReview")} ({stats.papers_under_review})
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowAllRelationships(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.coiDetected")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-destructive">{stats.coi_detected}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("coi.dashboard.stats.relationships")} ({stats.total_relationships})
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-primary mt-2 font-medium">
              {t("coi.dashboard.stats.viewAll")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.assignments")}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_assignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.completed")} ({stats.completed_assignments})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assign">{t("coi.dashboard.tabs.assignReviewer")}</TabsTrigger>
          <TabsTrigger value="reviewer-author">
            {t("coi.dashboard.tabs.reviewerToAuthor")}
          </TabsTrigger>
          <TabsTrigger value="reviewer-paper">
            {t("coi.dashboard.tabs.reviewerToPaper")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-4">
          <AssignReviewerFlow />
        </TabsContent>

        <TabsContent value="reviewer-author" className="space-y-4">
          <ReviewerToAuthorCOI />
        </TabsContent>

        <TabsContent value="reviewer-paper" className="space-y-4">
          <ReviewerToPaperCOI />
        </TabsContent>
      </Tabs>

      {/* All COI Relationships Dialog */}
      <AllCOIRelationships open={showAllRelationships} onOpenChange={setShowAllRelationships} />
    </div>
  )
}
