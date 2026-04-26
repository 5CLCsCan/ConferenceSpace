"use client"

import * as React from "react"
import type { UIMessage } from "ai"

import { AssistantTurn } from "./assistant-turn"
import { FilePreviewDialog, type PreviewableFile } from "./file-preview-dialog"
import type { TranscriptFileItem } from "./transcript-view-model"
import { buildTranscriptTurns } from "./transcript-view-model"
import { UserMessage } from "./user-message"

type ChatTranscriptProps = {
  messages: UIMessage[]
  status: string
}

export function ChatTranscript({ messages }: ChatTranscriptProps) {
  const turns = buildTranscriptTurns(messages)
  const [previewFile, setPreviewFile] = React.useState<PreviewableFile | null>(null)

  return (
    <>
      <div className="space-y-4">
        {turns.map((turn, index) => (
          <div
            key={
              turn.kind === "user-turn"
                ? turn.messageId
                : turn.messageIds.join("-") || `turn-${index}`
            }
            className={turn.kind === "user-turn" ? "flex justify-end" : "flex justify-start"}
          >
            {turn.kind === "user-turn" ? (
              <div className="flex max-w-[82%] flex-col items-end gap-1.5">
                <UserFileCards
                  files={turn.items.filter((item) => item.kind === "file")}
                  onPreview={setPreviewFile}
                />
                <UserMessage
                  text={turn.items
                    .filter((item) => item.kind === "text")
                    .map((item) => item.text)
                    .join("")}
                />
              </div>
            ) : (
              <AssistantTurn turn={turn} />
            )}
          </div>
        ))}
      </div>
      <FilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </>
  )
}

function UserFileCards({
  files,
  onPreview,
}: {
  files: TranscriptFileItem[]
  onPreview: (file: PreviewableFile) => void
}) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className="flex max-w-full flex-col items-end gap-1.5">
      {files.map((file, index) => {
        const visual = fileVisual(file)
        return (
          <button
            type="button"
            key={`${file.messageId}-${file.filename}-${index}`}
            data-testid="chat-user-file-card"
            className="flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            onClick={() =>
              onPreview({
                filename: file.filename,
                mediaType: file.mediaType,
                url: file.url,
              })
            }
          >
            <span
              data-testid="chat-user-file-icon-badge"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded ${visual.badgeClassName}`}
              aria-hidden
            >
              <span
                data-testid="chat-user-file-icon"
                className={`material-symbols-outlined block h-[18px] w-[18px] text-[18px] leading-[18px] ${visual.iconClassName}`}
                style={{ fontVariationSettings: '"FILL" 0, "wght" 500' }}
              >
                {visual.icon}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block max-w-[170px] truncate text-[10px] font-semibold leading-tight text-slate-800">
                {file.filename}
              </span>
              <span className="mt-0.5 block text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {fileLabel(file)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function fileLabel(file: TranscriptFileItem): string {
  const extension = file.filename.includes(".") ? file.filename.split(".").pop() : ""
  if (extension) {
    return extension.toUpperCase()
  }
  return file.mediaType || "FILE"
}

function fileVisual(file: TranscriptFileItem): {
  icon: string
  badgeClassName: string
  iconClassName: string
} {
  const label = fileLabel(file).toLowerCase()
  const mediaType = (file.mediaType || "").toLowerCase()

  if (label === "pdf" || mediaType === "application/pdf") {
    return { icon: "picture_as_pdf", badgeClassName: "bg-red-50", iconClassName: "text-red-600" }
  }
  if (
    mediaType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(label)
  ) {
    return { icon: "image", badgeClassName: "bg-sky-50", iconClassName: "text-sky-600" }
  }
  if (["xls", "xlsx", "csv"].includes(label)) {
    return {
      icon: "table_chart",
      badgeClassName: "bg-emerald-50",
      iconClassName: "text-emerald-600",
    }
  }
  if (["doc", "docx", "txt", "md"].includes(label)) {
    return { icon: "description", badgeClassName: "bg-indigo-50", iconClassName: "text-indigo-600" }
  }
  if (["zip", "rar", "7z"].includes(label)) {
    return { icon: "folder_zip", badgeClassName: "bg-amber-50", iconClassName: "text-amber-600" }
  }
  return {
    icon: "insert_drive_file",
    badgeClassName: "bg-slate-100",
    iconClassName: "text-slate-600",
  }
}
