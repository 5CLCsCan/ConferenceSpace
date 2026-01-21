"use client"

import { useState, useRef } from "react"
import { precheckPaper, downloadPaperFile } from "@/lib/api/papers"
import type { Conference } from "@/lib/types"

interface PreCheckResult {
  paper_title: string
  overall_score: number
  decision: string
  summary: {
    total_items: number
    passed: number
    failed: number
    pass_rate: number
  }
  category_scores?: Record<
    string,
    { score: number; passed: number; failed: number; weight: number }
  >
  detailed_results?: Array<{
    item_id: string
    category: string
    description: string
    status: "pass" | "fail" | "warning"
    details: string
    confidence: number
  }>
}

interface FileUploadStepProps {
  uploadedFile: File | null
  uploadProgress: number
  fileValidation: {
    format: boolean
    fonts: boolean
  }
  conference?: Conference | null
  submissionId?: string
  existingFile?: {
    name: string
    size: number
    type: string
  }
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
}

export function FileUploadStep({
  uploadedFile,
  uploadProgress,
  fileValidation,
  conference,
  submissionId,
  existingFile,
  onFileUpload,
  onRemoveFile,
}: FileUploadStepProps) {
  const [isPrechecking, setIsPrechecking] = useState(false)
  const [precheckResult, setPrecheckResult] = useState<PreCheckResult | null>(null)
  const [precheckError, setPrecheckError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Run precheck when file is uploaded
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileUpload(e)
    const file = e.target.files?.[0]

    if (file && conference?.id) {
      setIsPrechecking(true)
      setPrecheckError(null)
      setPrecheckResult(null)

      try {
        const conferenceId = String(conference.id)
        const response = await precheckPaper(conferenceId, file)

        if (response.error) {
          setPrecheckError(response.error)
        } else if (response.data) {
          setPrecheckResult(response.data as PreCheckResult)
        }
      } catch (error) {
        setPrecheckError(error instanceof Error ? error.message : "Precheck failed")
      } finally {
        setIsPrechecking(false)
      }
    }
  }

  const handleDownloadExisting = async () => {
    if (!submissionId || !conference?.id) return

    setIsDownloading(true)
    try {
      const response = await downloadPaperFile(submissionId, String(conference.id))
      if (response.error || !response.data) {
        console.error("Download failed:", response.error)
        return
      }

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
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Double-Blind Policy Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-primary p-4 rounded-r-lg">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-primary dark:text-blue-300">info</span>
          <div>
            <h3 className="text-sm font-bold text-primary dark:text-blue-200">
              Double-Blind Review Policy
            </h3>
            <p className="text-sm text-slate-600 dark:text-blue-300/80 mt-1">
              This conference follows a double-blind review process. Your manuscript must not
              contain names, affiliations, or any other identifying information.
            </p>
          </div>
        </div>
      </div>

      {/* Manuscript Upload */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
            Manuscript PDF <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
            Max size: 20MB
          </span>
        </div>
        <div className="relative group cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 hover:border-primary dark:hover:border-blue-400 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-neutral-50/50 dark:bg-neutral-900/20 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-all duration-300">
            <div className="size-16 bg-white dark:bg-neutral-800 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-primary dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            {uploadedFile ? (
              <div>
                <p className="text-lg font-bold text-primary dark:text-white">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB - Click to replace
                </p>
              </div>
            ) : existingFile ? (
              <div>
                <p className="text-lg font-bold text-primary dark:text-white">
                  {existingFile.name}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {(existingFile.size / 1024 / 1024).toFixed(2)} MB - Existing file
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadExisting()
                  }}
                  disabled={isDownloading}
                  className="mt-2 text-xs font-medium text-primary hover:underline flex items-center gap-1 mx-auto"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  {isDownloading ? "Downloading..." : "Download existing"}
                </button>
              </div>
            ) : (
              <>
                <p className="text-lg font-bold text-primary dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-neutral-500 mt-2">Only PDF files are allowed</p>
              </>
            )}
          </div>
        </div>

        {/* Precheck Loading */}
        {isPrechecking && (
          <div className="mt-4 flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
            <span className="text-sm font-medium text-primary">
              Running quality check on your paper...
            </span>
          </div>
        )}

        {/* Precheck Error */}
        {precheckError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{precheckError}</p>
          </div>
        )}

        {/* Uploaded File Preview */}
        {uploadedFile && !isPrechecking && (
          <div className="mt-6 flex flex-col gap-3">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 flex items-center gap-4 shadow-sm relative overflow-hidden group">
              <div
                className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-1000"
                style={{ width: `${uploadProgress}%` }}
              />
              <div className="size-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-filled">picture_as_pdf</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-bold text-primary dark:text-white truncate">
                    {uploadedFile.name}
                  </p>
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] icon-filled">
                      check_circle
                    </span>
                    Ready
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span>{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  <span>-</span>
                  <span>Uploaded just now</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-primary dark:hover:text-white transition-colors"
                  title="Preview"
                  type="button"
                >
                  <span className="material-symbols-outlined">visibility</span>
                </button>
                <button
                  onClick={onRemoveFile}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-neutral-400 hover:text-red-600 transition-colors"
                  title="Delete"
                  type="button"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Precheck Results */}
        {precheckResult && (
          <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-primary dark:text-white">
                Quality Check Results
              </h4>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  precheckResult.decision === "accept"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                Score: {precheckResult.overall_score}%
              </span>
            </div>
            <div className="space-y-2">
              {precheckResult.detailed_results?.slice(0, 5).map((item) => (
                <div key={item.item_id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      item.status === "pass"
                        ? "text-green-500"
                        : item.status === "warning"
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  >
                    {item.status === "pass"
                      ? "check_circle"
                      : item.status === "warning"
                        ? "warning"
                        : "cancel"}
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Supplementary Material */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-primary dark:text-white text-sm font-bold uppercase tracking-wider">
            Supplementary Material{" "}
            <span className="text-neutral-400 font-normal normal-case">(Optional)</span>
          </label>
          <span className="text-xs text-neutral-500">ZIP, Code, or Data</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex-1 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary dark:hover:border-blue-400 rounded-lg h-24 flex flex-col items-center justify-center gap-2 bg-neutral-50/50 dark:bg-neutral-900/20 hover:bg-blue-50/30 transition-all text-neutral-500 hover:text-primary dark:hover:text-blue-400"
          >
            <span className="material-symbols-outlined">upload_file</span>
            <span className="text-sm font-medium">Add supplementary files</span>
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          Upload source code, datasets, or additional proofs that support your submission.
        </p>
      </div>

      {/* Validation Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fileValidation.format && (
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-green-600 mt-0.5 text-lg">
              verified
            </span>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">
                Format Validated
              </p>
              <p className="text-xs text-green-700/70 dark:text-green-400/70">
                The uploaded PDF meets the conference formatting guidelines.
              </p>
            </div>
          </div>
        )}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-100 dark:border-neutral-700 flex items-start gap-3">
          <span className="material-symbols-outlined text-neutral-400 mt-0.5 text-lg">
            font_download
          </span>
          <div>
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Font Check</p>
            <p className="text-xs text-neutral-500">
              Fonts will be analyzed upon final submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
