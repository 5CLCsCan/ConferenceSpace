"use client"

import { useState, KeyboardEvent } from "react"
import { WizardHeader } from "../wizard-header"
import { WizardFormCard } from "../wizard-form-card"
import { WizardFormField } from "../wizard-form-field"
import { DateTimePicker } from "../date-time-picker"
import { ConferenceFormData } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface TopicsDeadlinesStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function TopicsDeadlinesStep({ data, updateData }: TopicsDeadlinesStepProps) {
  const { t } = useTranslation()
  const [topicInput, setTopicInput] = useState("")
  const [trackInput, setTrackInput] = useState("")

  const handleDateChange = (field: keyof ConferenceFormData, date: Date | undefined) => {
    updateData({ [field]: date })
  }

  // Topic handlers
  const handleAddTopic = (value: string) => {
    const trimmedValue = value.trim()
    if (trimmedValue && !data.topics.includes(trimmedValue)) {
      updateData({ topics: [...data.topics, trimmedValue] })
    }
    setTopicInput("")
  }

  const handleRemoveTopic = (topic: string) => {
    updateData({ topics: data.topics.filter((t) => t !== topic) })
  }

  const handleTopicInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      handleAddTopic(topicInput)
    } else if (e.key === ",") {
      e.preventDefault()
      e.stopPropagation()
      handleAddTopic(topicInput.replace(/,/g, ""))
    }
  }

  // Track handlers
  const handleAddTrack = (value: string) => {
    const trimmedValue = value.trim()
    if (trimmedValue && !data.tracks.includes(trimmedValue)) {
      updateData({ tracks: [...data.tracks, trimmedValue] })
    }
    setTrackInput("")
  }

  const handleRemoveTrack = (track: string) => {
    updateData({ tracks: data.tracks.filter((t) => t !== track) })
  }

  const handleTrackInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      handleAddTrack(trackInput)
    } else if (e.key === ",") {
      e.preventDefault()
      e.stopPropagation()
      handleAddTrack(trackInput.replace(/,/g, ""))
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <WizardHeader
        title={t(
          "runtime.components.wizard.creation.steps.topics-deadlines.title_topics_deadlines",
        )}
        description="Define the thematic scope and critical submission dates for your conference."
      />

      <form
        className="flex flex-col gap-4 w-full pt-0 pb-[64px]"
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
          }
        }}
      >
        {/* Research Topics */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.topics-deadlines.title_research_topics",
          )}
          tooltip="Topics are used to tag submissions and match reviewers. They help authors categorize their work and assist in assigning qualified reviewers."
        >
          <WizardFormField label="Subject Areas" required hint="Press Enter to add a topic.">
            <div className="flex flex-col gap-3">
              {/* Topic Input */}
              <div
                className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#1B3C53]/30 focus-within:border-[#1B3C53] transition-all flex items-center cursor-text"
                onClick={() => document.getElementById("topic-input")?.focus()}
              >
                <input
                  id="topic-input"
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-[#141414] dark:text-white placeholder:text-slate-400"
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.topics-deadlines.placeholder_enter_topic_and_press_enter",
                  )}
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicInputKeyDown}
                  onBlur={() => {
                    if (topicInput.trim()) {
                      handleAddTopic(topicInput)
                    }
                  }}
                />
                {topicInput.trim() && (
                  <span className="text-[9px] font-medium text-[#1B3C53] dark:text-slate-400 uppercase tracking-wider">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_press_enter",
                    )}{" "}
                  </span>
                )}
              </div>

              {/* Topic List */}
              {data.topics.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {data.topics.length}{" "}
                    {t("runtime.components.wizard.creation.steps.topics-deadlines.text_topic")}
                    {data.topics.length !== 1 ? "s" : ""}{" "}
                    {t("runtime.components.wizard.creation.steps.topics-deadlines.text_added")}{" "}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.topics.map((topic) => (
                      <div
                        key={topic}
                        className="group flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-2.5 pr-1.5 py-1.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        <span className="text-[11px] font-medium text-[#1B3C53] dark:text-slate-200">
                          {topic}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          className="size-4 flex items-center justify-center rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all opacity-60 group-hover:opacity-100"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "12px", lineHeight: "1" }}
                          >
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {data.topics.length === 0 && (
                <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {t(
                        "runtime.components.wizard.creation.steps.topics-deadlines.text_no_topics_added_yet",
                      )}{" "}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      {t(
                        "runtime.components.wizard.creation.steps.topics-deadlines.text_e_g_machine_learning_nlp_computer",
                      )}{" "}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </WizardFormField>
        </WizardFormCard>

        {/* Conference Tracks */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.topics-deadlines.title_conference_tracks",
          )}
          tooltip="Tracks represent distinct thematic streams within your conference. Authors will select a track when submitting their papers, and submissions will be reviewed within their assigned track."
        >
          <WizardFormField label="Track Names" hint="Press Enter to add a track.">
            <div className="flex flex-col gap-3">
              {/* Track Input */}
              <div
                className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#1B3C53]/30 focus-within:border-[#1B3C53] transition-all flex items-center cursor-text"
                onClick={() => document.getElementById("track-input")?.focus()}
              >
                <input
                  id="track-input"
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-[#141414] dark:text-white placeholder:text-slate-400"
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.topics-deadlines.placeholder_enter_track_name_and_press_enter",
                  )}
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  onKeyDown={handleTrackInputKeyDown}
                  onBlur={() => {
                    if (trackInput.trim()) {
                      handleAddTrack(trackInput)
                    }
                  }}
                />
                {trackInput.trim() && (
                  <span className="text-[9px] font-medium text-[#1B3C53] dark:text-slate-400 uppercase tracking-wider">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_press_enter",
                    )}{" "}
                  </span>
                )}
              </div>

              {/* Track List */}
              {data.tracks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {data.tracks.length}{" "}
                    {t("runtime.components.wizard.creation.steps.topics-deadlines.text_track")}
                    {data.tracks.length !== 1 ? "s" : ""}{" "}
                    {t("runtime.components.wizard.creation.steps.topics-deadlines.text_added")}{" "}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.tracks.map((track) => (
                      <div
                        key={track}
                        className="group flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-2.5 pr-1.5 py-1.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        <span className="text-[11px] font-medium text-[#1B3C53] dark:text-slate-200">
                          {track}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(track)}
                          className="size-4 flex items-center justify-center rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all opacity-60 group-hover:opacity-100"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "12px", lineHeight: "1" }}
                          >
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {data.tracks.length === 0 && (
                <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {t(
                        "runtime.components.wizard.creation.steps.topics-deadlines.text_no_tracks_added_yet",
                      )}{" "}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      {t(
                        "runtime.components.wizard.creation.steps.topics-deadlines.text_e_g_main_track_workshop_demo",
                      )}{" "}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </WizardFormField>
        </WizardFormCard>

        {/* Submission Timeline */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.topics-deadlines.title_submission_timeline",
          )}
          tooltip="Set the key dates for the review process. All times are 23:59 AoE (Anywhere on Earth) by default."
        >
          <div className="flex flex-col gap-4">
            {/* Submission Deadlines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WizardFormField label="Abstract Submission" required>
                <div className="flex flex-col gap-1">
                  <DateTimePicker
                    date={data.abstractDeadline}
                    onDateChange={(date) => handleDateChange("abstractDeadline", date)}
                    placeholder={t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.placeholder_pick_abstract_deadline",
                    )}
                  />
                  <span className="text-[9px] text-slate-400 font-light">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_deadline_for_initial_abstract_registration",
                    )}{" "}
                  </span>
                </div>
              </WizardFormField>

              <WizardFormField label="Full Paper Submission" required>
                <div className="flex flex-col gap-1">
                  <DateTimePicker
                    date={data.fullPaperDeadline}
                    onDateChange={(date) => handleDateChange("fullPaperDeadline", date)}
                    placeholder={t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.placeholder_pick_paper_deadline",
                    )}
                    minDate={data.abstractDeadline}
                  />
                  <span className="text-[9px] text-slate-400 font-light">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_final_deadline_for_pdf_upload",
                    )}{" "}
                  </span>
                </div>
              </WizardFormField>

              <WizardFormField label="Notification of Acceptance">
                <div className="flex flex-col gap-1">
                  <DateTimePicker
                    date={data.authorNotificationDate}
                    onDateChange={(date) => handleDateChange("authorNotificationDate", date)}
                    placeholder={t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.placeholder_pick_notification_date",
                    )}
                    minDate={data.fullPaperDeadline}
                  />
                  <span className="text-[9px] text-slate-400 font-light">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_when_authors_will_receive_decisions",
                    )}{" "}
                  </span>
                </div>
              </WizardFormField>

              <WizardFormField label="Camera-Ready Deadline">
                <div className="flex flex-col gap-1">
                  <DateTimePicker
                    date={data.cameraReadyDeadline}
                    onDateChange={(date) => handleDateChange("cameraReadyDeadline", date)}
                    placeholder={t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.placeholder_pick_camera_ready_deadline",
                    )}
                    minDate={data.authorNotificationDate}
                  />
                  <span className="text-[9px] text-slate-400 font-light">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_deadline_for_final_version",
                    )}{" "}
                  </span>
                </div>
              </WizardFormField>
            </div>

            {/* Strict Deadlines Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  className="size-4 text-[#1B3C53] focus:ring-[#1B3C53] border-slate-300 dark:border-slate-600 rounded"
                  checked={data.strictDeadlines}
                  onChange={(event) => updateData({ strictDeadlines: event.target.checked })}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#141414] dark:text-white">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_strict_deadlines",
                    )}{" "}
                  </span>
                  <span className="text-[10px] text-slate-400 font-light">
                    {t(
                      "runtime.components.wizard.creation.steps.topics-deadlines.text_automatically_prevent_submissions_after_the_deadline",
                    )}{" "}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </WizardFormCard>
      </form>
    </div>
  )
}
