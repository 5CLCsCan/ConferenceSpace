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
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border-soft)] pb-2">
        <h3 className="text-card-header">
          {t("runtime.components.reviewer.submission-review.review-sidebar.text_abstract")}
        </h3>
      </div>
      <p className="text-body mb-6 leading-relaxed">{submission.abstract}</p>
      <div className="space-y-4 border-t border-[var(--color-border-soft)] pt-6">
        <div>
          <span className="text-table-header">
            {t("runtime.components.reviewer.submission-review.review-sidebar.text_keywords")}{" "}
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {submission.keywords.map((kw, i) => (
              <span key={i} className="badge-neutral text-ui-meta px-2 py-1">
                {kw}
              </span>
            ))}
          </div>
        </div>
        {submission.supplementaryMaterial && (
          <div>
            <span className="text-table-header">
              {t(
                "runtime.components.reviewer.submission-review.review-sidebar.text_supplementary_material",
              )}{" "}
            </span>
            <div className="text-ui-meta mt-2 text-[var(--color-primary-ink)]">
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
          title: t(
            "runtime.components.reviewer.submission-review.review-sidebar.prop_title_report_generated",
          ),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_submission_pre_read_ready",
          ),
        }
      case "stale":
        return {
          title: t(
            "runtime.components.reviewer.submission-review.review-sidebar.prop_title_report_out_of_date",
          ),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_submission_changed_regenerate_analysis",
          ),
        }
      case "failed":
        return {
          title: t(
            "runtime.components.reviewer.submission-review.review-sidebar.prop_title_generation_failed",
          ),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_system_could_not_build_briefing",
          ),
        }
      case "idle":
        return {
          title: t(
            "runtime.components.reviewer.submission-review.review-sidebar.prop_title_no_analysis_yet",
          ),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_generate_neutral_briefing_first",
          ),
        }
      default:
        return {
          title: t(
            "runtime.components.reviewer.submission-review.review-sidebar.prop_title_checking_analysis_status",
          ),
          body: t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_looking_up_latest_pre_read_artifact",
          ),
        }
    }
  }, [status, t])

  return (
    <>
      <div className="surface-card px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-table-header flex items-center gap-1.5 text-[var(--color-primary-ink)]">
            <span className="material-symbols-outlined text-[14px] text-[var(--color-primary-ink)]">
              analytics
            </span>
            {t("runtime.components.reviewer.submission-review.review-sidebar.text_ai_assistant")}
          </h3>
          <span className={statusBadgeClass(status)}>{statusLabelMap[status] || status}</span>
        </div>

        <p className="text-kicker mt-3 text-[var(--color-text-meta)]">
          {t(
            "runtime.components.reviewer.submission-review.review-sidebar.text_submission_pre_read",
          )}{" "}
        </p>
        <p className="text-table-header mt-4 text-[var(--color-primary-ink)]">{statusCopy.title}</p>
        <p className="text-body mt-2 leading-relaxed text-[var(--color-text-strong)]">
          {statusCopy.body}
        </p>

        {loading ? (
          <p className="text-body mt-3">
            {t(
              "runtime.components.reviewer.submission-review.review-sidebar.text_checking_existing_submission_pre_read",
            )}{" "}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(status === "idle" || status === "failed" || status === "stale") && (
                <button
                  type="button"
                  onClick={() => void generateBriefing()}
                  disabled={generating}
                  className="button-primary text-ui-meta inline-flex items-center justify-center gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="button-secondary text-ui-meta inline-flex items-center justify-center gap-2 px-4"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  {t(
                    "runtime.components.reviewer.submission-review.review-sidebar.text_view_analysis",
                  )}{" "}
                </button>
              )}
            </div>

            {error && (
              <div className="badge-semantic-error text-ui-meta mt-3 rounded-[var(--radius-button)] px-3 py-2">
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
            <DialogTitle>
              {t(
                "runtime.components.reviewer.submission-review.review-sidebar.text_reviewer_pre_read_analysis",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "runtime.components.reviewer.submission-review.review-sidebar.text_read_the_manuscript_and_the_neutral",
              )}{" "}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-full grid-cols-1 xl:grid-cols-[0.42fr_0.58fr]">
            <section className="surface-page-detail flex min-h-0 flex-col border-b border-[var(--color-border-soft)] xl:border-r xl:border-b-0">
              <div className="min-h-0 flex-1 p-4">
                <div className="surface-card flex h-full min-h-[320px] overflow-hidden">
                  <div className="surface-page-detail min-h-0 flex-1">
                    {previewLoading ? (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-sm space-y-3 text-center">
                          <p className="text-kicker">
                            {t(
                              "runtime.components.reviewer.submission-review.review-sidebar.text_loading_preview",
                            )}{" "}
                          </p>
                          <p className="text-body leading-relaxed">
                            {t(
                              "runtime.components.reviewer.submission-review.review-sidebar.text_fetching_reviewer_visible_manuscript_file_and",
                            )}{" "}
                          </p>
                        </div>
                      </div>
                    ) : previewError ? (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-sm space-y-3 text-center">
                          <p className="text-kicker text-[var(--color-error-text)]">
                            {t(
                              "runtime.components.reviewer.submission-review.review-sidebar.text_preview_unavailable",
                            )}{" "}
                          </p>
                          <p className="text-body leading-relaxed">{previewError}</p>
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
                            <p className="text-kicker">
                              {t(
                                "runtime.components.reviewer.submission-review.review-sidebar.text_preview_unavailable",
                              )}{" "}
                            </p>
                            <p className="text-body leading-relaxed">
                              {t(
                                "runtime.components.reviewer.submission-review.review-sidebar.text_this_browser_could_not_render_the",
                              )}{" "}
                            </p>
                          </div>
                        </div>
                      </object>
                    ) : (
                      <div className="flex h-full items-center justify-center px-6">
                        <div className="max-w-sm space-y-3 text-center">
                          <p className="text-kicker">
                            {t(
                              "runtime.components.reviewer.submission-review.review-sidebar.text_preview_standby",
                            )}{" "}
                          </p>
                          <p className="text-body leading-relaxed">
                            {t(
                              "runtime.components.reviewer.submission-review.review-sidebar.text_the_manuscript_preview_will_appear_here",
                            )}{" "}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex min-h-0 flex-col bg-white">
              <div className="shrink-0 border-b border-[var(--color-border-soft)] bg-white px-6 py-4">
                <h2 className="text-card-header">
                  {t(
                    "runtime.components.reviewer.submission-review.review-sidebar.text_submission_analysis",
                  )}{" "}
                </h2>
              </div>

              <div className="surface-page-detail min-h-0 flex-1 overflow-y-auto px-6 py-6">
                {artifact ? (
                  <div className="space-y-5">
                    <div className="space-y-3 px-1">
                      <div className="flex items-start gap-3">
                        <h3 className="text-page-title min-w-0 flex-1 leading-tight text-[var(--color-text-strong)]">
                          {artifact.submission_snapshot.title}
                        </h3>
                        {artifact.submission_snapshot.track ? (
                          <span className="badge-neutral text-tiny-label mt-1 shrink-0 px-2.5 py-1">
                            {artifact.submission_snapshot.track}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="surface-card p-5">
                      <p className="text-kicker">
                        {t(
                          "runtime.components.reviewer.submission-review.review-sidebar.text_orientation_snapshot",
                        )}{" "}
                      </p>
                      <p className="text-card-title mt-3 leading-relaxed text-[var(--color-text-strong)]">
                        {artifact.submission_snapshot.abstract_summary}
                      </p>
                      <p className="text-body mt-3 leading-relaxed">
                        {artifact.submission_snapshot.manuscript_overview}
                      </p>
                    </div>

                    <SectionBlock
                      title={t(
                        "runtime.components.reviewer.submission-review.review-sidebar.title_review_readiness_signals",
                      )}
                    >
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
                              className="surface-card p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h5 className="text-card-title text-[var(--color-text-strong)]">
                                  {signal.label}
                                </h5>
                                <span className={signalPillClass(signal.status)}>
                                  {signalStatusLabel(signal.status, t)}
                                </span>
                              </div>
                              <p className="text-body mt-2 leading-relaxed">{signal.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionBlock>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <SectionBlock
                        title={t(
                          "runtime.components.reviewer.submission-review.review-sidebar.title_claimed_contributions",
                        )}
                      >
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

                      <SectionBlock
                        title={t(
                          "runtime.components.reviewer.submission-review.review-sidebar.title_notable_elements",
                        )}
                      >
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
                      <SectionBlock
                        title={t(
                          "runtime.components.reviewer.submission-review.review-sidebar.title_reviewer_attention_points",
                        )}
                      >
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

                      <SectionBlock
                        title={t(
                          "runtime.components.reviewer.submission-review.review-sidebar.title_scope_and_limitations",
                        )}
                      >
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
                    <p className="text-body">
                      {t(
                        "runtime.components.reviewer.submission-review.review-sidebar.text_no_analysis_artifact_is_available_for",
                      )}{" "}
                    </p>
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
    <div className="surface-card-quiet-strip rounded-[var(--radius-button)] border border-[var(--color-border-soft)] px-2.5 py-1.5">
      <p className="text-kicker">{label}</p>
      <p className="text-card-title mt-0.5 text-[var(--color-text-strong)]">{value}</p>
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

  return `text-tiny-label inline-flex rounded-[var(--radius-button)] border px-2 py-0.5 ${
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

  return `text-tiny-label inline-flex rounded-[var(--radius-button)] border px-2 py-0.5 ${
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
  return <p className="text-body leading-relaxed">{text}</p>
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
          className="surface-card-quiet-strip rounded-[var(--radius-card)] border border-[var(--color-border-soft)] p-3"
        >
          <p className="text-card-title text-[var(--color-text-strong)]">{item.title}</p>
          {item.body ? <p className="text-body mt-1.5 leading-relaxed">{item.body}</p> : null}
        </div>
      ))}
    </div>
  )
}

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface-card p-4">
      <div className="border-b border-[var(--color-border-soft)] pb-3">
        <h4 className="text-kicker">{title}</h4>
      </div>
      <div className="pt-4">{children}</div>
    </div>
  )
}
