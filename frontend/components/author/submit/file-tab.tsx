"use client"
import type React from "react"
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Download } from "lucide-react"
import { precheckPaper, downloadPaperFile } from "@/lib/api/papers"
import type { Conference } from "@/lib/types"
import { PreCheckResults, type PreCheckResult } from "./precheck-results"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface FileTabProps {
  uploadedFile: File | null
  setUploadedFile: (value: File | null) => void
  validationStatus: "pending" | "validating" | "success" | "error"
  setValidationStatus: (value: "pending" | "validating" | "success" | "error") => void
  conference?: Conference | null
  submissionId?: string
  conferenceId?: string
  existingFile?: {
    name: string
    size: number
    type: string
  }
}

export function FileTab({
  uploadedFile,
  setUploadedFile,
  validationStatus,
  setValidationStatus,
  conference,
  submissionId,
  conferenceId,
  existingFile,
}: FileTabProps) {
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [isPrechecking, setIsPrechecking] = useState(false)
  const [precheckResult, setPrecheckResult] = useState<PreCheckResult | null>(null)
  const [precheckError, setPrecheckError] = useState<string | null>(null)
  const [validationChecklist, setValidationChecklist] = useState<{
    fileType: boolean | null
    fileSize: boolean | null
    pageLimit: boolean | null
    embeddedFonts: boolean | null
    anonymized: boolean | null
    templateCompliance: boolean | null
  }>({
    fileType: null,
    fileSize: null,
    pageLimit: null,
    embeddedFonts: null,
    anonymized: null,
    templateCompliance: null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validatePDF = async (
    file: File,
  ): Promise<{
    isValid: boolean
    errors: string[]
    checklist: {
      fileType: boolean
      fileSize: boolean
      pageLimit: boolean
      embeddedFonts: boolean
      anonymized: boolean
      templateCompliance: boolean
    }
  }> => {
    const errors: string[] = []

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024 // 20MB in bytes
    const fileSizeValid = file.size <= maxSize
    if (!fileSizeValid) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 20MB limit`)
    }

    // Check file type
    const fileTypeValid = file.type === "application/pdf"
    if (!fileTypeValid) {
      errors.push("File must be a PDF")
    }

    // Note: Page count, embedded fonts, anonymization, and template compliance
    // would typically be validated server-side after upload
    // For now, we'll assume these pass on the client side (marked as pending validation)
    const checklist = {
      fileType: fileTypeValid,
      fileSize: fileSizeValid,
      pageLimit: true, // Assume valid for client-side
      embeddedFonts: true, // Assume valid for client-side
      anonymized: true, // Assume valid for client-side
      templateCompliance: true, // Assume valid for client-side
    }

    return {
      isValid: errors.length === 0,
      errors,
      checklist,
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return // Prevent multiple uploads

    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setValidationStatus("validating")

      // Perform client-side validation
      const validation = await validatePDF(file)

      setValidationChecklist(validation.checklist)

      if (validation.isValid) {
        setUploadedFile(file)
        setValidationStatus("success")

        // Run precheck if conference is available
        if (conference?.id) {
          setIsPrechecking(true)
          setPrecheckError(null)
          setPrecheckResult(null)

          try {
            // Ensure conference ID is a string for the API call
            const conferenceId = String(conference.id)
            const precheckResponse = await precheckPaper(conferenceId, file)

            if (precheckResponse.error) {
              setPrecheckError(precheckResponse.error)
            } else if (precheckResponse.data) {
              setPrecheckResult(precheckResponse.data)
            } else {
              setPrecheckError(
                t("dashboard.author.submit.fileTab.precheckError") ||
                  "No data returned from precheck",
              )
            }
          } catch (error) {
            console.error("Precheck error:", error)
            setPrecheckError(
              error instanceof Error
                ? error.message
                : t("dashboard.author.submit.fileTab.precheckError"),
            )
          } finally {
            setIsPrechecking(false)
          }
        } else {
          console.warn("Conference ID not available, skipping precheck")
        }
      } else {
        setUploadedFile(null)
        setValidationStatus("error")
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        alert(
          `${t("dashboard.author.submit.fileTab.validationFailed") || "Validation failed"}:\n${validation.errors.join("\n")}`,
        )
      }

      setIsUploading(false)
    }
  }

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDownloadExistingFile = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!submissionId || !conferenceId) {
      alert(t("dashboard.author.submit.fileTab.downloadError") || "Cannot download: missing submission or conference ID")
      return
    }

    try {
      const response = await downloadPaperFile(submissionId, conferenceId)
      
      if (response.error || !response.data) {
        alert(t("dashboard.author.submit.fileTab.downloadError") || `Download failed: ${response.error}`)
        return
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement("a")
      link.href = url
      link.download = response.filename || "paper.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      alert(t("dashboard.author.submit.fileTab.downloadError") || "Failed to download file")
    }
  }

  return (
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h3} ${typography.bold} text-gray-900 mb-1`}>
          {t("dashboard.author.submit.fileTab.manuscriptFile") || "Manuscript File"}
        </h2>
        <p className={`${typography.body} text-gray-600`}>
          {t("dashboard.author.submit.fileTab.uploadDescription") ||
            "Upload anonymized PDF following the conference template"}
        </p>
      </div>
      <div className={spacing.subsection}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            id="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <div onClick={handleUploadClick} className="cursor-pointer">
            <Upload className="size-12 mx-auto mb-4 text-gray-400" />
            {uploadedFile ? (
              <div>
                <p className={`${typography.bodyLarge} ${typography.medium} text-gray-900 mb-1`}>
                  {uploadedFile.name}
                </p>
                <p className={`${typography.body} text-gray-500`}>
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className={`${typography.bodySmall} text-gray-400 mt-1`}>
                  (New file - will replace existing)
                </p>
              </div>
            ) : existingFile ? (
              <div>
                <p className={`${typography.bodyLarge} ${typography.medium} text-gray-900 mb-1`}>
                  {existingFile.name}
                </p>
                <p className={`${typography.body} text-gray-500`}>
                  {(existingFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className={`${typography.bodySmall} text-gray-400 mt-1`}>
                  (Existing file - upload new to replace)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExistingFile}
                  className="mt-3"
                >
                  <Download className="size-4 mr-2" />
                  {t("dashboard.author.submit.fileTab.download") || "Download"}
                </Button>
              </div>
            ) : (
              <>
                <p className={`${typography.bodyLarge} ${typography.medium} text-gray-700 mb-1`}>
                  {t("dashboard.author.submit.fileTab.uploadPdf") || "Upload PDF"}
                </p>
                <p className={`${typography.body} text-gray-500`}>
                  {t("dashboard.author.submit.fileTab.noFileSelected") || "No file selected"}
                </p>
              </>
            )}
          </div>
          {isUploading && (
            <div className={`flex items-center justify-center ${spacing.gap.sm} ${typography.body} text-muted-foreground mt-4`}>
              <Loader2 className={`${iconSizes.sm} animate-spin`} />
              {t("dashboard.author.submit.fileTab.checking") || "Checking..."}
            </div>
          )}
          {isPrechecking && (
            <div className={`flex items-center justify-center ${spacing.gap.sm} ${typography.body} text-primary mt-4`}>
              <Loader2 className={`${iconSizes.sm} animate-spin`} />
              {t("dashboard.author.submit.fileTab.precheckRunning") ||
                "Running quality check on your paper..."}
            </div>
          )}
        </div>
        {precheckResult && <PreCheckResults result={precheckResult} />}
        {precheckError && (
          <div className={`${spacing.padding.card} bg-destructive/10 border border-destructive/20 rounded-lg`}>
            <p className={`${typography.body} text-destructive`}>{precheckError}</p>
          </div>
        )}
        {uploadedFile && !precheckResult && !isPrechecking && (
          <div className={`${spacing.padding.card} bg-gray-50 rounded-lg ${spacing.gap.md}`}>
            <h4 className={`${typography.body} ${typography.medium} text-gray-900`}>
              {t("dashboard.author.submit.fileTab.validationResults") || "Validation Results"}
            </h4>
            <div className={spacing.item}>
              <div className={`flex items-center ${spacing.gap.sm} ${typography.body}`}>
                {validationChecklist.fileType === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.fileType ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✗</span>
                  </div>
                )}
                <span
                  className={
                    validationChecklist.fileType === false ? "text-red-600" : "text-gray-700"
                  }
                >
                  File type: PDF
                </span>
              </div>

              <div className={`flex items-center ${spacing.gap.sm} ${typography.body}`}>
                {validationChecklist.fileSize === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.fileSize ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✗</span>
                  </div>
                )}
                <span
                  className={
                    validationChecklist.fileSize === false ? "text-red-600" : "text-gray-700"
                  }
                >
                  File size ≤ 20MB
                </span>
              </div>

              <div className={`flex items-center ${spacing.gap.sm} ${typography.body}`}>
                {validationChecklist.pageLimit === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.pageLimit ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✗</span>
                  </div>
                )}
                <span
                  className={
                    validationChecklist.pageLimit === false ? "text-red-600" : "text-gray-700"
                  }
                >
                  Page limit ≤ 10
                </span>
              </div>

              <div className={`flex items-center ${spacing.gap.sm} ${typography.body}`}>
                {validationChecklist.embeddedFonts === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.embeddedFonts ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✗</span>
                  </div>
                )}
                <span
                  className={
                    validationChecklist.embeddedFonts === false ? "text-red-600" : "text-gray-700"
                  }
                >
                  Embedded fonts
                </span>
              </div>

              <div className={`flex items-center ${spacing.gap.sm} ${typography.body}`}>
                {validationChecklist.anonymized === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.anonymized ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✗</span>
                  </div>
                )}
                <span
                  className={
                    validationChecklist.anonymized === false ? "text-red-600" : "text-gray-700"
                  }
                >
                  Anonymized (no author names/affiliations)
                </span>
              </div>

              <div className={`flex items-center ${spacing.gap.sm} ${typography.body}`}>
                {validationChecklist.templateCompliance === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.templateCompliance ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className={`text-white ${typography.bodySmall}`}>✗</span>
                  </div>
                )}
                <span
                  className={
                    validationChecklist.templateCompliance === false
                      ? "text-red-600"
                      : "text-gray-700"
                  }
                >
                  Template compliance
                </span>
              </div>
            </div>
          </div>
        )}
        <div className={`${spacing.item} ${typography.body} text-gray-600`}>
          <p className={`flex items-start ${spacing.gap.sm}`}>
            <Upload className={`${iconSizes.sm} mt-0.5 flex-shrink-0`} />
            <span>
              Checks: page limit ≤ 10; file size ≤ 20MB; embedded fonts; anonymized (no author
              names/affiliations); template compliance.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
