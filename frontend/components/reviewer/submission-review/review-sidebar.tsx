"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"

import useAssignmentBriefing from "@/hooks/use-assignment-briefing"
import { downloadPaperFile } from "@/lib/api/papers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SubmissionDetails } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface AbstractCardProps {
  submission: SubmissionDetails
}

export function AbstractCard({ submission }: AbstractCardProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="font-bold text-sm text-[#1B3C53] tracking-tight uppercase">
          {t("runtime.components.reviewer.submission-review.review-sidebar.text_abstract")}
        </h3>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-6">{submission.abstract}</p>
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t("runtime.components.reviewer.submission-review.review-sidebar.text_keywords")}{" "}
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {submission.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-md bg-slate-100 text-[10px] text-slate-600"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
        {submission.supplementaryMaterial && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t(
                "runtime.components.reviewer.submission-review.review-sidebar.text_supplementary_material",
              )}{" "}
            </span>
            <div className="mt-2 text-xs text-[#2563eb]">
              {submission.supplementaryMaterial.name} ({submission.supplementaryMaterial.size})
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface AIAssistantCardProps {
  conferenceId: string
  assignmentId: string
  submissionId: string
  submissionTitle: string
}

export function AIAssistantCard({
  conferenceId,
  assignmentId,
  submissionId,
  submissionTitle,
}: AIAssistantCardProps) {
  const { t } = useTranslation()
  const { briefing, loading, generating, error, generateBriefing } = useAssignmentBriefing(
    conferenceId,
    assignmentId,
  )
  const [open, setOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFilename, setPreviewFilename] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const status = briefing?.status ?? "idle"
  const artifact = briefing?.artifact
  const canView = status === "ready" && Boolean(artifact)
  const readinessSignals = artifact?.review_readiness_signals ?? []
  const notableElements = artifact?.notable_elements ?? []
  const claimedContributions = artifact?.claimed_contributions ?? []
  const attentionPoints = artifact?.reviewer_attention_points ?? []
  const scopeLimitations = artifact?.stated_scope_and_limitations ?? []

  useEffect(() => {
    if (!open || previewUrl || previewLoading) {
      return
    }

    let cancelled = false
    setPreviewLoading(true)
    setPreviewError(null)

    void downloadPaperFile(submissionId, conferenceId)
      .then((response) => {
        if (cancelled) {
          return
        }
        if (response.error || !response.data) {
          setPreviewError(
            response.error ||
              t(
                "runtime.components.reviewer.submission-review.review-sidebar.text_failed_to_load_manuscript_preview",
              ),
          )
          return
        }
        const objectUrl = window.URL.createObjectURL(response.data)
        setPreviewUrl(objectUrl)
        setPreviewFilename(response.filename)
      })
      .catch((previewIssue: unknown) => {
        if (!cancelled) {
          setPreviewError(
            previewIssue instanceof Error
              ? previewIssue.message
              : t(
                  "runtime.components.reviewer.submission-review.review-sidebar.text_failed_to_load_manuscript_preview",
                ),
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [conferenceId, open, previewLoading, previewUrl, submissionId, t])

  const statusLabelMap: Record<string, string> = {
    ready: t("runtime.components.reviewer.submission-review.review-sidebar.text_status_ready"),
    stale: t("runtime.components.reviewer.submission-review.review-sidebar.text_status_stale"),
    failed: t("runtime.components.reviewer.submission-review.review-sidebar.text_status_failed"),
    idle: t("runtime.components.reviewer.submission-review.review-sidebar.text_status_idle"),
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const statusCopy = useMemo(() => {
    switch (status) {
      case "ready":
        return {
          title: t("runtime.components.reviewer.submission-review.review-sidebar.prop_title_report_generated"),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_submission_pre_read_ready",
          ),
        }
      case "stale":
        return {
          title: t("runtime.components.reviewer.submission-review.review-sidebar.prop_title_report_out_of_date"),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_submission_changed_regenerate_analysis",
          ),
        }
      case "failed":
        return {
          title: t("runtime.components.reviewer.submission-review.review-sidebar.prop_title_generation_failed"),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_system_could_not_build_briefing",
          ),
        }
      case "idle":
        return {
          title: t("runtime.components.reviewer.submission-review.review-sidebar.prop_title_no_analysis_yet"),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_generate_neutral_briefing_first",
          ),
        }
      default:
        return {
          title: t("runtime.components.reviewer.submission-review.review-sidebar.prop_title_checking_analysis_status"),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_looking_up_latest_pre_read_artifact",
          ),
        }
    }
  }, [status, t])

  return (
    <>
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1B3C53]">
            <span className="material-symbols-outlined text-[14px] text-violet-600">analytics</span>
            {t("runtime.components.reviewer.submission-review.review-sidebar.text_ai_assistant")}
          </h3>
          <span className={statusBadgeClass(status)}>{statusLabelMap[status] || status}</span>
        </div>

        <p className="mt-3 text-[8px] font-black uppercase tracking-[0.24em] text-violet-600/70">
          {t("runtime.components.reviewer.submission-review.review-sidebar.text_submission_pre_read")}{" "}</p>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1B3C53]">
          {statusCopy.title}
        </p>
        <p className="mt-2 text-[10px] font-normal leading-relaxed text-slate-700">
          {statusCopy.body}
        </p>

        {loading ? (
          <p className="mt-3 text-[10px] font-normal text-slate-500">
            {t("runtime.components.reviewer.submission-review.review-sidebar.text_checking_existing_submission_pre_read")}{" "}</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(status === "idle" || status === "failed" || status === "stale") && (
                <button
                  type="button"
                  onClick={() => void generateBriefing()}
                  disabled={generating}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-[11px] font-bold tracking-wider text-white transition-all duration-200 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  {generating
                    ? t(
                        "runtime.components.reviewer.submission-review.review-sidebar.text_generating",
                      )
                    : status === "stale"
                      ? t(
                          "runtime.components.reviewer.submission-review.review-sidebar.text_regenerate_report",
                        )
                      : t(
                          "runtime.components.reviewer.submission-review.review-sidebar.text_start_generating",
                        )}
                </button>
              )}

              {canView && (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-violet-200 bg-white/90 px-4 text-[11px] font-bold tracking-wider text-[#1B3C53] transition-all duration-200 hover:border-violet-300 hover:bg-white"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  {t("runtime.components.reviewer.submission-review.review-sidebar.text_view_analysis")}{" "}</button>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="h-[calc(100vh-2rem)] w-[min(1680px,calc(100vw-2rem))] max-w-none gap-0 overflow-y-auto border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-none"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t("runtime.components.reviewer.submission-review.review-sidebar.text_reviewer_pre_read_analysis")}</DialogTitle>
            <DialogDescription>
              {t("runtime.components.reviewer.submission-review.review-sidebar.text_read_the_manuscript_and_the_neutral")}{" "}</DialogDescription>
          </DialogHeader>

          <div className="grid min-h-full grid-cols-1 xl:grid-cols-[0.42fr_0.58fr]">
            <section className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-100 xl:border-r xl:border-b-0">
              <div className="min-h-0 flex-1 p-4">
                <div className="flex h-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="min-h-0 flex-1 bg-slate-100">
                    {previewLoading ? (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-sm space-y-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                            {t("runtime.components.reviewer.submission-review.review-sidebar.text_loading_preview")}{" "}</p>
                          <p className="text-[11px] font-normal leading-relaxed text-slate-500">
                            {t("runtime.components.reviewer.submission-review.review-sidebar.text_fetching_reviewer_visible_manuscript_file_and")}{" "}</p>
                        </div>
                      </div>
                    ) : previewError ? (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-sm space-y-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-500">
                            {t("runtime.components.reviewer.submission-review.review-sidebar.text_preview_unavailable")}{" "}</p>
                          <p className="text-[11px] font-normal leading-relaxed text-slate-500">
                            {previewError}
                          </p>
                        </div>
                      </div>
                    ) : previewUrl ? (
                      <object
                        aria-label={
                          previewFilename ||
                          t(
                            "runtime.components.reviewer.submission-review.review-sidebar.aria_label_submission_manuscript_preview",
                          )
                        }
                        data={previewUrl}
                        type="application/pdf"
                        className="h-full w-full"
                      >
                        <div className="flex h-full items-center justify-center px-6">
                          <div className="max-w-sm space-y-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                              {t("runtime.components.reviewer.submission-review.review-sidebar.text_preview_unavailable")}{" "}</p>
                            <p className="text-[11px] font-normal leading-relaxed text-slate-500">
                              {t("runtime.components.reviewer.submission-review.review-sidebar.text_this_browser_could_not_render_the")}{" "}</p>
                          </div>
                        </div>
                      </object>
                    ) : (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-sm space-y-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                            {t("runtime.components.reviewer.submission-review.review-sidebar.text_preview_standby")}{" "}</p>
                          <p className="text-[13px] font-medium leading-relaxed text-slate-500">
                            {t("runtime.components.reviewer.submission-review.review-sidebar.text_the_manuscript_preview_will_appear_here")}{" "}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex min-h-0 flex-col bg-white">
              <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
                <h2 className="text-sm font-bold tracking-tight text-[#1B3C53]">
                  {t("runtime.components.reviewer.submission-review.review-sidebar.text_submission_analysis")}{" "}</h2>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FBFD] px-6 py-6">
                {artifact ? (
                  <div className="space-y-5">
                    <div className="space-y-3 px-1">
                      <div className="flex items-start gap-3">
                        <h3 className="min-w-0 flex-1 text-lg font-black leading-tight tracking-tight text-slate-950">
                          {artifact.submission_snapshot.title}
                        </h3>
                        {artifact.submission_snapshot.track ? (
                          <span className="mt-1 shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                            {artifact.submission_snapshot.track}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#456882]">
                        {t("runtime.components.reviewer.submission-review.review-sidebar.text_orientation_snapshot")}{" "}</p>
                      <p className="mt-3 text-[12px] font-medium leading-relaxed tracking-tight text-slate-900">
                        {artifact.submission_snapshot.abstract_summary}
                      </p>
                      <p className="mt-3 text-[11px] font-normal leading-relaxed text-slate-600">
                        {artifact.submission_snapshot.manuscript_overview}
                      </p>
                    </div>

                    <SectionBlock title={t("runtime.components.reviewer.submission-review.review-sidebar.title_review_readiness_signals")}>
                      {readinessSignals.length === 0 ? (
                        <EmptyState
                          text={t(
                            "runtime.components.reviewer.submission-review.review-sidebar.text_no_readiness_signals_were_generated",
                          )}
                        />
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {readinessSignals.map((signal) => (
                            <div
                              key={`${signal.label}-${signal.status}`}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h5 className="text-[11px] font-bold tracking-tight text-slate-900">
                                  {signal.label}
                                </h5>
                                <span className={signalPillClass(signal.status)}>
                                  {signalStatusLabel(signal.status, t)}
                                </span>
                              </div>
                              <p className="mt-2 text-[11px] font-normal leading-relaxed text-slate-600">
                                {signal.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionBlock>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <SectionBlock title={t("runtime.components.reviewer.submission-review.review-sidebar.title_claimed_contributions")}>
                        <RichItemList
                          items={claimedContributions.map((item) => ({
                            title: item.label,
                            body: item.evidence.join(" "),
                          }))}
                          emptyText={t(
                            "runtime.components.reviewer.submission-review.review-sidebar.text_no_contribution_claims_were_extracted",
                          )}
                        />
                      </SectionBlock>

                      <SectionBlock title={t("runtime.components.reviewer.submission-review.review-sidebar.title_notable_elements")}>
                        <RichItemList
                          items={notableElements.map((item) => ({
                            title: item.label,
                            body: item.detail,
                          }))}
                          emptyText={t(
                            "runtime.components.reviewer.submission-review.review-sidebar.text_no_notable_elements_were_extracted",
                          )}
                        />
                      </SectionBlock>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <SectionBlock title={t("runtime.components.reviewer.submission-review.review-sidebar.title_reviewer_attention_points")}>
                        <RichItemList
                          items={attentionPoints.map((item) => ({
                            title: item.focus,
                            body: item.reason || "",
                          }))}
                          emptyText={t(
                            "runtime.components.reviewer.submission-review.review-sidebar.text_no_reviewer_attention_points_were_extracted",
                          )}
                        />
                      </SectionBlock>

                      <SectionBlock title={t("runtime.components.reviewer.submission-review.review-sidebar.title_scope_and_limitations")}>
                        <RichItemList
                          items={scopeLimitations.map((item) => ({
                            title: item.label,
                            body: item.detail,
                          }))}
                          emptyText={t(
                            "runtime.components.reviewer.submission-review.review-sidebar.text_no_explicit_scope_boundaries_were_extracted",
                          )}
                        />
                      </SectionBlock>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-[10px] font-normal text-slate-500">
                      {t("runtime.components.reviewer.submission-review.review-sidebar.text_no_analysis_artifact_is_available_for")}{" "}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function statusBadgeClass(status: string) {
  const tones: Record<string, string> = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
    stale: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    idle: "border-slate-200 bg-slate-100 text-slate-600",
  }

  return `inline-flex rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
    tones[status] || tones.idle
  }`
}

function signalPillClass(status: "present" | "partial" | "not_found" | "not_applicable") {
  const tones = {
    present: "border-emerald-200 bg-emerald-50 text-emerald-700",
    partial: "border-amber-200 bg-amber-50 text-amber-700",
    not_found: "border-slate-200 bg-slate-100 text-slate-600",
    not_applicable: "border-slate-200 bg-white text-slate-500",
  }

  return `inline-flex rounded-md border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] ${
    tones[status]
  }`
}

function signalStatusLabel(
  status: "present" | "partial" | "not_found" | "not_applicable",
  t: (key: string) => string,
) {
  const labels = {
    present: t("runtime.components.reviewer.submission-review.review-sidebar.text_signal_present"),
    partial: t("runtime.components.reviewer.submission-review.review-sidebar.text_signal_partial"),
    not_found: t(
      "runtime.components.reviewer.submission-review.review-sidebar.text_signal_not_found",
    ),
    not_applicable: t(
      "runtime.components.reviewer.submission-review.review-sidebar.text_signal_not_applicable",
    ),
  }

  return labels[status]
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-[11px] font-medium leading-relaxed text-slate-500">{text}</p>
}

function RichItemList({
  items,
  emptyText,
}: {
  items: { title: string; body: string }[]
  emptyText: string
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.title}-${item.body}`}
          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
        >
          <p className="text-[12px] font-bold tracking-tight text-slate-900">{item.title}</p>
          {item.body ? (
            <p className="mt-1.5 text-[11px] font-normal leading-relaxed text-slate-600">
              {item.body}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#456882]">
          {title}
        </h4>
      </div>
      <div className="pt-4">{children}</div>
    </div>
  )
}
