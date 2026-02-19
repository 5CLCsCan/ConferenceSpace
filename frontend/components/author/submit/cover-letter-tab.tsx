"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileText, Upload, X, CheckCircle2, Info, Lightbulb, Download } from "lucide-react"
import { typography, spacing } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"
import { downloadCoverLetter } from "@/lib/api/papers"

interface CoverLetterTabProps {
  coverLetter: File | null
  setCoverLetter: (file: File | null) => void
  submissionId?: string
  conferenceId?: string
  existingCoverLetter?: {
    name: string
    size: number
    type: string
  }
}

export function CoverLetterTab({
  coverLetter,
  setCoverLetter,
  submissionId,
  conferenceId,
  existingCoverLetter,
}: CoverLetterTabProps) {
  const [dragActive, setDragActive] = useState(false)
  const { t, tList } = useTranslation()
  const includeList = tList("dashboard.author.submit.coverLetterTab.includeList")
  const tipsList = tList("dashboard.author.submit.coverLetterTab.tips")

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setCoverLetter(file)
      } else {
        alert("Please upload a PDF file")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setCoverLetter(file)
      } else {
        alert("Please upload a PDF file")
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleDownloadExistingCoverLetter = async () => {
    if (!submissionId || !conferenceId) {
      alert("Cannot download: missing submission or conference ID")
      return
    }

    try {
      const response = await downloadCoverLetter(submissionId, conferenceId)

      if (response.error || !response.data) {
        alert(`Download failed: ${response.error}`)
        return
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement("a")
      link.href = url
      link.download = response.filename || "cover_letter.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download cover letter")
    }
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className={spacing.item}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileText className="size-6 text-green-600" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-foreground font-arial`}>
              {t("dashboard.author.submit.coverLetterTab.title")}
            </h2>
            <p
              className={`${typography.body} text-muted-foreground font-arial ${spacing.margin.top.sm}`}
            >
              {t("dashboard.author.submit.coverLetterTab.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-success/10 border-success/25">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-success flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-muted-foreground font-arial`}>
              <p className={`${typography.medium} text-foreground mb-2`}>
                {t("dashboard.author.submit.coverLetterTab.includeTitle")}
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                {includeList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={`${typography.bodySmall} text-muted-foreground mt-2`}>
                {t("dashboard.author.submit.coverLetterTab.note")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Existing Cover Letter */}
      {!coverLetter && existingCoverLetter && (
        <Card className="bg-primary/5 border-primary/20">
          <div className={spacing.padding.card}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                <div className={`${typography.bodySmall} text-muted-foreground font-arial`}>
                  <p className={`${typography.medium} text-foreground mb-1`}>
                    {t("dashboard.author.submit.coverLetterTab.existingTitle")}
                  </p>
                  <p className="mb-2">
                    <strong>{existingCoverLetter.name}</strong> (
                    {formatFileSize(existingCoverLetter.size)})
                  </p>
                  <p className="text-muted-foreground">
                    {t("dashboard.author.submit.coverLetterTab.existingDescription")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExistingCoverLetter}
                className="flex-shrink-0"
              >
                <Download className="size-4 mr-2" />
                {t("common.actions.download")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Section */}
      <div className={spacing.item}>
        <Label className={`${typography.label} text-foreground font-arial`}>
          {t("dashboard.author.submit.coverLetterTab.uploadLabel")}
        </Label>

        {!coverLetter ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-accent"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="cover-letter-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Upload className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p
                  className={`${typography.bodyLarge} ${typography.medium} text-foreground font-arial mb-1`}
                >
                  {t("dashboard.author.submit.coverLetterTab.uploadTitle")}
                </p>
                <p className={`${typography.bodySmall} text-muted-foreground font-arial`}>
                  {t("dashboard.author.submit.coverLetterTab.uploadHint")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("cover-letter-upload")?.click()}
                className={`mx-auto border-primary text-primary hover:bg-primary/10 ${typography.body} ${typography.medium} font-arial`}
              >
                <Upload className="size-4 mr-2" />
                {t("dashboard.author.submit.coverLetterTab.chooseFile")}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-success/25 bg-success/10">
            <div className={spacing.padding.card}>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="size-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`${typography.body} ${typography.semibold} text-foreground font-arial truncate`}
                      >
                        {coverLetter.name}
                      </p>
                      <p
                        className={`${typography.bodySmall} text-muted-foreground font-arial mt-1`}
                      >
                        {t("dashboard.author.submit.coverLetterTab.uploadedDescription", {
                          size: formatFileSize(coverLetter.size),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCoverLetter(null)}
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="size-4 mr-1" />
                      {t("dashboard.author.submit.coverLetterTab.remove")}
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("cover-letter-upload")?.click()}
                      className={`border-primary text-primary hover:bg-primary/10 ${typography.bodySmall} font-arial`}
                    >
                      {t("dashboard.author.submit.coverLetterTab.replaceFile")}
                    </Button>
                  </div>
                  <input
                    type="file"
                    id="cover-letter-upload"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tips Section */}
      <details className="border-t border-border pt-4">
        <summary
          className={`cursor-pointer ${typography.label} text-muted-foreground hover:text-foreground flex items-center ${spacing.gap.sm} font-arial`}
        >
          <Lightbulb className="size-4 text-amber-500" />
          <span>{t("dashboard.author.submit.coverLetterTab.tipsTitle")}</span>
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <div className={`${typography.bodySmall} text-gray-700 space-y-2 font-arial`}>
            <p className={`${typography.medium} text-gray-900`}>
              {t("dashboard.author.submit.coverLetterTab.tipsTitle")}
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              {tipsList.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
