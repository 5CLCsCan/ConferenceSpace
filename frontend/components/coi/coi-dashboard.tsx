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
import { typography, spacing, iconSizes } from "@/lib/typography"

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
    <div className={spacing.subsection}>
      {/* Header */}
      <div>
        <h1 className={`${typography.h1} text-foreground mb-2`}>{t("coi.dashboard.title")}</h1>
        <p className={typography.muted}>{t("coi.dashboard.description")}</p>
      </div>

      {/* Overview Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-4 ${spacing.gap.md}`}>
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2`}>
            <CardTitle className={`${typography.body} ${typography.medium}`}>
              {t("coi.dashboard.stats.totalReviewers")}
            </CardTitle>
            <Users className={`${iconSizes.sm} text-muted-foreground`} />
          </CardHeader>
          <CardContent>
            <div className={typography.stats}>{stats.total_reviewers}</div>
            <p className={`${typography.bodySmall} text-muted-foreground mt-1`}>
              {t("coi.dashboard.stats.available")} ({stats.available_reviewers})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2`}>
            <CardTitle className={`${typography.body} ${typography.medium}`}>
              {t("coi.dashboard.stats.totalPapers")}
            </CardTitle>
            <FileText className={`${iconSizes.sm} text-muted-foreground`} />
          </CardHeader>
          <CardContent>
            <div className={typography.stats}>{stats.total_papers}</div>
            <p className={`${typography.bodySmall} text-muted-foreground mt-1`}>
              {t("coi.dashboard.stats.underReview")} ({stats.papers_under_review})
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowAllRelationships(true)}
        >
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2`}>
            <CardTitle className={`${typography.body} ${typography.medium}`}>
              {t("coi.dashboard.stats.coiDetected")}
            </CardTitle>
            <AlertTriangle className={`${iconSizes.sm} text-destructive`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`${typography.stats} text-destructive`}>
                  {stats.coi_detected}
                </div>
                <p className={`${typography.bodySmall} text-muted-foreground mt-1`}>
                  {t("coi.dashboard.stats.relationships")} ({stats.total_relationships})
                </p>
              </div>
              <ExternalLink className={`${iconSizes.sm} text-muted-foreground`} />
            </div>
            <p className={`${typography.bodySmall} text-primary mt-2 ${typography.medium}`}>
              {t("coi.dashboard.stats.viewAll")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2`}>
            <CardTitle className={`${typography.body} ${typography.medium}`}>
              {t("coi.dashboard.stats.assignments")}
            </CardTitle>
            <UserCheck className={`${iconSizes.sm} text-muted-foreground`} />
          </CardHeader>
          <CardContent>
            <div className={typography.stats}>{stats.total_assignments}</div>
            <p className={`${typography.bodySmall} text-muted-foreground mt-1`}>
              {t("coi.dashboard.stats.completed")} ({stats.completed_assignments})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className={spacing.subsection}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assign">{t("coi.dashboard.tabs.assignReviewer")}</TabsTrigger>
          <TabsTrigger value="reviewer-author">
            {t("coi.dashboard.tabs.reviewerToAuthor")}
          </TabsTrigger>
          <TabsTrigger value="reviewer-paper">
            {t("coi.dashboard.tabs.reviewerToPaper")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className={spacing.subsection}>
          <AssignReviewerFlow />
        </TabsContent>

        <TabsContent value="reviewer-author" className={spacing.subsection}>
          <ReviewerToAuthorCOI />
        </TabsContent>

        <TabsContent value="reviewer-paper" className={spacing.subsection}>
          <ReviewerToPaperCOI />
        </TabsContent>
      </Tabs>

      {/* All COI Relationships Dialog */}
      <AllCOIRelationships open={showAllRelationships} onOpenChange={setShowAllRelationships} />
    </div>
  )
}
