"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  getConferenceById,
  getConferenceDates,
  type Conference,
  type ImportantDate,
} from "@/lib/api/conferences"
import { useAuth } from "@/lib/auth-context"

type TabType = "overview" | "cfp" | "dates" | "committee"

interface AuthorConferenceDetailProps {
  conferenceId: string
}

export function AuthorConferenceDetail({ conferenceId }: AuthorConferenceDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [conference, setConference] = useState<Conference | null>(null)
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [hasSubmission, setHasSubmission] = useState(false) // TODO: Check if user has made a submission

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [confResp, datesResp] = await Promise.all([
        getConferenceById(conferenceId),
        getConferenceDates(conferenceId),
      ])

      if (confResp.data) setConference(confResp.data)
      if (datesResp.data) setDates(datesResp.data)

      // TODO: Check if user has submission for this conference
      // For now, hardcoded to false
      setHasSubmission(false)

      setLoading(false)
    }

    fetchData()
  }, [conferenceId])

  if (loading || !conference) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading conference details...</div>
      </div>
    )
  }

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return "Dates TBD"
    const s = new Date(start)
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
    if (!end) return s.toLocaleDateString("en-US", { ...options, year: "numeric" })
    const e = new Date(end)
    return `${s.toLocaleDateString("en-US", options)} - ${e.toLocaleDateString("en-US", { ...options, year: "numeric" })}`
  }

  const getConferenceStatus = () => {
    const now = new Date()
    const deadline = conference.submission_deadline
      ? new Date(conference.submission_deadline)
      : null
    const confEnd = conference.conference_end_date ? new Date(conference.conference_end_date) : null

    if (deadline && now < deadline)
      return { label: "Active", color: "bg-green-50 text-green-700 border-green-200" }
    if (confEnd && now >= confEnd)
      return { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200" }
    return { label: "Registration Open", color: "bg-blue-50 text-blue-700 border-blue-200" }
  }

  const status = getConferenceStatus()

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black h-screen overflow-y-auto relative">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="px-8 py-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              {conference.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {conference.location || "Online"}
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                {formatDateRange(conference.conference_date, conference.conference_end_date)}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full border text-xs font-bold uppercase",
                    status.color,
                  )}
                >
                  {status.label}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (hasSubmission) {
                  router.push(`/dashboard/author/submissions?conference=${conferenceId}`)
                } else {
                  router.push(`/dashboard/author/submit?conference=${conferenceId}`)
                }
              }}
              className="px-4 py-2 bg-primary text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm shadow-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              {hasSubmission ? "View submission" : "Submit new paper"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <div className="flex space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "py-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors",
                activeTab === "overview"
                  ? "border-navy-900 text-navy-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white font-medium",
              )}
            >
              <span className="material-symbols-outlined text-lg">info</span>
              Overview
            </button>
            <button
              onClick={() => setActiveTab("cfp")}
              className={cn(
                "py-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors",
                activeTab === "cfp"
                  ? "border-navy-900 text-navy-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white font-medium",
              )}
            >
              <span className="material-symbols-outlined text-lg">campaign</span>
              Call for Papers
            </button>
            <button
              onClick={() => setActiveTab("dates")}
              className={cn(
                "py-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors",
                activeTab === "dates"
                  ? "border-navy-900 text-navy-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white font-medium",
              )}
            >
              <span className="material-symbols-outlined text-lg">event</span>
              Important Dates
            </button>
            <button
              onClick={() => setActiveTab("committee")}
              className={cn(
                "py-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors",
                activeTab === "committee"
                  ? "border-navy-900 text-navy-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white font-medium",
              )}
            >
              <span className="material-symbols-outlined text-lg">groups</span>
              Committee
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow flex flex-col px-8 py-8 w-full">
        {activeTab === "overview" && <OverviewTab conference={conference} />}
        {activeTab === "cfp" && <CallForPapersTab conference={conference} />}
        {activeTab === "dates" && <ImportantDatesTab dates={dates} />}
        {activeTab === "committee" && <CommitteeTab conference={conference} />}
      </main>

      {/* Footer */}
      {/* <footer className="w-full py-6 px-8 border-t border-slate-200 dark:border-slate-800 mt-auto bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <p className="text-sm text-slate-500">
            © 2024 ConferenceSpace System. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a className="text-sm text-slate-500 hover:text-navy-900" href="#">
              Documentation
            </a>
            <a className="text-sm text-slate-500 hover:text-navy-900" href="#">
              Support
            </a>
            <a className="text-sm text-slate-500 hover:text-navy-900" href="#">
              Privacy
            </a>
          </div>
        </div>
      </footer> */}
    </div>
  )
}

