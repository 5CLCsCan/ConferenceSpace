"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Download,
  Edit,
  Calendar,
  User,
  FileText,
  Tag,
  Link as LinkIcon,
  Eye,
  AlertTriangle,
  FileCheck,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { Submission } from "@/lib/api/submissions"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface SubmissionDetailViewProps {
  submission: Submission
  conferenceId: string
}

export function SubmissionDetailView({ submission, conferenceId }: SubmissionDetailViewProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAuthor = user?.email === submission.author
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: {
        label: t("dashboard.submissions.status.draft"),
        className: "bg-yellow-100 text-yellow-800",
      },
      published: {
        label: t("dashboard.submissions.status.published"),
        className: "bg-blue-100 text-blue-800",
      },
    }

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    }

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const fileUrl = submission.file
    ? `/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/file`
    : null

  const isPdfFile =
    submission.file?.mime_type === "application/pdf" ||
    submission.file?.original_name?.toLowerCase().endsWith(".pdf")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              {t("common.actions.back", "Quay lại")}
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            {getStatusBadge(submission.status)}
          </div>
          <h1 className="text-3xl font-bold mb-2">{submission.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {t("dashboard.submission.details.author", "Author")}: {submission.author}
          </p>
        </div>
        <div className="flex gap-2">
          {isAuthor && submission.status === "draft" && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/author/submit?conference=${conferenceId}&edit=${submission.id}`}
              >
                <Edit className="size-4 mr-2" />
                {t("common.actions.edit", "Chỉnh sửa")}
              </Link>
            </Button>
          )}
          {submission.file && (
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl || ""} download={submission.file.original_name}>
                <Download className="size-4 mr-2" />
                {t("common.actions.download", "Tải xuống")}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-auto border border-border rounded-lg gap-1">
          <TabsTrigger 
            value="overview"
            className="rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 text-sm font-medium transition-all hover:bg-background/50 hover:text-foreground"
          >
            {t("dashboard.submission.tabs.overview", "Overview")}
          </TabsTrigger>
          <TabsTrigger 
            value="preview"
            className="rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 text-sm font-medium transition-all hover:bg-background/50 hover:text-foreground"
          >
            <Eye className="size-4 mr-2" />
            {t("dashboard.submission.tabs.preview", "Preview")}
          </TabsTrigger>
          <TabsTrigger 
            value="coi"
            className="rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 text-sm font-medium transition-all hover:bg-background/50 hover:text-foreground"
          >
            <AlertTriangle className="size-4 mr-2" />
            {t("dashboard.submission.tabs.coi", "COI")}
          </TabsTrigger>
          <TabsTrigger 
            value="cover-letter"
            className="rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-2.5 text-sm font-medium transition-all hover:bg-background/50 hover:text-foreground"
          >
            <FileCheck className="size-4 mr-2" />
            {t("dashboard.submission.tabs.coverLetter", "Cover Letter")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Overview Content - Single Column Layout */}
          <div className="space-y-6">
          {/* Abstract */}
          {submission.abstract && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dashboard.submission.details.abstract", "Tóm tắt")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {submission.abstract}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submission Details */}
          <Card className="py-6">
            <CardHeader>
              <CardTitle>{t("dashboard.submission.details.title", "Chi tiết bài nộp")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {t("dashboard.submission.details.author", "Tác giả")}
                  </div>
                  <div className="text-sm break-all">{submission.author}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {t("dashboard.submission.details.submittedDate", "Ngày nộp")}
                  </div>
                  <div className="text-sm">{formatDate(submission.created_at)}</div>
                </div>
              </div>

              {submission.updated_at !== submission.created_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {t("dashboard.submission.details.lastUpdated", "Cập nhật lần cuối")}
                    </div>
                    <div className="text-sm">{formatDate(submission.updated_at)}</div>
                  </div>
                </div>
              )}

              {submission.link && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {t("dashboard.submission.details.link", "Liên kết")}
                    </div>
                    <a
                      href={submission.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all block"
                    >
                      {submission.link}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Information */}
          {submission.file && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="size-4" />
                  {t("dashboard.submission.details.file", "File đính kèm")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {t("dashboard.submission.details.fileName", "Tên file")}
                  </div>
                  <div className="text-sm break-all">{submission.file.original_name}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {t("dashboard.submission.details.fileSize", "Kích thước")}
                  </div>
                  <div className="text-sm">
                    {(submission.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {t("dashboard.submission.details.fileType", "Loại file")}
                  </div>
                  <div className="text-sm">{submission.file.mime_type}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Domains */}
          {submission.domain && submission.domain.length > 0 && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="size-4" />
                  {t("dashboard.submission.details.domains", "Lĩnh vực")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {submission.domain.map((domain) => (
                    <Badge key={domain} variant="secondary" className="text-xs">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Keywords */}
          {submission.information?.keywords && submission.information.keywords.length > 0 && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dashboard.submission.details.keywords", "Từ khóa")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {submission.information.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Co-authors */}
          {submission.information?.co_authors && submission.information.co_authors.length > 0 && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dashboard.submission.details.coAuthors", "Đồng tác giả")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {submission.information.co_authors.map((email, index) => (
                    <li key={index} className="text-sm break-all">
                      {email}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Track and Paper Type */}
          {(submission.information?.track_name || submission.information?.paper_type) && (
            <Card className="py-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dashboard.submission.details.additionalInfo", "Thông tin bổ sung")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.information.track_name && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {t("dashboard.submission.details.track", "Track")}
                    </div>
                    <div className="text-sm">{submission.information.track_name}</div>
                  </div>
                )}

                {submission.information.paper_type && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {t("dashboard.submission.details.paperType", "Loại bài")}
                    </div>
                    <div className="text-sm">{submission.information.paper_type}</div>
                  </div>
                )}

                {submission.information.additional_notes && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {t("dashboard.submission.details.notes", "Ghi chú bổ sung")}
                    </div>
                    <div className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {submission.information.additional_notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {submission.information?.metadata &&
            Object.keys(submission.information.metadata).length > 0 && (
              <Card className="py-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("dashboard.submission.details.metadata", "Metadata")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    {Object.entries(submission.information.metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, " ")}
                        </dt>
                        <dd className="text-sm">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6 mt-4">
          {fileUrl ? (
            <Card className="h-[calc(100vh-12rem)] flex flex-col p-0 gap-0 overflow-hidden rounded-lg">
              <CardContent className="p-0 h-full flex-1 overflow-hidden rounded-lg">
                {isPdfFile ? (
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0 rounded-lg"
                    title={submission.file?.original_name || "Document Preview"}
                    allow="fullscreen"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <FileText className="size-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {t(
                        "dashboard.submission.details.previewNotAvailable",
                        "Xem trước không khả dụng",
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {t(
                        "dashboard.submission.details.downloadToView",
                        "Vui lòng tải xuống để xem file",
                      )}
                    </p>
                    <Button variant="default" asChild>
                      <a href={fileUrl} download={submission.file?.original_name}>
                        <Download className="size-4 mr-2" />
                        {t("common.actions.download", "Tải xuống")}
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="py-6">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="size-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {t("dashboard.submission.details.noFile", "Không có file đính kèm")}
                </p>
                {submission.link && (
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2 mt-4"
                  >
                    <LinkIcon className="size-4" />
                    {t("dashboard.submission.details.viewExternalLink", "Xem liên kết ngoài")}
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* COI Tab */}
        <TabsContent value="coi" className="space-y-6 mt-4">
          <Card className="py-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5" />
                {t("dashboard.submission.tabs.coi", "Conflict of Interest")}
              </CardTitle>
              <CardDescription>
                {t(
                  "dashboard.submission.coi.description",
                  "Conflicts of interest declared for this submission",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.submission.coi.notAvailable", "COI information not available")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cover Letter Tab */}
        <TabsContent value="cover-letter" className="space-y-6 mt-4">
          {submission.cover_letter ? (
            <div className="space-y-6">
              {/* Cover Letter File Information */}
              <Card className="py-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileCheck className="size-4" />
                    {t("dashboard.submission.details.coverLetterFile", "Cover Letter")}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "dashboard.submission.details.coverLetterDescription",
                      "Supporting document for your submission",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {t("dashboard.submission.details.fileName", "File Name")}
                    </div>
                    <div className="text-sm break-all">{submission.cover_letter.original_name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        {t("dashboard.submission.details.fileSize", "File Size")}
                      </div>
                      <div className="text-sm">
                        {(submission.cover_letter.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        {t("dashboard.submission.details.fileType", "File Type")}
                      </div>
                      <div className="text-sm">{submission.cover_letter.mime_type}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="default" asChild>
                      <a
                        href={`/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/cover_letter`}
                        download={submission.cover_letter.original_name}
                      >
                        <Download className="size-4 mr-2" />
                        {t("common.actions.download", "Download")}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Cover Letter */}
              {submission.cover_letter.mime_type === "application/pdf" && (
                <Card className="h-[calc(100vh-20rem)] flex flex-col p-0 gap-0 overflow-hidden rounded-lg">
                  <CardContent className="p-0 h-full flex-1 overflow-hidden rounded-lg">
                    <iframe
                      src={`/api/backend/api/v1/conferences/${conferenceId}/submissions/${submission.id}/cover_letter#toolbar=1&navpanes=0`}
                      className="w-full h-full border-0 rounded-lg"
                      title={submission.cover_letter.original_name || "Cover Letter Preview"}
                      allow="fullscreen"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="py-6">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileCheck className="size-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {t("dashboard.submission.details.noCoverLetter", "No cover letter attached")}
                </p>
                <p className="text-sm text-gray-500">
                  {t(
                    "dashboard.submission.details.coverLetterOptional",
                    "Cover letter is optional for this submission",
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
