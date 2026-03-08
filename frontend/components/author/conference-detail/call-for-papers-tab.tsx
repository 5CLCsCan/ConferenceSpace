"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState, useRef } from "react"
import type { TabProps } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

// Consistent icon styling for 16px material symbols
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

// Mock CFP data - markdown content
const MOCK_CFP_CONTENT = `# Call for Papers

We invite submissions on all aspects of **Artificial Intelligence**.

## Topics of Interest

The conference welcomes both theoretical and applied contributions in the following areas:

- Machine Learning: Deep Learning
- Natural Language Processing
- Computer Vision & Robotics
- Multiagent Systems
- Knowledge Representation
- AI Ethics, Fairness & Trust
- Reasoning & Constraint Satisfaction
- AI for Social Impact
- Human-AI Collaboration
- Game Theory & Economic Paradigms

## Submission Types

We welcome the following types of submissions:

| Type | Page Limit | Description |
|------|------------|-------------|
| Full Paper | 7 pages (+2 refs) | Original research contributions |
| Short Paper | 4 pages | Preliminary results or work-in-progress |
| Demo Paper | 2 pages | System demonstrations |

## Submission Guidelines

This is a double-blind conference. All submissions must be anonymous and must not reveal the identity of the authors. Papers must be formatted in the two-column style.

### Key Requirements

- Papers must be no longer than 7 pages (plus up to 2 pages of references)
- Submissions must be in PDF format
- Supplementary material (code, data, proofs) can be uploaded separately
- Do not include author names or affiliations in the PDF

## Rebuttal Period

> Authors will have the opportunity to view and respond to reviews during the author feedback period. The purpose of this phase is to correct factual errors in the reviews and to answer specific questions raised by the reviewers.

For more details, please refer to the submission guidelines.
`

const MOCK_RESOURCES = [
  {
    name: "LaTeX Template",
    description: t(
      "runtime.components.author.conference-detail.call-for-papers-tab.prop_description_official_style_file",
    ),
    // description: "IEEE style file (.tex)",
    type: "latex",
    icon: "description",
    url: "/templates/ieee-latex-template.tex",
    filename: "ieee-latex-template.tex",
  },
  {
    name: "Word Template",
    description: "IEEE conference (.docx)",
    type: "word",
    icon: "picture_as_pdf",
    url: "/templates/ieee-word-template.docx",
    filename: "ieee-word-template.docx",
  },
  {
    name: "Word Template",
    description: t(
      "runtime.components.author.conference-detail.call-for-papers-tab.prop_description_docx_format",
    ),
    type: "word",
    icon: "picture_as_pdf",
  },
]

/**
 * Compact Markdown Renderer for CFP content
 * Uses Scholar-Compact sizing conventions (text-[12px] for body)
 */
