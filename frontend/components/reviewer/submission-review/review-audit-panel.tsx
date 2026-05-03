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
  const priorityFindings = activeFindings.filter((finding) => finding.severity === "blocking")
  const suggestionFindings = activeFindings.filter((finding) => finding.severity === "warning")

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Evaluated
            </span>
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <CountPill label="Priority signals" value={priorityFindings.length} tone="rose" />
              <CountPill label="Suggestions" value={suggestionFindings.length} tone="amber" />
              <CountPill label="Dismissed findings" value={dismissedFindings.length} tone="slate" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Findings are reviewer-facing quality signals. Use the evaluation and rationales to
              decide what, if anything, needs revision.
            </p>
          </div>

          <AuditEvaluationCard audit={audit} />

          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_submit_blockers",
            )}
            emptyLabel="No priority findings."
            findings={priorityFindings}
            actionLabel="Dismiss"
            actionDisabled
            onAction={onDismiss}
          />
          <FindingSection
            title={t(
              "runtime.components.reviewer.submission-review.review-audit-panel.title_advisory_warnings",
            )}
            emptyLabel="No active suggestions."
            findings={suggestionFindings}
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
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${toneClass}`}>
      {label}: {value}
    </span>
  )
}

function AuditEvaluationCard({ audit }: { audit: ReviewAuditResponse }) {
  const evaluation = audit.evaluation
  const items = [
    { label: "Evidence engagement", value: evaluation?.evidence_engagement },
    { label: "Consistency", value: evaluation?.consistency_assessment },
    { label: "Best next improvement", value: evaluation?.improvement_focus },
  ].filter((item) => item.value?.trim())
  const summary = evaluation?.summary?.trim()

  if (!summary && items.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        Evaluation
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
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h4>
        <span className="text-[10px] text-slate-400">{findings.length}</span>
      </div>

      {findings.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {findings.map((finding) => (
            <div
              key={`${finding.code}-${finding.condition_fingerprint}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
                        finding.severity === "blocking"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
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
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-900">
                    {finding.message}
                  </p>
                  {finding.rationale && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-slate-700">Rationale: </span>
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

function formatSeverityLabel(severity: string) {
  return severity === "blocking" ? "priority" : "suggestion"
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
