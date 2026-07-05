"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { formatDate } from "@/lib/utils"
import { useCompletedReviews } from "@/hooks/use-completed-reviews"
import { ROUTES } from "@/lib/routes"
import { useDebounce } from "@/hooks/use-debounce"

const PAGE_SIZE = 8

interface CompletedReviewsProps {
  reviewerId?: string
  onSelectPaper?: (paperId: string, conferenceId: string) => void
}

type SortOption = "date" | "title"

export function CompletedReviews({ reviewerId, onSelectPaper }: CompletedReviewsProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const debouncedSearch = useDebounce(searchQuery, 500)

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const { reviews, total, isLoading, error } = useCompletedReviews(reviewerId ?? null, {
    search: debouncedSearch,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "date") {
      const comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      return sortOrder === "asc" ? -comparison : comparison
    }
    const comparison = a.title.localeCompare(b.title)
    return sortOrder === "asc" ? comparison : -comparison
  })

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }

  const handleSelect = (paperId: string, conferenceId: string) => {
    if (onSelectPaper) return onSelectPaper(paperId, conferenceId)
    const conferenceParam = conferenceId ? `?conferenceId=${conferenceId}` : ""
    router.push(`${ROUTES.REVIEWER.ASSIGNMENT(paperId)}${conferenceParam}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
          {t("dashboard.roles.reviewer.nav.completedReviews")}
        </h1>
        <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
          {t("dashboard.roles.reviewer.completedReviews.description")}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative group">
          <span
            className="material-symbols-outlined absolute left-2.5 top-1/2 text-slate-400 group-focus-within:text-[#1B3C53] transition-colors"
            style={{
              fontSize: "14px",
              width: "14px",
              height: "14px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "translateY(-50%)",
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder={t("dashboard.roles.reviewer.completedReviews.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-64 h-8 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 tracking-wider">
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          <span className="text-[10px] normal-case">
            {t("runtime.components.reviewer.completed-reviews.text_sort_by")}
          </span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-") as [SortOption, "asc" | "desc"]
              setSortBy(s)
              setSortOrder(o)
            }}
            className="bg-transparent border-none text-[#1B3C53] dark:text-white font-semibold uppercase tracking-wider focus:ring-0 p-0 cursor-pointer text-[10px] pr-8"
          >
            <option value="date-desc">
              {t("runtime.components.reviewer.completed-reviews.text_date")}{" "}
              {t("runtime.components.reviewer.completed-reviews.text_newest")}
            </option>
            <option value="date-asc">
              {t("runtime.components.reviewer.completed-reviews.text_date")}{" "}
              {t("runtime.components.reviewer.completed-reviews.text_oldest")}
            </option>
            <option value="title-asc">
              {t("runtime.components.reviewer.completed-reviews.text_title")}{" "}
              {t("runtime.components.reviewer.completed-reviews.text_a_z")}
            </option>
            <option value="title-desc">
              {t("runtime.components.reviewer.completed-reviews.text_title")}{" "}
              {t("runtime.components.reviewer.completed-reviews.text_z_a")}
            </option>
          </select>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t("runtime.components.reviewer.completed-reviews.text_clear")}{" "}
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-xs font-medium">
              {t("runtime.components.reviewer.completed-reviews.text_loading_completed_reviews")}
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {t("dashboard.reviewer.completedReviews.loadError")}
            </p>
            <p className="text-[10px] font-medium text-slate-400 text-center max-w-xs">{error}</p>
          </div>
        ) : !reviewerId ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1">
              {t("dashboard.reviewer.completedReviews.missingReviewer")}
            </p>
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px] text-slate-400 dark:text-slate-500">
                task_alt
              </span>
            </div>
            <p className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1">
              {debouncedSearch
                ? t("dashboard.roles.reviewer.completedReviews.noResults")
                : t("dashboard.roles.reviewer.completedReviews.noCompletedReviews")}
            </p>
            <p className="text-[10px] font-medium text-slate-400 text-center max-w-xs">
              {debouncedSearch
                ? t("dashboard.roles.reviewer.completedReviews.noResultsDescription")
                : t("dashboard.roles.reviewer.completedReviews.noCompletedReviewsDescription")}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="py-2.5 pl-4 pr-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-10">
                      #
                    </th>
                    <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("runtime.components.reviewer.completed-reviews.text_paper")}{" "}
                    </th>
                    <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-28">
                      {t("runtime.components.reviewer.completed-reviews.text_version")}{" "}
                    </th>
                    <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-36">
                      {t("dashboard.roles.reviewer.completedReviews.completedOn")}
                    </th>
                    <th className="py-2.5 px-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 w-24">
                      {t("runtime.components.reviewer.completed-reviews.text_action")}{" "}
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Table Body */}
            <table className="w-full">
              <tbody>
                {sortedReviews.map((review, index) => (
                  <tr
                    key={review.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors group cursor-pointer"
                    onClick={() => handleSelect(review.id, review.conference_id)}
                  >
                    {/* Index */}
                    <td className="py-3 pl-4 pr-2 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 w-10">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>

                    {/* Paper Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-bold leading-[1.3] tracking-tight text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors">
                            {review.title}
                          </h4>
                          {review.keywords && review.keywords.length > 0 && (
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                              {review.keywords.slice(0, 5).join(" / ")}
                              {review.keywords.length > 5 && ` +${review.keywords.length - 5}`}
                            </p>
                          )}
                        </div>
                        {/* Completed badge */}
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                          {t("runtime.components.reviewer.completed-reviews.text_done")}{" "}
                        </span>
                      </div>
                    </td>

                    {/* Version */}
                    <td className="py-3 px-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 w-28">
                      v{review.version}
                    </td>

                    {/* Completed On */}
                    <td className="py-3 px-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 w-36">
                      {formatDate(review.updated_at)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right w-24">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect(review.id, review.conference_id)
                        }}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#1B3C53] hover:bg-[#234C6A] text-white text-[9px] font-bold uppercase tracking-wider transition-colors"
                      >
                        {t("runtime.components.reviewer.completed-reviews.text_view")}{" "}
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "12px", lineHeight: "1" }}
                        >
                          chevron_right
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t("runtime.components.reviewer.completed-reviews.text_showing")}{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}–
              {Math.min(currentPage * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-bold text-[#1B3C53] dark:text-white">{total}</span> completed
            {total === 1 ? " review" : " reviews"}
            {debouncedSearch && (
              <>
                {" "}
                {t("runtime.components.reviewer.completed-reviews.text_for_ldquo")}
                <span className="font-medium">{debouncedSearch}</span>
                {t("runtime.components.reviewer.completed-reviews.text_rdquo")}
              </>
            )}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t("runtime.components.reviewer.completed-reviews.text_previous")}
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-8 min-w-[32px] rounded-md text-[11px] font-bold transition-colors ${
                      currentPage === page
                        ? "bg-[#1B3C53] text-white"
                        : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t("runtime.components.reviewer.completed-reviews.text_next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
