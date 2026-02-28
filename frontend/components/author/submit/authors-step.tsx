"use client"

import { useState, useEffect, useRef } from "react"
import { apiFetch } from "@/lib/api/client"
import type { Author } from "./types"

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
  onUpdateAuthor: (id: string, updates: Partial<Omit<Author, "id" | "isCorresponding">>) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  currentUserEmail?: string
}

export function AuthorsStep({
  authors,
  newAuthor,
  onNewAuthorChange,
  onAddAuthor,
  onRemoveAuthor,
  onToggleCorresponding,
  onUpdateAuthor,
  onReorder,
  currentUserEmail,
}: AuthorsStepProps) {
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // A9: Inline edit state
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    firstName: string; lastName: string; email: string; affiliation: string; country: string
  }>({ firstName: "", lastName: "", email: "", affiliation: "", country: "" })

  // A10: Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // A11: Naming guidelines modal state
  const [showGuidelines, setShowGuidelines] = useState(false)

  const startEditing = (author: Author) => {
    setEditingAuthorId(author.id)
    setEditValues({
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
      affiliation: author.affiliation,
      country: author.country,
    })
  }

  const saveEditing = () => {
    if (editingAuthorId) {
      onUpdateAuthor(editingAuthorId, editValues)
      setEditingAuthorId(null)
    }
  }

  // A10: Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

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
            Author List ({authors.length})
          </h3>
          <button
            onClick={() => setShowGuidelines(true)}
            className="text-[10px] font-medium text-[#1B3C53] dark:text-slate-400 hover:underline flex items-center gap-1 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Naming Guidelines
          </button>
        </div>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
          {authors.map((author, index) => (
            <div
              key={author.id}
              draggable={index !== 0}
              onDragStart={(e) => index !== 0 && handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex flex-col md:flex-row items-start md:items-center px-4 py-3 gap-3 transition-colors ${
                dragOverIndex === index && draggedIndex !== index
                  ? "bg-[#1B3C53]/5 border-t-2 border-[#1B3C53]"
                  : draggedIndex === index
                  ? "opacity-40"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              {/* A10: Drag handle */}
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
              {/* Author info – display or inline edit (A9) */}
              {editingAuthorId === author.id ? (
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editValues.firstName}
                    onChange={(e) => setEditValues((v) => ({ ...v, firstName: e.target.value }))}
                    placeholder="First name"
                    className="h-8 text-xs px-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-1 focus:ring-[#1B3C53]"
                  />
                  <input
                    type="text"
                    value={editValues.lastName}
                    onChange={(e) => setEditValues((v) => ({ ...v, lastName: e.target.value }))}
                    placeholder="Last name"
                    className="h-8 text-xs px-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-1 focus:ring-[#1B3C53]"
                  />
                  <input
                    type="email"
                    value={editValues.email}
                    onChange={(e) => setEditValues((v) => ({ ...v, email: e.target.value }))}
                    placeholder="Email"
                    className="h-8 text-xs px-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-1 focus:ring-[#1B3C53]"
                  />
                  <input
                    type="text"
                    value={editValues.affiliation}
                    onChange={(e) => setEditValues((v) => ({ ...v, affiliation: e.target.value }))}
                    placeholder="Affiliation"
                    className="h-8 text-xs px-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-1 focus:ring-[#1B3C53]"
                  />
                  {/* A9: Country in edit form */}
                  <div className="relative">
                    <select
                      value={editValues.country}
                      onChange={(e) => setEditValues((v) => ({ ...v, country: e.target.value }))}
                      className="w-full h-8 text-xs pl-2.5 pr-7 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-1 focus:ring-[#1B3C53] appearance-none"
                    >
                      <option value="">Country...</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Australia">Australia</option>
                      <option value="Vietnam">Vietnam</option>
                      <option value="China">China</option>
                      <option value="Singapore">Singapore</option>
                      <option value="South Korea">South Korea</option>
                      <option value="India">India</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </span>
                  </div>
                </div>
              ) : (
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#141414] dark:text-white truncate">
                      {author.firstName} {author.lastName}
                    </h4>
                    {currentUserEmail && author.email === currentUserEmail && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wide">
                        You
                      </span>
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
              )}
              <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                {editingAuthorId === author.id ? (
                  /* A9: Save / Cancel when editing */
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={saveEditing}
                      className="h-7 px-3 rounded-md text-[10px] font-medium bg-[#1B3C53] text-white hover:bg-[#234C6A] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAuthorId(null)}
                      className="h-7 px-3 rounded-md text-[10px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={author.isCorresponding}
                          onChange={() => onToggleCorresponding(author.id)}
                          className="peer appearance-none size-4 rounded border border-slate-300 bg-white checked:bg-[#1B3C53] checked:border-[#1B3C53] transition-all"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Correspondent
                      </span>
                    </label>
                    <div className="flex items-center border-l border-slate-200 dark:border-slate-600 pl-2 ml-1">
                      <button
                        type="button"
                        onClick={() => startEditing(author)}
                        className="p-1.5 text-slate-400 hover:text-[#1B3C53] dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-600"
                        title="Edit details"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      {index > 0 && (
                        <button
                          onClick={() => onRemoveAuthor(author.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remove author"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Co-Author Form */}
      <div className="px-4 pt-4 pb-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            Add Co-Author
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              First Name <span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.firstName}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, firstName: e.target.value })}
              placeholder="e.g. John"
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              Last Name <span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.lastName}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, lastName: e.target.value })}
              placeholder="e.g. Doe"
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />
          </div>

          {/* Email with User Search */}
          <div className="flex flex-col gap-1.5 md:col-span-2 relative" ref={dropdownRef}>
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              Email Address <span className="text-red-500 ml-0.5">*</span>
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
              placeholder="e.g. john.doe@university.edu - Start typing to search existing users"
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
                    <span className="text-xs text-slate-500">Searching...</span>
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
              Affiliation <span className="text-red-500 ml-0.5">*</span>
            </span>
            <input
              type="text"
              value={newAuthor.affiliation}
              onChange={(e) => onNewAuthorChange({ ...newAuthor, affiliation: e.target.value })}
              placeholder="e.g. Stanford University"
              className="w-full h-10 text-xs font-normal py-2 px-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#141414] dark:text-white uppercase tracking-widest">
              Country <span className="text-red-500 ml-0.5">*</span>
            </span>
            <div className="relative">
              <select
                value={newAuthor.country}
                onChange={(e) => onNewAuthorChange({ ...newAuthor, country: e.target.value })}
                className="w-full h-10 text-xs font-normal py-2 pl-3.5 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#141414] dark:text-white focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53] appearance-none cursor-pointer transition-all"
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
                <option value="China">China</option>
                <option value="Singapore">Singapore</option>
                <option value="South Korea">South Korea</option>
                <option value="India">India</option>
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onAddAuthor}
            className="flex items-center gap-1.5 h-9 px-4 rounded-md text-[10px] font-medium bg-[#1B3C53] hover:bg-[#234C6A] text-white shadow-md transition-all uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Add Author
          </button>
        </div>
      </div>

      {/* A11: Naming Guidelines Modal (compact) */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowGuidelines(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1B3C53] dark:text-white tracking-tight">Author Naming Guidelines</h3>
              <button type="button" onClick={() => setShowGuidelines(false)} className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <ul className="px-3 py-2.5 space-y-2 text-[10px] text-slate-600 dark:text-slate-300">
              <li className="flex gap-1.5"><span className="material-symbols-outlined text-[12px] text-[#1B3C53] mt-px shrink-0">check_circle</span><span><strong className="text-[#1B3C53] dark:text-white">Full legal names only</strong> — use your complete given and family name as it appears on official documents; avoid initials or shortened forms.</span></li>
              <li className="flex gap-1.5"><span className="material-symbols-outlined text-[12px] text-[#1B3C53] mt-px shrink-0">check_circle</span><span><strong className="text-[#1B3C53] dark:text-white">Consistent spelling</strong> — ensure your name matches exactly across all your previous publications and your profile to maintain a unified author identity.</span></li>
              <li className="flex gap-1.5"><span className="material-symbols-outlined text-[12px] text-[#1B3C53] mt-px shrink-0">check_circle</span><span><strong className="text-[#1B3C53] dark:text-white">Affiliation accuracy</strong> — list the institution where the research was primarily conducted, not your current institution if you have since moved.</span></li>
              <li className="flex gap-1.5"><span className="material-symbols-outlined text-[12px] text-[#1B3C53] mt-px shrink-0">check_circle</span><span><strong className="text-[#1B3C53] dark:text-white">One corresponding author</strong> — designate a single author responsible for all correspondence during review and post-acceptance communications.</span></li>
              <li className="flex gap-1.5"><span className="material-symbols-outlined text-[12px] text-amber-500 mt-px shrink-0">warning</span><span><strong className="text-amber-700 dark:text-amber-400">Double-blind review</strong> — do not include any author names, affiliations, or identifying information inside the submitted PDF manuscript.</span></li>
            </ul>
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button type="button" onClick={() => setShowGuidelines(false)} className="h-7 px-3 rounded text-[10px] font-medium bg-[#1B3C53] text-white hover:bg-[#234C6A] transition-colors">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
