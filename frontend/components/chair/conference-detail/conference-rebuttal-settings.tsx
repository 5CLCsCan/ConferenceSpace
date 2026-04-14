"use client"

import { useEffect, useState } from "react"
import {
  getRebuttalOverview,
  saveRebuttalSettings,
  type ConferenceRebuttalConfig,
} from "@/lib/api/conference-rebuttal"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { isReadOnlyRole } from "@/lib/role-helpers"

interface ConferenceRebuttalSettingsProps {
  conferenceId: string
  onSaved?: () => void
}

export function ConferenceRebuttalSettings({
  conferenceId,
  onSaved,
}: ConferenceRebuttalSettingsProps) {
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const readOnly = isReadOnlyRole(currentRole)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [enabled, setEnabled] = useState(false)
  const [startAt, setStartAt] = useState("")
  const [deadline, setDeadline] = useState("")
  const [charLimitGeneral, setCharLimitGeneral] = useState(3000)
  const [charLimitPerPoint, setCharLimitPerPoint] = useState(1000)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await getRebuttalOverview(conferenceId)
      setLoading(false)
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to load settings")
        return
      }
      const s = result.data.settings
      setEnabled(s.enabled)
      setStartAt(s.start_at ? s.start_at.slice(0, 10) : "")
      setDeadline(s.deadline ? s.deadline.slice(0, 10) : "")
      setCharLimitGeneral(s.char_limit_general || 3000)
      setCharLimitPerPoint(s.char_limit_per_point || 1000)
    }
    void load()
  }, [conferenceId])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const settings: Partial<ConferenceRebuttalConfig> = {
      enabled,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      char_limit_general: charLimitGeneral,
      char_limit_per_point: charLimitPerPoint,
      allow_discussion: false,
    }

    const result = await saveRebuttalSettings(conferenceId, settings)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSaved?.()
    }
  }

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">{t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_loading_settings")}</div>
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_rebuttal_configuration")}{" "}</h2>
        <p className="text-xs font-light text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
          {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_configure_the_rebuttal_period_settings_for")}{" "}</p>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_enable_rebuttal_phase")}{" "}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_allow_authors_to_submit_rebuttals_to")}{" "}</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              enabled ? "bg-[#1B3C53]" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_start_date")}{" "}</label>
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_deadline")}{" "}</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
            />
          </div>
        </div>

        {/* Char limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_general_response_limit_chars")}{" "}</label>
            <input
              type="number"
              min={100}
              max={10000}
              value={charLimitGeneral}
              onChange={(e) => setCharLimitGeneral(Number(e.target.value))}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_per_point_response_limit_chars")}{" "}</label>
            <input
              type="number"
              min={100}
              max={5000}
              value={charLimitPerPoint}
              onChange={(e) => setCharLimitPerPoint(Number(e.target.value))}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {t("runtime.components.chair.conference-detail.conference-rebuttal-settings.text_settings_saved_successfully")}{" "}</div>
        )}

        {!readOnly && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-4 py-1.5 rounded-lg bg-[#1B3C53] text-white hover:bg-[#1B3C53]/90 disabled:opacity-50 font-medium"
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
