"use client"

import type { ProfileFormData } from "@/lib/types"

const normalizeDomains = (domains: unknown): string[] => {
  if (!Array.isArray(domains)) return []
  return domains
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
    .filter((item) => item.length > 0)
}

export function ProfileAccountSection({
  formData,
  isOwnProfile,
  onEditDetails,
  onChangePassword,
  t,
}: {
  formData: ProfileFormData
  isOwnProfile: boolean
  onEditDetails: () => void
  onChangePassword: () => void
  t: (key: string) => string
}) {
  const domains = normalizeDomains(formData.domain)

  return (
    <div className="space-y-3">
      {/* Account Details - read-only */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
              {t("runtime.app.profile.user_id.page.text_account_details")}
            </h2>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              {isOwnProfile
                ? t(
                    "runtime.app.profile.user_id.page.text_manage_the_information_used_across_the_platform",
                  )
                : t("runtime.app.profile.user_id.page.text_read_only_profile_information")}
            </p>
          </div>
          {isOwnProfile && (
            <button
              onClick={onEditDetails}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-[#1B3C53]/20 bg-[#1B3C53]/5 text-[10px] font-bold uppercase tracking-widest text-[#1B3C53] dark:text-white hover:bg-[#1B3C53]/10 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                edit
              </span>
              {t("runtime.components.profile.profile-account-section.text_edit")}{" "}</button>
          )}
        </div>

        <div className="px-4 py-1 divide-y divide-slate-100 dark:divide-slate-700">
          {[
            {
              label: t("runtime.app.profile.user_id.page.text_first_name"),
              value: formData.firstName || "—",
            },
            {
              label: t("runtime.app.profile.user_id.page.text_last_name"),
              value: formData.lastName || "—",
            },
            {
              label: t("runtime.app.profile.user_id.page.text_email"),
              value: formData.email || "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 w-28">
                {label}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-200 text-right truncate">
                {value}
              </span>
            </div>
          ))}
          <div className="flex items-start justify-between py-3 gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 w-28">
              {t("runtime.app.profile.user_id.page.text_domains")}
            </span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {domains.length > 0 ? (
                domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-[#456882] dark:text-slate-300"
                  >
                    {domain}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">
                  {t("runtime.app.profile.user_id.page.text_no_domains_listed")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password button */}
      {isOwnProfile && (
        <button
          onClick={onChangePassword}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-[#1B3C53]/10 transition-colors">
              <span
                className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors"
                style={{ fontSize: "16px" }}
              >
                lock
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#1B3C53] dark:text-white">{t("runtime.components.profile.profile-account-section.text_change_password")}</p>
              <p className="text-[10px] font-medium text-slate-400">
                {t("runtime.components.profile.profile-account-section.text_update_your_account_password_securely")}{" "}</p>
            </div>
          </div>
          <span
            className="material-symbols-outlined text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors"
            style={{ fontSize: "18px" }}
          >
            chevron_right
          </span>
        </button>
      )}
    </div>
  )
}
