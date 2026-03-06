"use client"

import { useState } from "react"
import { WizardHeader } from "../wizard-header"
import { WizardFormCard } from "../wizard-form-card"
import { WizardFormField, WizardInput } from "../wizard-form-field"
import { ConferenceFormData } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

interface CommitteesStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

interface Organizer {
  id: string
  name: string
  email: string
  role: string
  affiliation?: string
  status: "active" | "pending"
}

const ROLE_OPTIONS = [
  { value: "co-chair", label: t("runtime.components.wizard.creation.steps.committees.prop_label_co_chair"), icon: "workspace_premium" },
  { value: "pc-member", label: t("runtime.components.wizard.creation.steps.committees.prop_label_pc_member"), icon: "groups" },
  { value: "track-chair", label: t("runtime.components.wizard.creation.steps.committees.prop_label_track_chair"), icon: "category" },
  { value: "reviewer", label: t("runtime.components.wizard.creation.steps.committees.prop_label_reviewer"), icon: "rate_review" },
] as const

// Mock current user as general chair
const CURRENT_USER: Organizer = {
  id: "current-user",
  name: "Jane Doe",
  email: "jane.doe@university.edu",
  role: "general-chair",
  affiliation: "Stanford University",
  status: "active",
}

export function CommitteesStep({ data, updateData }: CommitteesStepProps) {
  const { t } = useTranslation()
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState("co-chair")
  const [newAffiliation, setNewAffiliation] = useState("")

  const [organizers, setOrganizers] = useState<Organizer[]>([
    CURRENT_USER,
    {
      id: "2",
      name: "Dr. Alan Smith",
      email: "alan.smith@mit.edu",
      role: "co-chair",
      affiliation: "MIT",
      status: "active",
    },
    {
      id: "3",
      name: "Raj Kumar",
      email: "raj.kumar@iitd.ac.in",
      role: "pc-member",
      affiliation: "IIT Delhi",
      status: "pending",
    },
    {
      id: "4",
      name: "Emma Larson",
      email: "emma.larson@cmu.edu",
      role: "pc-member",
      affiliation: "CMU",
      status: "active",
    },
  ])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    if (role === "general-chair") return "Chair"
    const option = ROLE_OPTIONS.find((r) => r.value === role)
    return option?.label || role
  }

  const handleAddOrganizer = () => {
    if (!newEmail.trim()) return

    const newOrganizer: Organizer = {
      id: Date.now().toString(),
      name: newEmail.split("@")[0].replace(/[._]/g, " "),
      email: newEmail.trim(),
      role: newRole,
      affiliation: newAffiliation.trim() || undefined,
      status: "pending",
    }

    setOrganizers((prev) => [...prev, newOrganizer])
    updateData({
      organizers: [
        ...data.organizers,
        {
          id: newOrganizer.id,
          name: newOrganizer.name,
          email: newOrganizer.email,
          role: newOrganizer.role,
        },
      ],
    })

    setNewEmail("")
    setNewAffiliation("")
  }

  const handleRemoveOrganizer = (id: string) => {
    if (id === CURRENT_USER.id) return
    setOrganizers((prev) => prev.filter((o) => o.id !== id))
    updateData({
      organizers: data.organizers.filter((o) => o.id !== id),
    })
  }

  // Group organizers by role for the summary
  const roleGroups = {
    chairs: organizers.filter((o) => o.role === "general-chair" || o.role === "co-chair"),
    pcMembers: organizers.filter((o) => o.role === "pc-member"),
    trackChairs: organizers.filter((o) => o.role === "track-chair"),
    reviewers: organizers.filter((o) => o.role === "reviewer"),
  }

  const pendingCount = organizers.filter((o) => o.status === "pending").length

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <WizardHeader
        title={t("runtime.components.wizard.creation.steps.committees.title_committees")}
        description="Build your organizing committee by inviting collaborators."
      />

      <form
        className="flex flex-col gap-4 w-full pt-0 pb-[64px]"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t("runtime.components.wizard.creation.steps.committees.prop_label_chairs"), count: roleGroups.chairs.length, icon: "workspace_premium" },
            { label: t("runtime.components.wizard.creation.steps.committees.prop_label_pc_members"), count: roleGroups.pcMembers.length, icon: "groups" },
            { label: t("runtime.components.wizard.creation.steps.committees.prop_label_track_chairs"), count: roleGroups.trackChairs.length, icon: "category" },
            {
              label: t("runtime.components.wizard.creation.steps.committees.prop_label_pending"),
              count: pendingCount,
              icon: "schedule",
              highlight: pendingCount > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
                stat.highlight
                  ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  stat.highlight ? "text-amber-500" : "text-slate-400"
                }`}
                style={{ fontSize: "16px", width: "16px", height: "16px" }}
              >
                {stat.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {stat.label}
                </span>
                <span
                  className={`text-sm font-bold ${
                    stat.highlight
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-[#141414] dark:text-white"
                  }`}
                >
                  {stat.count}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Invite Form - Compact inline design */}
        <WizardFormCard title={t("runtime.components.wizard.creation.steps.committees.title_invite_member")}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-2 items-end">
              <div className="flex-1 min-w-0">
                <WizardFormField label="Email" required>
                  <WizardInput
                    type="email"
                    placeholder={t("runtime.components.wizard.creation.steps.committees.placeholder_colleague_university_edu")}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOrganizer()}
                  />
                </WizardFormField>
              </div>
              <div className="w-full md:w-36">
                <WizardFormField label="Role" required>
                  <select
                    className="w-full h-10 text-xs font-normal py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </WizardFormField>
              </div>
              <div className="w-full md:w-40">
                <WizardFormField label="Affiliation">
                  <WizardInput
                    type="text"
                    placeholder={t("runtime.components.wizard.creation.steps.committees.placeholder_institution")}
                    value={newAffiliation}
                    onChange={(e) => setNewAffiliation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOrganizer()}
                  />
                </WizardFormField>
              </div>
              <button
                type="button"
                onClick={handleAddOrganizer}
                disabled={!newEmail.trim()}
                className="h-10 px-4 bg-[#1B3C53] hover:bg-[#234C6A] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", width: "14px", height: "14px" }}
                >
                  person_add
                </span>
                {t("runtime.components.wizard.creation.steps.committees.text_invite")}{" "}</button>
            </div>
            <p className="text-[10px] text-slate-400 font-light">
              {t("runtime.components.wizard.creation.steps.committees.text_press_enter_to_quickly_add_invitations")}{" "}</p>
          </div>
        </WizardFormCard>

        {/* Committee Members - Compact List */}
        <WizardFormCard title={t("runtime.components.wizard.creation.steps.committees.title_committee_members")}>
          <div className="flex flex-col -mt-1">
            {/* List of members */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {organizers.map((member) => (
                <div
                  key={member.id}
                  className="group grid grid-cols-[auto_1fr_100px_60px] items-center gap-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 -mx-4 px-4 transition-colors"
                >
                  {/* Avatar */}
                  <div className="size-8 rounded-full bg-[#1B3C53]/10 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-[#1B3C53] dark:text-slate-300">
                    {getInitials(member.name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#141414] dark:text-white truncate">
                        {member.name}
                      </span>
                      {member.id === CURRENT_USER.id && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                          {t("runtime.components.wizard.creation.steps.committees.text_you")}{" "}</span>
                      )}
                      {member.status === "pending" && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                          {t("runtime.components.wizard.creation.steps.committees.text_pending")}{" "}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="truncate">{member.email}</span>
                      {member.affiliation && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="truncate">{member.affiliation}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role Badge - Fixed width column */}
                  <div className="flex justify-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>

                  {/* Actions - Fixed width column at end */}
                  <div className="flex items-center justify-end gap-0.5">
                    {member.id === CURRENT_USER.id ? (
                      <span className="text-[9px] text-slate-300 dark:text-slate-600 italic">
                        {t("runtime.components.wizard.creation.steps.committees.text_owner")}{" "}</span>
                    ) : (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {member.status === "pending" && (
                          <button
                            type="button"
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            title={t("runtime.components.wizard.creation.steps.committees.title_resend")}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "14px", width: "14px", height: "14px" }}
                            >
                              send
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveOrganizer(member.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500 transition-colors"
                          title={t("runtime.components.wizard.creation.steps.committees.title_remove")}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "14px", width: "14px", height: "14px" }}
                          >
                            close
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {organizers.length === 1 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span
                  className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-2"
                  style={{ fontSize: "32px" }}
                >
                  group_add
                </span>
                <p className="text-xs text-slate-400">
                  {t("runtime.components.wizard.creation.steps.committees.text_start_building_your_committee_by_inviting")}{" "}</p>
              </div>
            )}
          </div>
        </WizardFormCard>

        {/* Tip Card */}
        <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <span
            className="material-symbols-outlined text-[#1B3C53] dark:text-slate-400 flex-shrink-0 mt-0.5"
            style={{ fontSize: "14px", width: "14px", height: "14px" }}
          >
            lightbulb
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B3C53] dark:text-slate-300">
              {t("runtime.components.wizard.creation.steps.committees.text_academic_best_practice")}{" "}</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("runtime.components.wizard.creation.steps.committees.text_for_top_tier_conferences_aim_for")}{" "}</p>
          </div>
        </div>
      </form>
    </div>
  )
}
