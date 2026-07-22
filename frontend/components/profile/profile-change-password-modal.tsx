"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api/auth"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

type PwRuleKey = "length" | "lower" | "upper" | "number" | "special"
const PW_RULE_ORDER: PwRuleKey[] = ["length", "lower", "upper", "number", "special"]
const PW_RULE_LABELS: Record<PwRuleKey, string> = {
  length: "At least 8 characters",
  lower: "Lowercase letter",
  upper: "Uppercase letter",
  number: "Number",
  special: "Special character",
}

export function ProfileChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [form, setForm] = useState({ current: "", next: "", confirm: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  const checks: Record<PwRuleKey, boolean> = {
    length: form.next.length >= 8,
    lower: /[a-z]/.test(form.next),
    upper: /[A-Z]/.test(form.next),
    number: /\d/.test(form.next),
    special: /[^A-Za-z0-9]/.test(form.next),
  }
  const strength = PW_RULE_ORDER.filter((r) => checks[r]).length

  const handleSubmit = async () => {
    setError("")
    if (form.next !== form.confirm) {
      setError("Passwords do not match.")
      return
    }
    if (!PW_RULE_ORDER.every((r) => checks[r])) {
      setError("New password does not meet all requirements.")
      return
    }
    setLoading(true)
    try {
      await authApi.changePassword(form.current, form.next)
      toast({ title: t("runtime.components.profile.profile-change-password-modal.prop_title_password_changed"), description: t("runtime.components.profile.profile-change-password-modal.prop_description_your_password_was_updated_successfully") })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(15,23,42,0.5)" }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 id="change-password-title" className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
              {t("runtime.components.profile.profile-change-password-modal.text_change_password")}{" "}</h2>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              {t("runtime.components.profile.profile-change-password-modal.text_update_your_account_password_securely")}{" "}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dashboard.discussion.close")}
            className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Current */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("runtime.components.profile.profile-change-password-modal.text_current_password")}{" "}</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="--------"
                value={form.current}
                onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
                disabled={loading}
                className="pr-10 h-9 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* New */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("runtime.components.profile.profile-change-password-modal.text_new_password")}{" "}</label>
            <div className="flex gap-1 mb-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    background:
                      i < strength
                        ? ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][strength - 1]
                        : "#e2e8f0",
                  }}
                />
              ))}
            </div>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                placeholder="--------"
                value={form.next}
                onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
                disabled={loading}
                className="pr-10 h-9 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                tabIndex={-1}
              >
                {showNext ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("runtime.components.profile.profile-change-password-modal.text_confirm_new_password")}{" "}</label>
            <Input
              type="password"
              placeholder="--------"
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          {/* Rules */}
          <div className="flex flex-wrap gap-1.5">
            {PW_RULE_ORDER.map((rule) => (
              <span
                key={rule}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  checks[rule]
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-50 text-slate-500 border border-slate-200",
                )}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>
                  {checks[rule] ? "check" : "circle"}
                </span>
                {PW_RULE_LABELS[rule]}
              </span>
            ))}
          </div>

          {error && <p className="text-[11px] text-rose-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-8 px-4 rounded-full border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {t("runtime.components.profile.profile-change-password-modal.text_cancel")}{" "}</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.current || !form.next || !form.confirm}
            className="h-8 px-4 rounded-full bg-[#1B3C53] text-white text-[11px] font-medium hover:bg-[#234C6A] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin inline" />
                {t("runtime.components.profile.profile-change-password-modal.text_saving")}{" "}</>
            ) : (
              "Change password"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
