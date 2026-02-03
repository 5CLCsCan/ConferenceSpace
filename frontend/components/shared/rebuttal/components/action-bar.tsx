"use client"

import type { ActionBarProps } from "../types"

export function ActionBar({
  hasUpdates,
  userRole,
  onUpdateReview,
  onSubmitRebuttal,
  onStartDiscussion,
}: ActionBarProps) {
  return (
    <div className="sticky bottom-6 z-20 bg-white border border-slate-200 p-4 rounded-xl shadow-lg mt-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1B3C53]/10 text-[#1B3C53] p-2 rounded-lg">
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
            >rate_review</span>
          </div>
          <div className="text-[12px]">
            <span className="block font-bold text-[#141414]">
              {userRole === "author" ? "Rebuttal Actions" : "Review Actions"}
            </span>
            <span className="text-slate-500">
              {userRole === "author"
                ? "Submit your response to reviewer comments"
                : hasUpdates
                  ? "You have pending acknowledgments to submit"
                  : "Mark responses and update your assessment"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {userRole !== "author" && (
            <button
              onClick={onStartDiscussion}
              className="flex-1 md:flex-none h-8 px-4 rounded-md border border-slate-300 text-slate-700 font-medium text-[11px] hover:bg-slate-50 transition-colors"
            >
              Start Discussion
            </button>
          )}

          {userRole === "author" ? (
            <button
              onClick={onSubmitRebuttal}
              className="flex-1 md:flex-none h-8 px-4 rounded-md bg-[#1B3C53] hover:bg-[#234C6A] text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
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
              >send</span>
              Submit Rebuttal
            </button>
          ) : (
            <button
              onClick={onUpdateReview}
              className="flex-1 md:flex-none h-8 px-4 rounded-md bg-[#1B3C53] hover:bg-[#234C6A] text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
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
              >edit</span>
              Update Review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
