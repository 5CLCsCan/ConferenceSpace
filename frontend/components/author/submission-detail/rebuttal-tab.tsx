"use client"

import { useState } from "react"
import { MOCK_REVIEWS } from "./mock-data"

export function RebuttalTab() {
  const [expandedReviewers, setExpandedReviewers] = useState<string[]>(["R1", "R2"])
  const [responses, setResponses] = useState<Record<string, string>>({})

  const toggleExpand = (id: string) => {
    setExpandedReviewers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const scoreColorClasses = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
  }

  const reviewerColorClasses = [
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-purple-100 text-purple-700 border-purple-200",
  ]

  return (
    <div className="space-y-8">
      {/* Deadline Warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
        <div className="bg-orange-100 text-orange-600 rounded-full p-1 shrink-0">
          <span className="material-symbols-outlined text-[20px]">timer</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-orange-900">Rebuttal Phase Ending Soon</h3>
          <p className="text-sm text-orange-800 mt-1 leading-relaxed">
            The rebuttal period closes on <strong>May 15, 2024 at 11:59 PM PST</strong>. You have 3
            days remaining to submit your responses. Please address the reviewers&apos; comments
            below. You can save a draft at any time.
          </p>
        </div>
      </div>

      {/* Reviewer Cards */}
      {MOCK_REVIEWS.map((review, idx) => {
        const isExpanded = expandedReviewers.includes(review.id)
        return (
          <div
            key={review.id}
            className={`bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden ${!isExpanded ? "opacity-60" : ""}`}
          >
            {/* Header */}
            <div
              className={`bg-neutral-50 border-b border-neutral-100 p-4 flex justify-between items-center ${!isExpanded ? "cursor-pointer hover:opacity-100 transition-opacity" : ""}`}
              onClick={() => !isExpanded && toggleExpand(review.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-full flex items-center justify-center font-bold text-sm border shadow-sm ${reviewerColorClasses[idx]}`}
                >
                  R{review.reviewerNum}
                </div>
                <div>
                  <h3 className="font-bold text-[#141414] text-sm">
                    Reviewer #{review.reviewerNum}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Confidence: {review.confidence} ({review.confidenceLevel})
                  </p>
                </div>
                <span
                  className={`ml-2 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide ${scoreColorClasses[review.scoreColor]}`}
                >
                  {review.scoreLabel} ({review.score})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isExpanded && (
                  <span className="text-xs text-neutral-400 font-medium">
                    Word Count: {responses[review.id]?.split(/\s+/).filter(Boolean).length || 0}
                    /1500
                  </span>
                )}
                {!isExpanded && (
                  <span className="text-xs text-neutral-400 font-medium">Click to expand</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(review.id)
                  }}
                  className="text-neutral-400 hover:text-[#1e3a8a] transition-colors p-1 rounded hover:bg-neutral-200"
                >
                  <span className="material-symbols-outlined">
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
            </div>

            {/* Content */}
            {isExpanded && (
              <>
                <div className="p-6 border-b border-neutral-100 bg-white">
                  <div className="prose prose-sm max-w-none text-neutral-600">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Review Summary
                    </h4>
                    <p className="mb-4">{review.summary}</p>
                    {review.questions && review.questions.length > 0 && (
                      <>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                          Questions for Rebuttal
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {review.questions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {review.weaknesses && review.weaknesses.length > 0 && (
                      <>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 mt-4">
                          Weaknesses
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {review.weaknesses.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                {/* Response Area */}
                <div className="p-6 bg-blue-50/20">
                  <label className="block text-sm font-bold text-[#1e3a8a] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    Your Response to Reviewer #{review.reviewerNum}
                  </label>
                  <div className="relative bg-white rounded-lg border border-neutral-300 shadow-sm focus-within:ring-2 focus-within:ring-[#1e3a8a] focus-within:border-[#1e3a8a] transition-all">
                    <div className="absolute top-0 left-0 right-0 h-10 bg-neutral-50 border-b border-neutral-200 rounded-t-lg flex items-center px-2 gap-1 text-neutral-500 z-10">
                      <button
                        className="p-1.5 hover:bg-neutral-200 rounded transition-colors hover:text-[#1e3a8a]"
                        title="Bold"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_bold</span>
                      </button>
                      <button
                        className="p-1.5 hover:bg-neutral-200 rounded transition-colors hover:text-[#1e3a8a]"
                        title="Italic"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_italic</span>
                      </button>
                      <div className="w-px h-4 bg-neutral-300 mx-1"></div>
                      <button
                        className="p-1.5 hover:bg-neutral-200 rounded transition-colors hover:text-[#1e3a8a]"
                        title="List"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          format_list_bulleted
                        </span>
                      </button>
                      <button
                        className="p-1.5 hover:bg-neutral-200 rounded transition-colors hover:text-[#1e3a8a]"
                        title="Link"
                      >
                        <span className="material-symbols-outlined text-[18px]">link</span>
                      </button>
                      <button
                        className="p-1.5 hover:bg-neutral-200 rounded transition-colors hover:text-[#1e3a8a]"
                        title="Quote"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_quote</span>
                      </button>
                    </div>
                    <textarea
                      className="w-full rounded-lg border-0 bg-transparent text-sm pt-12 p-4 h-48 resize-none focus:ring-0"
                      placeholder="Write your response here. You can use Markdown formatting."
                      value={responses[review.id] || ""}
                      onChange={(e) =>
                        setResponses((prev) => ({ ...prev, [review.id]: e.target.value }))
                      }
                    ></textarea>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* Confidential Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500">lock</span>
            <h3 className="font-bold text-[#141414] text-sm">
              Confidential Comments to Area Chair
            </h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-xs text-neutral-500 mb-3">
            These comments are only visible to the Area Chair and Program Chairs. Use this space to
            raise concerns about conflicts of interest or reviewer misconduct if necessary.
          </p>
          <textarea
            className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] text-sm p-3 h-24 resize-none"
            placeholder="Optional confidential remarks..."
          ></textarea>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-280px)] bg-white border-t border-neutral-200 p-4 px-8 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
          <span>Draft saved automatically at 2:15 PM</span>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:text-[#141414] hover:bg-neutral-50 transition-colors border border-neutral-200 rounded-lg bg-white">
            Save Draft
          </button>
          <button className="px-6 py-2.5 text-sm font-bold bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-900 shadow-lg shadow-blue-900/20 transition-all hover:translate-y-[-1px] flex items-center gap-2">
            Submit Rebuttal
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  )
}
