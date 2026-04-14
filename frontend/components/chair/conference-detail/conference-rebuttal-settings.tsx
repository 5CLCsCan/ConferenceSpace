"use client"

import { useEffect, useState } from "react"
import {
  getRebuttalOverview,
  saveRebuttalSettings,
  type ConferenceRebuttalConfig,
} from "@/lib/api/conference-rebuttal"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceRebuttalSettingsProps {
  conferenceId: string
  onSaved?: () => void
}

export function ConferenceRebuttalSettings({
  conferenceId,
  onSaved,
}: ConferenceRebuttalSettingsProps) {
  const { t } = useTranslation()
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
    return (
      <div className="text-body py-4">
        {t(
          "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_loading_settings",
        )}
      </div>
    )
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-[var(--color-border-soft)] px-4 pb-3 pt-4">
        <h2 className="text-card-header">
          {t(
            "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_rebuttal_configuration",
          )}{" "}
        </h2>
        <p className="text-body mt-0.5 leading-relaxed">
          {t(
            "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_configure_the_rebuttal_period_settings_for",
          )}{" "}
        </p>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-ui-meta font-[700] text-[var(--color-primary-ink)]">
              {t(
                "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_enable_rebuttal_phase",
              )}{" "}
            </p>
            <p className="text-meta">
              {t(
                "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_allow_authors_to_submit_rebuttals_to",
              )}{" "}
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              enabled ? "bg-[var(--color-primary-ink)]" : "bg-[var(--color-border-strong)]"
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
            <label className="text-table-header mb-1 block">
              {t(
                "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_start_date",
              )}{" "}
            </label>
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="control-standard text-body w-full px-3 py-1.5 focus:border-[var(--color-primary-ink)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-table-header mb-1 block">
              {t(
                "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_deadline",
              )}{" "}
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="control-standard text-body w-full px-3 py-1.5 focus:border-[var(--color-primary-ink)] focus:outline-none"
            />
          </div>
        </div>

        {/* Char limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-table-header mb-1 block">
              {t(
                "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_general_response_limit_chars",
              )}{" "}
            </label>
            <input
              type="number"
              min={100}
              max={10000}
              value={charLimitGeneral}
              onChange={(e) => setCharLimitGeneral(Number(e.target.value))}
              className="control-standard text-body w-full px-3 py-1.5 focus:border-[var(--color-primary-ink)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-table-header mb-1 block">
              {t(
                "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_per_point_response_limit_chars",
              )}{" "}
            </label>
            <input
              type="number"
              min={100}
              max={5000}
              value={charLimitPerPoint}
              onChange={(e) => setCharLimitPerPoint(Number(e.target.value))}
              className="control-standard text-body w-full px-3 py-1.5 focus:border-[var(--color-primary-ink)] focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="badge-semantic-error rounded-[var(--radius-button)] px-3 py-2 text-ui-meta">
            {error}
          </div>
        )}

        {success && (
          <div className="badge-semantic-success rounded-[var(--radius-button)] px-3 py-2 text-ui-meta">
            {t(
              "runtime.components.chair.conference-detail.conference-rebuttal-settings.text_settings_saved_successfully",
            )}{" "}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="button-primary text-ui-meta px-4 py-1.5 font-[500] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
