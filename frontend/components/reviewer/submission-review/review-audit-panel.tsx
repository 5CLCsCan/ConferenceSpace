"use client"

import { Button } from "@/components/ui/button"
import type { ReviewAuditFinding, ReviewAuditResponse } from "@/lib/api/review-audit"
import { useTranslation } from "@/lib/i18n/translation-context"
import { cn } from "@/lib/utils"

type ReviewAuditPanelProps = {
  audit: ReviewAuditResponse | null
  auditing: boolean
  updatingDismissal: boolean
  error: string | null
  canSubmitAnyway?: boolean
  submittingOverride?: boolean
  onSubmitAnyway?: () => void | Promise<void>
  onDismiss: (finding: ReviewAuditFinding) => void | Promise<void>
  onUndismiss: (finding: ReviewAuditFinding) => void | Promise<void>
}

export function ReviewAuditPanel({
  audit,
  auditing,
  updatingDismissal,
  error,
  canSubmitAnyway = false,
  submittingOverride = false,
  onSubmitAnyway,
  onDismiss,
  onUndismiss,
}: ReviewAuditPanelProps) {
  const { t } = useTranslation()
  const activeFindings = audit?.active_findings ?? []
  const dismissedFindings = audit?.dismissed_findings ?? []
  const criticalFindings = activeFindings.filter((finding) => finding.severity === "blocking")
  const suggestionFindings = activeFindings.filter((finding) => finding.severity === "warning")
  const isBlockStatus = audit?.status === "block"
  const isWarnStatus = audit?.status === "warn"

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm",
        isBlockStatus
          ? "border-rose-300 ring-2 ring-rose-200/80 shadow-rose-100/60"
          : isWarnStatus
            ? "border-amber-200"
            : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            {t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_ai_010_review_audit",
            )}{" "}
          </p>
          <h3 className="mt-2 text-sm font-bold tracking-tight text-[#1B3C53]">
            {t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_semantic_consistency_and_justification_audit",
            )}{" "}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_ai_010_checks_whether_your_narrative",
            )}{" "}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {auditing ? (
            <span className="text-[11px] font-medium text-slate-500">
              {t("runtime.components.reviewer.submission-review.review-audit-panel.text_auditing")}
            </span>
          ) : audit ? (
            <StatusBadge status={audit.status} t={t} />
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              {t(
                "runtime.components.reviewer.submission-review.review-audit-panel.text_not_run_yet",
              )}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          {error}
        </div>
      )}

      {!audit ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-xs leading-relaxed text-slate-500">
          {t(
            "runtime.components.reviewer.submission-review.review-audit-panel.text_save_a_draft_or_run_submit",
          )}{" "}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {isBlockStatus && (
            <div
              role="alert"
              className="rounded-xl border border-rose-300 bg-gradient-to-br from-rose-50 via-rose-50 to-orange-50 px-4 py-3 shadow-sm shadow-rose-100/80"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white"
                  aria-hidden
                >
                  !
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-800">
                    {t(
                      "runtime.components.reviewer.submission-review.review-audit-panel.text_critical_attention_required",
                    )}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-rose-900">
                    {t(
                      "runtime.components.reviewer.submission-review.review-audit-panel.text_critical_attention_body",
                    )}
                  </p>
                  {canSubmitAnyway && onSubmitAnyway && (
                    <Button
                      type="button"
                      className="mt-3 h-8 bg-rose-700 px-3 text-[11px] font-bold text-white hover:bg-rose-800"
                      disabled={submittingOverride}
                      onClick={onSubmitAnyway}
                    >
                      {submittingOverride
                        ? t("runtime.components.reviewer.submission-review.text_submitting")
                        : t("runtime.components.reviewer.submission-review.text_submit_anyway")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              isBlockStatus
                ? "border-rose-200 bg-rose-50/40"
                : isWarnStatus
                  ? "border-amber-100 bg-amber-50/40"
                  : "border-slate-200 bg-slate-50",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <CountPill
                label={t(
                  "runtime.components.reviewer.submission-review.review-audit-panel.text_critical_signals",
                )}
                value={criticalFindings.length}
                tone="critical"
              />
              <CountPill
                label={t(
                  "runtime.components.reviewer.submission-review.review-audit-panel.title_advisory_warnings",
                )}
                value={suggestionFindings.length}
                tone="amber"
              />
              <CountPill
                label={t(
                  "runtime.components.reviewer.submission-review.review-audit-panel.title_dismissed_warnings",
                )}
                value={dismissedFindings.length}
                tone="slate"
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {t(
                "runtime.components.reviewer.submission-review.review-audit-panel.text_findings_are_reviewer_facing",
              )}
            </p>
          </div>

          <AuditEvaluationCard audit={audit} />

          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_critical_findings",
            )}
            emptyLabel={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_no_critical_findings",
            )}
            findings={criticalFindings}
            tone="critical"
            actionLabel="Dismiss"
            actionDisabled
            onAction={onDismiss}
          />
          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_advisory_warnings",
            )}
            emptyLabel={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_no_active_suggestions",
            )}
            findings={suggestionFindings}
            tone="warning"
            actionLabel="Dismiss"
            actionDisabled={auditing || updatingDismissal}
            onAction={onDismiss}
          />
          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_dismissed_warnings",
            )}
            emptyLabel={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_no_dismissed_warnings",
            )}
            findings={dismissedFindings}
            tone="dismissed"
            actionLabel="Reopen"
            actionDisabled={auditing || updatingDismissal}
            onAction={onUndismiss}
          />
        </div>
      )}
    </div>
  )
}

