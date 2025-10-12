"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { Conference } from "@/lib/types"
import { getConferenceById } from "@/lib/api/conferences"
import { ConferenceOverview } from "@/components/conference/conference-overview"
import { ConferenceCallForPapers } from "@/components/conference/conference-call-for-papers"
import { ConferenceImportantDates } from "@/components/conference/conference-important-dates"
import { ConferenceCommittee } from "@/components/conference/conference-committee"
import { ConferenceSubmissions } from "@/components/conference/conference-submissions"
import { ConferenceProgram } from "@/components/conference/conference-program"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type TabType = "overview" | "call-for-papers" | "dates" | "committee" | "submissions"

export default function ConferencePage() {
  const params = useParams()
  const conferenceId = params.id as string
  const { user, currentRole, switchRole } = useAuth()

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  useEffect(() => {
    async function loadConference() {
      setLoading(true)
      const response = await getConferenceById(conferenceId)
      if (response.data) {
        setConference(response.data)
      }
      setLoading(false)
    }

    loadConference()
  }, [conferenceId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Conference Not Found</h1>
          <p className="mt-2 text-gray-600">The conference you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "overview" as TabType, label: "Tổng Quan" },
    { id: "call-for-papers" as TabType, label: "Call for Papers" },
    { id: "dates" as TabType, label: "Thời Gian Quan Trọng" },
    { id: "committee" as TabType, label: "Ban Tổ Chức" },
    { id: "submissions" as TabType, label: "Bài Nộp" },
  ]

  const roleConfig = {
    author: { label: "Tác giả", color: "bg-blue-100 text-blue-700" },
    reviewer: { label: "Reviewer", color: "bg-green-100 text-green-700" },
    chair: { label: "Chair", color: "bg-purple-100 text-purple-700" },
    pc_member: { label: "PC Member", color: "bg-yellow-100 text-yellow-700" },
    admin: { label: "Admin", color: "bg-red-100 text-red-700" },
  }
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {currentRole && ["author", "reviewer", "chair", "pc_member"].includes(currentRole) && (
        <DashboardHeader role={currentRole as "author" | "reviewer" | "chair" | "pc_member"} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="sticky top-0">
            {/* Conference Header */}
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">{conference.acronym}</h2>
              <p className="mt-1 text-sm text-gray-600">{conference.year}</p>
            </div>

            {/* Navigation Tabs */}
            <nav className="p-4">
              <ul className="space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Vai trò hiện tại</p>
                  {currentRole && (
                    <Badge className={`${roleConfig[currentRole].color} border-0`}>
                      {roleConfig[currentRole].label}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Chuyển vai trò (Dev Mode)</p>
                  <div className="flex flex-col gap-2">
                    {user.roles.map((role) => (
                      <Button
                        key={role}
                        variant={currentRole === role ? "default" : "outline"}
                        size="sm"
                        onClick={() => switchRole(role)}
                        className="w-full justify-start text-xs"
                      >
                        {roleConfig[role].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User Info */}
            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Đăng nhập với</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-8">
            {activeTab === "overview" && <ConferenceOverview conference={conference} />}
            {activeTab === "call-for-papers" && <ConferenceCallForPapers conference={conference} />}
            {activeTab === "dates" && <ConferenceImportantDates conferenceId={conference.id} />}
            {activeTab === "committee" && <ConferenceCommittee conferenceId={conference.id} />}
            {activeTab === "submissions" && <ConferenceSubmissions conferenceId={conference.id} />}
          </div>
        </main>
      </div>
    </div>
  )
}