function OverviewTab({ conference }: { conference: Conference }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* About the Conference */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">description</span>
                About the Conference
              </h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                [To be generated by AI]
              </p>
            </div>
          </section>

          {/* Conference Tracks */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">alt_route</span>
                Conference Tracks
              </h2>
              {conference.tracks && conference.tracks.length > 0 && (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {conference.tracks.length} Active Tracks
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {conference.tracks && conference.tracks.length > 0 ? (
                  conference.tracks.map((track, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {track}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">No tracks specified</span>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Details */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">info</span>
                Details
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Synonym
                </span>
                <div className="text-sm font-medium text-navy-900 dark:text-white bg-slate-50 dark:bg-slate-800 inline-block px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  {conference.acronym} {conference.year}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Venue
                </span>
                <div className="text-sm font-medium text-navy-900 dark:text-white flex items-start gap-2">
                  {conference.location || "Online"}
                </div>
              </div>
              {conference.website && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Website
                  </span>
                  <a
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                    href={conference.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {conference.website}
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              )}
              {conference.primary_contact && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Organizer Contact
                  </span>
                  <a
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-navy-900 flex items-center gap-1"
                    href={`mailto:${conference.primary_contact}`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      mail
                    </span>
                    {conference.primary_contact}
                  </a>
                </div>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Conference ID</span>
                <span className="text-xs text-slate-400 font-mono">#{conference.id}</span>
              </div>
            </div>
          </section>

          {/* Keywords */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">label</span>
                Keywords
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {conference.domain && conference.domain.length > 0 ? (
                  conference.domain.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">No keywords specified</span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function CallForPapersTab({ conference }: { conference: Conference }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="w-full space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Call for Papers</h2>
              {conference.submission_deadline && (
                <p className="text-slate-500 text-sm mt-1">
                  Submission Deadline:{" "}
                  {new Date(conference.submission_deadline).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="text-slate-500 hover:text-navy-900 p-2 rounded hover:bg-slate-100 transition-colors"
                title="Print"
              >
                <span className="material-symbols-outlined">print</span>
              </button>
              <button
                className="text-slate-500 hover:text-navy-900 p-2 rounded hover:bg-slate-100 transition-colors"
                title="Download PDF"
              >
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </button>
              <button
                className="text-slate-500 hover:text-navy-900 p-2 rounded hover:bg-slate-100 transition-colors"
                title="Share"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
            {conference.call_for_paper_text ? (
              <div dangerouslySetInnerHTML={{ __html: conference.call_for_paper_text }} />
            ) : (
              <p className="mb-4 leading-relaxed">
                The {conference.name} promotes research and fosters scientific exchange between
                researchers, practitioners, scientists, students, and engineers. The conference will
                have a diverse technical track, student abstracts, poster sessions, invited
                speakers, tutorials, workshops, and exhibit and competition programs, all selected
                according to the highest reviewing standards.
              </p>
            )}

            {conference.configurations?.submission_format && (
              <>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mt-8 mb-4">
                  Submission Guidelines
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-5 mb-6">
                  <h4 className="font-bold text-navy-900 dark:text-white mb-2 text-sm uppercase tracking-wide">
                    Key Requirements
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {conference.configurations.maximum_pages && (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-600 text-lg">
                          check_circle
                        </span>
                        <span>
                          Papers must be no longer than {conference.configurations.maximum_pages}{" "}
                          pages.
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-600 text-lg">
                        check_circle
                      </span>
                      <span>
                        Submissions must be in {conference.configurations.submission_format} format.
                      </span>
                    </li>
                    {conference.configurations.review_type === "double_blind" && (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-500 text-lg">
                          cancel
                        </span>
                        <span>
                          Do not include author names or affiliations (double-blind review).
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Author Resources</h3>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li>
              <a
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group h-full"
                href="#"
              >
                <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-blue-700">
                    LaTeX Template
                  </p>
                  <p className="text-xs text-slate-500">Official style file</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-600">
                  download
                </span>
              </a>
            </li>
            <li>
              <a
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group h-full"
                href="#"
              >
                <div className="bg-red-50 text-red-600 p-2 rounded-md">
                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-red-700">
                    Word Template
                  </p>
                  <p className="text-xs text-slate-500">.docx format</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-red-600">
                  download
                </span>
              </a>
            </li>
            <li>
              <a
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group h-full"
                href="#"
              >
                <div className="bg-green-50 text-green-600 p-2 rounded-md">
                  <span className="material-symbols-outlined text-xl">link</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-green-700">
                    Submission Portal
                  </p>
                  <p className="text-xs text-slate-500">External CMT Link</p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-green-600">
                  open_in_new
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ImportantDatesTab({ dates }: { dates: ImportantDate[] }) {
  const now = new Date()

  const categories = [
    {
      id: "submission",
      title: "Submission Phase",
      pattern: /submission|abstract|paper/i,
      icon: "upload_file",
    },
    {
      id: "review",
      title: "Review & Decision",
      pattern: /review|notification|rebuttal|acceptance/i,
      icon: "assignment_late",
    },
    {
      id: "event",
      title: "Camera Ready & Conference",
      pattern: /camera|registration|conference/i,
      icon: "event_available",
    },
  ]

  const groupedDates = categories.map((cat) => ({
    ...cat,
    items: dates.filter((d) => cat.pattern.test(d.title)),
  }))

  const nextDeadline = dates.find((d) => new Date(d.date) > now)
  const daysUntil = nextDeadline
    ? Math.ceil((new Date(nextDeadline.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">Conference Timeline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep track of important deadlines for your submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">calendar_add_on</span>
            Sync to Calendar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        <div className="lg:col-span-8 space-y-12">
          {groupedDates.map((group, gIdx) => {
            if (group.items.length === 0) return null
            const allPast = group.items.every((i) => i.isPast)
            const inProgress =
              group.items.some((i) => !i.isPast) && group.items.some((i) => i.isPast)

            return (
              <div
                key={group.id}
                className={cn(
                  "relative pl-8 border-l-2",
                  allPast
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-navy-900 dark:border-white",
                  group.id === "event" && "border-dashed",
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900",
                    allPast
                      ? "bg-slate-300 dark:bg-slate-600"
                      : "bg-navy-900 dark:bg-white ring-4 ring-blue-50 dark:ring-slate-700",
                  )}
                ></span>

                <div className="mb-6">
                  <h3
                    className={cn(
                      "text-lg font-bold",
                      allPast
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-navy-900 dark:text-white",
                    )}
                  >
                    {group.title}
                  </h3>
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider font-bold mt-1",
                      allPast
                        ? "text-slate-400 dark:text-slate-600"
                        : "text-blue-600 dark:text-blue-400",
                    )}
                  >
                    {allPast ? "Completed" : inProgress ? "In Progress" : "Upcoming"}
                  </p>
                </div>

                <div className="space-y-4">
                  {group.items.map((date) => {
                    const d = new Date(date.date)
                    const month = d.toLocaleString("en-US", { month: "short" })
                    const day = d.getDate()
                    const isNext = nextDeadline?.id === date.id

                    return (
                      <div
                        key={date.id}
                        className={cn(
                          "bg-white/80 dark:bg-slate-900 border rounded-xl p-4 flex items-start gap-4 transition-all",
                          date.isPast
                            ? "border-slate-200 dark:border-slate-800 opacity-60"
                            : isNext
                              ? "border-navy-900/20 dark:border-slate-700 shadow-md relative overflow-hidden"
                              : "border-slate-200 dark:border-slate-800",
                        )}
                      >
                        {isNext && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 dark:from-slate-800 to-transparent -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                        )}

                        <div
                          className={cn(
                            "rounded-lg w-14 h-14 flex flex-col items-center justify-center shrink-0 shadow-sm",
                            isNext
                              ? "bg-navy-900 dark:bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px] uppercase font-bold",
                              isNext ? "opacity-80" : "text-slate-500",
                            )}
                          >
                            {month}
                          </span>
                          <span
                            className={cn(
                              "text-lg font-bold",
                              isNext ? "text-white" : "text-slate-700 dark:text-slate-300",
                            )}
                          >
                            {day}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 z-10">
                          <div className="flex items-center gap-2 mb-1">
                            <h4
                              className={cn(
                                "font-bold",
                                isNext
                                  ? "text-base text-navy-900 dark:text-white"
                                  : "text-sm text-navy-900 dark:text-white",
                              )}
                            >
                              {date.title}
                            </h4>
                            {isNext && (
                              <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {date.description}
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2 shrink-0 z-10">
                          <span
                            className={cn(
                              "inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border",
                              date.isPast
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent"
                                : isNext
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-navy-900 dark:text-blue-200 border-blue-100 dark:border-blue-900/50"
                                  : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100",
                            )}
                          >
                            {date.isPast ? "PASSED" : isNext ? "UPCOMING" : "OPEN"}
                          </span>
                          {!date.isPast && (
                            <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              <span className="material-symbols-outlined text-[12px] mr-1">
                                schedule
                              </span>
                              23:59 AoE
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {nextDeadline && daysUntil !== null && (
            <div className="bg-navy-900 dark:bg-slate-800 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">
                Next Major Deadline
              </h3>
              <div className="text-4xl font-bold mb-1">
                {daysUntil} <span className="text-lg font-normal text-slate-400">days</span>
              </div>
              <p className="text-lg font-medium text-white mb-6">Until {nextDeadline.title}</p>
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Target Date</span>
                  <span className="font-mono">
                    {new Date(nextDeadline.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Timezone</span>
                  <span className="font-mono">AoE (UTC-12)</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/80 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">help</span>
              Need Help?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Check the conference website or contact the program chairs if you have questions about
              deadlines.
            </p>
            <a
              className="text-sm font-bold text-navy-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              href="#"
            >
              Contact Support{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommitteeTab({ conference }: { conference: Conference }) {
  const stringToColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase()
    return "#" + "00000".substring(0, 6 - c.length) + c
  }

  const getArtisticGradient = (seed: string) => {
    const color1 = stringToColor(seed)
    const color2 = stringToColor(seed.split("").reverse().join(""))
    return `radial-gradient(circle at 30% 30%, ${color1} 0%, ${color2} 100%)`
  }

  const Avatar = ({
    name,
    email,
    img,
    size = "md",
  }: {
    name: string
    email: string
    img?: string
    size?: "sm" | "md" | "lg"
  }) => {
    const sizeClasses = {
      sm: "w-10 h-10",
      md: "w-12 h-12",
      lg: "w-14 h-14",
    }
    const initial = name ? name.charAt(0).toUpperCase() : "?"

    return (
      <div
        className={cn(
          "rounded-full flex-shrink-0 overflow-hidden bg-cover bg-center shadow-sm flex items-center justify-center",
          sizeClasses[size],
        )}
        style={{
          backgroundImage: img ? `url('${img}')` : getArtisticGradient(email || name),
        }}
      >
        {!img && <span className="text-white font-bold text-sm drop-shadow-md">{initial}</span>}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-2">
          Organizing Committee
        </h2>
        <p className="text-slate-500 text-sm mb-8">Meet the team behind {conference.name}.</p>

        {/* General Chairs */}
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            General Chairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conference.chair ? (
              <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                <Avatar
                  name={conference.chair}
                  email={String(conference.primary_contact || conference.chair)}
                  size="lg"
                />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white text-lg">
                    {conference.chair}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    No organization
                  </div>
                  <a
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    href={`mailto:${conference.chair || ""}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">mail</span>{" "}
                    {conference.chair || "contact@conference.org"}
                  </a>
                </div>
              </div>
            ) : null}

            {conference.co_chairs?.map((co, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/50"
              >
                <Avatar name={co} email={`${co}@conf.org`} size="lg" />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white text-lg">{co}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Conference Co-Chair
                  </div>
                  <a
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[14px]">mail</span>{" "}
                    {co.toLowerCase().replace(" ", ".")}@conference.org
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Chairs */}
        <div className="mb-10">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            Program Chairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Alex Brown", "Emily Zhang", "Robert Klein"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <Avatar name={name} email={`${name}@ai.com`} />
                <div>
                  <div className="font-bold text-navy-900 dark:text-white">{name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Research & Peer Review
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Chairs */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            Area Chairs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "David Miller", track: "Reinforcement Learning" },
              { name: "Sarah Jenkins", track: "Computer Vision" },
              { name: "Wei Liu", track: "NLP & LLMs" },
              { name: "Carlos Mendez", track: "Generative Models" },
            ].map((chair) => (
              <div
                key={chair.name}
                className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900"
              >
                <div className="font-bold text-navy-900 dark:text-white text-sm">{chair.name}</div>
                <div className="text-xs text-slate-500 truncate">Academic Committee</div>
                <div className="mt-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wide">
                  {chair.track}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900 flex flex-col justify-center">
              <div className="font-bold text-navy-900 dark:text-white text-sm">More Members</div>
              <div className="text-xs text-slate-500">View full list</div>
              <div className="mt-2 flex">
                <span className="material-symbols-outlined text-slate-400 text-lg">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
