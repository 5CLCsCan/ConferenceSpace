"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceById, getConferenceTracks } from "@/lib/api/conferences"
import type { Conference, Track } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceOverviewProps {
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

function AboutSection({ description }: { description?: string }) {
  const { t } = useTranslation()

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
            description
          </span>
          {t("runtime.components.chair.conference-detail.conference-overview.text_about_the_conference")}{" "}</h2>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description ||
            t(
              "runtime.components.chair.conference-detail.conference-overview.text_no_conference_description_provided",
            )}
        </p>
      </div>
    </section>
  )
}

function TracksSection({ tracks }: { tracks: Track[] }) {
  const { t } = useTranslation()

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
            alt_route
          </span>
          {t("runtime.components.chair.conference-detail.conference-overview.text_conference_tracks")}{" "}</h2>
        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {tracks.length} {t("runtime.components.chair.conference-detail.conference-overview.text_active_tracks")}{" "}</span>
      </div>
      <div className="p-4">
        {tracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors",
                  idx === tracks.length - 1 && "italic",
                )}
              >
                <span
                  className={cn(
                    "text-[13px] font-semibold tracking-tight",
                    idx === tracks.length - 1
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-[#1B3C53] dark:text-white",
                  )}
                >
                  {track.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("runtime.components.chair.conference-detail.conference-overview.text_no_tracks_configured")}</p>
        )}
      </div>
    </section>
  )
}

function DetailsCard({ conference }: { conference: Conference }) {
  const { t } = useTranslation()

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
            info
          </span>
          {t("runtime.components.chair.conference-detail.conference-overview.text_details")}{" "}</h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            {t("runtime.components.chair.conference-detail.conference-overview.text_synonym")}{" "}</span>
          <div className="text-[11px] font-semibold text-[#1B3C53] dark:text-white bg-slate-50 dark:bg-slate-800 inline-block px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            {conference.acronym} {conference.year}
          </div>
        </div>

        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            {t("runtime.components.chair.conference-detail.conference-overview.text_venue")}{" "}</span>
          <div className="text-[11px] font-medium text-[#1B3C53] dark:text-white flex items-start gap-1.5">
            <span className="material-symbols-outlined text-slate-400 mt-0.5" style={iconStyle}>
              apartment
            </span>
            <span>{conference.location || "TBD"}</span>
          </div>
        </div>

        {conference.website && (
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {t("runtime.components.chair.conference-detail.conference-overview.text_website")}{" "}</span>
            <a
              href={
                conference.website.startsWith("http")
                  ? conference.website
                  : `https://${conference.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              {conference.website}
              <span className="material-symbols-outlined" style={iconStyle}>
                open_in_new
              </span>
            </a>
          </div>
        )}

        {conference.primary_contact && (
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {t("runtime.components.chair.conference-detail.conference-overview.text_organizer_contact")}{" "}</span>
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
                call
              </span>
              {conference.primary_contact}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-500 font-medium">{t("runtime.components.chair.conference-detail.conference-overview.text_conference_id")}</span>
          <span className="text-[9px] text-slate-400 font-mono">#{conference.id}</span>
        </div>
      </div>
    </section>
  )
}

function KeywordsCard({ keywords }: { keywords?: string[] }) {
  const { t } = useTranslation()

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white flex items-center gap-2 tracking-tight">
          <span className="material-symbols-outlined text-slate-400" style={iconStyle}>
            label
          </span>
          {t("runtime.components.chair.conference-detail.conference-overview.text_keywords")}{" "}</h2>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {keywords && keywords.length > 0 ? (
            keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {keyword}
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("runtime.components.chair.conference-detail.conference-overview.text_no_keywords_specified")}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export function ConferenceOverview({ conferenceId, className }: ConferenceOverviewProps) {
  const { t } = useTranslation()
  const [conference, setConference] = useState<Conference | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOverview() {
      setLoading(true)
      setError(null)
      const [conferenceResponse, tracksResponse] = await Promise.all([
        getConferenceById(conferenceId),
        getConferenceTracks(conferenceId),
      ])

      if (conferenceResponse.error || !conferenceResponse.data) {
        setError(conferenceResponse.error || "Failed to load conference overview")
        setLoading(false)
        return
      }

      setConference(conferenceResponse.data)
      setTracks(tracksResponse.data || [])
      setLoading(false)
    }

    void loadOverview()
  }, [conferenceId])

  if (loading) {
    return (
      <div className="text-xs text-slate-500">
        {t("runtime.components.chair.conference-detail.conference-overview.text_loading_overview")}
      </div>
    )
  }

  if (error || !conference) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error || "Conference overview unavailable."}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <AboutSection description={conference.description} />
          <TracksSection tracks={tracks} />
        </div>

        <div className="space-y-6">
          <DetailsCard conference={conference} />
          <KeywordsCard keywords={conference.domain} />
        </div>
      </div>
    </div>
  )
}
