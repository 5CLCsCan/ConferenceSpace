"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { ArrowLeft, Inbox, Search } from "lucide-react"
import type { AssignedPaper } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing } from "@/lib/typography"

interface ConferencePapersProps {
  papers: AssignedPaper[]
  conferenceName: string
  onBack: () => void
  onSelectPaper: (paperId: string) => void
  onReviewSubmitted?: () => void
}

export function ConferencePapers({
  papers,
  conferenceName,
  onBack,
  onSelectPaper,
  onReviewSubmitted,
}: ConferencePapersProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filter papers based on search and status
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || paper.assignment_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [papers, searchQuery, statusFilter])

  const renderStatusBadge = useCallback(
    (status: string) => {
      const isPending = status === "pending"
      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            isPending ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
          }`}
        >
          {t(`dashboard.roles.reviewer.papers.statusValues.${status}`)}
        </span>
      )
    },
    [t],
  )

  const columns = useMemo<DataTableColumn<AssignedPaper>[]>(
    () => [
      {
        key: "title",
        label: t("dashboard.roles.reviewer.papers.table.title"),
        render: (paper) => <span className="font-medium">{paper.title}</span>,
      },
      {
        key: "assignment_status",
        label: t("dashboard.roles.reviewer.papers.table.status"),
        width: "w-32",
        render: (paper) => renderStatusBadge(paper.assignment_status),
        mobileLabel: t("dashboard.roles.reviewer.papers.table.status"),
      },
      {
        key: "due_date",
        label: t("dashboard.roles.reviewer.papers.table.deadline"),
        width: "w-36",
        render: (paper) => (paper.due_date ? new Date(paper.due_date).toLocaleDateString() : "-"),
        mobileLabel: t("dashboard.roles.reviewer.papers.table.deadline"),
      },
    ],
    [t, renderStatusBadge],
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <CardTitle>{conferenceName}</CardTitle>
            <CardDescription>
              {t("dashboard.roles.reviewer.papers.description", {
                count: papers.length,
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder={t("dashboard.roles.reviewer.papers.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("dashboard.roles.reviewer.papers.filter.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.roles.reviewer.papers.filter.all")}</SelectItem>
              <SelectItem value="pending">
                {t("dashboard.roles.reviewer.papers.statusValues.pending")}
              </SelectItem>
              <SelectItem value="in_progress">
                {t("dashboard.roles.reviewer.papers.statusValues.in_progress")}
              </SelectItem>
              <SelectItem value="completed">
                {t("dashboard.roles.reviewer.papers.statusValues.completed")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable<AssignedPaper>
          columns={columns}
          data={filteredPapers}
          loading={false}
          error={null}
          emptyMessage={
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="rounded-full bg-muted p-6">
                <Inbox className="size-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className={`text-lg ${typography.semibold}`}>
                  {searchQuery || statusFilter !== "all"
                    ? t("dashboard.roles.reviewer.papers.search.noResults")
                    : t("dashboard.roles.reviewer.papers.empty.title")}
                </h3>
                <p className={`${typography.body} text-muted-foreground max-w-md`}>
                  {searchQuery || statusFilter !== "all"
                    ? t("dashboard.roles.reviewer.papers.search.noResultsDescription")
                    : t("dashboard.roles.reviewer.papers.empty.description")}
                </p>
              </div>
            </div>
          }
          getRowKey={(paper) => paper.id}
          onRowClick={(paper) => onSelectPaper(paper.assignment_id.toString())}
          renderMobileCard={(paper) => (
            <div className={spacing.padding.card}>
              <div className={`${typography.medium} mb-2`}>{paper.title}</div>
              <div
                className={`flex flex-col ${spacing.gap.sm} ${typography.body} text-muted-foreground`}
              >
                <div>
                  {t("dashboard.roles.reviewer.papers.table.status")}:{" "}
                  {renderStatusBadge(paper.assignment_status)}
                </div>
                <div>
                  {t("dashboard.roles.reviewer.papers.table.deadline")}:{" "}
                  {paper.due_date ? new Date(paper.due_date).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
