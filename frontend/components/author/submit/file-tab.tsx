"use client"
import type React from "react"
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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setUploadedFile(file)
      setValidationStatus("validating")
      setTimeout(() => {
        setValidationStatus("pending")
      }, 1500)
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
            type="file"
            id="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="file" className="cursor-pointer">
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
          </label>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div
            className={`flex items-center gap-2 ${validationStatus === "validating" ? "text-blue-600" : "text-gray-600"}`}
          >
            <Upload className="size-4" />
            <span className="text-sm font-medium">Validation:</span>
          </div>
          <span className="text-sm text-gray-600">
            {validationStatus === "pending" && "Pending"}
            {validationStatus === "validating" && "Validating..."}
          </span>
        </div>
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
