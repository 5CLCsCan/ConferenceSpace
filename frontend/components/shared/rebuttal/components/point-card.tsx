"use client"

import { useState } from "react"

import { CATEGORY_CONFIG } from "../config"
import type { PointCardProps, ResponseStatus } from "../types"
import { StatusBadge } from "./status-badge"

export function PointCard({
  point,
  reviewer,
  userRole,
  onMarkStatus,
  onAddNote,
  readOnly = false,
}: PointCardProps) {
  const [acknowledgmentNote, setAcknowledgmentNote] = useState("")
  const [showNoteInput, setShowNoteInput] = useState(false)
  const category = CATEGORY_CONFIG[point.category]
  const isCurrentUserPoint = reviewer.isCurrentUser
  const isPending = point.status === "pending_review"

  // Reviewers can only mark status on their own points
  const canMarkStatus = userRole === "reviewer" && isCurrentUserPoint && isPending && !readOnly
  // Chairs can mark any point
  const canChairMarkStatus = userRole === "chair" && isPending && !readOnly

  const showActions = canMarkStatus || canChairMarkStatus

  const handleMarkStatus = (status: ResponseStatus) => {
    onMarkStatus?.(status)
    if (acknowledgmentNote && onAddNote) {
      onAddNote(acknowledgmentNote)
    }
    setShowNoteInput(false)
    setAcknowledgmentNote("")
  }

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
        isPending && isCurrentUserPoint ? "border-[#1B3C53]/30 shadow-sm" : "border-slate-200"
      }`}
    >
      {/* Header: Original Comment */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span 
              className={`material-symbols-outlined mt-0.5 ${category.color}`}
              style={{ 
                fontSize: '16px', 
                width: '16px', 
                height: '16px', 
                maxWidth: '16px', 
                maxHeight: '16px',
                minWidth: '16px',
                minHeight: '16px',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: 'none',
                boxSizing: 'border-box'
              }}
            >
              {category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {point.section || category.label}
                </span>
                <span className="text-[9px] text-slate-400">from {reviewer.anonymousId}</span>
                <StatusBadge status={point.status} />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{point.originalComment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Response */}
      {point.authorResponse && (
        <div className="px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="text-[9px] font-bold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500">Author Response</span>
                <span className="text-[9px] text-slate-400">
                  {point.characterCount?.toLocaleString()} chars
                </span>
              </div>
              <p
                className="text-xs text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: point.authorResponse.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="text-emerald-600">$1</strong>',
                  ),
                }}
              />
            </div>
          </div>

          {/* Reviewer Acknowledgment */}
          {point.reviewerAcknowledgment?.acknowledged && (
            <div className="mt-3 ml-9 pl-3 border-l-2 border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Reviewer Response
                </span>
                {point.reviewerAcknowledgment.satisfactory && (
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Satisfied
                  </span>
                )}
              </div>
              {point.reviewerAcknowledgment.note && (
                <p className="text-[11px] text-slate-600 italic">
                  {point.reviewerAcknowledgment.note}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="mt-4 ml-9">
              {!showNoteInput ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkStatus("addressed")}
                    className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1"
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '16px', 
                        width: '16px', 
                        height: '16px', 
                        maxWidth: '16px', 
                        maxHeight: '16px',
                        minWidth: '16px',
                        minHeight: '16px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: 'none',
                        boxSizing: 'border-box'
                      }}
                    >check</span>
                    Addressed
                  </button>
                  <button
                    onClick={() => handleMarkStatus("partially_addressed")}
                    className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1"
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '16px', 
                        width: '16px', 
                        height: '16px', 
                        maxWidth: '16px', 
                        maxHeight: '16px',
                        minWidth: '16px',
                        minHeight: '16px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: 'none',
                        boxSizing: 'border-box'
                      }}
                    >timelapse</span>
                    Partial
                  </button>
                  <button
                    onClick={() => handleMarkStatus("not_addressed")}
                    className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '16px', 
                        width: '16px', 
                        height: '16px', 
                        maxWidth: '16px', 
                        maxHeight: '16px',
                        minWidth: '16px',
                        minHeight: '16px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: 'none',
                        boxSizing: 'border-box'
                      }}
                    >close</span>
                    Not Addressed
                  </button>
                  <button
                    onClick={() => setShowNoteInput(true)}
                    className="h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ 
                        fontSize: '16px', 
                        width: '16px', 
                        height: '16px', 
                        maxWidth: '16px', 
                        maxHeight: '16px',
                        minWidth: '16px',
                        minHeight: '16px',
                        lineHeight: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: 'none',
                        boxSizing: 'border-box'
                      }}
                    >add_comment</span>
                    Add Note
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={acknowledgmentNote}
                    onChange={(e) => setAcknowledgmentNote(e.target.value)}
                    placeholder="Add a note to your response..."
                    className="w-full px-3 py-2 text-xs text-slate-700 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1B3C53] resize-none"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowNoteInput(false)}
                      className="h-7 px-3 text-[10px] font-medium text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleMarkStatus("addressed")}
                      className="h-7 px-3 text-[10px] font-medium bg-[#1B3C53] text-white rounded-md hover:bg-[#234C6A]"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
