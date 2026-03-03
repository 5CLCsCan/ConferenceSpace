"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceCommittee, getConferenceReviewers } from "@/lib/api/conferences"
import type { User } from "@/lib/types"

interface ConferenceCommitteeProps {
  conferenceId: string
  className?: string
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <h3 className="text-xl font-bold text-[#1B3C53]">{value.toLocaleString()}</h3>
    </div>
  )
}

export function ConferenceCommittee({ conferenceId, className }: ConferenceCommitteeProps) {
  const PAGE_SIZE = 8
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [pendingInvites, setPendingInvites] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function loadCommittee() {
      setLoading(true)
      setError(null)

      const [committeeResponse, pendingResponse] = await Promise.all([
        getConferenceCommittee(conferenceId),
        getConferenceReviewers(conferenceId, { limit: 200, status: "pending" }),
      ])

      if (committeeResponse.error || !committeeResponse.data) {
        setError(committeeResponse.error || "Failed to load committee")
        setMembers([])
        setLoading(false)
        return
      }

      setMembers(committeeResponse.data)
      setPendingInvites(pendingResponse.data?.total || 0)
      setLoading(false)
    }

    void loadCommittee()
  }, [conferenceId])

  return (
    <div className={cn("space-y-5", className)}>
      {loading ? (
        <div className="text-xs text-slate-500">Loading committee...</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Members" value={members.length} />
            <StatCard label="Reviewers" value={members.length} />
            <StatCard label="Area Chairs" value={0} />
            <StatCard label="Pending Invites" value={pendingInvites} />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#1B3C53] tracking-tight">Committee Members</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 tracking-widest">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Domains</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-xs text-slate-500 text-center">
                        No committee members found.
                      </td>
                    </tr>
                  ) : (
                    members.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">{member.name}</td>
                        <td className="px-4 py-3 text-slate-600">{member.email}</td>
                        <td className="px-4 py-3 text-slate-600">Reviewer</td>
                        <td className="px-4 py-3 text-slate-600">
                          {member.expertise?.length ? member.expertise.join(", ") : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {members.length > PAGE_SIZE && (() => {
              const totalPages = Math.ceil(members.length / PAGE_SIZE)
              const getPageNumbers = () => {
                const pages: (number | "ellipsis")[] = []
                if (totalPages <= 5) {
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
              return (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500">
                    Showing{" "}
                    <span className="font-bold text-[#1B3C53]">
                      {Math.min((currentPage - 1) * PAGE_SIZE + 1, members.length)}–{Math.min(currentPage * PAGE_SIZE, members.length)}
                    </span>{" "}
                    of <span className="font-bold text-[#1B3C53]">{members.length}</span> members
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 px-2.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Previous
                    </button>
                    {getPageNumbers().map((page, idx) =>
                      page === "ellipsis" ? (
                        <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-7 min-w-[28px] rounded text-[11px] font-bold transition-colors ${
                            currentPage === page
                              ? "bg-[#1B3C53] text-white"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 px-2.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
