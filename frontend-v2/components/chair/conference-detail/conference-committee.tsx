"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface ConferenceCommitteeProps {
  conferenceId: string
  className?: string
}

type MemberStatus = "active" | "invited" | "declined"
type MemberRole = "program-chair" | "area-chair" | "reviewer"

interface CommitteeMember {
  id: string
  name: string
  email: string
  avatar?: string
  initials?: string
  role: MemberRole
  track: string
  assignments: number | null
  status: MemberStatus
  invitedAt?: string
}

interface CommitteeStats {
  totalMembers: number
  reviewers: number
  areaChairs: number
  pendingInvites: number
}

// Mock data
const MOCK_STATS: CommitteeStats = {
  totalMembers: 1248,
  reviewers: 982,
  areaChairs: 156,
  pendingInvites: 42,
}

const MOCK_MEMBERS: CommitteeMember[] = [
  {
    id: "1",
    name: "Prof. Michael Chen",
    email: "m.chen@mit.edu",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDsPfUhAGKfOzux0PlDZ-Mu6mfznYkjCUQDnKbdRWh32DxK5EJs_aftLnUqkms1HazcuaKUnh7BCWu-IcaeIFQ17Z26VYKxNoyQqkyFtzFu5c2iEFpgjcTu79iEBtdWC1AXEP1FgvBMTNxAwMFb-2XsX7TrF24s2cZT2Z2INNpHurO5GAqenfqHZlBDSpJjVzwPZmTkSWd-BLaKgUfw00SSqvJu0GfafPq40ushC9twpeQZFb57Bkat9TIdoJWfk1Eg8M8tPokJ5n_X",
    role: "program-chair",
    track: "Computer Vision",
    assignments: 45,
    status: "active",
  },
  {
    id: "2",
    name: "Dr. Jessica Wu",
    email: "jessica.wu@berkeley.edu",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDoP8VWb7EEXCmGfVTkEluUL8VFKjzmWiRkanBQNrWo6eorAucZiDOuDbpd7um0Dj8EusXlMYjoen5nTH8GWRhPKFK1vbVLvPAOME5XCslZTj7rAXTUpZDK-opAyIRo8J6ytc9ttGRaBKxrN1l9uz0z9CyBJh4MYu0MDzBi12yHhfx3wtsuAnP82orGE94jY8TFGa_x7WC98S7KoOd62KMnKJeR-6F6LCYIRgesEJxlZUwJy8PHZACOHirvl7_2a5F86-3pv4CK2juW",
    role: "area-chair",
    track: "NLP & LLMs",
    assignments: 12,
    status: "active",
  },
  {
    id: "3",
    name: "David Miller",
    email: "dmiller@ox.ac.uk",
    initials: "DM",
    role: "reviewer",
    track: "Reinforcement Learning",
    assignments: 6,
    status: "active",
  },
  {
    id: "4",
    name: "Dr. Emily Zhang",
    email: "emily.z@techu.edu",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVFOFqzpo17IqT20XG7Scoem27ThLpXrv5yeueYHMkPxGTECfCQg4NXxr0TpdQCFliAe_Wf2qXL8ZYyeHjl_tU8KcdgFK_ZFHcASeVh98dch-i4-DFGXR8KCo7wvJW5S4TEzv8msSMnSZgEtqsm-mI9jkoNh0GfanWvdVBuKyuAXYZSwrlbhTW8tLu4DfSa9QbCh38cnge0thdkO2LzWAURZSVuyIalLMBefUjMHJaEv7PQdJCUjcEoqvm4tFsRr4g_9-TxryGNehj",
    role: "reviewer",
    track: "Robotics",
    assignments: null,
    status: "invited",
    invitedAt: "Sent 2 days ago",
  },
  {
    id: "5",
    name: "Alex Brown",
    email: "abrown@research.org",
    initials: "AB",
    role: "area-chair",
    track: "AI Ethics",
    assignments: null,
    status: "declined",
  },
]

// Icon helper for consistent sizing
function Icon({ name, className, size = 16 }: { name: string; className?: string; size?: number }) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        lineHeight: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: "none",
        boxSizing: "border-box",
      }}
    >
      {name}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconBgClass,
  iconTextClass,
}: {
  label: string
  value: string | number
  icon: string
  iconBgClass: string
  iconTextClass: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">
          {label}
        </p>
        <h3 className="text-xl font-bold text-[#1B3C53] dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
      </div>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", iconBgClass)}>
        <span className={cn("material-symbols-outlined text-[20px]", iconTextClass)}>{icon}</span>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: MemberRole }) {
  const roleConfig = {
    "program-chair": {
      label: "Program Chair",
      bgClass: "bg-indigo-50 dark:bg-indigo-900/30",
      textClass: "text-indigo-700 dark:text-indigo-300",
      borderClass: "border-indigo-100 dark:border-indigo-800",
    },
    "area-chair": {
      label: "Area Chair",
      bgClass: "bg-purple-50 dark:bg-purple-900/30",
      textClass: "text-purple-700 dark:text-purple-300",
      borderClass: "border-purple-100 dark:border-purple-800",
    },
    reviewer: {
      label: "Reviewer",
      bgClass: "bg-blue-50 dark:bg-blue-900/30",
      textClass: "text-blue-700 dark:text-blue-300",
      borderClass: "border-blue-100 dark:border-blue-800",
    },
  }

  const config = roleConfig[role]

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border",
        config.bgClass,
        config.textClass,
        config.borderClass,
      )}
      style={{ fontWeight: 500 }}
    >
      {config.label}
    </span>
  )
}

