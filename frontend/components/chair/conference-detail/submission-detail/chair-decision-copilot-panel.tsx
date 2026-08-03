"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  ScholarTooltip,
  ScholarTooltipContent,
  ScholarTooltipTrigger,
} from "@/components/ui/scholar-tooltip"
import type {
  ChairDecisionCopilotCountMetric,
  ChairDecisionCopilotResponse,
} from "@/lib/api/chair-decision-copilot"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { isReadOnlyRole } from "@/lib/role-helpers"

interface ChairDecisionCopilotPanelProps {
  copilot: ChairDecisionCopilotResponse | null
  loading: boolean
  generating: boolean
  regenerating: boolean
  error: string | null
  onGenerate: () => void
  onRegenerate: () => void
}

function normalizeValues(values?: string[] | null) {
  return Array.isArray(values) ? values.filter(Boolean) : []
}

function formatMetricLabel(label: string) {
  return label.replace(/_/g, " ")
}

function formatGeneratedAt(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)
}

function formatCount(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

// --- Sub-components ---

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</h4>
  )
}

function MetricPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
      {children}
    </span>
  )
}

function CountMetricPills({ values }: { values?: ChairDecisionCopilotCountMetric[] | null }) {
  const items = Array.isArray(values) ? values.filter((v) => v.count > 0) : []
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v) => (
        <MetricPill key={`${v.label}-${v.count}`}>
          {formatMetricLabel(v.label)}: {v.count}
        </MetricPill>
      ))}
    </div>
  )
}

function BulletList({
  values,
  accent,
}: {
  values?: string[] | null
  accent?: "green" | "red" | "amber" | "slate"
}) {
  const items = normalizeValues(values)
  if (items.length === 0) return null

  const accentClass = {
    green: "border-l-green-300",
    red: "border-l-red-300",
    amber: "border-l-amber-300",
    slate: "border-l-slate-200",
  }[accent ?? "slate"]

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item}
          className={cn("border-l pl-2 text-[11px] leading-relaxed text-slate-600", accentClass)}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}

