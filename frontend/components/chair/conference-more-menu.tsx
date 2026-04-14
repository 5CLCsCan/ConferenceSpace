"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { transitionConferenceStatus } from "@/lib/api/conferences"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"
import type { ConferenceStatus } from "@/lib/types"

interface ConferenceMoreMenuProps {
  conferenceId: string
  conferenceStatus: ConferenceStatus
  compact?: boolean
  onActionComplete?: () => void
}

export function ConferenceMoreMenu({
  conferenceId,
  conferenceStatus,
  compact = false,
  onActionComplete,
}: ConferenceMoreMenuProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isMutating, setIsMutating] = useState(false)

  const isArchived = conferenceStatus === "archived"
  const isDraft = conferenceStatus === "draft"

  const handleStatusToggle = async () => {
    const targetStatus: ConferenceStatus = isArchived ? "completed" : "archived"

    setIsMutating(true)
    try {
      const response = await transitionConferenceStatus(conferenceId, targetStatus)
      if (response.error || !response.data) {
        toast({
          title: t(
            "runtime.components.chair.conference-detail.chair-actions-panel.text_failed_to_update_conference_status",
          ),
          description:
            response.error ||
            t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_failed_to_update_conference_status_description",
            ),
          variant: "destructive",
        })
        return
      }

      toast({
        title: isArchived
          ? t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_unarchived_success",
            )
          : t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_archived_success",
            ),
      })

      onActionComplete?.()
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center justify-center text-slate-400 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all ${compact ? "w-7 h-7" : ""}`}
          aria-label={t("runtime.components.conference.conference-cards.text_more_actions")}
        >
          <span className="material-symbols-outlined text-[14px]">more_horiz</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          className="text-[11px] font-medium"
          onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId))}
        >
          {t("runtime.components.conference.explore-cards.text_view_details")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[11px] font-medium"
          onClick={() => router.push(ROUTES.CHAIR.CONFERENCE_EDIT(conferenceId))}
        >
          {isDraft
            ? t("runtime.components.conference.conference-cards.text_continue_editing")
            : t("runtime.components.conference.conference-cards.text_edit_details")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[11px] font-medium"
          disabled={isMutating}
          onClick={handleStatusToggle}
        >
          {isArchived
            ? t(
                "runtime.components.chair.conference-detail.chair-actions-panel.text_unarchive_conference",
              )
            : t(
                "runtime.components.chair.conference-detail.chair-actions-panel.text_archive_conference",
              )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
