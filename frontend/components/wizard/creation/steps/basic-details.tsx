"use client"

import { WizardHeader } from "../wizard-header"
import { WizardFormCard } from "../wizard-form-card"
import { WizardFormField, WizardInput } from "../wizard-form-field"
import { DateTimePicker } from "../date-time-picker"
import { ConferenceFormData } from "../types"

interface BasicDetailsStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

const LOCATION_TYPES = [
  { value: "in-person", label: "In-Person", icon: "location_on" },
  { value: "virtual", label: "Virtual", icon: "videocam" },
  { value: "hybrid", label: "Hybrid", icon: "sync_alt" },
] as const

export function BasicDetailsStep({ data, updateData }: BasicDetailsStepProps) {
  const handleDateChange = (field: keyof ConferenceFormData, date: Date | undefined) => {
    updateData({ [field]: date })
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pt-0 pb-0">
      <WizardHeader
        title="Basic Details"
        description="Provide the fundamental information for your new conference. This includes the conference identity, venue, and event dates."
      />

      <form className="flex flex-col gap-4 w-full pb-[64px]" onSubmit={(e) => e.preventDefault()}>
        {/* Conference Identity */}
        <WizardFormCard title="Conference Identity">
          <div className="flex flex-col gap-4">
            <WizardFormField label="Conference Name" required>
              <WizardInput
                type="text"
                placeholder="e.g., International Conference on Computer Vision"
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
              />
            </WizardFormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WizardFormField label="Acronym" required hint="Used in URLs and correspondence">
                <WizardInput
                  type="text"
                  placeholder="e.g., ICCV 2024"
                  value={data.acronym}
                  onChange={(e) => updateData({ acronym: e.target.value })}
                />
              </WizardFormField>

              <WizardFormField label="Contact Email" required>
                <WizardInput
                  type="email"
                  placeholder="e.g., chairs@iccv2024.org"
                  value={data.contactEmail}
                  onChange={(e) => updateData({ contactEmail: e.target.value })}
                  icon={
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "14px",
                        width: "14px",
                        height: "14px",
                        maxWidth: "14px",
                        maxHeight: "14px",
                        minWidth: "14px",
                        minHeight: "14px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transform: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      mail
                    </span>
                  }
                />
              </WizardFormField>
            </div>

            <WizardFormField label="Conference Website">
              <WizardInput
                type="url"
                placeholder="https://example.org/conference"
                value={data.website}
                onChange={(e) => updateData({ website: e.target.value })}
                icon={
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "14px",
                      width: "14px",
                      height: "14px",
                      maxWidth: "14px",
                      maxHeight: "14px",
                      minWidth: "14px",
                      minHeight: "14px",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    language
                  </span>
                }
              />
            </WizardFormField>
          </div>
        </WizardFormCard>

        {/* Venue & Format and Conference Dates - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Venue & Format */}
          <WizardFormCard title="Venue & Format">
            <div className="flex flex-col gap-4">
              {/* Format Selection */}
              <WizardFormField label="Conference Format" required>
                <div className="flex gap-2" style={{ paddingTop: "4px", paddingBottom: "4px" }}>
                  {LOCATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateData({ locationType: type.value })}
                      className={`flex items-center gap-2 h-8 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                        data.locationType === type.value
                          ? "bg-[#1B3C53] text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "14px",
                          width: "14px",
                          height: "14px",
                          maxWidth: "14px",
                          maxHeight: "14px",
                          minWidth: "14px",
                          minHeight: "14px",
                          lineHeight: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transform: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        {type.icon}
                      </span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </WizardFormField>

              {/* Location - only show if not virtual */}
              {data.locationType !== "virtual" && (
                <WizardFormField
                  label="Venue Location"
                  required
                  hint="Full address of the conference venue"
                >
                  <WizardInput
                    type="text"
                    placeholder="e.g., Convention Center, Paris, France"
                    value={data.location}
                    onChange={(e) => {
                      updateData({ location: e.target.value, venue: e.target.value })
                    }}
                    icon={
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "14px",
                          width: "14px",
                          height: "14px",
                          maxWidth: "14px",
                          maxHeight: "14px",
                          minWidth: "14px",
                          minHeight: "14px",
                          lineHeight: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transform: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        location_on
                      </span>
                    }
                  />
                </WizardFormField>
              )}

              {/* Virtual platform - only show if virtual or hybrid */}
              {(data.locationType === "virtual" || data.locationType === "hybrid") && (
                <WizardFormField
                  label="Virtual Platform"
                  hint="Specify the virtual conferencing platform"
                >
                  <WizardInput
                    type="text"
                    placeholder="e.g., Zoom, Gather.town, Hopin"
                    value=""
                    onChange={() => {}}
                    icon={
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "14px",
                          width: "14px",
                          height: "14px",
                          maxWidth: "14px",
                          maxHeight: "14px",
                          minWidth: "14px",
                          minHeight: "14px",
                          lineHeight: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transform: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        videocam
                      </span>
                    }
                  />
                </WizardFormField>
              )}
            </div>
          </WizardFormCard>

          {/* Conference Dates */}
          <WizardFormCard title="Conference Dates">
            <div className="flex flex-col gap-4">
              <WizardFormField label="Start Date" required>
                <DateTimePicker
                  date={data.conferenceStartDate}
                  onDateChange={(date) => handleDateChange("conferenceStartDate", date)}
                  placeholder="Pick start date and time"
                />
              </WizardFormField>

              <WizardFormField label="End Date" required>
                <DateTimePicker
                  date={data.conferenceEndDate}
                  onDateChange={(date) => handleDateChange("conferenceEndDate", date)}
                  placeholder="Pick end date and time"
                  minDate={data.conferenceStartDate}
                />
              </WizardFormField>

              {/* Duration Preview */}
              {data.conferenceStartDate && data.conferenceEndDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-[14px] text-[#1B3C53] dark:text-slate-400">
                    schedule
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Duration:{" "}
                    <strong className="text-[#1B3C53] dark:text-white">
                      {Math.ceil(
                        (data.conferenceEndDate.getTime() - data.conferenceStartDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}{" "}
                      days
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </WizardFormCard>
        </div>

        {/* Brief Description (optional) */}
        <WizardFormCard title="Conference Description">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-light text-slate-400 -mt-2">
              A brief overview of the conference scope and objectives. This will appear in the
              conference listing.
            </p>
            <textarea
              className="w-full min-h-[100px] text-xs font-normal py-2.5 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all resize-y leading-relaxed"
              placeholder="e.g., The International Conference on Computer Vision brings together researchers and practitioners to present cutting-edge research in computer vision, pattern recognition, and related fields..."
              value={data.description}
              onChange={(e) => updateData({ description: e.target.value })}
              rows={4}
            />
            <div className="flex justify-end">
              <span className="text-[9px] font-light text-slate-400 uppercase tracking-wider">
                {data.description.length} / 500 characters
              </span>
            </div>
          </div>
        </WizardFormCard>
      </form>
    </div>
  )
}
