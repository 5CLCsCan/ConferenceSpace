"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import type { AcademicPaper, AcademicProfile } from "@/lib/api/user"
import { AcademicStateCallout } from "@/components/profile/profile-academic-callout"
import { PublicationCard } from "@/components/profile/publication-card"
import { BookOpen, Search } from "lucide-react"

const INITIAL_VISIBLE = 8
type PaperSort = "newest" | "cited"

export function ProfilePublicationsSection({
  academicProfile,
  authorName,
  locale,
  t,
}: {
  academicProfile: AcademicProfile | null
  authorName?: string
  locale: string
  t: (key: string) => string
}) {
  const [paperQuery, setPaperQuery] = useState("")
  const [paperSort, setPaperSort] = useState<PaperSort>("newest")
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const deferredQuery = useDeferredValue(paperQuery)

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE)
  }, [academicProfile?.papers, deferredQuery, paperSort])

  const filteredPapers = useMemo(() => {
    if (!academicProfile?.papers?.length) return []
    const query = deferredQuery.trim().toLowerCase()
    const papers = [...academicProfile.papers]

    if (paperSort === "cited") {
      papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    } else {
      papers.sort((a, b) => {
        if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0)
        return (b.citationCount || 0) - (a.citationCount || 0)
      })
    }
    if (!query) return papers
    return papers.filter((p) =>
      [p.title, p.abstract, p.venue, ...(p.authors?.map((a) => a.name) || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
  }, [academicProfile?.papers, deferredQuery, paperSort])

  const visiblePapers = useMemo(
    () => filteredPapers.slice(0, visibleCount),
    [filteredPapers, visibleCount],
  )

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
              {t("runtime.app.profile.user_id.page.text_publications")}
            </h2>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              {academicProfile?.papers?.length
                ? t("runtime.app.profile.user_id.page.text_showing_publications_summary")
                    .replace("{visible}", String(visiblePapers.length))
                    .replace("{total}", String(filteredPapers.length))
                : t("runtime.app.profile.user_id.page.text_publications_description")}
            </p>
          </div>
          {academicProfile?.papers?.length ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  style={{ fontSize: "14px" }}
                >
                  search
                </span>
                <input
                  value={paperQuery}
                  onChange={(e) => setPaperQuery(e.target.value)}
                  className="h-8 w-52 pl-8 pr-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53] transition-all"
                  placeholder={t(
                    "runtime.app.profile.user_id.page.placeholder_search_publications",
                  )}
                />
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
                {(["newest", "cited"] as PaperSort[]).map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    onClick={() => setPaperSort(sort)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${paperSort === sort ? "bg-white dark:bg-slate-600 shadow-sm text-[#1B3C53] dark:text-white" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {sort === "newest"
                      ? t("runtime.app.profile.user_id.page.text_sort_newest")
                      : t("runtime.app.profile.user_id.page.text_sort_most_cited")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {visiblePapers.length > 0 ? (
          <>
            {visiblePapers.map((paper) => (
              <PublicationCard
                key={paper.paperId}
                paper={paper}
                authorName={authorName}
                locale={locale}
                citationsLabel={t("runtime.app.profile.user_id.page.text_citations")}
                authorsLabel={t("runtime.app.profile.user_id.page.text_authors")}
                abstractLabel={t("runtime.app.profile.user_id.page.text_abstract")}
                unavailableLabel={t("runtime.app.profile.user_id.page.text_not_available")}
                viewLabel={t("runtime.app.profile.user_id.page.text_view")}
              />
            ))}
            {filteredPapers.length > visibleCount && (
              <div className="flex justify-center py-3">
                <button
                  className="h-8 px-4 rounded-full border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-[#1B3C53] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE)}
                >
                  {t("runtime.app.profile.user_id.page.text_show_more_publications")}
                </button>
              </div>
            )}
          </>
        ) : academicProfile?.papers?.length ? (
          <AcademicStateCallout
            icon={<Search className="h-4 w-4" />}
            title={t("runtime.app.profile.user_id.page.text_no_matching_publications")}
            description={t(
              "runtime.app.profile.user_id.page.text_try_a_different_search_term_for_publications",
            )}
          />
        ) : academicProfile ? (
          <AcademicStateCallout
            icon={<BookOpen className="h-4 w-4" />}
            title={t("runtime.app.profile.user_id.page.text_no_publications_available")}
            description={t(
              "runtime.app.profile.user_id.page.text_profile_linked_but_no_publications_are",
            )}
          />
        ) : (
          <AcademicStateCallout
            icon={<BookOpen className="h-4 w-4" />}
            title={t("runtime.app.profile.user_id.page.text_publications")}
            description={t("runtime.app.profile.user_id.page.text_publications_empty_state")}
          />
        )}
      </div>
    </div>
  )
}
