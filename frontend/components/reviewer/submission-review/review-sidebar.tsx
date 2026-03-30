"use client"

import type { ReactNode } from "react"

import useAssignmentBriefing from "@/hooks/use-assignment-briefing"
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
}

export function AIAssistantCard({ conferenceId, assignmentId }: AIAssistantCardProps) {
  const { t } = useTranslation()
  const { briefing, loading, generating, error, generateBriefing } = useAssignmentBriefing(
    conferenceId,
    assignmentId,
  )

  const status = briefing?.status ?? "idle"
  const artifact = briefing?.artifact

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[11px] text-cyan-950 flex items-center gap-1.5 uppercase tracking-wider">
          <span className="material-symbols-outlined text-cyan-700 text-base">analytics</span>
          {t("runtime.components.reviewer.submission-review.review-sidebar.text_ai_assistant")}
        </h3>
        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-200 text-cyan-900 uppercase">
          {status}
        </span>
      </div>

      {loading ? (
        <p className="text-[10px] text-cyan-900 leading-relaxed">Checking existing submission pre-read.</p>
      ) : (
        <>
          <p className="text-[10px] text-cyan-900 mb-3 leading-relaxed">
            Neutral manuscript-grounded pre-read for faster reviewer orientation. No score, no recommendation.
          </p>

          {(status === "idle" || status === "failed" || status === "stale") && (
            <button
              type="button"
              onClick={() => void generateBriefing()}
              disabled={generating}
              className="w-full h-8 px-3 bg-cyan-700 hover:bg-cyan-800 disabled:bg-cyan-300 text-white text-[10px] font-bold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              {generating
                ? "Generating..."
                : status === "stale"
                  ? "Refresh briefing"
                  : "Start generating"}
            </button>
          )}

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
              {error}
            </div>
          )}

          {artifact && (
            <div className="mt-4 space-y-4">
              <Section title="Summary">
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {artifact.submission_snapshot.abstract_summary}
                </p>
                <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">
                  {artifact.submission_snapshot.manuscript_overview}
                </p>
              </Section>

              <Section title="Highlights">
                <ItemList
                  items={artifact.notable_elements.map((item) => `${item.label}: ${item.detail}`)}
                />
              </Section>

              <Section title="Contributions">
                <ItemList items={artifact.claimed_contributions.map((item) => item.label)} />
              </Section>

              <Section title="Attention Points">
                <ItemList
                  items={artifact.reviewer_attention_points.map((item) =>
                    item.reason ? `${item.focus}: ${item.reason}` : item.focus,
                  )}
                />
              </Section>

              <Section title="Scope">
                <ItemList
                  items={artifact.stated_scope_and_limitations.map(
                    (item) => `${item.label}: ${item.detail}`,
                  )}
                />
              </Section>

              <div className="rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-[10px] text-slate-600">
                {artifact.guardrails.bias_notice}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </div>
  )
}

function ItemList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-[10px] text-slate-500">No items available.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="text-[11px] text-slate-700 leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  )
}
