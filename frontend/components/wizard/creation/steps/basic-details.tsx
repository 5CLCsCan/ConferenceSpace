"use client"

import { WizardHeader } from "../wizard-header"
import { WizardFormCard } from "../wizard-form-card"
import { WizardFormField, WizardInput } from "../wizard-form-field"
import { DateTimePicker } from "../date-time-picker"
import { ConferenceFormData } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface BasicDetailsStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function BasicDetailsStep({ data, updateData }: BasicDetailsStepProps) {
  const { t } = useTranslation()
  const locationTypes = [
    {
      value: "in-person",
      label: t("runtime.components.wizard.creation.steps.basic-details.prop_label_in_person"),
      icon: "location_on",
    },
    {
      value: "virtual",
      label: t("runtime.components.wizard.creation.steps.basic-details.prop_label_virtual"),
      icon: "videocam",
    },
    {
      value: "hybrid",
      label: t("runtime.components.wizard.creation.steps.basic-details.prop_label_hybrid"),
      icon: "sync_alt",
    },
  ] as const

  const handleDateChange = (field: keyof ConferenceFormData, date: Date | undefined) => {
    updateData({ [field]: date })
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pt-0 pb-0">
      <WizardHeader
        title={t("runtime.components.wizard.creation.steps.basic-details.title_basic_details")}
        description={t(
          "runtime.components.wizard.creation.steps.basic-details.text_provide_the_fundamental_information_for_your_new_conference",
        )}
      />

      <form className="flex flex-col gap-4 w-full pb-[64px]" onSubmit={(e) => e.preventDefault()}>
        {/* Conference Identity */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.basic-details.title_conference_identity",
          )}
        >
          <div className="flex flex-col gap-4">
            <WizardFormField
              label={t(
                "runtime.components.wizard.creation.steps.basic-details.label_conference_name",
              )}
              required
            >
              <WizardInput
                type="text"
                placeholder={t(
                  "runtime.components.wizard.creation.steps.basic-details.placeholder_e_g_international_conference_on_computer",
                )}
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
              />
            </WizardFormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WizardFormField
                label={t("runtime.components.wizard.creation.steps.basic-details.label_acronym")}
                required
                hint={t(
                  "runtime.components.wizard.creation.steps.basic-details.hint_used_in_urls_and_correspondence",
                )}
              >
                <WizardInput
                  type="text"
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.basic-details.placeholder_e_g_iccv_2024",
                  )}
                  value={data.acronym}
                  onChange={(e) => updateData({ acronym: e.target.value })}
                />
              </WizardFormField>

              <WizardFormField
                label={t(
                  "runtime.components.wizard.creation.steps.basic-details.label_contact_email",
                )}
                required
              >
                <WizardInput
                  type="email"
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.basic-details.placeholder_e_g_chairs_iccv2024_org",
                  )}
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

            <WizardFormField
              label={t(
                "runtime.components.wizard.creation.steps.basic-details.label_conference_website",
              )}
            >
              <WizardInput
                type="url"
                placeholder={t(
                  "runtime.components.wizard.creation.steps.basic-details.placeholder_https_example_org_conference",
                )}
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
          <WizardFormCard
            title={t("runtime.components.wizard.creation.steps.basic-details.title_venue_format")}
          >
            <div className="flex flex-col gap-4">
              {/* Format Selection */}
              <WizardFormField
                label={t(
                  "runtime.components.wizard.creation.steps.basic-details.label_conference_format",
                )}
                required
              >
                <div className="flex gap-2" style={{ paddingTop: "4px", paddingBottom: "4px" }}>
                  {locationTypes.map((type) => (
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
                  label={t(
                    "runtime.components.wizard.creation.steps.basic-details.label_venue_location",
                  )}
                  required
                  hint={t(
                    "runtime.components.wizard.creation.steps.basic-details.hint_full_address_of_the_conference_venue",
                  )}
                >
                  <WizardInput
                    type="text"
                    placeholder={t(
                      "runtime.components.wizard.creation.steps.basic-details.placeholder_e_g_convention_center_paris_france",
                    )}
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
                  label={t(
                    "runtime.components.wizard.creation.steps.basic-details.label_virtual_platform",
                  )}
                  hint={t(
                    "runtime.components.wizard.creation.steps.basic-details.hint_specify_the_virtual_conferencing_platform",
                  )}
                >
                  <WizardInput
                    type="text"
                    placeholder={t(
                      "runtime.components.wizard.creation.steps.basic-details.placeholder_e_g_zoom_gather_town_hopin",
                    )}
                    value={data.virtualPlatform}
                    onChange={(e) => updateData({ virtualPlatform: e.target.value })}
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
          <WizardFormCard
            title={t(
              "runtime.components.wizard.creation.steps.basic-details.title_conference_dates",
            )}
          >
            <div className="flex flex-col gap-4">
              <WizardFormField
                label={t("runtime.components.wizard.creation.steps.basic-details.label_start_date")}
                required
              >
                <DateTimePicker
                  date={data.conferenceStartDate}
                  onDateChange={(date) => handleDateChange("conferenceStartDate", date)}
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.basic-details.placeholder_pick_start_date_and_time",
                  )}
                />
              </WizardFormField>

              <WizardFormField
                label={t("runtime.components.wizard.creation.steps.basic-details.label_end_date")}
                required
              >
                <DateTimePicker
                  date={data.conferenceEndDate}
                  onDateChange={(date) => handleDateChange("conferenceEndDate", date)}
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.basic-details.placeholder_pick_end_date_and_time",
                  )}
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
                    {t("runtime.components.wizard.creation.steps.basic-details.text_duration")}{" "}
                    <strong className="text-[#1B3C53] dark:text-white">
                      {Math.ceil(
                        (data.conferenceEndDate.getTime() - data.conferenceStartDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}{" "}
                      {t("runtime.components.wizard.creation.steps.basic-details.text_days")}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </WizardFormCard>
        </div>

        {/* Brief Description (optional) */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.basic-details.title_conference_description",
          )}
        >
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-light text-slate-400 -mt-2">
              {t(
                "runtime.components.wizard.creation.steps.basic-details.text_a_brief_overview_of_the_conference",
              )}{" "}
            </p>
            <textarea
              className="w-full min-h-[100px] text-xs font-normal py-2.5 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all resize-y leading-relaxed"
              placeholder={t(
                "runtime.components.wizard.creation.steps.basic-details.placeholder_e_g_the_international_conference_on",
              )}
              value={data.description}
              onChange={(e) => updateData({ description: e.target.value })}
              rows={4}
            />
            <div className="flex justify-end">
              <span className="text-[9px] font-light text-slate-400 uppercase tracking-wider">
                {data.description.length}{" "}
                {t(
                  "runtime.components.wizard.creation.steps.basic-details.text_500_characters",
                )}{" "}
              </span>
            </div>
          </div>
        </WizardFormCard>
      </form>
    </div>
  )
}
