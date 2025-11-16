"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Check } from "lucide-react"
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

      const users = (data.data?.users || []).map(user => ({
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
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h3} ${typography.bold} text-gray-900 mb-1`}>
          Authors & Affiliations
        </h2>
        <p className={`${typography.body} text-gray-600`}>
          Add all co-authors in the correct order
        </p>
      </div>
      <div className={spacing.subsection}>
        {authors.map((author, index) => (
          <div key={index} className={spacing.item}>
            <div className="relative">
              <Label className={`${typography.bodySmall} text-gray-600`}>
                Author {index + 1} - Email *
              </Label>
              <div className="relative">
                <Input
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="email"
                  placeholder="Enter email address"
                  value={author.email}
                  onChange={(e) => handleUpdateEmail(index, e.target.value)}
                  onFocus={() => {
                    if (author.email && author.email.length >= 2) {
                      searchUsers(index, author.email)
                    }
                  }}
                  onBlur={() => {
                    // Close popover after a short delay to allow click events
                    setTimeout(() => {
                      setOpenPopovers({ ...openPopovers, [index]: false })
                    }, 200)
                  }}
                  className="w-full"
                />
                {(searchResults[index]?.length > 0 || isSearching[index]) &&
                  openPopovers[index] && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                      {isSearching[index] ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : searchResults[index]?.length > 0 ? (
                        <div className="p-1">
                          {searchResults[index].map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault() // Prevent input blur
                                handleSelectUser(index, user)
                              }}
                              className={cn(
                                `w-full flex items-center ${spacing.gap.sm} px-2 py-1.5 ${typography.body} rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer`,
                                author.email === user.email && "bg-accent"
                              )}
                            >
                              <div className="flex-1 text-left">
                                <div className={typography.medium}>{user.email}</div>
                                {(user.first_name || user.last_name) && (
                                  <div className={typography.bodySmall}>
                                    {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                                  </div>
                                )}
                              </div>
                              {author.email === user.email && (
                                <Check className={`${iconSizes.sm} text-primary`} />
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
              <div className={`${typography.body} text-muted-foreground pl-1`}>
                <span className={typography.medium}>Name:</span> {author.name}
              </div>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleAddAuthor}
        className="w-full bg-transparent"
      >
        <Plus className={`${iconSizes.sm} mr-2`} />
        Add Co-Author
      </Button>
      <div className={`flex items-center ${spacing.gap.sm} pt-4 border-t`}>
        <Checkbox
          id="corresponding"
          checked={isCorresponding}
          onCheckedChange={(checked) => setIsCorresponding(checked === true)}
        />
        <label
          htmlFor="corresponding"
          className={`${typography.body} ${typography.medium} leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`}
        >
          I am the corresponding author
        </label>
      </div>
    </div>
  )
}
