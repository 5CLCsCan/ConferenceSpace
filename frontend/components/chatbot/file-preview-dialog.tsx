"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type PreviewableFile = {
  filename: string
  mediaType?: string
  url?: string
}

type FilePreviewDialogProps = {
  file: PreviewableFile | null
  onOpenChange: (open: boolean) => void
}

export function FilePreviewDialog({ file, onOpenChange }: FilePreviewDialogProps) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] gap-3 overflow-hidden p-0 sm:max-w-[75vw]">
        {file && (
          <>
            <DialogHeader className="border-b border-slate-200 px-4 py-3">
              <DialogTitle className="max-w-[620px] truncate text-sm text-slate-900">
                {file.filename}
              </DialogTitle>
              {/* <DialogDescription className="text-[11px] text-slate-500">
                {fileLabel(file)}
              </DialogDescription> */}
            </DialogHeader>
            <div className="bg-slate-50">
              <FilePreviewContent file={file} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FilePreviewContent({ file }: { file: PreviewableFile }) {
  if (!file.url) {
    return <PreviewUnavailable file={file} reason="No preview URL is available for this file." />
  }

  if (isPdf(file)) {
    return (
      <iframe
        title={file.filename}
        src={file.url}
        className="h-[68vh] w-full rounded-md border border-slate-200 bg-white"
      />
    )
  }

  if (isImage(file)) {
    return (
      <div className="flex max-h-[68vh] items-center justify-center overflow-auto rounded-md border border-slate-200 bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.filename}
          className="max-h-[62vh] max-w-full object-contain"
        />
      </div>
    )
  }

  return <PreviewUnavailable file={file} reason="Preview is available for PDFs and images only." />
}

function PreviewUnavailable({ file, reason }: { file: PreviewableFile; reason: string }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-6 text-center">
      <span
        className="material-symbols-outlined mb-3 text-[28px] text-slate-400"
        aria-hidden
        style={{ fontVariationSettings: '"FILL" 0, "wght" 400' }}
      >
        insert_drive_file
      </span>
      <p className="text-xs font-semibold text-slate-800">{file.filename}</p>
      <p className="mt-1 max-w-[320px] text-[11px] leading-relaxed text-slate-500">{reason}</p>
    </div>
  )
}

function fileLabel(file: PreviewableFile): string {
  return file.mediaType || extensionLabel(file.filename) || "File"
}

function extensionLabel(filename: string): string {
  const extension = filename.includes(".") ? filename.split(".").pop() : ""
  return extension ? extension.toUpperCase() : ""
}

function isPdf(file: PreviewableFile): boolean {
  return file.mediaType === "application/pdf" || extensionLabel(file.filename) === "PDF"
}

function isImage(file: PreviewableFile): boolean {
  return Boolean(file.mediaType?.startsWith("image/"))
}
