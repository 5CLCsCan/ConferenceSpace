"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getConferenceById, getConferenceDates, type ImportantDate } from "@/lib/api/conferences"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceCFPProps {
  conferenceId: string
  className?: string
}

const iconStyle = {
  fontSize: "16px",
  width: "16px",
  height: "16px",
  maxWidth: "16px",
  maxHeight: "16px",
  minWidth: "16px",
  minHeight: "16px",
  lineHeight: "1",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexShrink: 0,
  transform: "none",
  boxSizing: "border-box" as const,
}

const RESOURCE_ITEMS = [
  {
    name: "LaTeX Template",
    description: "Official conference template",
    type: "latex",
    icon: "description",
  },
  {
    name: "Word Template",
    description: ".docx format",
    type: "word",
    icon: "picture_as_pdf",
  },
]

function CFPMarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="cfp-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[20px] font-bold text-[#1B3C53] dark:text-white mt-4 mb-2 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[18px] font-bold text-[#1B3C53] dark:text-white mt-4 mb-2 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[16px] font-bold text-[#1B3C53] dark:text-white mt-3 mb-1.5 tracking-tight">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[14px] font-bold text-[#1B3C53] dark:text-white mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="text-[12px] text-slate-500 dark:text-slate-400 list-disc pl-4 mb-2 space-y-0.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-[12px] text-slate-500 dark:text-slate-400 list-decimal pl-4 mb-2 space-y-0.5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-[12px] leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-700 dark:text-slate-300">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#1B3C53] pl-3 my-2 text-[12px] text-slate-400 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-[12px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-[12px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1.5 text-left border border-slate-200 dark:border-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 text-[12px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">
                  {children}
                </code>
              )
            }

            return (
              <code className="block bg-slate-50 dark:bg-slate-800 p-2 rounded text-[10px] font-mono overflow-x-auto">
                {children}
              </code>
            )
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-t border-slate-200 dark:border-slate-700 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function CFPContentCard({ content, conferenceName }: { content: string; conferenceName: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Call for Papers
          </h2>
          <p className="text-[9px] text-slate-400 mt-0.5">{conferenceName}</p>
        </div>
        <div className="flex gap-1">
          {["print", "picture_as_pdf", "share"].map((icon) => (
            <button
              key={icon}
              type="button"
              className="text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined" style={iconStyle}>
                {icon}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <CFPMarkdownRenderer content={content} />
      </div>
    </div>
  )
}

function CFPManagementCard() {
  return (
    <div className="bg-[#1B3C53] text-white p-4 rounded-xl shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -mr-6 -mt-6 pointer-events-none" />

      <div className="relative z-10">
        <h3 className="text-xs font-bold mb-3 tracking-tight">CFP Management</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-white/10 rounded-lg border border-white/10">
            <div>
              <div className="text-[8px] text-slate-300 uppercase tracking-widest font-bold">
                Status
              </div>
              <div className="font-bold text-white flex items-center gap-1 text-[11px] mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                Read Only
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2.5">
            <p className="text-[10px] text-slate-200 leading-relaxed">
              Publishing workflows remain API-backed and read-only. The legacy management shell is
              restored without changing current production behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImportantDatesCard({ dates }: { dates: ImportantDate[] }) {
  const normalizedDates = useMemo(() => {
    const upcomingIndex = dates.findIndex((item) => !item.isPast)

    return dates.map((item, index) => ({
      ...item,
      status:
        item.isPast
          ? "passed"
          : upcomingIndex === -1 || index !== upcomingIndex
            ? "upcoming"
            : "current",
    }))
  }, [dates])

  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          Important Dates
        </h3>
      </div>

      <div className="space-y-2.5 relative">
        <div className="absolute left-[9px] top-1.5 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

        {normalizedDates.length > 0 ? (
          normalizedDates.map((item) => (
            <div key={item.id} className="relative flex gap-2.5">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                  item.status === "passed" && "bg-slate-200 dark:bg-slate-700",
                  item.status === "current" &&
                    "bg-[#1B3C53] text-white shadow-md ring-2 ring-slate-50 dark:ring-slate-900",
                  item.status === "upcoming" &&
                    "bg-white border-2 border-slate-300 dark:border-slate-600",
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined",
                    item.status === "passed" && "text-slate-400",
                    item.status === "current" && "text-white",
                    item.status === "upcoming" && "text-slate-400",
                  )}
                  style={{
                    ...iconStyle,
                    fontSize: "12px",
                    width: "12px",
                    height: "12px",
                    maxWidth: "12px",
                    maxHeight: "12px",
                    minWidth: "12px",
                    minHeight: "12px",
                  }}
                >
                  {item.status === "passed"
                    ? "check"
                    : item.status === "current"
                      ? "event"
                      : "notifications"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[8px] uppercase font-bold tracking-widest",
                    item.status === "current"
                      ? "text-[#1B3C53] dark:text-blue-400"
                      : "text-slate-400",
                  )}
                >
                  {item.title}
                </p>
                <p
                  className={cn(
                    "text-[11px] font-semibold",
                    item.status === "passed"
                      ? "text-slate-400 line-through"
                      : "text-[#1B3C53] dark:text-white",
                  )}
                >
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">No dates available.</p>
        )}
      </div>
    </div>
  )
}

function AuthorResourcesCard() {
  const resourceColors: Record<string, { bg: string; text: string; hover: string }> = {
    latex: { bg: "bg-blue-50", text: "text-blue-600", hover: "group-hover:text-blue-700" },
    word: { bg: "bg-red-50", text: "text-red-600", hover: "group-hover:text-red-700" },
  }

  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-3 tracking-tight">
        Author Resources
      </h3>

      <ul className="space-y-1.5">
        {RESOURCE_ITEMS.map((resource) => {
          const colors = resourceColors[resource.type] || resourceColors.latex

          return (
            <li key={resource.name}>
              <a
                href="#"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div className={cn("p-1 rounded-md", colors.bg, colors.text)}>
                  <span className="material-symbols-outlined" style={iconStyle}>
                    {resource.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[10px] font-bold text-[#1B3C53] dark:text-white",
                      colors.hover,
                    )}
                  >
                    {resource.name}
                  </p>
                  <p className="text-[8px] text-slate-400">{resource.description}</p>
                </div>
                <span
                  className={cn("material-symbols-outlined text-slate-300", colors.hover)}
                  style={iconStyle}
                >
                  download
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ConferenceCFP({ conferenceId, className }: ConferenceCFPProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cfpContent, setCfpContent] = useState("")
  const [conferenceName, setConferenceName] = useState("Conference")
  const [dates, setDates] = useState<ImportantDate[]>([])

  useEffect(() => {
    async function loadCFP() {
      setLoading(true)
      setError(null)
      const [conferenceResponse, datesResponse] = await Promise.all([
        getConferenceById(conferenceId),
        getConferenceDates(conferenceId),
      ])

      if (conferenceResponse.error || !conferenceResponse.data) {
        setError(conferenceResponse.error || "Failed to load CFP")
        setLoading(false)
        return
      }

      setConferenceName(conferenceResponse.data.name)
      setCfpContent(
        conferenceResponse.data.call_for_paper_text ||
          `# Call for Papers\n\n${conferenceResponse.data.name}\n\nNo CFP content has been published yet.`,
      )
      setDates(datesResponse.data || [])
      setLoading(false)
    }

    void loadCFP()
  }, [conferenceId])

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        {t("runtime.components.chair.conference-detail.conference-cfp.text_loading_cfp")}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <CFPContentCard content={cfpContent} conferenceName={conferenceName} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <CFPManagementCard />
          <ImportantDatesCard dates={dates} />
          <AuthorResourcesCard />
        </div>
      </div>
    </div>
  )
}
