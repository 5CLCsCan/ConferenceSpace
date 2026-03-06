"use client"

import { useState, useEffect, useRef } from "react"
import { apiFetch } from "@/lib/api/client"
import type { Author } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface UserSearchResult {
  id: number
  email: string
  first_name: string
  last_name: string
}

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
  const { t } = useTranslation()
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced user search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (newAuthor.email.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(newAuthor.email)
      }, 300)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [newAuthor.email])

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) return

    setIsSearching(true)
    setShowDropdown(true)

    try {
      const { data } = await apiFetch<{
        data: {
          users: UserSearchResult[]
          total: number
        }
      }>(`/api/v1/users/search?q=${encodeURIComponent(query)}&limit=10`)

      setSearchResults(data.data?.users || [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = (user: UserSearchResult) => {
    onNewAuthorChange({
      ...newAuthor,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email,
    })
    setShowDropdown(false)
    setSearchResults([])
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Author List Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {t("runtime.components.author.submit.authors-step.text_author_list")}{authors.length})
          </h3>
          <button className="text-[10px] font-medium text-[#1B3C53] dark:text-slate-400 hover:underline flex items-center gap-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">info</span>
            {t("runtime.components.author.submit.authors-step.text_naming_guidelines")}{" "}</button>
        </div>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
          {authors.map((author, index) => (
            <div
              key={author.id}
              className="group flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div
                className={`hidden md:flex items-center justify-center ${
                  index === 0
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-400 hover:text-[#1B3C53] cursor-grab active:cursor-grabbing"
                }`}
                title={index === 0 ? "Cannot reorder primary author" : "Drag to reorder"}
              >
                <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
              </div>
              <div className="flex-none">
                <div
                  className={`size-10 rounded-full ${
                    index === 0 ? "bg-[#1B3C53]" : "bg-amber-600"
                  } text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-600 shadow-sm`}
                >
                  {author.firstName[0]}
                  {author.lastName[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#141414] dark:text-white truncate">
                      {author.firstName} {author.lastName}
                    </h4>
                    {index === 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wide">
                        {t("runtime.components.author.submit.authors-step.text_you")}{" "}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{author.email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#141414] dark:text-white truncate">
                    {author.affiliation}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{author.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={author.isCorresponding}
                      onChange={() => onToggleCorresponding(author.id)}
                      disabled={index === 0}
                      className={`peer appearance-none size-4 rounded border border-slate-300 bg-white checked:bg-[#1B3C53] checked:border-[#1B3C53] transition-all ${
                        index === 0 ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                      <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("runtime.components.author.submit.authors-step.text_correspondent")}{" "}</span>
                </label>
                <div className="flex items-center border-l border-slate-200 dark:border-slate-600 pl-2 ml-1">
                  <button
                    className="p-1.5 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-600"
                    title={t("runtime.components.author.submit.authors-step.title_edit_details")}
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  {index > 0 && (
                    <button
                      onClick={() => onRemoveAuthor(author.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      title={t("runtime.components.author.submit.authors-step.title_remove_author")}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Co-Author Form */}
      <div className="px-4 pt-4 pb-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {t("runtime.components.author.submit.authors-step.text_add_co_author")}{" "}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.authors-step.text_first_name")}{" "}<span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.firstName}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, firstName: e.target.value })}
              placeholder={t("runtime.components.author.submit.authors-step.placeholder_e_g_john")}
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.authors-step.text_last_name")}{" "}<span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.lastName}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, lastName: e.target.value })}
              placeholder={t("runtime.components.author.submit.authors-step.placeholder_e_g_doe")}
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />
          </div>

          {/* Email with User Search */}
          <div className="flex flex-col gap-1.5 md:col-span-2 relative" ref={dropdownRef}>
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.authors-step.text_email_address")}{" "}<span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="email"
              value={newAuthor.email}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, email: e.target.value })}
              onFocus={() => {
                if (newAuthor.email.length >= 2 && searchResults.length > 0) {
                  setShowDropdown(true)
                }
              }}
              placeholder={t("runtime.components.author.submit.authors-step.placeholder_e_g_john_doe_university_edu")}
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />

            {/* User Search Dropdown */}
            {showDropdown && (isSearching || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                {isSearching ? (
                  <div className="flex items-center justify-center p-3 gap-2">
                    <span className="material-symbols-outlined animate-spin text-[#1B3C53] text-[14px]">
                      sync
                    </span>
                    <span className="text-xs text-slate-500">{t("runtime.components.author.submit.authors-step.text_searching")}</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-1">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="size-7 rounded-full bg-[#1B3C53]/10 flex items-center justify-center text-[#1B3C53] font-bold text-[10px]">
                          {user.first_name?.[0] || user.email[0].toUpperCase()}
                          {user.last_name?.[0] || ""}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#141414] dark:text-white truncate">
                            {user.email}
                          </p>
                          {(user.first_name || user.last_name) && (
                            <p className="text-[10px] text-slate-500 truncate">
                              {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                            </p>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-slate-400 text-[16px]">
                          person_add
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.authors-step.text_affiliation")}{" "}<span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.affiliation}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, affiliation: e.target.value })}
              placeholder={t("runtime.components.author.submit.authors-step.placeholder_e_g_stanford_university")}
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              {t("runtime.components.author.submit.authors-step.text_country")}{" "}<span className="text-red-500 ml-0.5">*</span>
            </span>
            <div className="relative">
              <select
                value={newAuthor.country}
                onChange={(e) => onNewAuthorChange({ ...newAuthor, country: e.target.value })}
                className="w-full h-10 text-xs font-normal py-2 pl-3.5 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] appearance-none cursor-pointer transition-all"
              >
                <option value="">{t("runtime.components.author.submit.authors-step.text_select_country")}</option>
                <option value="United States">{t("runtime.components.author.submit.authors-step.text_united_states")}</option>
                <option value="United Kingdom">{t("runtime.components.author.submit.authors-step.text_united_kingdom")}</option>
                <option value="Canada">{t("runtime.components.author.submit.authors-step.text_canada")}</option>
                <option value="Germany">{t("runtime.components.author.submit.authors-step.text_germany")}</option>
                <option value="France">{t("runtime.components.author.submit.authors-step.text_france")}</option>
                <option value="Japan">{t("runtime.components.author.submit.authors-step.text_japan")}</option>
                <option value="Australia">{t("runtime.components.author.submit.authors-step.text_australia")}</option>
                <option value="Vietnam">{t("runtime.components.author.submit.authors-step.text_vietnam")}</option>
                <option value="China">{t("runtime.components.author.submit.authors-step.text_china")}</option>
                <option value="Singapore">{t("runtime.components.author.submit.authors-step.text_singapore")}</option>
                <option value="South Korea">{t("runtime.components.author.submit.authors-step.text_south_korea")}</option>
                <option value="India">{t("runtime.components.author.submit.authors-step.text_india")}</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </span>
            </div>
          </div>
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
            className="h-8 px-3 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-wider"
          >
            {t("runtime.components.author.submit.authors-step.text_cancel")}{" "}</button>
          <button
            type="button"
            onClick={onAddAuthor}
            className="flex items-center gap-1.5 h-9 px-4 rounded-md text-[10px] font-medium bg-[#1B3C53] hover:bg-[#234C6A] text-white shadow-md transition-all uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            {t("runtime.components.author.submit.authors-step.text_add_author")}{" "}</button>
        </div>
      </div>
    </div>
  )
}
