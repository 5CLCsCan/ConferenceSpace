"use client"

import { cn } from "@/lib/utils"

interface ConferenceOverviewProps {
  conferenceId: string
  className?: string
}

// Mock data for overview
const MOCK_OVERVIEW = {
  about: {
    description: `The AAAI Conference on Artificial Intelligence promotes theoretical and applied AI research as well as intellectual interchange among researchers and practitioners in the field. The technical program features substantial, original research and practices. The conference also includes a wide range of workshops, tutorials, and invited speakers that survey the latest developments in the field.`,
    additionalInfo: `AAAI-24 will be held in Vancouver, British Columbia, Canada. The conference will be in-person with a virtual component. We invite submissions across all areas of artificial intelligence.`,
  },
  details: {
    synonym: "AAAI 2024",
    venue: {
      name: "Vancouver Convention Centre",
      location: "Vancouver, BC, Canada",
    },
    website: "aaai.org/aaai-24",
    organizerContact: "chairs24@aaai.org",
    conferenceId: "#CONF-24-3392",
  },
  tracks: [
    "Computer Vision",
    "Natural Language Processing",
    "Robotics & Control",
    "Machine Learning",
    "AI Ethics & Society",
    "AI for Social Good",
    "Multi-Agent Systems",
    "Special Track",
  ],
  keywords: [
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "NLP",
    "Robotics",
    "Knowledge Representation",
    "Planning",
  ],
}

function AboutSection() {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span
            className="material-symbols-outlined text-slate-400"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "none",
              boxSizing: "border-box",
            }}
          >
            description
          </span>
          About the Conference
        </h2>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
          {MOCK_OVERVIEW.about.description}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {MOCK_OVERVIEW.about.additionalInfo}
        </p>
      </div>
    </section>
  )
}

function TracksSection() {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span
            className="material-symbols-outlined text-slate-400"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "none",
              boxSizing: "border-box",
            }}
          >
            alt_route
          </span>
          Conference Tracks
        </h2>
        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {MOCK_OVERVIEW.tracks.length} Active Tracks
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
          {MOCK_OVERVIEW.tracks.map((track, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer",
                idx === MOCK_OVERVIEW.tracks.length - 1 && "italic",
              )}
            >
              <span
                className={cn(
                  "text-[13px] font-semibold tracking-tight",
                  idx === MOCK_OVERVIEW.tracks.length - 1
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-[#1B3C53] dark:text-white",
                )}
              >
                {track}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DetailsCard() {
  const { details } = MOCK_OVERVIEW

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span
            className="material-symbols-outlined text-slate-400"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "none",
              boxSizing: "border-box",
            }}
          >
            info
          </span>
          Details
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {/* Synonym */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Synonym
          </span>
          <div className="text-[11px] font-semibold text-[#1B3C53] dark:text-white bg-slate-50 dark:bg-slate-800 inline-block px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            {details.synonym}
          </div>
        </div>

        {/* Venue */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Venue
          </span>
          <div className="text-[11px] font-medium text-[#1B3C53] dark:text-white flex items-start gap-1.5">
            <span
              className="material-symbols-outlined text-slate-400 mt-0.5"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              apartment
            </span>
            <span>
              {details.venue.name},<br />
              {details.venue.location}
            </span>
          </div>
        </div>

        {/* Website */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Website
          </span>
          <a
            href={`https://${details.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            {details.website}
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              open_in_new
            </span>
          </a>
        </div>

        {/* Organizer Contact */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Organizer Contact
          </span>
          <a
            href={`mailto:${details.organizerContact}`}
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-[#1B3C53] flex items-center gap-1"
          >
            <span
              className="material-symbols-outlined text-slate-400"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              mail
            </span>
            {details.organizerContact}
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-500 font-medium">Conference ID</span>
          <span className="text-[9px] text-slate-400 font-mono">{details.conferenceId}</span>
        </div>
      </div>
    </section>
  )
}

function KeywordsCard() {
  const keywords = MOCK_OVERVIEW.keywords
  const moreCount = 12

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span
            className="material-symbols-outlined text-slate-400"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "none",
              boxSizing: "border-box",
            }}
          >
            label
          </span>
          Keywords
        </h2>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((keyword, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {keyword}
            </span>
          ))}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            + {moreCount} more
          </span>
          <button className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-blue-600 border border-dashed border-blue-300 hover:border-blue-500 hover:text-blue-700 transition-colors gap-1">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              edit
            </span>
            Edit
          </button>
        </div>
      </div>
    </section>
  )
}

export function ConferenceOverview({ conferenceId, className }: ConferenceOverviewProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <AboutSection />
          <TracksSection />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <DetailsCard />
          <KeywordsCard />
        </div>
      </div>
    </div>
  )
}
