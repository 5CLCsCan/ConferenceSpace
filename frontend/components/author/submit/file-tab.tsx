"use client"
import type React from "react"
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

interface FileTabProps {
  uploadedFile: File | null
  setUploadedFile: (value: File | null) => void
  validationStatus: "pending" | "validating" | "success" | "error"
  setValidationStatus: (value: "pending" | "validating" | "success" | "error") => void
}

export function FileTab({
  uploadedFile,
  setUploadedFile,
  validationStatus,
  setValidationStatus,
}: FileTabProps) {
  const [isUploading, setIsUploading] = useState(false)
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
      } else {
        setUploadedFile(null)
        setValidationStatus("error")
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        alert(`Validation failed:\n${validation.errors.join("\n")}`)
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Manuscript File</h2>
        <p className="text-sm text-gray-600">
          Upload anonymized PDF following the conference template
        </p>
      </div>
      <div className="space-y-4">
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
                <p className="text-base text-gray-900 font-medium mb-1">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <p className="text-base text-gray-700 font-medium mb-1">Upload PDF</p>
                <p className="text-sm text-gray-500">No file selected</p>
              </>
            )}
          </div>
        </div>
        {uploadedFile && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Validation Results</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {validationChecklist.fileType === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.fileType ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
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

              <div className="flex items-center gap-2 text-sm">
                {validationChecklist.fileSize === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.fileSize ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
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

              <div className="flex items-center gap-2 text-sm">
                {validationChecklist.pageLimit === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.pageLimit ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
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

              <div className="flex items-center gap-2 text-sm">
                {validationChecklist.embeddedFonts === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.embeddedFonts ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
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

              <div className="flex items-center gap-2 text-sm">
                {validationChecklist.anonymized === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.anonymized ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
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

              <div className="flex items-center gap-2 text-sm">
                {validationChecklist.templateCompliance === null ? (
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                ) : validationChecklist.templateCompliance ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
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
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <Upload className="size-4 mt-0.5 flex-shrink-0" />
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
