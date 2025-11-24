"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Plus, Loader2, Check, Users, Info, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface Author {
  name: string
  email: string
  affiliation: string
}

interface UserSearchResult {
  id: number
  email: string
  first_name: string
  last_name: string
}

interface AuthorsTabProps {
  authors: Author[]
  setAuthors: (value: Author[]) => void
  isCorresponding: boolean
  setIsCorresponding: (value: boolean) => void
}

export function AuthorsTab({
  authors,
  setAuthors,
  isCorresponding,
  setIsCorresponding,
}: AuthorsTabProps) {
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({})
  const [searchResults, setSearchResults] = useState<Record<number, UserSearchResult[]>>({})
  const [isSearching, setIsSearching] = useState<Record<number, boolean>>({})
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({})
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const handleAddAuthor = () => {
    setAuthors([...authors, { name: "", email: "", affiliation: "" }])
  }

  const handleRemoveAuthor = (index: number) => {
    if (authors.length > 1) {
      setAuthors(authors.filter((_, i) => i !== index))
    }
  }

  const handleUpdateEmail = (index: number, email: string) => {
    const updated = [...authors]
    updated[index].email = email
    setAuthors(updated)
    setSearchQueries({ ...searchQueries, [index]: email })
  }

  const searchUsers = async (index: number, query: string) => {
    if (!query || query.length < 2) {
      setSearchResults({ ...searchResults, [index]: [] })
      setOpenPopovers({ ...openPopovers, [index]: false })
      return
    }

    setIsSearching({ ...isSearching, [index]: true })
    setOpenPopovers({ ...openPopovers, [index]: true })

    try {
      const { data } = await apiFetch<{
        data: {
          users: Array<{
            id: number
            email: string
            first_name: string
            last_name: string
          }>
          total: number
        }
      }>(`/api/v1/users/search?q=${encodeURIComponent(query)}&limit=10`)

      const users = (data.data?.users || []).map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      }))
      setSearchResults({ ...searchResults, [index]: users })
    } catch (error) {
      setSearchResults({ ...searchResults, [index]: [] })
    } finally {
      setIsSearching({ ...isSearching, [index]: false })
    }
  }

  // Debounce search
  useEffect(() => {
    const timers: Record<number, NodeJS.Timeout> = {}

    Object.entries(searchQueries).forEach(([indexStr, query]) => {
      const index = parseInt(indexStr)
      if (timers[index]) {
        clearTimeout(timers[index])
      }
      timers[index] = setTimeout(() => {
        searchUsers(index, query)
      }, 300)
    })

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer))
    }
  }, [searchQueries])

  const handleSelectUser = (index: number, user: UserSearchResult) => {
    const updated = [...authors]
    updated[index] = {
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      affiliation: "", // Backend doesn't store affiliation
    }
    setAuthors(updated)
    setOpenPopovers({ ...openPopovers, [index]: false })
    setSearchQueries({ ...searchQueries, [index]: user.email })
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className={spacing.item}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Users className="size-6 text-purple-600" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-[#212529] font-arial`}>Authors & Affiliations</h2>
            <p className={`${typography.body} text-[#6C757D] font-arial ${spacing.margin.top.sm}`}>
              List all co-authors in the order they should appear
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-gray-700`}>
              <p className={`${typography.medium} text-purple-900 mb-2`}>Author Guidelines:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Enter email addresses to search for registered users</li>
                <li>Authors will be listed in the order shown below</li>
                <li>The first author is typically the primary contributor</li>
                <li>Mark yourself as corresponding author if applicable</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Authors List */}
      <div className={spacing.subsection}>
        {authors.map((author, index) => (
          <Card key={index} className="border-[#DEE2E6]">
            <div className={spacing.padding.card}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E9ECEF] text-[#495057] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <Label className={`${typography.label} text-[#212529] font-arial`}>
                      {index === 0 ? "Primary Author" : `Co-Author ${index}`}
                    </Label>
                  </div>

                  <div className="relative">
                    <Label
                      className={`${typography.bodySmall} text-[#6C757D] font-arial mb-1.5 block`}
                    >
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Input
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="email"
                        placeholder="author@university.edu"
                        value={author.email}
                        onChange={(e) => handleUpdateEmail(index, e.target.value)}
                        onFocus={() => {
                          if (author.email && author.email.length >= 2) {
                            searchUsers(index, author.email)
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setOpenPopovers({ ...openPopovers, [index]: false })
                          }, 200)
                        }}
                        className={`${typography.body} font-arial border-[#DEE2E6] focus:border-[#0056A3] focus:ring-[#0056A3]`}
                      />
                      {(searchResults[index]?.length > 0 || isSearching[index]) &&
                        openPopovers[index] && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                            {isSearching[index] ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="size-4 animate-spin text-[#6C757D]" />
                              </div>
                            ) : searchResults[index]?.length > 0 ? (
                              <div className="p-1">
                                {searchResults[index].map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      handleSelectUser(index, user)
                                    }}
                                    className={cn(
                                      `w-full flex items-center ${spacing.gap.sm} px-3 py-2 ${typography.body} font-arial rounded-sm hover:bg-[#F8F9FA] cursor-pointer transition-colors`,
                                      author.email === user.email && "bg-[#E9ECEF]",
                                    )}
                                  >
                                    <div className="flex-1 text-left">
                                      <div className={`${typography.medium} text-[#212529]`}>
                                        {user.email}
                                      </div>
                                      {(user.first_name || user.last_name) && (
                                        <div className={`${typography.bodySmall} text-[#6C757D]`}>
                                          {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                                        </div>
                                      )}
                                    </div>
                                    {author.email === user.email && (
                                      <Check className={`${iconSizes.sm} text-[#0056A3]`} />
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                    </div>
                  </div>

                  {author.name && (
                    <div className={`${typography.body} text-[#495057] font-arial pl-1`}>
                      <span className={typography.medium}>Name:</span> {author.name}
                    </div>
                  )}
                </div>

                {authors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAuthor(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Author Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddAuthor}
        className={`w-full border-[#0056A3] text-[#0056A3] hover:bg-[#0056A3]/10 ${typography.body} ${typography.medium} font-arial`}
      >
        <Plus className={`${iconSizes.sm} mr-2`} />
        Add Co-Author
      </Button>

      {/* Corresponding Author Checkbox */}
      <Card className="border-[#DEE2E6] bg-[#F8F9FA]">
        <div className={spacing.padding.card}>
          <div className={`flex items-center ${spacing.gap.sm}`}>
            <Checkbox
              id="corresponding"
              checked={isCorresponding}
              onCheckedChange={(checked) => setIsCorresponding(checked === true)}
              className="border-[#0056A3]"
            />
            <label
              htmlFor="corresponding"
              className={`${typography.body} ${typography.medium} text-[#212529] font-arial leading-none cursor-pointer`}
            >
              I am the corresponding author for this submission
            </label>
          </div>
          <p className={`${typography.bodySmall} text-[#6C757D] font-arial ml-6 mt-1`}>
            The corresponding author will receive all communication regarding this submission
          </p>
        </div>
      </Card>
    </div>
  )
}
