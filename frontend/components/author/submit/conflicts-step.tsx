"use client"

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

const conflictReasons = [
  { value: "advisor", label: "Advisor / Advisee Relationship" },
  { value: "coauthor", label: "Recent Co-author (last 24 months)" },
  { value: "family", label: "Family Member / Close Personal Relationship" },
  { value: "financial", label: "Financial Interest / Grant Collaboration" },
  { value: "other", label: "Other (Please specify in comments)" },
]

const reasonLabels: Record<string, { label: string; color: string }> = {
  advisor: {
    label: "Advisor",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  coauthor: {
    label: "Co-author",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  family: {
    label: "Personal",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  financial: {
    label: "Financial",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  other: {
    label: "Other",
    color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
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
  return (
    <div className="flex flex-col gap-6">
      {/* Policy Definition Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex gap-3">
        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mt-0.5">
          info
        </span>
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-bold mb-1">Policy Definition</p>
          <p className="leading-relaxed opacity-90">
            A conflict of interest exists if you have been a co-author with a PC member in the last
            24 months, are from the same institution, or have a close personal or professional
            relationship (e.g., family member, Ph.D. advisor/advisee).
          </p>
        </div>
      </div>

      {/* Institutional Conflicts */}
      <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-primary dark:text-white text-lg font-bold">
              Institutional Conflicts
            </h3>
            <span
              className="material-symbols-outlined text-neutral-400 cursor-help"
              title="Domains of your current affiliation are automatically flagged."
            >
              help
            </span>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-neutral-600 dark:text-neutral-300 text-sm font-semibold uppercase tracking-wider">
              Conflict Domains
            </span>
            <div className="w-full min-h-[56px] px-2 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary dark:text-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all flex flex-wrap gap-2 items-center">
              {conflictDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700"
                >
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {domain}
                  </span>
                  <button
                    className="flex items-center justify-center size-4 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-500 transition-colors"
                    type="button"
                    onClick={() => onRemoveDomain(domain)}
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
              <input
                className="flex-1 min-w-[200px] h-8 border-none bg-transparent focus:ring-0 focus:outline-none text-sm px-2"
                placeholder="Add domain (e.g. google.com) and press Enter..."
                type="text"
                value={domainInput}
                onChange={(e) => onDomainInputChange(e.target.value)}
                onKeyDown={onAddDomain}
              />
            </div>
            <p className="text-xs text-neutral-500">
              Reviewers with email addresses from these domains will be automatically marked as
              conflicted.
            </p>
          </label>
        </div>
      </div>

      {/* Individual Conflicts */}
      <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-primary dark:text-white text-lg font-bold">Individual Conflicts</h3>
          <p className="text-neutral-500 text-sm">
            Specify individual program committee members with whom you have a conflict.
          </p>
        </div>

        {/* Add Conflict Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-lg border border-neutral-100 dark:border-neutral-800">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
              First Name
            </label>
            <input
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary"
              placeholder="John"
              type="text"
              value={newConflict.firstName}
              onChange={(e) => onNewConflictChange({ ...newConflict, firstName: e.target.value })}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
              Last Name
            </label>
            <input
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary"
              placeholder="Doe"
              type="text"
              value={newConflict.lastName}
              onChange={(e) => onNewConflictChange({ ...newConflict, lastName: e.target.value })}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
              Email (Optional)
            </label>
            <input
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary"
              placeholder="john.doe@example.com"
              type="email"
              value={newConflict.email}
              onChange={(e) => onNewConflictChange({ ...newConflict, email: e.target.value })}
            />
          </div>
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase">
              Reason for Conflict
            </label>
            <div className="relative">
              <select
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={newConflict.reason}
                onChange={(e) => onNewConflictChange({ ...newConflict, reason: e.target.value })}
              >
                {conflictReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </span>
            </div>
          </div>
          <div className="md:col-span-4">
            <button
              className="w-full h-10 flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#1e293b]/90 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              type="button"
              onClick={onAddConflict}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Conflict
            </button>
          </div>
        </div>

        {/* Conflicts Table */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">
                  Name
                </th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300 hidden sm:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">
                  Reason
                </th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-600 dark:text-neutral-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-[#1e1e1e]">
              {conflicts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-500 italic text-sm">
                    No individual conflicts listed. Add conflicts using the form above.
                  </td>
                </tr>
              ) : (
                conflicts.map((conflict) => (
                  <tr
                    key={conflict.id}
                    className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-primary dark:text-white">
                      {conflict.firstName} {conflict.lastName}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">
                      {conflict.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${reasonLabels[conflict.reason]?.color || reasonLabels.other.color}`}
                      >
                        {reasonLabels[conflict.reason]?.label || conflict.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remove"
                        onClick={() => onRemoveConflict(conflict.id)}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
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
      <div className="p-6 bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            className="mt-1 size-5 rounded border-neutral-300 text-primary focus:ring-primary transition-all"
            type="checkbox"
            checked={coiConfirmed}
            onChange={(e) => onCoiConfirmedChange(e.target.checked)}
          />
          <div className="flex flex-col">
            <span className="text-primary dark:text-white text-sm font-bold">
              Confirm Declaration
            </span>
            <span className="text-sm text-neutral-500 mt-1">
              I certify that I have disclosed all potential conflicts of interest to the best of my
              knowledge according to the conference policy.
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}

export type { Conflict }
