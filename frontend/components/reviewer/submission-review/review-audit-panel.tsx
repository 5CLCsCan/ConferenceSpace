"use client"

import { Button } from "@/components/ui/button"
import type { ReviewAuditFinding, ReviewAuditResponse } from "@/lib/api/review-audit"
import { useTranslation } from "@/lib/i18n/translation-context"

type ReviewAuditPanelProps = {
  audit: ReviewAuditResponse | null
  auditing: boolean
  updatingDismissal: boolean
  error: string | null
  onDismiss: (finding: ReviewAuditFinding) => void | Promise<void>
  onUndismiss: (finding: ReviewAuditFinding) => void | Promise<void>
}

const statusTone: Record<ReviewAuditResponse["status"], string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  block: "border-rose-200 bg-rose-50 text-rose-700",
}

const statusCopy: Record<ReviewAuditResponse["status"], string> = {
  pass: "No active semantic issues detected.",
  warn: "Advisory issues need reviewer attention before submit.",
  block: "The review is not ready to submit until the blockers are resolved.",
}

export function ReviewAuditPanel({
  audit,
  auditing,
  updatingDismissal,
  error,
  onDismiss,
  onUndismiss,
}: ReviewAuditPanelProps) {
  const { t } = useTranslation()
  const activeFindings = audit?.active_findings ?? []
  const dismissedFindings = audit?.dismissed_findings ?? []
  const blockingFindings = activeFindings.filter((finding) => finding.severity === "blocking")
  const warningFindings = activeFindings.filter((finding) => finding.severity === "warning")

  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-kicker">
            {t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_ai_010_review_audit",
            )}{" "}
          </p>
          <h3 className="text-card-header mt-2">
            {t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_semantic_consistency_and_justification_audit",
            )}{" "}
          </h3>
          <p className="text-body mt-1 leading-relaxed">
            {t(
              "runtime.components.reviewer.submission-review.review-audit-panel.text_ai_010_checks_whether_your_narrative",
            )}{" "}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {auditing ? (
            <span className="text-ui-meta">
              {t("runtime.components.reviewer.submission-review.review-audit-panel.text_auditing")}
            </span>
          ) : audit ? (
            <span
              className={`text-tiny-label inline-flex rounded-[var(--radius-button)] border px-2.5 py-1 ${statusTone[audit.status]}`}
            >
              {audit.status}
            </span>
          ) : (
            <span className="text-meta">
              {t(
                "runtime.components.reviewer.submission-review.review-audit-panel.text_not_run_yet",
              )}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="badge-semantic-warning text-ui-meta mt-4 rounded-[var(--radius-button)] px-4 py-3 leading-relaxed">
          {error}
        </div>
      )}

      {!audit ? (
        <div className="surface-card-quiet-strip text-body mt-4 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-soft)] px-4 py-5 leading-relaxed">
          {t(
            "runtime.components.reviewer.submission-review.review-audit-panel.text_save_a_draft_or_run_submit",
          )}{" "}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="surface-card-quiet-strip rounded-[var(--radius-card)] border border-[var(--color-border-soft)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <CountPill label="Blockers" value={blockingFindings.length} tone="rose" />
              <CountPill label="Warnings" value={warningFindings.length} tone="amber" />
              <CountPill label="Dismissed" value={dismissedFindings.length} tone="slate" />
            </div>
            <p className="text-body mt-2 leading-relaxed">{statusCopy[audit.status]}</p>
          </div>

          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_submit_blockers",
            )}
            emptyLabel="No blocking issues."
            findings={blockingFindings}
            actionLabel="Dismiss"
            actionDisabled
            onAction={onDismiss}
          />
          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_advisory_warnings",
            )}
            emptyLabel="No active warnings."
            findings={warningFindings}
            actionLabel="Dismiss"
            actionDisabled={auditing || updatingDismissal}
            onAction={onDismiss}
          />
          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_dismissed_warnings",
            )}
            emptyLabel="No dismissed warnings."
            findings={dismissedFindings}
            actionLabel="Reopen"
            actionDisabled={auditing || updatingDismissal}
            onAction={onUndismiss}
          />
        </div>
      )}
    </div>
  )
}

function CountPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "rose" | "amber" | "slate"
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-100 text-rose-700"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600"

  return (
    <span
      className={`text-ui-meta inline-flex rounded-[var(--radius-button)] px-2.5 py-1 font-[500] ${toneClass}`}
    >
      {label}: {value}
    </span>
  )
}

function FindingSection({
  title,
  emptyLabel,
  findings,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  title: string
  emptyLabel: string
  findings: ReviewAuditFinding[]
  actionLabel: string
  actionDisabled: boolean
  onAction: (finding: ReviewAuditFinding) => void | Promise<void>
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-kicker">{title}</h4>
        <span className="text-meta">{findings.length}</span>
      </div>

      {findings.length === 0 ? (
        <div className="surface-card-quiet-strip text-body mt-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] px-4 py-3 leading-relaxed">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {findings.map((finding) => (
            <div
              key={`${finding.code}-${finding.condition_fingerprint}`}
              className="surface-card rounded-[var(--radius-card)] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-tiny-label inline-flex rounded-[var(--radius-button)] px-2 py-0.5 ${
                        finding.severity === "blocking"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="badge-neutral text-ui-meta rounded-[var(--radius-button)] px-2 py-0.5">
                      {formatFieldLabel(finding.field)}
                    </span>
                    <span className="text-meta">{formatFamilyLabel(finding.code)}</span>
                  </div>
                  <p className="text-body mt-2 font-[700] leading-relaxed text-[var(--color-text-strong)]">
                    {finding.message}
                  </p>
                  <p className="text-body mt-1 leading-relaxed">{finding.suggestion}</p>
                </div>
                {finding.severity === "warning" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="button-secondary text-ui-meta h-8 shrink-0 px-3"
                    disabled={actionDisabled}
                    onClick={() => onAction(finding)}
                  >
                    {actionLabel}
                  </Button>
                )}
              </div>
            </div>
          ))}
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
