"use client"

import type { ReactNode } from "react"
import type { AcademicProfile } from "@/lib/api/user"
import type { User } from "@/lib/types"
import { AcademicStateCallout } from "@/components/profile/profile-academic-callout"
import { ProfileIdentityAvatar } from "@/components/profile/profile-identity-avatar"
import { ProfileMetricCard } from "@/components/profile/profile-metric-card"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

function formatSyncedAt(value: string | undefined, locale: string) {
  if (!value) return null
  const parsed = new Date(value.replace(" ", "T"))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ProfileHeroSection({
  profile,
  academicProfile,
  displayName,
  domains,
  isOwnProfile,
  profileSyncStatus,
  profileSyncError,
  syncBadge,
  locale,
  isUnlinking,
  onConnect,
  onUnlink,
  t,
}: {
  profile: User
  academicProfile: AcademicProfile | null
  displayName: string
  domains: string[]
  isOwnProfile: boolean
  profileSyncStatus: string | null
  profileSyncError: string | null
  syncBadge: { className: string; label: string } | null
  locale: string
  isUnlinking: boolean
  onConnect: () => void
  onUnlink: () => void
  t: (key: string) => string
}) {
  const affiliations = academicProfile?.affiliations?.filter(Boolean) || []
  const syncedAtLabel = formatSyncedAt(academicProfile?.syncedAt, locale)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Navy header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-[#1B3C53] via-[#234C6A] to-[#456882] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <ProfileIdentityAvatar
              name={displayName}
              seed={profile.email || academicProfile?.semanticScholarId || displayName}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{displayName}</h1>
                <span className="inline-flex items-center rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-white/15 text-white/90 border border-white/20">
                  {isOwnProfile
                    ? t("runtime.app.profile.user_id.page.text_profile_owner")
                    : t("runtime.app.profile.user_id.page.text_public_profile")}
                </span>
                {academicProfile && (
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-400/20 text-emerald-200 border border-emerald-300/20">
                    {t("runtime.app.profile.user_id.page.text_academic_profile_linked")}
                  </span>
                )}
                {syncBadge && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                      syncBadge.className,
                    )}
                  >
                    {syncBadge.label}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    mail
                  </span>
                  {profile.email}
                </span>
                {affiliations[0] && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      domain
                    </span>
                    {affiliations[0]}
                  </span>
                )}
                {syncedAtLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      schedule
                    </span>
                    {t("runtime.app.profile.user_id.page.text_last_synced")} {syncedAtLabel}
                  </span>
                )}
              </div>
              {affiliations.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {affiliations.slice(1, 4).map((affiliation) => (
                    <span
                      key={affiliation}
                      className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium bg-white/10 text-white/80"
                    >
                      {affiliation}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
            {academicProfile?.url && (
              <a
                href={academicProfile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center h-8 px-3 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white hover:bg-white/20 transition-colors gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  open_in_new
                </span>
                {t("runtime.app.profile.user_id.page.text_view_scholar_profile")}
              </a>
            )}
            {isOwnProfile && !academicProfile && (
              <button
                onClick={onConnect}
                disabled={profileSyncStatus === "pending"}
                className="inline-flex items-center h-8 px-3 rounded-full bg-white text-[#1B3C53] text-[11px] font-medium hover:bg-white/90 transition-colors gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  link
                </span>
                {t("runtime.app.profile.user_id.page.text_connect")}
              </button>
            )}
            {isOwnProfile && academicProfile && (
              <button
                onClick={onUnlink}
                disabled={isUnlinking || profileSyncStatus === "pending"}
                className="inline-flex items-center h-8 px-3 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white hover:bg-white/20 transition-colors gap-2 disabled:opacity-50"
              >
                {isUnlinking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    link_off
                  </span>
                )}
                {t("runtime.app.profile.user_id.page.text_unlink")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics + interests */}
      <div className="px-6 py-5 space-y-4">
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <ProfileMetricCard
            label={t("runtime.app.profile.user_id.page.text_h_index")}
            value={academicProfile?.hIndex ?? 0}
          />
          <ProfileMetricCard
            label={t("runtime.app.profile.user_id.page.text_citations")}
            value={academicProfile?.citationCount ?? 0}
          />
          <ProfileMetricCard
            label={t("runtime.app.profile.user_id.page.text_papers")}
            value={academicProfile?.paperCount ?? academicProfile?.papers?.length ?? 0}
          />
          <ProfileMetricCard
            label={t("runtime.app.profile.user_id.page.text_sync_freshness")}
            value={syncedAtLabel || t("runtime.app.profile.user_id.page.text_not_synced_yet")}
          />
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {t("runtime.app.profile.user_id.page.text_research_interests")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {domains.length > 0 ? (
              domains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-[#456882] dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                >
                  {domain}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">
                {t("runtime.app.profile.user_id.page.text_no_research_interests_listed")}
              </span>
            )}
          </div>
        </div>

        {/* Academic state callouts */}
        {!academicProfile && profileSyncStatus === "pending" && (
          <AcademicStateCallout
            tone="info"
            icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}
            title={t("runtime.app.profile.user_id.page.text_profile_sync_in_progress")}
            description={t(
              "runtime.app.profile.user_id.page.text_sync_in_progress_your_profile_metrics_and_publications_will_appear_when_it_completes",
            )}
          />
        )}
        {!academicProfile && profileSyncStatus === "failed" && (
          <AcademicStateCallout
            tone="danger"
            icon={
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                error
              </span>
            }
            title={t("runtime.app.profile.user_id.page.text_sync_failed")}
            description={
              profileSyncError ||
              t(
                "runtime.app.profile.user_id.page.text_profile_sync_failed_retry_linking_your_profile",
              )
            }
            action={
              isOwnProfile ? (
                <button
                  className="h-7 px-2.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors"
                  onClick={onConnect}
                >
                  {t("runtime.app.profile.user_id.page.text_retry_sync")}
                </button>
              ) : undefined
            }
          />
        )}
        {!academicProfile && profileSyncStatus !== "pending" && profileSyncStatus !== "failed" && (
          <AcademicStateCallout
            icon={
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                school
              </span>
            }
            title={
              isOwnProfile
                ? t("runtime.app.profile.user_id.page.text_build_your_academic_profile")
                : t("runtime.app.profile.user_id.page.text_no_academic_profile_linked")
            }
            description={
              isOwnProfile
                ? t(
                    "runtime.app.profile.user_id.page.text_connect_your_semantic_scholar_profile_to_sync_citations_and_publications",
                  )
                : t(
                    "runtime.app.profile.user_id.page.text_this_user_has_not_linked_an_academic_profile",
                  )
            }
            action={
              isOwnProfile ? (
                <button
                  className="h-8 px-3 rounded-full bg-[#1B3C53] text-white text-[11px] font-medium hover:bg-[#234C6A] transition-colors"
                  onClick={onConnect}
                >
                  {t("runtime.app.profile.user_id.page.text_connect")}
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