function StatusIndicator({ status, invitedAt }: { status: MemberStatus; invitedAt?: string }) {
  const statusConfig = {
    active: {
      dotClass: "bg-emerald-500",
      label: "Active",
      labelClass: "text-slate-600 dark:text-slate-300 font-medium",
    },
    invited: {
      dotClass: "bg-amber-400 animate-pulse",
      label: "Invited",
      labelClass: "text-slate-600 dark:text-slate-300 font-medium",
    },
    declined: {
      dotClass: "bg-slate-300",
      label: "Declined",
      labelClass: "text-slate-400 font-medium",
    },
  }

  const config = statusConfig[status]

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
        <span className={cn("text-[11px]", config.labelClass)}>{config.label}</span>
      </div>
      {status === "invited" && invitedAt && (
        <div className="text-[9px] text-slate-400 mt-0.5">{invitedAt}</div>
      )}
    </div>
  )
}

function MemberAvatar({ member }: { member: CommitteeMember }) {
  if (member.avatar) {
    return (
      <div
        className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('${member.avatar}')` }}
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 text-[10px] font-bold border border-slate-200">
      {member.initials}
    </div>
  )
}

function CommitteeTable({ members }: { members: CommitteeMember[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-grow overflow-hidden">
      {/* Table Header / Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between gap-3">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 md:max-w-sm">
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 text-slate-400"
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
                transform: "translateY(-50%)",
                boxSizing: "border-box",
              }}
            >
              search
            </span>
            <input
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-md text-[11px] focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] dark:text-white dark:placeholder-slate-400"
              style={{ borderColor: "rgba(227, 227, 227, 1)" }}
              placeholder="Search by name, email, or affiliation..."
              type="text"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-2">
            <select className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] rounded-md py-2 px-2.5 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] shadow-sm min-w-[110px]">
              <option value="">All Roles</option>
              <option value="program-chair">Program Chair</option>
              <option value="area-chair">Area Chair</option>
              <option value="reviewer">Reviewer</option>
            </select>
            <select className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] rounded-md py-2 px-2.5 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] shadow-sm min-w-[110px]">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm">
            <Icon name="upload_file" size={16} />
            Import CSV
          </button>
          <button className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm">
            <Icon name="download" size={16} />
            Export
          </button>
          <button className="px-3 py-2 bg-[#1B3C53] text-white font-medium text-[11px] rounded-md hover:bg-[#234C6A] transition-colors shadow-sm flex items-center gap-1.5">
            <Icon name="person_add" size={16} />
            Add Member
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 tracking-widest">
            <tr>
              <th className="px-4 py-2.5 w-10">
                <input
                  className="rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] h-3.5 w-3.5"
                  type="checkbox"
                />
              </th>
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Primary Track</th>
              <th className="px-4 py-2.5">Assignments</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px]">
            {members.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <td className="px-4 py-3">
                  <input
                    className="rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] h-3.5 w-3.5"
                    type="checkbox"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar member={member} />
                    <div>
                      <div className="font-bold text-[#1B3C53] dark:text-white text-[12px]">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={member.role} />
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{member.track}</td>
                <td className="px-4 py-3">
                  {member.assignments !== null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#1B3C53] dark:text-white">
                        {member.assignments}
                      </span>
                      <span className="text-[10px] text-slate-400">papers</span>
                    </div>
                  ) : member.status === "invited" ? (
                    <span className="text-[10px] text-slate-400 italic">No assignments</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusIndicator status={member.status} invitedAt={member.invitedAt} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    {member.status === "invited" && (
                      <button className="text-[10px] font-bold text-[#1B3C53] hover:underline mr-1.5">
                        Resend
                      </button>
                    )}
                    {member.status !== "invited" && (
                      <button className="p-1 text-slate-400 hover:text-[#1B3C53] hover:bg-slate-100 rounded transition-colors">
                        <Icon name="edit" size={18} />
                      </button>
                    )}
                    <button className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="text-[11px] text-slate-500">
          Showing <span className="font-bold text-[#1B3C53] dark:text-white">1-10</span> of{" "}
          <span className="font-bold text-[#1B3C53] dark:text-white">
            {MOCK_STATS.totalMembers.toLocaleString()}
          </span>{" "}
          members
        </div>
        <div className="flex gap-1">
          <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50">
            Previous
          </button>
          <button className="px-2.5 py-1 bg-[#1B3C53] text-white rounded text-[10px] hover:bg-[#234C6A]">
            1
          </button>
          <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50">
            2
          </button>
          <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50">
            3
          </button>
          <span className="px-1.5 text-slate-400 text-[10px]">...</span>
          <button className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConferenceCommittee({ conferenceId, className }: ConferenceCommitteeProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={MOCK_STATS.totalMembers}
          icon="group"
          iconBgClass="bg-slate-50 dark:bg-slate-800"
          iconTextClass="text-[#1B3C53] dark:text-slate-300"
        />
        <StatCard
          label="Reviewers"
          value={MOCK_STATS.reviewers}
          icon="rate_review"
          iconBgClass="bg-blue-50 dark:bg-blue-900/20"
          iconTextClass="text-blue-700 dark:text-blue-400"
        />
        <StatCard
          label="Area Chairs"
          value={MOCK_STATS.areaChairs}
          icon="manage_accounts"
          iconBgClass="bg-purple-50 dark:bg-purple-900/20"
          iconTextClass="text-purple-700 dark:text-purple-400"
        />
        <StatCard
          label="Pending Invites"
          value={MOCK_STATS.pendingInvites}
          icon="pending_actions"
          iconBgClass="bg-yellow-50 dark:bg-yellow-900/20"
          iconTextClass="text-yellow-700 dark:text-yellow-400"
        />
      </div>

      {/* Committee Table */}
      <CommitteeTable members={MOCK_MEMBERS} />
    </div>
  )
}
