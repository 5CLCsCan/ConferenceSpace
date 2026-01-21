"use client"

import type { Author } from "./types"

interface AuthorsStepProps {
  authors: Author[]
  newAuthor: {
    firstName: string
    lastName: string
    email: string
    affiliation: string
    country: string
  }
  onNewAuthorChange: (author: AuthorsStepProps["newAuthor"]) => void
  onAddAuthor: () => void
  onRemoveAuthor: (id: string) => void
  onToggleCorresponding: (id: string) => void
}

export function AuthorsStep({
  authors,
  newAuthor,
  onNewAuthorChange,
  onAddAuthor,
  onRemoveAuthor,
  onToggleCorresponding,
}: AuthorsStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Author List Card */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-white">
            Author List ({authors.length})
          </h3>
          <button className="text-xs font-medium text-primary dark:text-blue-400 hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Naming Guidelines
          </button>
        </div>
        <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
          {authors.map((author, index) => (
            <div
              key={author.id}
              className="group flex flex-col md:flex-row items-start md:items-center p-4 gap-4 bg-white dark:bg-[#1e1e1e] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div
                className={`hidden md:flex items-center justify-center ${
                  index === 0
                    ? "text-neutral-300 cursor-not-allowed"
                    : "text-neutral-400 hover:text-primary cursor-grab active:cursor-grabbing"
                }`}
                title={index === 0 ? "Cannot reorder primary author" : "Drag to reorder"}
              >
                <span className="material-symbols-outlined">drag_indicator</span>
              </div>
              <div className="flex-none">
                <div
                  className={`size-12 rounded-full ${
                    index === 0 ? "bg-primary" : "bg-amber-600"
                  } text-white flex items-center justify-center text-sm font-bold border-2 border-white dark:border-neutral-700 shadow-sm`}
                >
                  {author.firstName[0]}
                  {author.lastName[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-primary dark:text-white truncate">
                      {author.firstName} {author.lastName}
                    </h4>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 truncate">{author.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary dark:text-white truncate">
                    {author.affiliation}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{author.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={author.isCorresponding}
                      onChange={() => onToggleCorresponding(author.id)}
                      disabled={index === 0}
                      className={`peer appearance-none size-4 rounded border border-neutral-300 bg-white checked:bg-primary checked:border-primary transition-all ${
                        index === 0 ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    </span>
                  </div>
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Correspondent
                  </span>
                </label>
                <div className="flex items-center border-l border-neutral-200 dark:border-neutral-700 pl-3 ml-1">
                  <button
                    className="p-2 text-neutral-400 hover:text-primary dark:hover:text-white transition-colors rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    title="Edit details"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  {index > 0 && (
                    <button
                      onClick={() => onRemoveAuthor(author.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remove author"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Co-Author Form */}
      <div className="p-6 bg-neutral-50 dark:bg-[#1e1e1e] rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-white mb-4">
          Add Co-Author
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              First Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.firstName}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, firstName: e.target.value })}
              placeholder="e.g. John"
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Last Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.lastName}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, lastName: e.target.value })}
              placeholder="e.g. Doe"
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              value={newAuthor.email}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, email: e.target.value })}
              placeholder="e.g. john.doe@university.edu"
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Affiliation / Institution <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.affiliation}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, affiliation: e.target.value })}
              placeholder="e.g. Stanford University"
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Country / Region <span className="text-red-500">*</span>
            </span>
            <div className="relative">
              <select
                value={newAuthor.country}
                onChange={(e) => onNewAuthorChange({ ...newAuthor, country: e.target.value })}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
              >
                <option value="">Select country...</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Japan">Japan</option>
                <option value="Australia">Australia</option>
                <option value="Vietnam">Vietnam</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </span>
            </div>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() =>
              onNewAuthorChange({
                firstName: "",
                lastName: "",
                email: "",
                affiliation: "",
                country: "",
              })
            }
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAddAuthor}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Author
          </button>
        </div>
      </div>
    </div>
  )
}
