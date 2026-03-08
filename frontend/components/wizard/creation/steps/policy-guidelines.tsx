"use client"

import { WizardHeader } from "../wizard-header"
import { WizardFormCard } from "../wizard-form-card"
import { WizardFormField, WizardInput } from "../wizard-form-field"
import { ConferenceFormData } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

interface PolicyGuidelinesStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

const FILE_FORMATS = [
  {
    value: "PDF",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_pdf"),
  },
  {
    value: "LaTeX",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_latex"),
  },
  {
    value: "Word",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_word"),
  },
] as const

const SUPPLEMENTARY_TYPES = [
  {
    value: "code",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_source_code"),
    icon: "code",
  },
  {
    value: "data",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_datasets"),
    icon: "database",
  },
  {
    value: "appendix",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_appendix"),
    icon: "description",
  },
  {
    value: "video",
    label: t("runtime.components.wizard.creation.steps.policy-guidelines.prop_label_video"),
    icon: "videocam",
  },
] as const

export function PolicyGuidelinesStep({ data, updateData }: PolicyGuidelinesStepProps) {
  const { t } = useTranslation()
  const handleFileFormatToggle = (format: string) => {
    const formats = data.fileFormats.includes(format)
      ? data.fileFormats.filter((f) => f !== format)
      : [...data.fileFormats, format]
    updateData({ fileFormats: formats })
  }

  const handleSupplementaryToggle = (type: string) => {
    const types = data.supplementaryTypes.includes(type)
      ? data.supplementaryTypes.filter((t) => t !== type)
      : [...data.supplementaryTypes, type]
    updateData({ supplementaryTypes: types })
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <WizardHeader
        title={t(
          "runtime.components.wizard.creation.steps.policy-guidelines.title_policy_guidelines",
        )}
        description="Configure submission requirements, review process, and supplementary materials policy."
      />

      <form
        className="flex flex-col gap-4 w-full pt-0 pb-[64px]"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Submission Guidelines */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.policy-guidelines.title_submission_guidelines",
          )}
          tooltip="Define the formatting and length requirements for paper submissions."
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WizardFormField label="Maximum Pages" required hint="Excluding references">
                <WizardInput
                  type="number"
                  min={1}
                  max={30}
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.placeholder_e_g_8",
                  )}
                  value={data.maxPages || ""}
                  onChange={(e) => updateData({ maxPages: parseInt(e.target.value) || 8 })}
                  icon={
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "14px",
                        width: "14px",
                        height: "14px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      article
                    </span>
                  }
                />
              </WizardFormField>

              <WizardFormField label="Abstract Max Words" hint="Recommended: 150-300">
                <WizardInput
                  type="number"
                  min={50}
                  max={500}
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.placeholder_e_g_250",
                  )}
                  value={data.abstractMaxWords || ""}
                  onChange={(e) =>
                    updateData({ abstractMaxWords: parseInt(e.target.value) || 250 })
                  }
                  icon={
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "14px",
                        width: "14px",
                        height: "14px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      short_text
                    </span>
                  }
                />
              </WizardFormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WizardFormField label="Min Keywords" hint="Required keywords per submission">
                <WizardInput
                  type="number"
                  min={1}
                  max={10}
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.placeholder_e_g_3",
                  )}
                  value={data.minKeywords || ""}
                  onChange={(e) => updateData({ minKeywords: parseInt(e.target.value) || 3 })}
                />
              </WizardFormField>

              <WizardFormField label="Max Keywords">
                <WizardInput
                  type="number"
                  min={1}
                  max={10}
                  placeholder={t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.placeholder_e_g_5",
                  )}
                  value={data.maxKeywords || ""}
                  onChange={(e) => updateData({ maxKeywords: parseInt(e.target.value) || 5 })}
                />
              </WizardFormField>
            </div>

            {/* File Format Selection */}
            <WizardFormField label="Accepted File Formats" required>
              <div
                className="flex gap-2"
                style={{ paddingTop: "4px", paddingBottom: "4px" }}
                onClick={(e) => e.stopPropagation()}
              >
                {FILE_FORMATS.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFileFormatToggle(format.value)
                    }}
                    className={`flex items-center gap-2 h-8 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                      data.fileFormats.includes(format.value)
                        ? "bg-[#1B3C53] text-white shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </WizardFormField>
          </div>
        </WizardFormCard>

        {/* Review Configuration */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.policy-guidelines.title_review_configuration",
          )}
          tooltip="Configure the blind review process and conflict of interest policies."
        >
          <div className="flex flex-col gap-4">
            {/* Anonymity Type */}
            <WizardFormField label="Review Type" required>
              <div className="flex gap-2" style={{ paddingTop: "4px", paddingBottom: "4px" }}>
                <button
                  type="button"
                  onClick={() => updateData({ anonymity: "double-blind" })}
                  className={`flex items-center gap-2 h-8 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                    data.anonymity === "double-blind"
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
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    visibility_off
                  </span>
                  {t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.text_double_blind",
                  )}{" "}
                </button>
                <button
                  type="button"
                  onClick={() => updateData({ anonymity: "single-blind" })}
                  className={`flex items-center gap-2 h-8 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                    data.anonymity === "single-blind"
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
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    visibility
                  </span>
                  {t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.text_single_blind",
                  )}{" "}
                </button>
              </div>
            </WizardFormField>

            {/* Review Type Description */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
              <span
                className="material-symbols-outlined text-[#1B3C53] dark:text-slate-400 mt-0.5"
                style={{ fontSize: "14px", width: "14px", height: "14px" }}
              >
                info
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {data.anonymity === "double-blind" ? (
                  <>
                    <strong className="text-[#141414] dark:text-white">
                      {t(
                        "runtime.components.wizard.creation.steps.policy-guidelines.text_double_blind_2",
                      )}
                    </strong>{" "}
                    {t(
                      "runtime.components.wizard.creation.steps.policy-guidelines.text_both_author_and_reviewer_identities_are",
                    )}{" "}
                  </>
                ) : (
                  <>
                    <strong className="text-[#141414] dark:text-white">
                      {t(
                        "runtime.components.wizard.creation.steps.policy-guidelines.text_single_blind_2",
                      )}
                    </strong>{" "}
                    {t(
                      "runtime.components.wizard.creation.steps.policy-guidelines.text_reviewers_know_author_identities_but_authors",
                    )}{" "}
                  </>
                )}
              </p>
            </div>
          </div>
        </WizardFormCard>

        {/* Supplementary Materials */}
        <WizardFormCard
          title={t(
            "runtime.components.wizard.creation.steps.policy-guidelines.title_supplementary_materials",
          )}
          tooltip="Configure what additional materials authors can submit alongside their papers."
        >
          <div className="flex flex-col gap-4">
            {/* Allow Supplementary Toggle */}
            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                className="size-4 text-[#1B3C53] focus:ring-[#1B3C53] border-slate-300 dark:border-slate-600 rounded"
                checked={data.allowSupplementary}
                onChange={(e) => updateData({ allowSupplementary: e.target.checked })}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#141414] dark:text-white">
                  {t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.text_allow_supplementary_materials",
                  )}{" "}
                </span>
                <span className="text-[10px] text-slate-400 font-light">
                  {t(
                    "runtime.components.wizard.creation.steps.policy-guidelines.text_authors_can_upload_additional_files_with",
                  )}{" "}
                </span>
              </div>
            </label>

            {/* Supplementary Types */}
            {data.allowSupplementary && (
              <WizardFormField label="Allowed Types">
                <div
                  className="flex flex-wrap gap-2"
                  style={{ paddingTop: "4px", paddingBottom: "4px" }}
                >
                  {SUPPLEMENTARY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleSupplementaryToggle(type.value)}
                      className={`flex items-center gap-2 h-8 px-3 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                        data.supplementaryTypes.includes(type.value)
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
                          lineHeight: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {type.icon}
                      </span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </WizardFormField>
            )}
          </div>
        </WizardFormCard>
      </form>
    </div>
  )
}
