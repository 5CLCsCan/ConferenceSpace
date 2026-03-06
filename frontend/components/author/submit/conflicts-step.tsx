"use client"

import { useTranslation } from "@/lib/i18n/translation-context"

interface Conflict {
  id: string
  firstName: string
  lastName: string
  email: string
  reason: string
}

interface ConflictsStepProps {
  conflictDomains: string[]
  domainInput: string
  conflicts: Conflict[]
  newConflict: {
    firstName: string
    lastName: string
    email: string
    reason: string
  }
  coiConfirmed: boolean
  onDomainInputChange: (value: string) => void
  onAddDomain: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onRemoveDomain: (domain: string) => void
  onNewConflictChange: (conflict: ConflictsStepProps["newConflict"]) => void
  onAddConflict: () => void
  onRemoveConflict: (id: string) => void
  onCoiConfirmedChange: (checked: boolean) => void
}

const reasonColors: Record<string, string> = {
  advisor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  coauthor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  family: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  financial: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
}

export function ConflictsStep({
  conflictDomains,
  domainInput,
  conflicts,
  newConflict,
  coiConfirmed,
  onDomainInputChange,
  onAddDomain,
  onRemoveDomain,
  onNewConflictChange,
  onAddConflict,
  onRemoveConflict,
  onCoiConfirmedChange,
}: ConflictsStepProps) {
  const { t } = useTranslation()
  const conflictReasonOptions = [
    {
      value: "advisor",
      label: t(
        "runtime.components.author.submit.conflicts-step.prop_label_advisor_advisee_relationship",
      ),
    },
    {
      value: "coauthor",
      label: t(
        "runtime.components.author.submit.conflicts-step.prop_label_recent_co_author_last_24_months",
      ),
    },
    {
      value: "family",
      label: t(
        "runtime.components.author.submit.conflicts-step.prop_label_family_member_close_personal_relationship",
      ),
    },
    {
      value: "financial",
      label: t(
        "runtime.components.author.submit.conflicts-step.prop_label_financial_interest_grant_collaboration",
      ),
    },
    {
      value: "other",
      label: t(
        "runtime.components.author.submit.conflicts-step.prop_label_other_please_specify_in_comments",
      ),
    },
  ]

  const reasonLabels: Record<string, string> = {
    advisor: t("runtime.components.author.submit.conflicts-step.prop_label_advisor"),
    coauthor: t("runtime.components.author.submit.conflicts-step.prop_label_co_author"),
    family: t("runtime.components.author.submit.conflicts-step.prop_label_personal"),
    financial: t("runtime.components.author.submit.conflicts-step.prop_label_financial"),
    other: t("runtime.components.author.submit.conflicts-step.prop_label_other"),
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Policy Definition Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-[#1B3C53] px-4 py-3 rounded-r-lg flex gap-3">
        <span className="material-symbols-outlined text-[#1B3C53] dark:text-blue-300 text-[18px]">
          info
        </span>
        <div>
          <p className="text-xs font-bold text-[#1B3C53] dark:text-blue-200 mb-0.5">
            {t("runtime.components.author.submit.conflicts-step.text_policy_definition")}{" "}</p>
          <p className="text-[11px] text-slate-600 dark:text-blue-300/80 leading-relaxed">
            {t("runtime.components.author.submit.conflicts-step.text_a_conflict_of_interest_exists_if")}{" "}</p>
        </div>
      </div>

      {/* Institutional Conflicts */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
              {t("runtime.components.author.submit.conflicts-step.text_institutional_conflicts")}{" "}</h3>
            <span
              className="material-symbols-outlined text-slate-400 cursor-help text-[16px]"
              title={t("runtime.components.author.submit.conflicts-step.title_domains_of_your_current_affiliation_are")}
            >
              help
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
            {t("runtime.components.author.submit.conflicts-step.text_conflict_domains")}{" "}</span>
          <div className="w-full min-h-10 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus-within:ring-2 focus-within:ring-[#1B3C53] focus-within:border-[#1B3C53] transition-all flex flex-wrap gap-2 items-center">
            {conflictDomains.map((domain) => (
              <div
                key={domain}
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-xs"
              >
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  {domain}
                </span>
                <button
                  className="flex items-center justify-center size-4 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-500 transition-colors"
                  type="button"
                  onClick={() => onRemoveDomain(domain)}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            <input
              className="flex-1 min-w-[180px] h-6 border-none bg-transparent focus:ring-0 focus:outline-none text-xs px-2 placeholder:text-slate-400"
              placeholder={t("runtime.components.author.submit.conflicts-step.placeholder_add_domain_e_g_google_com")}
              type="text"
              value={domainInput}
              onChange={(e) => onDomainInputChange(e.target.value)}
              onKeyDown={onAddDomain}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-light">
            {t("runtime.components.author.submit.conflicts-step.text_reviewers_with_email_addresses_from_these")}{" "}</p>
        </div>
      </div>

      {/* Individual Conflicts */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {t("runtime.components.author.submit.conflicts-step.text_individual_conflicts")}{" "}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-light">
            {t("runtime.components.author.submit.conflicts-step.text_specify_individual_program_committee_members_with")}{" "}</p>
        </div>

        {/* Add Conflict Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.conflicts-step.text_first_name")}{" "}</span>
            <input
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
              placeholder={t("runtime.components.author.submit.conflicts-step.placeholder_john")}
              type="text"
              value={newConflict.firstName}
              onChange={(e) => onNewConflictChange({ ...newConflict, firstName: e.target.value })}
            />
          </div>
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.conflicts-step.text_last_name")}{" "}</span>
            <input
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
              placeholder={t("runtime.components.author.submit.conflicts-step.placeholder_doe")}
              type="text"
              value={newConflict.lastName}
              onChange={(e) => onNewConflictChange({ ...newConflict, lastName: e.target.value })}
            />
          </div>
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.conflicts-step.text_email")}{" "}<span className="font-normal text-slate-400">{t("runtime.components.author.submit.conflicts-step.text_optional")}</span>
            </span>
            <input
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
              placeholder={t("runtime.components.author.submit.conflicts-step.placeholder_john_doe_example_com")}
              type="email"
              value={newConflict.email}
              onChange={(e) => onNewConflictChange({ ...newConflict, email: e.target.value })}
            />
          </div>
          <div className="md:col-span-8 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.conflicts-step.text_reason")}{" "}</span>
            <div className="relative">
              <select
                className="w-full h-10 text-xs font-normal py-2 pl-3.5 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] appearance-none cursor-pointer transition-all"
                value={newConflict.reason}
                onChange={(e) => onNewConflictChange({ ...newConflict, reason: e.target.value })}
              >
                {conflictReasonOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </span>
            </div>
          </div>
          <div className="md:col-span-4">
            <button
              className="w-full h-9 flex items-center justify-center gap-1.5 bg-[#1B3C53] hover:bg-[#234C6A] text-white rounded-md text-[10px] font-medium transition-all shadow-md uppercase tracking-wider"
              type="button"
              onClick={onAddConflict}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              {t("runtime.components.author.submit.conflicts-step.text_add_conflict")}{" "}</button>
          </div>
        </div>

        {/* Conflicts Table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t("runtime.components.author.submit.conflicts-step.text_name")}{" "}</th>
                <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">
                  {t("runtime.components.author.submit.conflicts-step.text_email")}{" "}</th>
                <th className="px-3 py-2.5 font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t("runtime.components.author.submit.conflicts-step.text_reason")}{" "}</th>
                <th className="px-3 py-2.5 text-right font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t("runtime.components.author.submit.conflicts-step.text_action")}{" "}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {conflicts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-slate-400 text-xs">
                    {t("runtime.components.author.submit.conflicts-step.text_no_individual_conflicts_listed_add_conflicts")}{" "}</td>
                </tr>
              ) : (
                conflicts.map((conflict) => (
                  <tr
                    key={conflict.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium text-[#141414] dark:text-white text-xs">
                      {conflict.firstName} {conflict.lastName}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs hidden sm:table-cell">
                      {conflict.email || "-"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${reasonColors[conflict.reason] || reasonColors.other}`}
                      >
                        {reasonLabels[conflict.reason] || reasonLabels.other}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title={t("runtime.components.author.submit.conflicts-step.title_remove")}
                        onClick={() => onRemoveConflict(conflict.id)}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            className="mt-0.5 size-4 rounded border-slate-300 text-[#1B3C53] focus:ring-[#1B3C53] transition-all"
            type="checkbox"
            checked={coiConfirmed}
            onChange={(e) => onCoiConfirmedChange(e.target.checked)}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#141414] dark:text-white">
              {t("runtime.components.author.submit.conflicts-step.text_confirm_declaration")}{" "}</span>
            <span className="text-[10px] text-slate-400 font-light">
              {t("runtime.components.author.submit.conflicts-step.text_i_certify_that_i_have_disclosed")}{" "}</span>
          </div>
        </label>
      </div>
    </div>
  )
}

export type { Conflict }
