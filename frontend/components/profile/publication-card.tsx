import type { AcademicPaper } from "@/lib/api/user"

export function formatPublicationAuthors(
  authors: AcademicPaper["authors"],
  currentAuthorName?: string,
) {
  if (!authors?.length) return null

  const visibleAuthors = authors
    .map((a) => a.name)
    .filter(Boolean)
    .filter((name, i, list) => list.indexOf(name) === i)

  if (visibleAuthors.length === 0) return null

  const ordered =
    currentAuthorName && visibleAuthors.includes(currentAuthorName)
      ? [currentAuthorName, ...visibleAuthors.filter((n) => n !== currentAuthorName)]
      : visibleAuthors

  return ordered.length <= 4
    ? ordered.join(", ")
    : `${ordered.slice(0, 4).join(", ")} +${ordered.length - 4}`
}

export function PublicationCard({
  paper,
  authorName,
  locale,
  citationsLabel,
  authorsLabel,
  abstractLabel,
  unavailableLabel,
  viewLabel,
}: {
  paper: AcademicPaper
  authorName?: string
  locale: string
  citationsLabel: string
  authorsLabel: string
  abstractLabel: string
  unavailableLabel: string
  viewLabel: string
}) {
  const publicationAuthors = formatPublicationAuthors(paper.authors, authorName)
  const citationCount = paper.citationCount ?? 0
  const yearLabel = paper.year || unavailableLabel
  const venueLabel = paper.venue?.trim() || unavailableLabel

  return (
    <article className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 pt-4 pb-3 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-bold leading-[1.3] tracking-tight text-[#1B3C53] dark:text-white line-clamp-2">
            {paper.title}
          </h3>
          {publicationAuthors && (
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">
              {publicationAuthors}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {yearLabel}
            </span>
            <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {citationCount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}{" "}
              {citationsLabel.toLowerCase()}
            </span>
            <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#456882] dark:text-slate-300 max-w-[200px] truncate">
              {venueLabel}
            </span>
          </div>
        </div>
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-7 px-2.5 rounded-md bg-transparent border border-slate-200 dark:border-slate-600 text-[9px] font-bold uppercase tracking-wider text-[#1B3C53] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined mr-1" style={{ fontSize: "12px" }}>
              open_in_new
            </span>
            {viewLabel}
          </a>
        )}
      </div>
      {paper.abstract?.trim() && (
        <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
          <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {paper.abstract}
          </p>
        </div>
      )}
    </article>
  )
}
