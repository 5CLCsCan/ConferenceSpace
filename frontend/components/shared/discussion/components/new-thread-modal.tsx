"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import type { NewThreadModalProps, MessageVisibility, ThreadCategory } from "../types"
import { VISIBILITY_CONFIG, CATEGORY_CONFIG } from "../config"
import { useTranslation } from "@/lib/i18n/translation-context"

const DEFAULT_VISIBILITIES: MessageVisibility[] = ["committee", "reviewers", "authors"]

export function NewThreadModal({
  isOpen,
  onClose,
  reviewMode,
  onSubmit,
  availableVisibilities,
}: NewThreadModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<MessageVisibility>("reviewers")
  const [category, setCategory] = useState<ThreadCategory>("general")
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      return () => document.removeEventListener("keydown", handleEsc)
    }
  }, [isOpen, onClose])

  const handleSubmit = () => {
    if (title.trim() && content.trim() && onSubmit) {
      onSubmit({ title: title.trim(), content: content.trim(), visibility, category })
      setTitle("")
      setContent("")
      setVisibility("reviewers")
      setCategory("general")
      onClose()
    }
  }

  // Don't render on server or when closed
  if (!isOpen || typeof document === "undefined") return null

  const visibilities: MessageVisibility[] =
    availableVisibilities ||
    (reviewMode === "open" ? ["committee", "reviewers", "authors", "public"] : DEFAULT_VISIBILITIES)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#141414] tracking-tight">
            {t(
              "runtime.components.shared.discussion.components.new-thread-modal.text_start_new_discussion",
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t(
                "runtime.components.shared.discussion.components.new-thread-modal.text_topic_title",
              )}{" "}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(
                "runtime.components.shared.discussion.components.new-thread-modal.placeholder_e_g_concern_about_baseline_methodology",
              )}
              className="w-full h-9 px-3 text-sm text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20"
            />
          </div>

          {/* Visibility & Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t(
                  "runtime.components.shared.discussion.components.new-thread-modal.text_visibility",
                )}{" "}
              </label>
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as MessageVisibility)}
                  className="w-full h-9 pl-3 pr-8 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#1B3C53] cursor-pointer"
                >
                  {visibilities.map((v) => (
                    <option key={v} value={v}>
                      {VISIBILITY_CONFIG[v].label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-2.5 top-2.5 pointer-events-none material-symbols-outlined text-[14px] text-slate-400">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t(
                  "runtime.components.shared.discussion.components.new-thread-modal.text_category",
                )}{" "}
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ThreadCategory)}
                  className="w-full h-9 pl-3 pr-8 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#1B3C53] cursor-pointer"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-2.5 top-2.5 pointer-events-none material-symbols-outlined text-[14px] text-slate-400">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Visibility Description */}
          <div
            className={`px-3 py-2 rounded-lg text-[10px] ${VISIBILITY_CONFIG[visibility].bgColor} ${VISIBILITY_CONFIG[visibility].color}`}
          >
            <span className="material-symbols-outlined text-[12px] mr-1 align-middle">
              {VISIBILITY_CONFIG[visibility].icon}
            </span>
            {VISIBILITY_CONFIG[visibility].description}
          </div>

          {/* Content */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t(
                "runtime.components.shared.discussion.components.new-thread-modal.text_message",
              )}{" "}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(
                "runtime.components.shared.discussion.components.new-thread-modal.placeholder_describe_your_topic_or_concern",
              )}
              className="w-full px-3 py-2 text-xs text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 resize-none"
              rows={5}
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 pb-1">
            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[16px]">attach_file</span>
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[16px]">link</span>
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[16px]">functions</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-4 text-[11px] font-medium text-slate-600 hover:text-slate-800 rounded-md hover:bg-slate-200 transition-colors"
          >
            {t("runtime.components.shared.discussion.components.new-thread-modal.text_cancel")}{" "}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className="h-8 px-4 bg-[#1B3C53] hover:bg-[#234C6A] disabled:bg-slate-300 text-white text-[11px] font-bold rounded-md transition-colors disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
            {t(
              "runtime.components.shared.discussion.components.new-thread-modal.text_start_discussion",
            )}{" "}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
