"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileText, Upload, X, CheckCircle2, Info, Lightbulb, Download } from "lucide-react"
import { typography, spacing } from "@/lib/typography"
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
            <h2 className={`${typography.h2} text-[#212529] font-arial`}>Cover Letter</h2>
            <p className={`${typography.body} text-[#6C757D] font-arial ${spacing.margin.top.sm}`}>
              Optional document to provide additional context to reviewers
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-gray-700 font-arial`}>
              <p className={`${typography.medium} text-green-900 mb-2`}>
                What to include in your cover letter:
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Brief summary of your paper's significance and novelty</li>
                <li>Why this work is suitable for this conference</li>
                <li>Any special considerations for reviewers</li>
                <li>Suggested reviewers (if applicable)</li>
                <li>Previous submission history (if resubmitting)</li>
              </ul>
              <p className={`${typography.bodySmall} text-gray-600 mt-2`}>
                <strong>Note:</strong> Cover letter is optional but recommended. Maximum file size:
                5MB. PDF format only.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Existing Cover Letter */}
      {!coverLetter && existingCoverLetter && (
        <Card className="bg-blue-50 border-blue-200">
        <div className={spacing.padding.card}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <CheckCircle2 className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className={`${typography.bodySmall} text-gray-700 font-arial`}>
                  <p className={`${typography.medium} text-blue-900 mb-1`}>
                    Existing Cover Letter
                  </p>
                  <p className="mb-2">
                    <strong>{existingCoverLetter.name}</strong> ({formatFileSize(existingCoverLetter.size)})
                  </p>
                  <p className="text-gray-600">
                    Upload a new file below to replace the existing cover letter.
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
                Download
              </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Upload Section */}
      <div className={spacing.item}>
        <Label className={`${typography.label} text-[#212529] font-arial`}>
          Upload Cover Letter (Optional)
        </Label>

        {!coverLetter ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive ? "border-[#0056A3] bg-blue-50" : "border-[#DEE2E6] hover:border-[#ADB5BD]"
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
              <div className="mx-auto w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                <Upload className="size-8 text-[#6C757D]" />
              </div>
              <div>
                <p
                  className={`${typography.bodyLarge} ${typography.medium} text-[#212529] font-arial mb-1`}
                >
                  Drop your PDF here or click to browse
                </p>
                <p className={`${typography.bodySmall} text-[#6C757D] font-arial`}>
                  PDF format only, maximum 5MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("cover-letter-upload")?.click()}
                className={`mx-auto border-[#0056A3] text-[#0056A3] hover:bg-[#0056A3]/10 ${typography.body} ${typography.medium} font-arial`}
              >
                <Upload className="size-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <div className={spacing.padding.card}>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`${typography.body} ${typography.semibold} text-[#212529] font-arial truncate`}
                      >
                        {coverLetter.name}
                      </p>
                      <p className={`${typography.bodySmall} text-[#6C757D] font-arial mt-1`}>
                        {formatFileSize(coverLetter.size)} • PDF Document
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
                      Remove
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("cover-letter-upload")?.click()}
                      className={`border-[#0056A3] text-[#0056A3] hover:bg-[#0056A3]/10 ${typography.bodySmall} font-arial`}
                    >
                      Replace File
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
      <details className="border-t border-[#DEE2E6] pt-4">
        <summary
          className={`cursor-pointer ${typography.label} text-[#495057] hover:text-[#212529] flex items-center ${spacing.gap.sm} font-arial`}
        >
          <Lightbulb className="size-4 text-amber-500" />
          <span>Cover Letter Writing Tips</span>
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <div className={`${typography.bodySmall} text-gray-700 space-y-2 font-arial`}>
            <p className={`${typography.medium} text-gray-900`}>Best Practices:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Keep it concise (1-2 pages maximum)</li>
              <li>Be professional and respectful in tone</li>
              <li>Highlight the novelty and impact of your work</li>
              <li>Address any potential concerns proactively</li>
              <li>Avoid repeating the abstract verbatim</li>
              <li>Suggest 3-5 qualified reviewers if the conference allows it</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