function StatusBadge({
  status,
  t,
}: {
  status: ReviewAuditResponse["status"]
  t: (key: string) => string
}) {
  if (status === "block") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm shadow-rose-200">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden />
        {t("runtime.components.reviewer.submission-review.review-audit-panel.text_status_critical")}
      </span>
    )
  }
  if (status === "warn") {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
        {t(
          "runtime.components.reviewer.submission-review.review-audit-panel.text_status_suggestions",
        )}
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
      {t("runtime.components.reviewer.submission-review.review-audit-panel.text_status_clear")}
    </span>
  )
}

function CountPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "critical" | "amber" | "slate"
}) {
  const toneClass =
    tone === "critical"
      ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600"

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${toneClass}`}>
      {label}: {value}
    </span>
  )
}

function AuditEvaluationCard({ audit }: { audit: ReviewAuditResponse }) {
  const { t } = useTranslation()
  const evaluation = audit.evaluation
  const items = [
    {
      label: t(
        "runtime.components.reviewer.submission-review.review-audit-panel.text_evidence_engagement",
      ),
      value: evaluation?.evidence_engagement,
    },
    {
      label: t("runtime.components.reviewer.submission-review.review-audit-panel.text_consistency"),
      value: evaluation?.consistency_assessment,
    },
    {
      label: t(
        "runtime.components.reviewer.submission-review.review-audit-panel.text_best_next_improvement",
      ),
      value: evaluation?.improvement_focus,
    },
  ].filter((item) => item.value?.trim())
  const summary = evaluation?.summary?.trim()

  if (!summary && items.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {t("runtime.components.reviewer.submission-review.review-audit-panel.text_evaluation")}
      </h4>
      {summary && <p className="mt-2 text-xs leading-relaxed text-slate-700">{summary}</p>}
      {items.length > 0 && (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FindingSection({
  title,
  emptyLabel,
  findings,
  tone,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  title: string
  emptyLabel: string
  findings: ReviewAuditFinding[]
  tone: "critical" | "warning" | "dismissed"
  actionLabel: string
  actionDisabled: boolean
  onAction: (finding: ReviewAuditFinding) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const isCritical = tone === "critical"

  return (
    <section>
      <div className="flex items-center justify-between">
        <h4
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.2em]",
            isCritical ? "text-rose-700" : "text-slate-500",
          )}
        >
          {title}
        </h4>
        <span
          className={cn(
            "text-[10px] font-semibold",
            isCritical && findings.length > 0 ? "text-rose-600" : "text-slate-400",
          )}
        >
          {findings.length}
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {findings.map((finding) => {
            const isBlocking = finding.severity === "blocking"
            return (
              <div
                key={`${finding.code}-${finding.condition_fingerprint}`}
                className={cn(
                  "rounded-xl border px-4 py-3",
                  isBlocking
                    ? "border-rose-300 bg-gradient-to-br from-rose-50 to-white shadow-sm shadow-rose-100/70 ring-1 ring-rose-200/70"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]",
                          isBlocking
                            ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {formatSeverityLabel(finding.severity)}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {formatFieldLabel(finding.field)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatFamilyLabel(finding.code)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-xs font-semibold leading-relaxed",
                        isBlocking ? "text-rose-950" : "text-slate-900",
                      )}
                    >
                      {finding.message}
                    </p>
                    {finding.rationale && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        <span className="font-semibold text-slate-700">
                          {t(
                            "runtime.components.reviewer.submission-review.review-audit-panel.text_rationale",
                          )}{" "}
                        </span>
                        {finding.rationale}
                      </p>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {finding.suggestion}
                    </p>
                  </div>
                  {finding.severity === "warning" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-md border-slate-200 px-3 text-[10px]"
                      disabled={actionDisabled}
                      onClick={() => onAction(finding)}
                    >
                      {actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function formatFieldLabel(field: string) {
  const explicit: Record<string, string> = {
    review: "Whole review",
    recommendation: "Recommendation",
    confidence: "Confidence",
    summary: "Summary",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    questions: "Questions",
    "criteria.originality": "Originality score",
    "criteria.technical_quality": "Technical quality score",
    "criteria.clarity": "Clarity score",
    "criteria.significance": "Significance score",
    "criteria.methodology": "Methodology score",
  }

  return explicit[field] ?? field
}

function formatSeverityLabel(severity: string) {
  return severity === "blocking" ? "critical" : "suggestion"
}

function formatFamilyLabel(code: string) {
  const family = code.split(".")[0]
  const explicit: Record<string, string> = {
    consistency: "Consistency",
    justification: "Justification",
    coverage: "Coverage",
    quality: "Review quality",
    policy: "Policy",
  }
  return explicit[family] ?? family
}