function HelpTooltip() {
  const { t } = useTranslation()
  return (
    <ScholarTooltip>
      <ScholarTooltipTrigger asChild>
        <button
          type="button"
          aria-label={t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.aria_label_about_decision_advisory")}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[7px] font-bold text-slate-400 transition-colors hover:border-[#456882]/40 hover:bg-[#1B3C53]/[0.04] hover:text-[#1B3C53]"
        >
          ?
        </button>
      </ScholarTooltipTrigger>
      <ScholarTooltipContent>
        {t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_ai_generated_synthesis_of_the_current")}{" "}</ScholarTooltipContent>
    </ScholarTooltip>
  )
}

// --- Collapsed card signal chips ---
function CollapsedSignals({ copilot }: { copilot: ChairDecisionCopilotResponse }) {
  const { t } = useTranslation()
  const artifact = copilot.artifact
  if (!artifact) return null

  const totalReviews =
    artifact.review_analytics.review_distribution?.reduce((s, v) => s + v.count, 0) ?? 0
  const hasRebuttal = artifact.rebuttal_signals.status === "available"
  const threadCount = formatCount(artifact.discussion_signals.thread_count)

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {totalReviews > 0 && (
        <MetricPill>
          {totalReviews} review{totalReviews !== 1 ? "s" : ""}
        </MetricPill>
      )}
      {threadCount > 0 && (
        <MetricPill>
          {threadCount} thread{threadCount !== 1 ? "s" : ""}
        </MetricPill>
      )}
      {hasRebuttal && <MetricPill>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_rebuttal_available")}</MetricPill>}
      {copilot.cache?.hit && !copilot.cache.is_stale && <MetricPill>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_evidence_current")}</MetricPill>}
    </div>
  )
}

// --- Main component ---

export function ChairDecisionCopilotPanel({
  copilot,
  loading,
  generating,
  regenerating,
  error,
  onGenerate,
  onRegenerate,
}: ChairDecisionCopilotPanelProps) {
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const readOnly = isReadOnlyRole(currentRole)
  const [isExpanded, setIsExpanded] = useState(false)
  const artifact = copilot?.artifact ?? null
  const isIdle = !copilot || copilot.status === "idle"
  const isStale = copilot?.status === "stale"
  const isFailed = copilot?.status === "failed"
  const generatedAtLabel = formatGeneratedAt(artifact?.generated_at)

  const evidenceBasis = normalizeValues(artifact?.evidence_summary?.evidence_basis)
  const agreementItems = normalizeValues(artifact?.disagreement_map?.areas_of_agreement)
  const disagreementItems = normalizeValues(artifact?.disagreement_map?.areas_of_disagreement)
  const unresolvedItems = normalizeValues(artifact?.disagreement_map?.unresolved_concerns)
  const confidenceLimitItems = normalizeValues(artifact?.disagreement_map?.confidence_limits)
  const strengthItems = normalizeValues(artifact?.review_feedback_synthesis?.strengths)
  const weaknessItems = normalizeValues(artifact?.review_feedback_synthesis?.weaknesses)
  const questionItems = normalizeValues(artifact?.review_feedback_synthesis?.questions)
  const strongestCriteria = normalizeValues(artifact?.review_analytics?.strongest_criteria)
  const weakestCriteria = normalizeValues(artifact?.review_analytics?.weakest_criteria)

  const hasDisagreementContent =
    agreementItems.length > 0 ||
    disagreementItems.length > 0 ||
    unresolvedItems.length > 0 ||
    confidenceLimitItems.length > 0

  useEffect(() => {
    if (isFailed) setIsExpanded(true)
  }, [isFailed])

  const leftBorderClass = isStale
    ? "border-l-2 border-l-amber-400"
    : isFailed
      ? "border-l-2 border-l-red-400"
      : artifact
        ? "border-l-2 border-l-[#1B3C53]"
        : "border-l-2 border-l-slate-200"

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all",
        leftBorderClass,
      )}
    >
      {/* --- Collapsed header --- */}
      <div className={cn("px-4 py-3", isExpanded && "border-b border-slate-100")}>
        <div className="flex items-start justify-between gap-3">
          {/* Left: title + signals */}
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls="decision-advisory-body"
            aria-label={isExpanded ? "Collapse Decision Advisory" : "Expand Decision Advisory"}
            onClick={() => setIsExpanded((v) => !v)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[#1B3C53]">{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_decision_advisory")}</h2>
              <HelpTooltip />
              <span
                className="material-symbols-outlined ml-0.5 text-slate-400 transition-transform duration-200"
                style={{ fontSize: "14px" }}
                aria-hidden="true"
              >
                {isExpanded ? "expand_less" : "expand_more"}
              </span>
            </div>

            {/* Status / timestamp line */}
            <div className="mt-1 flex items-center gap-2">
              {/* {isStale ? (
                <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                  stale
                </span>
              ) : isFailed ? (
                <span className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600">
                  failed
                </span>
              ) : artifact ? (
                <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                  ready
                </span>
              ) : null} */}

              {generatedAtLabel && (
                <span className="text-[10px] text-slate-400">
                  {isStale ? "Last generated" : "Generated"} {generatedAtLabel}
                </span>
              )}
            </div>

            {/* Signal chips when collapsed and has data */}
            {/* {!isExpanded && copilot && <CollapsedSignals copilot={copilot} />} */}
          </button>

          {/* Right: action button */}
          {!readOnly && (
            <div className="flex-shrink-0 pt-0.5">
              {isIdle ? (
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={generating}
                  className={cn(
                    "h-6 rounded-md px-3.5 text-[9px] font-medium",
                    generating
                      ? "cursor-wait bg-slate-100 text-slate-400"
                      : "bg-[#1B3C53] text-white hover:bg-[#234C6A]",
                  )}
                >
                  {generating
                    ? t("dashboard.copilot.generating")
                    : t("dashboard.copilot.generate")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className={cn(
                    "h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors",
                    regenerating
                      ? "cursor-wait border-slate-200 bg-slate-50 text-slate-400"
                      : "border-slate-200 bg-white text-[#1B3C53] hover:bg-slate-50",
                  )}
                >
                  {regenerating
                    ? t("dashboard.copilot.generating")
                    : t("dashboard.copilot.regenerate")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Expanded body --- */}
      {isExpanded && (
        <div id="decision-advisory-body" className="divide-y divide-slate-100">
          {/* Loading state */}
          {loading && !copilot && (
            <div className="px-4 py-4 text-[11px] text-slate-400">{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_loading_evidence_package")}</div>
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="px-4 py-3.5">
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                  {t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_could_not_generate_recommendation")}{" "}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-red-800">
                  {error ||
                    copilot?.error?.message ||
                    "The copilot could not synthesize this submission right now. Review the raw evidence directly or try again."}
                </p>
              </div>
            </div>
          )}

          {/* Idle / no advisory yet */}
          {isIdle && !loading && (
            <div className="px-4 py-4">
              <p className="text-[11px] leading-relaxed text-slate-500">
                {t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_no_advisory_generated_yet_generate_one")}{" "}</p>
            </div>
          )}

          {/* Main artifact content */}
          {artifact && (
            <>
              {/* 1. Evidence Overview */}
              <div className="px-4 py-4">
                <div className="space-y-3">
                  <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_evidence_overview")}</SectionLabel>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {artifact.evidence_summary.overview}
                  </p>
                  {evidenceBasis.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {evidenceBasis.map((item) => (
                        <MetricPill key={item}>{item}</MetricPill>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Review Analytics */}
              <div className="px-4 py-4">
                <div className="space-y-3">
                  <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_review_analytics")}</SectionLabel>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {artifact.review_analytics.review_coverage_completeness}
                  </p>
                  {artifact.review_analytics.score_changes_after_rebuttal && (
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      {artifact.review_analytics.score_changes_after_rebuttal}
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {artifact.review_analytics.review_distribution?.some((v) => v.count > 0) && (
                      <SubSection label="Score distribution">
                        <CountMetricPills values={artifact.review_analytics.review_distribution} />
                      </SubSection>
                    )}
                    {artifact.review_analytics.confidence_mix?.some((v) => v.count > 0) && (
                      <SubSection label="Confidence mix">
                        <CountMetricPills values={artifact.review_analytics.confidence_mix} />
                      </SubSection>
                    )}
                    {strongestCriteria.length > 0 && (
                      <SubSection label="Strongest criteria">
                        <BulletList values={strongestCriteria} accent="green" />
                      </SubSection>
                    )}
                    {weakestCriteria.length > 0 && (
                      <SubSection label="Weakest criteria">
                        <BulletList values={weakestCriteria} accent="red" />
                      </SubSection>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Reviewer Feedback */}
              <div className="px-4 py-4">
                <div className="space-y-3">
                  <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_reviewer_feedback_synthesis")}</SectionLabel>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {artifact.review_feedback_synthesis.summary}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {strengthItems.length > 0 && (
                      <SubSection label="Strengths">
                        <BulletList values={strengthItems} accent="green" />
                      </SubSection>
                    )}
                    {weaknessItems.length > 0 && (
                      <SubSection label="Weaknesses">
                        <BulletList values={weaknessItems} accent="red" />
                      </SubSection>
                    )}
                  </div>
                  {questionItems.length > 0 && (
                    <SubSection label="Open questions">
                      <BulletList values={questionItems} accent="amber" />
                    </SubSection>
                  )}
                </div>
              </div>

              {/* 4. Signals row */}
              <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {/* Discussion signals */}
                <div className="px-4 py-4">
                  <div className="space-y-2">
                    <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_discussion")}</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      <MetricPill>
                        {formatCount(artifact.discussion_signals.thread_count)} thread
                        {formatCount(artifact.discussion_signals.thread_count) !== 1 ? "s" : ""}
                      </MetricPill>
                      <MetricPill>
                        {formatCount(artifact.discussion_signals.message_count)} message
                        {formatCount(artifact.discussion_signals.message_count) !== 1 ? "s" : ""}
                      </MetricPill>
                    </div>
                    {artifact.discussion_signals.summary && (
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {artifact.discussion_signals.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rebuttal signals */}
                <div className="px-4 py-4">
                  <div className="space-y-2">
                    <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_rebuttal")}</SectionLabel>
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        artifact.rebuttal_signals.status === "available"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {artifact.rebuttal_signals.status === "available"
                        ? "Available"
                        : "Not applicable"}
                    </span>
                    {artifact.rebuttal_signals.summary && (
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {artifact.rebuttal_signals.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Disagreement map */}
              {hasDisagreementContent && (
                <div className="px-4 py-4">
                  <div className="space-y-3">
                    <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_reviewer_alignment")}</SectionLabel>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {agreementItems.length > 0 && (
                        <SubSection label="Areas of agreement">
                          <BulletList values={agreementItems} accent="green" />
                        </SubSection>
                      )}
                      {disagreementItems.length > 0 && (
                        <SubSection label="Areas of disagreement">
                          <BulletList values={disagreementItems} accent="red" />
                        </SubSection>
                      )}
                      {unresolvedItems.length > 0 && (
                        <SubSection label="Unresolved concerns">
                          <BulletList values={unresolvedItems} accent="amber" />
                        </SubSection>
                      )}
                      {confidenceLimitItems.length > 0 && (
                        <SubSection label="Confidence limits">
                          <BulletList values={confidenceLimitItems} accent="slate" />
                        </SubSection>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Suggested chair note */}
              {artifact.suggested_chair_note && (
                <div className="px-4 py-4">
                  <div className="space-y-2">
                    <SectionLabel>{t("runtime.components.chair.conference-detail.submission-detail.chair-decision-copilot-panel.text_suggested_chair_note")}</SectionLabel>
                    <div className="rounded-lg border border-[#1B3C53]/10 bg-[#1B3C53]/[0.03] px-3 py-3">
                      <p className="text-[11px] leading-relaxed text-slate-700">
                        {artifact.suggested_chair_note}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
