"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import type { ProfileFormData } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

const normalizeDomains = (domains: unknown): string[] => {
  if (!Array.isArray(domains)) return []
  return domains
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "").trim()))
    .filter((item) => item.length > 0)
}

export function ProfileEditDetailsModal({
  initialData,
  onSave,
  onClose,
  saving,
}: {
  initialData: ProfileFormData
  onSave: (data: ProfileFormData) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<ProfileFormData>({
    ...initialData,
    domain: [...initialData.domain],
  })
  const [domainInput, setDomainInput] = useState("")

  const domains = normalizeDomains(formData.domain)

  const isDirty = useMemo(() => {
    const sameDomains =
      formData.domain.length === initialData.domain.length &&
      formData.domain.every((v, i) => v.trim() === (initialData.domain[i] || "").trim())
    return (
      formData.firstName.trim() !== initialData.firstName.trim() ||
      formData.lastName.trim() !== initialData.lastName.trim() ||
      formData.email.trim() !== initialData.email.trim() ||
      !sameDomains
    )
  }, [formData, initialData])

  const addDomain = () => {
    const value = domainInput.trim()
    if (!value || formData.domain.includes(value)) return
    setFormData((prev) => ({ ...prev, domain: [...prev.domain, value] }))
    setDomainInput("")
  }

  const removeDomain = (value: string) =>
    setFormData((prev) => ({ ...prev, domain: prev.domain.filter((d) => d !== value) }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(15,23,42,0.5)" }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
              {t("runtime.components.profile.profile-edit-details-modal.text_edit_account_details")}{" "}</h2>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              {t("runtime.components.profile.profile-edit-details-modal.text_update_your_profile_information")}{" "}</p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-first-name"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                {t("runtime.components.profile.profile-edit-details-modal.text_first_name")}{" "}</label>
              <Input
                id="edit-first-name"
                value={formData.firstName}
                disabled={saving}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="edit-last-name"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                {t("runtime.components.profile.profile-edit-details-modal.text_last_name")}{" "}</label>
              <Input
                id="edit-last-name"
                value={formData.lastName}
                disabled={saving}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-email"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
              {t("runtime.components.profile.profile-edit-details-modal.text_email")}{" "}</label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              disabled={saving}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("runtime.components.profile.profile-edit-details-modal.text_research_domains")}{" "}</label>
            <div className="flex gap-2">
              <Input
                value={domainInput}
                disabled={saving}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addDomain()
                  }
                }}
                placeholder={t("runtime.components.profile.profile-edit-details-modal.placeholder_add_a_domain")}
                className="h-9 text-xs"
              />
              <button
                type="button"
                onClick={addDomain}
                disabled={saving || !domainInput.trim()}
                className="h-9 px-4 rounded-md bg-slate-100 dark:bg-slate-700 text-[11px] font-medium text-[#1B3C53] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 shrink-0"
              >
                {t("runtime.components.profile.profile-edit-details-modal.text_add")}{" "}</button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
              {domains.length > 0 ? (
                domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      disabled={saving}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                        close
                      </span>
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">{t("runtime.components.profile.profile-edit-details-modal.text_no_domains_listed")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-8 px-4 rounded-full border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {t("runtime.components.profile.profile-edit-details-modal.text_cancel")}{" "}</button>
          <button
            onClick={() => onSave(formData)}
            disabled={saving || !isDirty}
            className="h-8 px-4 rounded-full bg-[#1B3C53] text-white text-[11px] font-medium hover:bg-[#234C6A] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
