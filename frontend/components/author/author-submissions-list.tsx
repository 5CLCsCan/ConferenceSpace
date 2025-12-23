import { FileText, Plus, Search, Filter, ChevronRight, MoreVertical } from "lucide-react"
import { getUserSubmissions } from "@/lib/api/submissions"
import type { SubmissionWithConference } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { cn } from "@/lib/utils"

export function AuthorSubmissionsList() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [conferenceFilter, setConferenceFilter] = useState<string>("all")

  useEffect(() => {
    const fetchSubmissions = async () => {
      console.log("[AuthorSubmissionsList] useEffect triggered", {
        userEmail: user?.email,
        hasUser: !!user,
        userObjectKeys: user ? Object.keys(user) : [],
        fullUserObject: JSON.stringify(user, null, 2),
      })

      if (!user?.email) {
        console.warn("[AuthorSubmissionsList] No user email found, skipping fetch", {
          user,
          userKeys: user ? Object.keys(user) : [],
          userEmailValue: user?.email,
          userEmailType: typeof user?.email,
        })
        setLoading(false)
        return
      }

      try {
        console.log("[AuthorSubmissionsList] Starting fetch for user:", user.email)
        setLoading(true)
        const response = await getUserSubmissions(user.email)
        console.log("[AuthorSubmissionsList] Fetch response:", {
          hasError: !!response.error,
          hasData: !!response.data,
          dataLength: response.data?.length || 0,
        })

        if (response.error) {
          console.error("[AuthorSubmissionsList] Error:", response.error)
          setError(response.error)
        } else if (response.data) {
          console.log("[AuthorSubmissionsList] Setting submissions:", response.data.length)
          setSubmissions(response.data)
        } else {
          console.warn("[AuthorSubmissionsList] No data and no error in response")
          setSubmissions([])
        }
      } catch (err) {
        console.error("[AuthorSubmissionsList] Exception:", err)
        setError("Failed to load submissions")
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [user])

  // Get unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const conferences = new Map<string, { id: string; name: string; acronym: string }>()
    submissions.forEach((sub) => {
      if (!conferences.has(sub.conference.id)) {
        conferences.set(sub.conference.id, {
          id: sub.conference.id,
          name: sub.conference.name,
          acronym: sub.conference.acronym,
        })
      }
    })
    return Array.from(conferences.values())
  }, [submissions])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toString().includes(searchQuery)
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter
      const matchesConference = conferenceFilter === "all" || sub.conference.id === conferenceFilter

      return matchesSearch && matchesStatus && matchesConference
    })
  }, [submissions, searchQuery, statusFilter, conferenceFilter])

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "under_review":
      case "reviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
            <span className="size-1 rounded-full bg-amber-500"></span>
            Under Review
          </span>
        )
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
            <span className="size-1 rounded-full bg-emerald-500"></span>
            Accepted
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
            <span className="size-1 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        )
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-50 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            <span className="size-1 rounded-full bg-neutral-400"></span>
            Draft
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Search - Scaled down to match Author Dashboard */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 h-10">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full pl-11 pr-4 bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white transition-all font-medium text-primary dark:text-white shadow-sm"
          />
        </div>

        <div className="flex gap-3">
          {/* Conference Select */}
          <div className="relative min-w-[180px] h-10">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[20px]">
              filter_list
            </span>
            <select
              value={conferenceFilter}
              onChange={(e) => setConferenceFilter(e.target.value)}
              className="w-full h-full pl-11 pr-10 bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-primary dark:text-white cursor-pointer font-medium shadow-sm max-w-[150px]"
            >
              <option value="all">All Conferences</option>
              {uniqueConferences.map((conf) => (
                <option key={conf.id} value={conf.id}>
                  {conf.name} ({conf.acronym})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          {/* Status Select */}
          <div className="relative min-w-[150px] h-10">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-full pl-4 pr-10 bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-primary dark:text-white cursor-pointer font-medium shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Drafts</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Table Container */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-[#dbdbdb] dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] dark:bg-neutral-800/50 border-b border-[#dbdbdb] dark:border-neutral-800">
                <th className="py-4 px-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest w-24">
                  ID
                </th>
                <th className="py-4 px-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Paper Title
                </th>
                <th className="py-4 px-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Conference
                </th>
                <th className="py-4 px-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest w-40">
                  Date
                </th>
                <th className="py-4 px-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest w-36">
                  Status
                </th>
                <th className="py-4 px-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest w-20 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbdbdb] dark:divide-neutral-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-6">
                      <div className="h-10 bg-[#f3f4f6] dark:bg-neutral-800 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-neutral-300">
                        description
                      </span>
                      <p className="text-sm font-bold text-neutral-400">No submissions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="group hover:bg-[#f9fafb] dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/conference/${sub.conference_id}/submission/${sub.id}`)
                    }
                  >
                    <td className="py-4 px-6 text-xs font-bold text-neutral-400">#{sub.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#141414] dark:text-white group-hover:text-[#1B3C53] transition-colors leading-snug mb-0.5">
                          {sub.title}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-medium">
                          Authors: {sub.abstract?.slice(0, 50)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-600 dark:text-neutral-300">
                          {sub.conference.acronym} {sub.conference.year}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-medium truncate max-w-[200px]">
                          {sub.conference.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="py-4 px-6">{renderStatusBadge(sub.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-neutral-400 hover:text-[#141414] dark:hover:text-white transition-colors p-1 rounded-md hover:bg-[#dbdbdb] dark:hover:bg-neutral-700">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="bg-[#f9fafb] dark:bg-neutral-800/30 border-t border-[#dbdbdb] dark:border-neutral-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500 font-medium">
            Showing <span className="font-bold text-[#141414] dark:text-white">1</span> to{" "}
            <span className="font-bold text-[#141414] dark:text-white">
              {filteredSubmissions.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#141414] dark:text-white">{submissions.length}</span>{" "}
            results
          </p>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded-lg border border-[#dbdbdb] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-400 cursor-not-allowed">
              Previous
            </button>
            <button className="h-8 px-4 rounded-lg border border-[#dbdbdb] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-[#141414] dark:text-white hover:bg-[#f9fafb] dark:hover:bg-neutral-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
