"use client"

import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"

// Mock data for the dashboard
const MOCK_STATS = {
  pending: 12,
  urgent: 3,
  invites: 2,
  completed: 45,
}

const MOCK_URGENT_PAPER = {
  id: "#4492",
  conference: "CVPR 2024",
  title:
    "Generative Adversarial Networks for High-Fidelity Audio Synthesis in Low-Resource Environments",
  track: "Computer Vision",
  status: "In Progress" as const,
  dueLabel: "Due Tomorrow",
}

const MOCK_ASSIGNED_PAPERS = [
  {
    id: 1,
    conference: "ICLR 2024",
    assignedAgo: "3 days ago",
    title:
      "Efficient Transformer Architectures for Mobile Devices: A Comprehensive Benchmark Study",
    abstract:
      "This paper proposes a novel lightweight attention mechanism that reduces computational complexity from O(n^2) to O(n log n) without significant accuracy loss on standard benchmarks including ImageNet and COCO...",
    tags: ["Deep Learning", "Mobile AI"],
    deadline: "Oct 24, 2024",
    status: "Not Started" as const,
    actionLabel: "Review",
  },
  {
    id: 2,
    conference: "CVPR 2024",
    assignedAgo: "1 week ago",
    title: "Unsupervised Domain Adaptation via Feature Alignment and Pseudo-Labeling",
    abstract:
      "We address the problem of unsupervised domain adaptation in semantic segmentation. Our approach leverages a dual-branch network structure to align features both globally and locally...",
    tags: ["Computer Vision", "Unsupervised Learning"],
    deadline: "Oct 28, 2024",
    status: "Submitted" as const,
    actionLabel: "View Details",
  },
]

/**
 * Reviewer Dashboard - Main overview page
 * Shows stats, urgent papers, and assigned papers list
 */
export function ReviewerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("deadline")

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white">
            Reviewer Dashboard
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Manage your paper reviews and track upcoming deadlines.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers, IDs, or tracks..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#234C6A]/20 focus:border-[#234C6A] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#1B3C53]/5 dark:bg-[#1B3C53]/20 text-[#1B3C53] dark:text-slate-300 rounded-lg group-hover:bg-[#1B3C53]/10 dark:group-hover:bg-[#1B3C53]/30 transition-colors">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Pending
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#1B3C53] dark:text-white block">
              {MOCK_STATS.pending}
            </span>
            <span className="text-xs font-medium text-slate-500">Papers to review</span>
          </div>
        </div>

        {/* Urgent */}
        <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
              <span className="material-symbols-outlined">timer</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Urgent
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#1B3C53] dark:text-white block">
              {MOCK_STATS.urgent}
            </span>
            <span className="text-xs font-medium text-slate-500">Due &lt; 48 hours</span>
          </div>
        </div>

        {/* Invites */}
        <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Invites
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#1B3C53] dark:text-white block">
              {MOCK_STATS.invites}
            </span>
            <span className="text-xs font-medium text-slate-500">Waiting response</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Completed
            </span>
          </div>
          <div>
            <span className="text-3xl font-bold text-[#1B3C53] dark:text-white block">
              {MOCK_STATS.completed}
            </span>
            <span className="text-xs font-medium text-slate-500">Reviews submitted</span>
          </div>
        </div>
      </div>

      {/* Urgent Attention Needed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            priority_high
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wide">Urgent Attention Needed</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm overflow-hidden hover:border-red-200 dark:hover:border-red-900/50 transition-colors">
          <div className="px-4 pt-4 pb-3 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-600 tracking-wide">
                  {MOCK_URGENT_PAPER.conference}
                </span>
                <span className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold border border-red-100 dark:border-red-900/30 tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">timer</span>
                  {MOCK_URGENT_PAPER.dueLabel}
                </span>
              </div>
              <h4 className="text-sm font-bold leading-[1.2] tracking-tight text-[#1B3C53] dark:text-white mb-1 hover:text-[#234C6A] dark:hover:text-slate-300 transition-colors cursor-pointer">
                {MOCK_URGENT_PAPER.title}
              </h4>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">tag</span>
                  ID: {MOCK_URGENT_PAPER.id}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">category</span>
                  {MOCK_URGENT_PAPER.track}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between w-full md:w-auto gap-6 pl-0 md:pl-6 md:border-l border-slate-100 dark:border-slate-700">
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Status</div>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-500">
                    {MOCK_URGENT_PAPER.status}
                  </span>
                </div>
              </div>
              <button className="h-8 px-3 text-[11px] font-medium bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] rounded-full hover:shadow-lg hover:bg-[#234C6A] dark:hover:bg-slate-200 transition-all shrink-0 border">
                Continue Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Papers */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-2">
          <h3 className="text-xl font-bold tracking-tight text-[#1B3C53] dark:text-white">
            Assigned Papers
          </h3>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 focus:ring-[#234C6A] focus:border-[#234C6A] cursor-pointer shadow-sm"
            >
              <option value="deadline">Sort by: Deadline (Soonest)</option>
              <option value="id">Sort by: ID</option>
              <option value="status">Sort by: Status</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
              arrow_drop_down
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {MOCK_ASSIGNED_PAPERS.map((paper) => (
            <div
              key={paper.id}
              className="group bg-white dark:bg-slate-800 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-[#234C6A]/30 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B3C53]/5 dark:bg-slate-700 text-[#1B3C53] dark:text-slate-200 border border-[#1B3C53]/10 dark:border-slate-600">
                      {paper.conference}
                    </span>
                    <span className="text-xs text-slate-400">-</span>
                    <span className="text-xs text-slate-500">Assigned {paper.assignedAgo}</span>
                  </div>
                  <h4 className="text-sm font-bold leading-[1.2] tracking-tight text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-300 transition-colors cursor-pointer">
                    {paper.title}
                  </h4>
                  <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">
                    {paper.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {paper.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-700 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 min-w-[140px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                      Deadline
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {paper.deadline}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                      Status
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        paper.status === "Submitted"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600"
                      }`}
                    >
                      {paper.status}
                    </span>
                  </div>
                  <button
                    className={`mt-auto w-full md:w-auto h-8 px-3 text-[11px] font-medium rounded-full transition-colors shadow-sm border ${
                      paper.status === "Submitted"
                        ? "border-slate-200 dark:border-slate-600 text-slate-500 hover:text-[#1B3C53] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                        : "bg-white border-slate-200 dark:border-slate-600 text-[#1B3C53] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {paper.actionLabel}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
