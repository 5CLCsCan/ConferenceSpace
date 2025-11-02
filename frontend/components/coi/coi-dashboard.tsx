"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewerToAuthorCOI } from "./reviewer-to-author-coi"
import { ReviewerToPaperCOI } from "./reviewer-to-paper-coi"
import { AssignReviewerFlow } from "./assign-reviewer-flow"
import { AlertTriangle, Users, FileText, UserCheck } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

export function COIDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("assign")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("coi.dashboard.title") || "Conflict of Interest (COI) Analysis"}
        </h1>
        <p className="text-muted-foreground">
          {t("coi.dashboard.description") ||
            "Manage reviewer assignments with comprehensive COI checking and relationship analysis"}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.totalReviewers") || "Total Reviewers"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.available") || "4 available"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.totalPapers") || "Total Papers"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.underReview") || "3 under review"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.coiDetected") || "COI Detected"}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.relationships") || "12 relationships"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("coi.dashboard.stats.assignments") || "Assignments"}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("coi.dashboard.stats.completed") || "8 completed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assign">
            {t("coi.dashboard.tabs.assignReviewer") || "Assign Reviewer"}
          </TabsTrigger>
          <TabsTrigger value="reviewer-author">
            {t("coi.dashboard.tabs.reviewerToAuthor") || "Reviewer → Author"}
          </TabsTrigger>
          <TabsTrigger value="reviewer-paper">
            {t("coi.dashboard.tabs.reviewerToPaper") || "Reviewer → Paper"}
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
    </div>
  )
}

