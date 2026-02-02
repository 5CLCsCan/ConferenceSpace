"use client"

import { WizardHeader } from "../wizard-header"
import { ConferenceFormData } from "../types"

interface FinalReviewStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
  onEditStep?: (step: number) => void
}

interface ReviewCardProps {
  title: string
  onEdit?: () => void
  children: React.ReactNode
}

function ReviewCard({ title, onEdit, children }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {title}
          </h3>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-[10px] font-medium text-[#1B3C53] dark:text-blue-400 hover:underline uppercase tracking-wider"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "12px", width: "12px", height: "12px" }}
            >
              edit
            </span>
            Edit
          </button>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

interface ReviewFieldProps {
  label: string
  value?: string | React.ReactNode
  fullWidth?: boolean
}

function ReviewField({ label, value, fullWidth }: ReviewFieldProps) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-medium text-[#141414] dark:text-white">{value || "-"}</p>
    </div>
  )
}

function formatDate(date: Date | undefined): string {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function FinalReviewStep({ data, updateData, onEditStep }: FinalReviewStepProps) {
  // Count organizers by role
  const organizerCounts = {
    generalChairs: 1, // Current user
    programChairs:
      data.organizers.filter((o) => o.role === "co-chair" || o.role === "track-chair").length + 1,
    reviewers: data.organizers.filter((o) => o.role === "reviewer" || o.role === "pc-member")
      .length,
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-[#141414] dark:text-white text-[32px] font-bold tracking-tight leading-[1.1]">
            Final Review
          </h1>
          <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 max-w-xl">
            Please review all details before creating the conference.
          </p>
        </div>

        {/* Ready to Publish Badge */}
        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm">
          <span
            className="material-symbols-outlined text-blue-600 dark:text-blue-400"
            style={{ fontSize: "12px", width: "12px", height: "12px" }}
          >
            info
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Ready to Publish
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-[64px]">
        {/* Basic Details */}
        <ReviewCard title="Basic Details" onEdit={() => onEditStep?.(1)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <ReviewField label="Conference Name" value={data.title} />
            <ReviewField label="Acronym" value={data.acronym} />
            <ReviewField
              label="Location"
              value={
                data.locationType === "virtual" ? "Virtual Conference" : data.location || data.venue
              }
              fullWidth
            />
            <ReviewField label="Start Date" value={formatDate(data.conferenceStartDate)} />
            <ReviewField label="End Date" value={formatDate(data.conferenceEndDate)} />
          </div>
        </ReviewCard>

        {/* Topics & Tracks */}
        <ReviewCard title="Topics & Tracks" onEdit={() => onEditStep?.(2)}>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Selected Topics
              </p>
              <div className="flex flex-wrap gap-2">
                {data.topics.length > 0 ? (
                  <>
                    {data.topics.slice(0, 4).map((topic, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-600"
                      >
                        {topic}
                      </span>
                    ))}
                    {data.topics.length > 4 && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-600">
                        + {data.topics.length - 4} more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No topics defined</span>
                )}
              </div>
            </div>

            {data.tracks.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Conference Tracks
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.tracks.slice(0, 3).map((track, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-600"
                    >
                      {track}
                    </span>
                  ))}
                  {data.tracks.length > 3 && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-600">
                      + {data.tracks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Key Deadlines */}
            <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <ReviewField label="Abstract Deadline" value={formatDate(data.abstractDeadline)} />
              <ReviewField label="Full Paper Deadline" value={formatDate(data.fullPaperDeadline)} />
            </div>
          </div>
        </ReviewCard>

        {/* Two-column layout for Committees and Review Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Committees */}
          <ReviewCard title="Committees" onEdit={() => onEditStep?.(5)}>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">General Chairs</span>
                <span className="font-medium text-[#141414] dark:text-white text-xs">
                  {organizerCounts.generalChairs} Member
                  {organizerCounts.generalChairs !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Program Chairs</span>
                <span className="font-medium text-[#141414] dark:text-white text-xs">
                  {organizerCounts.programChairs} Member
                  {organizerCounts.programChairs !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">Reviewers</span>
                <span className="font-medium text-[#141414] dark:text-white text-xs">
                  {organizerCounts.reviewers > 0
                    ? `${organizerCounts.reviewers} Member${organizerCounts.reviewers !== 1 ? "s" : ""}`
                    : "Pending Invite"}
                </span>
              </div>
            </div>
          </ReviewCard>

          {/* Review Policy */}
          <ReviewCard title="Review Policy" onEdit={() => onEditStep?.(3)}>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Review Mode
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="material-symbols-outlined text-slate-400"
                    style={{ fontSize: "12px", width: "12px", height: "12px" }}
                  >
                    {data.anonymity === "double-blind" ? "visibility_off" : "visibility"}
                  </span>
                  <p className="text-xs font-medium text-[#141414] dark:text-white">
                    {data.anonymity === "double-blind" ? "Double Blind" : "Single Blind"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Paper Submission Deadline
                </p>
                <p className="text-xs font-medium text-[#141414] dark:text-white">
                  {formatDate(data.fullPaperDeadline)}
                </p>
              </div>
            </div>
          </ReviewCard>
        </div>

        {/* Submission Guidelines Summary */}
        <ReviewCard title="Submission Guidelines" onEdit={() => onEditStep?.(3)}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Max Pages
              </p>
              <p className="text-xs font-medium text-[#141414] dark:text-white">
                {data.maxPages || 8}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Abstract Max Words
              </p>
              <p className="text-xs font-medium text-[#141414] dark:text-white">
                {data.abstractMaxWords || 250}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                File Formats
              </p>
              <p className="text-xs font-medium text-[#141414] dark:text-white">
                {data.fileFormats.length > 0 ? data.fileFormats.join(", ") : "PDF"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Supplementary
              </p>
              <p className="text-xs font-medium text-[#141414] dark:text-white">
                {data.allowSupplementary ? "Allowed" : "Not Allowed"}
              </p>
            </div>
          </div>
        </ReviewCard>

        {/* Confirmation Checkbox */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 size-4 text-[#1B3C53] focus:ring-[#1B3C53] border-slate-300 dark:border-slate-600 rounded"
              checked={data.confirmed}
              onChange={(e) => updateData({ confirmed: e.target.checked })}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#141414] dark:text-white">
                I confirm that all information is correct
              </span>
              <span className="text-[10px] text-slate-400 font-light leading-relaxed">
                By checking this box, you confirm that all the conference details are accurate. Some
                settings cannot be changed after the conference is published.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
