"use client"

import { useState, useMemo } from "react"
import type {
  DiscussionPanelProps,
  MessageVisibility,
  ThreadStatus,
  CreateThreadData,
} from "./types"
import { ThreadCard } from "./components/thread-card"
import { NewThreadModal } from "./components/new-thread-modal"
import { ReviewModeIndicator } from "./components/review-mode-indicator"
import { useTranslation } from "@/lib/i18n/translation-context"

export function DiscussionPanel({
  threads,
  settings,
  currentUser,
  onCreateThread,
  onReplyToThread,
  onToggleThreadCollapse,
  readOnly = false,
  availableVisibilities,
  className = "",
}: DiscussionPanelProps) {
  const { t } = useTranslation()
  const [filterVisibility, setFilterVisibility] = useState<MessageVisibility | "all">("all")
  const [filterStatus, setFilterStatus] = useState<ThreadStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      if (filterVisibility !== "all" && thread.visibility !== filterVisibility) return false
      if (filterStatus !== "all" && thread.status !== filterStatus) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          thread.title.toLowerCase().includes(q) ||
          thread.messages.some((m) => m.content.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [threads, filterVisibility, filterStatus, searchQuery])

  // Separate pinned from rest
  const pinnedThreads = filteredThreads.filter((t) => t.status === "pinned")
  const otherThreads = filteredThreads.filter((t) => t.status !== "pinned")
  const totalCount = filteredThreads.length

  const handleCreateThread = (data: CreateThreadData) => {
    onCreateThread?.(data)
    setShowNewThreadModal(false)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header Section */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight flex items-center gap-2">
              {t("runtime.components.shared.discussion.DiscussionPanel.text_discussion_threads")}{" "}<span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">
                {totalCount}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
              {t("runtime.components.shared.discussion.DiscussionPanel.text_collaborate_with_other_reviewers_and_committee")}{" "}</p>
          </div>
          <ReviewModeIndicator mode={settings.reviewMode} />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span
              className="absolute left-3 top-1/2 material-symbols-outlined text-slate-400"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "translateY(-50%)",
                boxSizing: "border-box",
              }}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("runtime.components.shared.discussion.DiscussionPanel.placeholder_search_discussions")}
              className="w-full h-8 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20"
            />
          </div>

          {/* Visibility Filter */}
          <div className="relative">
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as MessageVisibility | "all")}
              className="h-8 pl-3 pr-7 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#1B3C53] cursor-pointer"
            >
              <option value="all">{t("runtime.components.shared.discussion.DiscussionPanel.text_all_visibility")}</option>
              <option value="committee">{t("runtime.components.shared.discussion.DiscussionPanel.text_committee_only")}</option>
              <option value="reviewers">{t("runtime.components.shared.discussion.DiscussionPanel.text_reviewers_only")}</option>
              <option value="authors">{t("runtime.components.shared.discussion.DiscussionPanel.text_visible_to_authors")}</option>
            </select>
            <span
              className="absolute right-2 top-2 pointer-events-none material-symbols-outlined text-slate-400"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              expand_more
            </span>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ThreadStatus | "all")}
              className="h-8 pl-3 pr-7 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#1B3C53] cursor-pointer"
            >
              <option value="all">{t("runtime.components.shared.discussion.DiscussionPanel.text_all_status")}</option>
              <option value="pinned">{t("runtime.components.shared.discussion.DiscussionPanel.text_pinned")}</option>
              <option value="open">{t("runtime.components.shared.discussion.DiscussionPanel.text_open")}</option>
              <option value="resolved">{t("runtime.components.shared.discussion.DiscussionPanel.text_resolved")}</option>
              <option value="flagged">{t("runtime.components.shared.discussion.DiscussionPanel.text_flagged")}</option>
            </select>
            <span
              className="absolute right-2 top-2 pointer-events-none material-symbols-outlined text-slate-400"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              expand_more
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* New Thread Button */}
          {!readOnly && (
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="h-8 px-3 bg-[#1B3C53] hover:bg-[#234C6A] text-white text-[11px] font-bold rounded-md transition-colors flex items-center gap-1.5"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "16px",
                  width: "16px",
                  height: "16px",
                  maxWidth: "16px",
                  maxHeight: "16px",
                  minWidth: "16px",
                  minHeight: "16px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
                add
              </span>
              {t("runtime.components.shared.discussion.DiscussionPanel.text_new_topic")}{" "}</button>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {/* Pinned Threads Section */}
        {pinnedThreads.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span
                className="material-symbols-outlined text-amber-500 filled"
                style={{
                  fontSize: "16px",
                  width: "16px",
                  height: "16px",
                  maxWidth: "16px",
                  maxHeight: "16px",
                  minWidth: "16px",
                  minHeight: "16px",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transform: "none",
                  boxSizing: "border-box",
                }}
              >
                push_pin
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("runtime.components.shared.discussion.DiscussionPanel.text_pinned")}{" "}</span>
            </div>
            {pinnedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                reviewMode={settings.reviewMode}
                currentUser={currentUser}
                onToggleCollapse={() => onToggleThreadCollapse?.(thread.id)}
                onReply={(content) => onReplyToThread?.(thread.id, content)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {/* Other Threads */}
        {otherThreads.length > 0 && (
          <div className="space-y-3">
            {pinnedThreads.length > 0 && (
              <div className="flex items-center gap-2 px-1 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("runtime.components.shared.discussion.DiscussionPanel.text_all_threads")}{" "}</span>
              </div>
            )}
            {otherThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                reviewMode={settings.reviewMode}
                currentUser={currentUser}
                onToggleCollapse={() => onToggleThreadCollapse?.(thread.id)}
                onReply={(content) => onReplyToThread?.(thread.id, content)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredThreads.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-slate-400">forum</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">{t("runtime.components.shared.discussion.DiscussionPanel.text_no_discussions_found")}</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {searchQuery || filterVisibility !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters or search query."
                : "Start a new topic to discuss this submission with other reviewers."}
            </p>
            {!readOnly && !searchQuery && filterVisibility === "all" && filterStatus === "all" && (
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="mt-4 h-8 px-4 bg-[#1B3C53] hover:bg-[#234C6A] text-white text-[11px] font-bold rounded-md transition-colors inline-flex items-center gap-1.5"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "16px",
                    width: "16px",
                    height: "16px",
                    maxWidth: "16px",
                    maxHeight: "16px",
                    minWidth: "16px",
                    minHeight: "16px",
                    lineHeight: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transform: "none",
                    boxSizing: "border-box",
                  }}
                >
                  add
                </span>
                {t("runtime.components.shared.discussion.DiscussionPanel.text_start_discussion")}{" "}</button>
            )}
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      <NewThreadModal
        isOpen={showNewThreadModal}
        onClose={() => setShowNewThreadModal(false)}
        reviewMode={settings.reviewMode}
        onSubmit={handleCreateThread}
        availableVisibilities={availableVisibilities}
      />
    </div>
  )
}