function CFPMarkdownRenderer({ content }: { content: string }) {
  const { t } = useTranslation()
  return (
    <div className="cfp-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
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
          // Paragraphs
          p: ({ children }) => (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
              {children}
            </p>
          ),
          // Lists
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
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-700 dark:text-slate-300">{children}</strong>
          ),
          // Emphasis
          em: ({ children }) => <em className="italic">{children}</em>,
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#1B3C53] pl-3 my-2 text-[12px] text-slate-400 italic">
              {children}
            </blockquote>
          ),
          // Tables
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
          // Code
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
          // Links
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
          // Horizontal rule
          hr: () => <hr className="border-t border-slate-200 dark:border-slate-700 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function CFPContentCard({ conference }: TabProps) {
  const cfpContent = conference.call_for_paper_text || MOCK_CFP_CONTENT
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const el = contentRef.current
    if (!el) return
    const popup = window.open("", "_blank", "width=900,height=700,scrollbars=yes")
    if (!popup) return
    const title = conference.name || "Call for Papers"
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title} — Call for Papers</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; font-size: 13px; color: #1a1a1a; line-height: 1.6;
              max-width: 800px; margin: 40px auto; padding: 0 32px; }
            h1 { font-size: 24px; font-weight: 700; color: #1B3C53; margin-bottom: 6px; }
            .meta { font-size: 11px; color: #888; margin-bottom: 24px; }
            h2 { font-size: 17px; font-weight: 700; color: #1B3C53; margin: 20px 0 8px; }
            h3 { font-size: 14px; font-weight: 600; color: #234C6A; margin: 16px 0 6px; }
            p { margin: 8px 0; }
            ul, ol { padding-left: 20px; margin: 8px 0; }
            li { margin: 4px 0; }
            strong { font-weight: 600; }
            em { font-style: italic; }
            blockquote { border-left: 3px solid #1B3C53; padding-left: 12px; color: #555; margin: 10px 0; }
            hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
            code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 12px; font-family: monospace; }
            pre { background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; }
            a { color: #1B3C53; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
            th { background: #1B3C53; color: white; padding: 6px 10px; text-align: left; font-weight: 600; }
            td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
            @media print {
              body { margin: 20px; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="meta">Call for Papers${conference.submission_deadline ? ` &nbsp;·&nbsp; Submission Deadline: ${new Date(conference.submission_deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}</p>
          <hr />
          ${el.innerHTML}
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    // Give fonts/images time to load then print
    setTimeout(() => popup.print(), 600)
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t(
              "runtime.components.author.conference-detail.call-for-papers-tab.text_call_for_papers",
            )}{" "}
          </h2>
          {conference.submission_deadline && (
            <p className="text-[9px] text-slate-400 mt-0.5">
              {t(
                "runtime.components.author.conference-detail.call-for-papers-tab.text_submission_deadline",
              )}{" "}
              {new Date(conference.submission_deadline).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePrint}
            className="text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            title={t("runtime.components.author.conference-detail.call-for-papers-tab.title_print")}
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              print
            </span>
          </button>
          <button
            className="text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            title={t(
              "runtime.components.author.conference-detail.call-for-papers-tab.title_download_pdf",
            )}
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              picture_as_pdf
            </span>
          </button>
          <button
            onClick={handleShare}
            className="relative text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            title={
              copied
                ? t(
                    "runtime.components.author.conference-detail.call-for-papers-tab.title_share_success",
                  )
                : t("runtime.components.author.conference-detail.call-for-papers-tab.title_share")
            }
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              {copied ? "check" : "share"}
            </span>
          </button>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="p-4" ref={contentRef}>
        <CFPMarkdownRenderer content={cfpContent} />
      </div>
    </div>
  )
}

function ImportantDatesCard({ conference }: TabProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const calcDaysLeft = (dateStr?: string): number | null => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : null
  }

  const submissionDaysLeft = calcDaysLeft(conference.submission_deadline)

  const dates = [
    {
      label: t(
        "runtime.components.author.conference-detail.call-for-papers-tab.prop_label_abstract_deadline",
      ),
      date: conference.configurations?.abstract_submission_deadline,
      status: "passed" as const,
    },
    {
      label: t(
        "runtime.components.author.conference-detail.call-for-papers-tab.prop_label_full_paper_deadline",
      ),
      date: conference.submission_deadline,
      status: "current" as const,
      daysLeft: submissionDaysLeft,
    },
    {
      label: t(
        "runtime.components.author.conference-detail.call-for-papers-tab.prop_label_notification",
      ),
      date: conference.notification_date,
      status: "upcoming" as const,
    },
    {
      label: t(
        "runtime.components.author.conference-detail.call-for-papers-tab.prop_label_conference_dates",
      ),
      date: conference.conference_date,
      status: "upcoming" as const,
    },
  ].filter((d) => d.date)

  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          {t(
            "runtime.components.author.conference-detail.call-for-papers-tab.text_important_dates",
          )}{" "}
        </h3>
      </div>

      <div className="space-y-2.5 relative">
        {/* Timeline line */}
        <div className="absolute left-[9px] top-1.5 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

        {dates.map((item, idx) => (
          <div key={idx} className="relative flex gap-2.5">
            {/* Timeline dot */}
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
                  fontSize: "12px",
                  width: "12px",
                  height: "12px",
                }}
              >
                {item.status === "passed"
                  ? "check"
                  : item.status === "current"
                    ? "event"
                    : "notifications"}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[8px] uppercase font-bold tracking-widest",
                  item.status === "current"
                    ? "text-[#1B3C53] dark:text-blue-400"
                    : "text-slate-400",
                )}
              >
                {item.label}
              </p>
              <p
                className={cn(
                  "text-[11px] font-semibold",
                  item.status === "passed"
                    ? "text-slate-400 line-through"
                    : "text-[#1B3C53] dark:text-white",
                )}
              >
                {item.date &&
                  new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
              </p>
              {item.daysLeft != null && item.daysLeft > 0 && (
                <p className="text-[8px] text-red-500 font-medium mt-0.5">
                  {item.daysLeft}{" "}
                  {t(
                    "runtime.components.author.conference-detail.call-for-papers-tab.text_days_left",
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AuthorResourcesCard() {
  const resourceColors: Record<string, { bg: string; text: string; hover: string }> = {
    latex: {
      bg: "bg-blue-50",
      text: t(
        "runtime.components.author.conference-detail.call-for-papers-tab.prop_text_text_blue_600",
      ),
      hover: "group-hover:text-blue-700",
    },
    word: {
      bg: "bg-red-50",
      text: t(
        "runtime.components.author.conference-detail.call-for-papers-tab.prop_text_text_red_600",
      ),
      hover: "group-hover:text-red-700",
    },
  }

  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-3 tracking-tight">
        {t(
          "runtime.components.author.conference-detail.call-for-papers-tab.text_author_resources",
        )}{" "}
      </h3>

      <ul className="space-y-1.5">
        {MOCK_RESOURCES.map((resource, idx) => {
          const colors = resourceColors[resource.type] || resourceColors.latex
          return (
            <li key={idx}>
              <a
                href={resource.url}
                download={resource.filename}
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

export function CallForPapersTab({ conference }: TabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Column - 70% width */}
        <div className="lg:col-span-7 space-y-6">
          <CFPContentCard conference={conference} />
        </div>

        {/* Right Column - 30% width */}
        <div className="lg:col-span-3 space-y-4">
          <ImportantDatesCard conference={conference} />
          <AuthorResourcesCard />
        </div>
      </div>
    </div>
  )
}
