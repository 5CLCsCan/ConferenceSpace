"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceById, getConferenceTracks } from "@/lib/api/conferences"
import type { Conference, Track } from "@/lib/types"

interface ConferenceOverviewProps {
  conferenceId: string
  className?: string
}

function formatDate(value?: string) {
  if (!value) return "TBD"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "TBD"
  return parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export function ConferenceOverview({ conferenceId, className }: ConferenceOverviewProps) {
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
    return <div className="text-xs text-slate-500">Loading overview...</div>
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
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight">About the Conference</h2>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {conference.description || "No conference description provided."}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight">Details</h2>
          </div>
          <div className="p-4 space-y-3 text-[11px] text-slate-600">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Acronym</p>
              <p className="font-semibold text-slate-800">{conference.acronym || "N/A"}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Location</p>
              <p className="font-semibold text-slate-800">{conference.location || "TBD"}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Conference Dates</p>
              <p className="font-semibold text-slate-800">
                {formatDate(conference.conference_date)} - {formatDate(conference.conference_end_date)}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Status</p>
              <p className="font-semibold text-slate-800 capitalize">{conference.status}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight">Conference Tracks</h2>
          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {tracks.length}
          </span>
        </div>
        <div className="p-4">
          {tracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tracks.map((track) => (
                <div key={track.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[12px] font-semibold text-slate-800">{track.name}</p>
                  {track.description && (
                    <p className="text-[10px] text-slate-500 mt-1">{track.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No tracks configured.</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight">Research Domains</h2>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {conference.domain && conference.domain.length > 0 ? (
            conference.domain.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                {keyword}
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-500">No domains specified.</p>
          )}
        </div>
      </section>
    </div>
  )
}
