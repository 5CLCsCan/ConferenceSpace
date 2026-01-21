"use client"

import { useState } from "react"
import { MOCK_DISCUSSION_THREADS } from "./mock-data"

export function DiscussionTab() {
  const [filter, setFilter] = useState<"all" | "reviewers" | "chairs">("all")

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <span className="text-sm font-medium text-neutral-500 mr-2 whitespace-nowrap">
            Filter by:
          </span>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-colors ${
              filter === "all"
                ? "bg-[#1e3a8a] text-white ring-1 ring-[#1e3a8a]"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setFilter("reviewers")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === "reviewers"
                ? "bg-[#1e3a8a] text-white ring-1 ring-[#1e3a8a]"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            Reviewers
          </button>
          <button
            onClick={() => setFilter("chairs")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === "chairs"
                ? "bg-[#1e3a8a] text-white ring-1 ring-[#1e3a8a]"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            Chairs
          </button>
        </div>
        <button className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-blue-900 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add_comment</span>
          Start New Topic
        </button>
      </div>

      {/* Discussion Threads */}
      <div className="space-y-6">
        {MOCK_DISCUSSION_THREADS.filter((thread) => {
          if (filter === "all") return true
          if (filter === "reviewers") return thread.author.role === "reviewer"
          if (filter === "chairs") return thread.author.role === "chair"
          return true
        }).map((thread) => (
          <div
            key={thread.id}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
          >
            {/* Thread Header */}
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-neutral-400 text-[20px]">
                  forum
                </span>
                <h3 className="font-bold text-[#141414] text-sm">{thread.threadTitle}</h3>
              </div>
              <span className="text-xs font-medium text-neutral-400">
                Thread ID: {thread.threadId}
              </span>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-6">
              {/* Original Message */}
              <div className="flex gap-4">
                <div
                  className={`shrink-0 size-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-sm ${
                    thread.author.role === "reviewer"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : thread.author.role === "chair"
                        ? "bg-purple-100 text-purple-700 border-purple-200"
                        : "bg-slate-200"
                  }`}
                >
                  {thread.author.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <h4 className="font-bold text-sm text-[#141414]">{thread.author.name}</h4>
                    <span className="text-xs text-neutral-400">{thread.timestamp}</span>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-lg rounded-tl-none border border-neutral-100 text-sm text-neutral-700 leading-relaxed">
                    {thread.content}
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <button className="text-xs font-medium text-neutral-500 hover:text-[#1e3a8a] flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">reply</span> Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {thread.replies?.map((reply) => (
                <div key={reply.id} className="flex gap-4 pl-8 relative">
                  <div className="absolute left-4 top-0 bottom-full w-px bg-neutral-200 -z-10 h-full"></div>
                  <div className="absolute left-4 top-5 w-4 h-px bg-neutral-200"></div>
                  <div className="shrink-0 size-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-sm">
                    {reply.author.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#141414]">{reply.author.name}</h4>
                        {reply.author.role === "author" && (
                          <span className="bg-[#1e3a8a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                            Author
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">{reply.timestamp}</span>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-lg rounded-tl-none border border-blue-100 text-sm text-neutral-800 leading-relaxed">
                      {reply.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Message Composer */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 relative">
        <h3 className="text-sm font-bold text-[#141414] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1e3a8a]">edit_note</span>
          Draft New Message
        </h3>
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-10 bg-neutral-50 border-b border-neutral-200 rounded-t-lg flex items-center px-2 gap-1 text-neutral-500">
            <button className="p-1.5 hover:bg-neutral-200 rounded transition-colors" title="Bold">
              <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button className="p-1.5 hover:bg-neutral-200 rounded transition-colors" title="Italic">
              <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
            <div className="w-px h-4 bg-neutral-300 mx-1"></div>
            <button className="p-1.5 hover:bg-neutral-200 rounded transition-colors" title="List">
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            </button>
            <button className="p-1.5 hover:bg-neutral-200 rounded transition-colors" title="Link">
              <span className="material-symbols-outlined text-[18px]">link</span>
            </button>
          </div>
          <textarea
            className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] text-sm pt-12 p-4 h-32 resize-none"
            placeholder="Type your message here... select a recipient or thread above to reply."
          ></textarea>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Visible to Reviewers &amp; Chairs</span>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-[#141414] transition-colors">
              Discard
            </button>
            <button className="px-5 py-2 text-sm font-bold bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-900 shadow-sm transition-colors flex items-center gap-2">
              Send Message
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
