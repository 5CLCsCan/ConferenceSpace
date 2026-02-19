import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { TabProps } from "./types"

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
    description: "Official style file",
    type: "latex",
    icon: "description",
  },
  { name: "Word Template", description: ".docx format", type: "word", icon: "picture_as_pdf" },
]

/**
 * Compact Markdown Renderer for CFP content
 * Uses Scholar-Compact sizing conventions (text-[12px] for body)
 */
function CFPMarkdownRenderer({ content }: { content: string }) {
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Call for Papers
          </h2>
          {conference.submission_deadline && (
            <p className="text-[9px] text-slate-400 mt-0.5">
              Submission Deadline:{" "}
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
            className="text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            title="Print"
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              print
            </span>
          </button>
          <button
            className="text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            title="Download PDF"
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              picture_as_pdf
            </span>
          </button>
          <button
            className="text-slate-400 hover:text-[#1B3C53] p-1.5 rounded hover:bg-slate-50 transition-colors"
            title="Share"
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              share
            </span>
          </button>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="p-4">
        <CFPMarkdownRenderer content={cfpContent} />
      </div>
    </div>
  )
}

function ImportantDatesCard({ conference }: TabProps) {
  const dates = [
    {
      label: "Abstract Deadline",
      date: conference.configurations?.abstract_submission_deadline,
      status: "passed" as const,
    },
    {
      label: "Full Paper Deadline",
      date: conference.submission_deadline,
      status: "current" as const,
      daysLeft: 5,
    },
    { label: "Notification", date: conference.notification_date, status: "upcoming" as const },
    {
      label: "Conference Dates",
      date: conference.conference_date,
      status: "upcoming" as const,
    },
  ].filter((d) => d.date)

  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          Important Dates
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
              {item.daysLeft && (
                <p className="text-[8px] text-red-500 font-medium mt-0.5">
                  {item.daysLeft} days left
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
    latex: { bg: "bg-blue-50", text: "text-blue-600", hover: "group-hover:text-blue-700" },
    word: { bg: "bg-red-50", text: "text-red-600", hover: "group-hover:text-red-700" },
  }

  return (
    <div className="bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-3 tracking-tight">
        Author Resources
      </h3>

      <ul className="space-y-1.5">
        {MOCK_RESOURCES.map((resource, idx) => {
          const colors = resourceColors[resource.type] || resourceColors.latex
          return (
            <li key={idx}>
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
