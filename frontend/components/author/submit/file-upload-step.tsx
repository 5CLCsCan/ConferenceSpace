"use client"

import { useState, useRef } from "react"
import { precheckPaper, downloadPaperFile } from "@/lib/api/papers"
import type { Conference, PrecheckResult } from "@/lib/types"
import { PreCheckResults } from "./precheck-results"

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
  onPrecheckUpdate?: (result: PrecheckResult | null, error: string | null) => void
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
  onPrecheckUpdate,
}: FileUploadStepProps) {
  const [isPrechecking, setIsPrechecking] = useState(false)
  const [precheckResult, setPrecheckResult] = useState<PrecheckResult | null>(null)
  const [precheckError, setPrecheckError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Run precheck when file is uploaded
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    onFileUpload(e)

    if (file && (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024)) {
      onPrecheckUpdate?.(null, null)
      return
    }

    if (file && conference?.id) {
      setIsPrechecking(true)
      setPrecheckError(null)
      setPrecheckResult(null)
      onPrecheckUpdate?.(null, null)

      try {
        const conferenceId = String(conference.id)
        const response = await precheckPaper(conferenceId, file)

        if (response.error) {
          setPrecheckError(response.error)
          onPrecheckUpdate?.(null, response.error)
        } else if (response.data) {
          setPrecheckResult(response.data)
          onPrecheckUpdate?.(response.data, null)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Precheck failed"
        setPrecheckError(message)
        onPrecheckUpdate?.(null, message)
      } finally {
        setIsPrechecking(false)
      }
    } else {
      onPrecheckUpdate?.(null, null)
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
    <div className="flex flex-col gap-4 w-full">
      {/* Double-Blind Policy Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-[#1B3C53] px-4 py-3 rounded-r-lg">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-[#1B3C53] dark:text-blue-300 text-[18px]">
            info
          </span>
          <div>
            <h3 className="text-xs font-bold text-[#1B3C53] dark:text-blue-200">
              Double-Blind Review Policy
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-blue-300/80 mt-0.5 leading-relaxed">
              This conference follows a double-blind review process. Your manuscript must not
              contain names, affiliations, or any other identifying information.
            </p>
          </div>
        </div>
      </div>

      {/* Manuscript Upload */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
              Manuscript PDF
            </h3>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded uppercase tracking-wider">
              Max: 20MB
            </span>
          </div>
        </div>
        <div className="relative group cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          />
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#1B3C53] dark:hover:border-slate-400 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/20 group-hover:bg-[#1B3C53]/5 dark:group-hover:bg-slate-800/50 transition-all duration-300">
            <div className="size-14 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-[#1B3C53] dark:text-slate-300">
              <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
            </div>
            {uploadedFile ? (
              <div>
                <p className="text-sm font-bold text-[#1B3C53] dark:text-white">
                  {uploadedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB - Click to replace
                </p>
              </div>
            ) : existingFile ? (
              <div>
                <p className="text-sm font-bold text-[#1B3C53] dark:text-white">
                  {existingFile.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {(existingFile.size / 1024 / 1024).toFixed(2)} MB - Existing file
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadExisting()
                  }}
                  disabled={isDownloading}
                  className="mt-2 text-[10px] font-medium text-[#1B3C53] hover:underline flex items-center gap-1 mx-auto uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  {isDownloading ? "Downloading..." : "Download existing"}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-[#141414] dark:text-white group-hover:text-[#1B3C53] dark:group-hover:text-slate-300 transition-colors">
                  Click to upload or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Only PDF files are allowed</p>
              </>
            )}
          </div>
        </div>

        {/* Precheck Loading */}
        {isPrechecking && (
          <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-[#1B3C53]/5 dark:bg-slate-700/50 rounded-lg">
            <span className="material-symbols-outlined animate-spin text-[#1B3C53] text-[16px]">
              sync
            </span>
            <span className="text-xs font-medium text-[#1B3C53] dark:text-slate-300">
              Running quality check on your paper...
            </span>
          </div>
        )}

        {/* Precheck Error */}
        {precheckError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">{precheckError}</p>
          </div>
        )}

        {/* Uploaded File Preview */}
        {uploadedFile && !isPrechecking && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm relative overflow-hidden group">
              <div
                className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-1000"
                style={{ width: `${uploadProgress}%` }}
              />
              <div className="size-9 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined icon-filled text-[20px]">
                  picture_as_pdf
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-xs font-bold text-[#141414] dark:text-white truncate">
                    {uploadedFile.name}
                  </p>
                  <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[14px] icon-filled">
                      check_circle
                    </span>
                    Ready
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  <span>-</span>
                  <span>Uploaded just now</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
                  title="Preview"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button
                  onClick={() => {
                    onRemoveFile()
                    onPrecheckUpdate?.(null, null)
                  }}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Precheck Results */}
        {precheckResult && (
          <div className="mt-4">
            <PreCheckResults result={precheckResult} />
          </div>
        )}
      </div>

      {/* Supplementary Material */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
              Supplementary Material{" "}
              <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </h3>
            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">
              ZIP, Code, Data
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex-1 border border-dashed border-slate-300 dark:border-slate-600 hover:border-[#1B3C53] dark:hover:border-slate-400 rounded-lg h-20 flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-[#1B3C53]/5 transition-all text-slate-500 hover:text-[#1B3C53] dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span className="text-[11px] font-medium">Add supplementary files</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-3 font-light">
          Upload source code, datasets, or additional proofs that support your submission.
        </p>
      </div>

      {/* Validation Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fileValidation.format && (
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg px-4 py-3 border border-green-100 dark:border-green-900/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-green-600 text-[16px]">verified</span>
            <div>
              <p className="text-xs font-bold text-green-800 dark:text-green-300">
                Format Validated
              </p>
              <p className="text-[10px] text-green-700/70 dark:text-green-400/70 font-light">
                The uploaded PDF meets the conference formatting guidelines.
              </p>
            </div>
          </div>
        )}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
          <span className="material-symbols-outlined text-slate-400 text-[16px]">
            font_download
          </span>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Font Check</p>
            <p className="text-[10px] text-slate-500 font-light">
              Fonts will be analyzed upon final submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
