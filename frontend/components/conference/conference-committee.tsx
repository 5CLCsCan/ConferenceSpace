"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/translation-context"
import {
  UserPlus,
  Trash2,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Award,
  ExternalLink,
} from "lucide-react"
import {
  getConferenceReviewers,
  inviteReviewers,
  removeReviewer,
  getConferenceById,
  type Reviewer,
} from "@/lib/api/conferences"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api/client"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface ConferenceCommitteeProps {
  conferenceId: string
}

type InviteResult = {
  success: Reviewer[]
  failed: Array<{ user_id: number; error: string }>
}

const REVIEWERS_PAGE_SIZE = 2

function normalizeInviteResult(raw: unknown): InviteResult | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const candidate = raw as {
    success?: unknown
    failed?: unknown
    data?: unknown
  }

  const hasSuccessArray = Array.isArray(candidate.success)
  const hasFailedArray = Array.isArray(candidate.failed)

  if (hasSuccessArray || hasFailedArray) {
    return {
      success: hasSuccessArray ? (candidate.success as Reviewer[]) : [],
      failed: hasFailedArray ? (candidate.failed as Array<{ user_id: number; error: string }>) : [],
    }
  }

  if (candidate.data) {
    return normalizeInviteResult(candidate.data)
  }

  return null
}

export function ConferenceCommittee({ conferenceId }: ConferenceCommitteeProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentRole, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conference, setConference] = useState<any>(null)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [totalReviewers, setTotalReviewers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreReviewers, setHasMoreReviewers] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(
    searchParams.get("invite") === "true",
  )
  const [inviteEmail, setInviteEmail] = useState("")
  const [searchResults, setSearchResults] = useState<
    Array<{ id: number; email: string; name?: string }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ id: number; email: string; name?: string }>
  >([])
  const [isInviting, setIsInviting] = useState(false)
  const [reviewerToRemove, setReviewerToRemove] = useState<Reviewer | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [inviteErrors, setInviteErrors] = useState<string[]>([])
  const [inviteSuccessInfo, setInviteSuccessInfo] = useState<string | null>(null)
  const isChair = currentRole === "chair"

  // Get chair email - prioritize chair_email field, fallback to chair if it looks like email
  const chairEmail =
    conference?.chair_email || (conference?.chair?.includes("@") ? conference.chair : null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setIsLoadingMore(false)
    try {
      const confResponse = await getConferenceById(conferenceId)
      if (confResponse.data) {
        setConference(confResponse.data)
      }
      const reviewersResponse = await getConferenceReviewers(conferenceId, {
        limit: REVIEWERS_PAGE_SIZE,
        offset: 0,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      // Backend returns { data: { reviewers: [], total: 4 } }
      // apiFetch wraps it, so we get reviewersResponse.data = { data: { reviewers: [], total: 4 } }
      if (reviewersResponse.data) {
        const responseData = reviewersResponse.data as any
        // Check if data is wrapped in another "data" property
        const actualData = responseData.data || responseData
        const list = actualData.reviewers || []
        const total = actualData.total || 0
        setReviewers(list)
        setTotalReviewers(total)
        setHasMoreReviewers(list.length < total)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("dashboard.conference.committee.errors.loadFailed"),
        description: error instanceof Error ? error.message : "Unknown error",
      })
      setHasMoreReviewers(false)
    } finally {
      setIsLoading(false)
    }
  }, [conferenceId, statusFilter, t, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Restore invite dialog state from sessionStorage when dialog opens
  useEffect(() => {
    if (isInviteDialogOpen) {
      const storageKey = `invite-dialog-${conferenceId}`
      const savedState = sessionStorage.getItem(storageKey)
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          if (parsed.selectedUsers) setSelectedUsers(parsed.selectedUsers)
          if (parsed.searchResults) setSearchResults(parsed.searchResults)
          if (parsed.inviteEmail) setInviteEmail(parsed.inviteEmail)
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [isInviteDialogOpen, conferenceId])

  // Save invite dialog state to sessionStorage whenever it changes
  useEffect(() => {
    if (
      isInviteDialogOpen &&
      (selectedUsers.length > 0 || searchResults.length > 0 || inviteEmail)
    ) {
      const storageKey = `invite-dialog-${conferenceId}`
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedUsers,
          searchResults,
          inviteEmail,
        }),
      )
    }
  }, [isInviteDialogOpen, selectedUsers, searchResults, inviteEmail, conferenceId])

  const handleRemoveStatusFilter = () => {
    setStatusFilter("all")
  }

  const hasActiveFilters = statusFilter !== "all"

  const activeFilters: ActiveFilter[] = useMemo(() => {
    if (statusFilter === "all") return []
    return [
      {
        id: "status",
        label: t(`dashboard.conference.committee.filter.${statusFilter}`),
        onRemove: handleRemoveStatusFilter,
      },
    ]
  }, [statusFilter, t])

  const filterPopover = (
    <div className={spacing.subsection}>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>
          {t("dashboard.conference.committee.filter.placeholder")}
        </h4>
        <div className={spacing.item}>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "all"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "all" : statusFilter)}
            />
            <span className={typography.body}>
              {t("dashboard.conference.committee.filter.all")}
            </span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "pending"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "pending" : "all")}
            />
            <span className={typography.body}>
              {t("dashboard.conference.committee.filter.pending")}
            </span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "accepted"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "accepted" : "all")}
            />
            <span className={typography.body}>
              {t("dashboard.conference.committee.filter.accepted")}
            </span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "rejected"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "rejected" : "all")}
            />
            <span className={typography.body}>
              {t("dashboard.conference.committee.filter.rejected")}
            </span>
          </label>
        </div>
      </div>
      <div className={`flex justify-end ${spacing.gap.sm} pt-2 border-t`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter("all")
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )

  const filteredReviewers = reviewers.filter((reviewer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      reviewer.email?.toLowerCase().includes(query) ||
      reviewer.id?.toString().includes(query) ||
      reviewer.user_id?.toString().includes(query)
    )
  })

  const loadMoreReviewers = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMoreReviewers) {
      return
    }

    setIsLoadingMore(true)

    try {
      const nextOffset = reviewers.length
      const reviewersResponse = await getConferenceReviewers(conferenceId, {
        limit: REVIEWERS_PAGE_SIZE,
        offset: nextOffset,
        status: statusFilter === "all" ? undefined : statusFilter,
      })

      if (reviewersResponse.data) {
        const responseData = reviewersResponse.data as any
        const actualData = responseData.data || responseData
        const list = actualData.reviewers || []
        const total = actualData.total || 0

        let updatedLength = reviewers.length

        setReviewers((prev) => {
          const merged = [...prev, ...list]
          // Deduplicate by reviewer id to avoid duplicates when filters change quickly
          const unique = new Map<number, Reviewer>()
          for (const reviewer of merged) {
            if (!reviewer) continue
            const key = reviewer.id ?? reviewer.user_id
            if (key !== undefined) {
              unique.set(key, reviewer)
            }
          }
          const deduped = Array.from(unique.values())
          updatedLength = deduped.length
          return deduped
        })

        setTotalReviewers(total)
        setHasMoreReviewers(updatedLength < total)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [conferenceId, hasMoreReviewers, isLoading, isLoadingMore, reviewers.length, statusFilter])

  const sentinelRef = useInfiniteScroll(
    loadMoreReviewers,
    hasMoreReviewers && !searchQuery,
    isLoading || isLoadingMore,
  )

  // Search users by email
  const searchUsers = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Call API to search users by email using apiFetch
      const { data } = await apiFetch<{
        data: {
          users: Array<{ id: number; email: string; first_name?: string; last_name?: string }>
        }
      }>(`/api/v1/users/search?q=${encodeURIComponent(query)}`)

      // Transform the response to include name field
      const users = (data.data.users || []).map((user) => ({
        id: user.id,
        email: user.email,
        name:
          user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : undefined,
      }))
      setSearchResults(users)
    } catch (error) {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce email search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inviteEmail) {
        searchUsers(inviteEmail)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inviteEmail])

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: t("dashboard.conference.committee.errors.invalidUserId"),
        description: t("dashboard.conference.committee.errors.userIdRequired"),
      })
      return
    }

    setIsInviting(true)
    setInviteErrors([])
    setInviteSuccessInfo(null)
    const selectedSnapshot = [...selectedUsers]

    try {
      const response = await inviteReviewers(
        conferenceId,
        selectedUsers.map((u) => ({ user_id: u.id })),
      )
      if (!response.data) {
        toast({
          variant: "destructive",
          title: t("dashboard.conference.committee.errors.inviteFailed"),
          description: response.error || t("common.messages.error"),
          duration: 5000,
        })
        return
      }

      const inviteResult = normalizeInviteResult(response.data)

      if (!inviteResult) {
        toast({
          variant: "destructive",
          title: t("dashboard.conference.committee.errors.inviteFailed"),
          description: response.error || t("common.messages.error"),
          duration: 5000,
        })
        return
      }

      const successCount = inviteResult.success.length
      const failedCount = inviteResult.failed.length

      if (successCount > 0) {
        setInviteEmail("")
        setSelectedUsers([])
        setSearchResults([])
        setInviteErrors([])

        const successDescription =
          successCount === 1
            ? t("dashboard.conference.committee.toast.inviteSuccessDescription")
            : `${t("dashboard.conference.committee.toast.inviteSuccessDescription")} (${successCount})`

        setInviteSuccessInfo(successDescription)

        toast({
          title: `✅ ${t("dashboard.conference.committee.toast.inviteSuccess")}`,
          description: successDescription,
          className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
          duration: 4000,
        })

        await new Promise((resolve) => setTimeout(resolve, 300))
        await loadData()
      }

      if (failedCount > 0) {
        const failureMessages = inviteResult.failed.map((failure) => {
          const user = selectedSnapshot.find((item) => item.id === failure.user_id)
          const email = user?.email || t("dashboard.conference.committee.errors.unknownReviewer")
          const normalizedError = (failure.error || "").toLowerCase()
          const prefix =
            normalizedError.includes("already") || normalizedError.includes("duplicate")
              ? "WARN"
              : "ERROR"
          return `${prefix}: ${email} - ${failure.error}`
        })

        toast({
          variant: "destructive",
          title: `${t("dashboard.conference.committee.errors.inviteFailed")} (${failedCount})`,
          description: (
            <div className={`${spacing.tight} mt-2 max-h-32 overflow-y-auto`}>
              {failureMessages.map((message, index) => (
                <p key={index} className={typography.body}>
                  {message}
                </p>
              ))}
            </div>
          ),
          duration: 8000,
        })

        if (successCount === 0) {
          setInviteErrors(failureMessages)
        }
      }

      if (successCount === 0 && failedCount === 0) {
        const fallbackMessage =
          response.error || t("dashboard.conference.committee.errors.inviteUnknown")

        toast({
          variant: "destructive",
          title: t("dashboard.conference.committee.errors.inviteFailed"),
          description: fallbackMessage,
          duration: 5000,
        })

        setInviteErrors([fallbackMessage])
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("dashboard.conference.committee.errors.inviteUnknown")

      toast({
        variant: "destructive",
        title: t("dashboard.conference.committee.errors.inviteFailed"),
        description: errorMessage,
        duration: 5000,
      })

      setInviteErrors([errorMessage])
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (reviewer: Reviewer) => {
    if (!reviewer.id) return
    setIsRemoving(true)
    try {
      const response = await removeReviewer(conferenceId, reviewer.id.toString())
      if (response.data) {
        toast({
          title: t("dashboard.conference.committee.toast.removeSuccess"),
          description: t("dashboard.conference.committee.toast.removeSuccessDescription"),
        })
        setReviewerToRemove(null)
        loadData()
      } else {
        toast({
          variant: "destructive",
          title: t("dashboard.conference.committee.errors.removeFailed"),
          description: response.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("dashboard.conference.committee.errors.removeFailed"),
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className={`mr-1 ${iconSizes.xs}`} />
            {t("dashboard.conference.committee.status.accepted")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className={`mr-1 ${iconSizes.xs}`} />
            {t("dashboard.conference.committee.status.rejected")}
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge variant="outline">
            <Mail className={`mr-1 ${iconSizes.xs}`} />
            {t("dashboard.conference.committee.status.pending")}
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12`}>
        <Loader2
          className={`${iconSizes.lg} animate-spin text-muted-foreground`}
          style={{ width: "2rem", height: "2rem" }}
        />
      </div>
    )
  }

  return (
    <div className={spacing.subsection}>
      {conference && (
        <Card className="py-6">
          <CardHeader>
            <CardTitle className={`flex items-center ${spacing.gap.sm}`}>
              <Award className={iconSizes.md} />
              {t("dashboard.conference.committee.chairInfo.title")}
            </CardTitle>
            <CardDescription className={typography.body}>
              {t("dashboard.conference.committee.chairInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-wrap items-start justify-between ${spacing.gap.md}`}>
              <div className={spacing.item}>
                <p className={typography.body}>
                  <span className={typography.medium}>
                    {t("dashboard.conference.committee.chairInfo.chair")}:
                  </span>{" "}
                  {conference.chair || "N/A"}
                </p>
                {conference.chair_email && (
                  <p className={`${typography.body} text-muted-foreground`}>
                    {conference.chair_email}
                  </p>
                )}
              </div>
              {chairEmail && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Remove invite param and push to history (outside dialog)
                    const url = new URL(window.location.href)
                    url.searchParams.delete("invite")
                    window.history.pushState({}, "", url)
                    router.push(`/dashboard/users/${chairEmail}`)
                  }}
                >
                  <ExternalLink className="mr-1 size-3.5" />
                  {t("dashboard.conference.committee.chairInfo.viewProfile")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {isChair && (
        <Card className="py-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`flex items-center ${spacing.gap.sm}`}>
                  <Users className={iconSizes.md} />
                  {t("dashboard.conference.committee.reviewers.title")}
                </CardTitle>
                <CardDescription className={typography.body}>
                  {t("dashboard.conference.committee.reviewers.description")} {totalReviewers}{" "}
                  {t("dashboard.conference.committee.reviewers.count")}
                </CardDescription>
              </div>
              <Dialog
                open={isInviteDialogOpen}
                onOpenChange={(open) => {
                  setIsInviteDialogOpen(open)
                  // Update URL to persist dialog state
                  const url = new URL(window.location.href)
                  if (open) {
                    url.searchParams.set("invite", "true")
                    setInviteSuccessInfo(null)
                  } else {
                    url.searchParams.delete("invite")
                    setInviteEmail("")
                    setSelectedUsers([])
                    setSearchResults([])
                    setInviteErrors([])
                    setInviteSuccessInfo(null)
                    // Clear saved state when dialog closes
                    const storageKey = `invite-dialog-${conferenceId}`
                    sessionStorage.removeItem(storageKey)
                  }
                  window.history.replaceState({}, "", url)
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className={`mr-2 ${iconSizes.sm}`} />
                    {t("dashboard.conference.committee.actions.invite")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* Loading overlay */}
                  {isInviting && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                      <div
                        className={`bg-card ${spacing.padding.cardLarge} rounded-lg shadow-lg border flex flex-col items-center ${spacing.gap.md} max-w-sm`}
                      >
                        <Loader2
                          className="animate-spin text-primary"
                          style={{ width: "3rem", height: "3rem" }}
                        />
                        <div className="text-center">
                          <p className={`${typography.semibold} ${typography.h4}`}>
                            Sending invitations...
                          </p>
                          <p className={`${typography.body} text-muted-foreground mt-1`}>
                            Inviting {selectedUsers.length}{" "}
                            {selectedUsers.length > 1 ? "reviewers" : "reviewer"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {inviteSuccessInfo && (
                    <div
                      className={`mb-4 flex items-start ${spacing.gap.md} rounded-lg border border-green-200 bg-green-50 ${spacing.padding.card} dark:border-green-900/60 dark:bg-green-950/40`}
                    >
                      <CheckCircle2
                        className={`mt-0.5 ${iconSizes.md} text-green-600 dark:text-green-300`}
                      />
                      <div>
                        <p className={`${typography.semibold} text-green-700 dark:text-green-200`}>
                          {t("dashboard.conference.committee.dialog.inviteSuccessBannerTitle")}
                        </p>
                        <p className={`${typography.body} text-green-700 dark:text-green-200/80`}>
                          {inviteSuccessInfo}
                        </p>
                      </div>
                    </div>
                  )}

                  <DialogHeader>
                    <DialogTitle className={typography.h4}>
                      {t("dashboard.conference.committee.dialog.inviteTitle")}
                    </DialogTitle>
                    <DialogDescription className={typography.body}>
                      {t("dashboard.conference.committee.dialog.inviteDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className={`${spacing.subsection} py-4`}>
                    <div className={spacing.item}>
                      <label
                        htmlFor="userEmail"
                        className={`${typography.body} ${typography.medium}`}
                      >
                        {t("dashboard.conference.committee.dialog.userEmail")} *
                      </label>
                      <div className="relative">
                        <Input
                          id="userEmail"
                          type="email"
                          placeholder="reviewer@example.com"
                          value={inviteEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setInviteEmail(e.target.value)
                          }}
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2
                              className={`${iconSizes.sm} animate-spin text-muted-foreground`}
                            />
                          </div>
                        )}
                      </div>
                      <p className={`${typography.bodySmall} text-muted-foreground`}>
                        {t("dashboard.conference.committee.dialog.userEmailHint")}
                      </p>

                      {/* Search results dropdown */}
                      {searchResults.length > 0 && (
                        <div
                          className={`border rounded-md mt-2 max-h-48 overflow-y-auto bg-background shadow-lg`}
                        >
                          {searchResults.map((searchUser) => {
                            const isSelected = selectedUsers.some((u) => u.id === searchUser.id)
                            return (
                              <div
                                key={searchUser.id}
                                className={`w-full px-4 py-2 flex items-center justify-between gap-2 ${
                                  isSelected ? "bg-green-50 dark:bg-green-950" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedUsers(
                                        selectedUsers.filter((u) => u.id !== searchUser.id),
                                      )
                                    } else {
                                      setSelectedUsers([...selectedUsers, searchUser])
                                    }
                                  }}
                                  className="flex-1 text-left hover:opacity-80"
                                >
                                  <div>
                                    <p className={`${typography.body} ${typography.medium}`}>
                                      {searchUser.email}
                                    </p>
                                    {searchUser.name && (
                                      <p
                                        className={`${typography.bodySmall} text-muted-foreground`}
                                      >
                                        {searchUser.name}
                                      </p>
                                    )}
                                  </div>
                                </button>
                                <div className={`flex items-center ${spacing.gap.sm}`}>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // Push current URL to history before navigating
                                      window.history.pushState({}, "", window.location.href)
                                      router.push(`/dashboard/users/${searchUser.email}`)
                                    }}
                                  >
                                    <ExternalLink className={iconSizes.xs} />
                                  </Button>
                                  {isSelected && (
                                    <CheckCircle2
                                      className={`${iconSizes.sm} text-green-600 dark:text-green-400`}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Selected users display */}
                      {selectedUsers.length > 0 && (
                        <div className={spacing.item}>
                          <p
                            className={`${typography.bodySmall} ${typography.medium} text-muted-foreground`}
                          >
                            {selectedUsers.length}{" "}
                            {selectedUsers.length === 1 ? "reviewer" : "reviewers"} selected
                          </p>
                          <div className={`flex flex-wrap ${spacing.gap.sm}`}>
                            {selectedUsers.map((user) => (
                              <Badge key={user.id} variant="secondary" className={spacing.gap.sm}>
                                {user.email}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))
                                  }
                                  className="ml-1 hover:text-destructive"
                                >
                                  <XCircle className={iconSizes.xs} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Invite errors */}
                      {inviteErrors.length > 0 && (
                        <div
                          className={`rounded-md border border-destructive/30 bg-destructive/10 p-3`}
                        >
                          <p className={`${typography.body} ${typography.medium} text-destructive`}>
                            {t("dashboard.conference.committee.errors.inviteIssues")}
                          </p>
                          <div className={`mt-2 ${spacing.tight} max-h-32 overflow-y-auto`}>
                            {inviteErrors.map((message, index) => (
                              <p key={index} className={`${typography.body} text-destructive`}>
                                {message}
                              </p>
                            ))}
                          </div>
                          <p className={`mt-2 ${typography.bodySmall} text-destructive/80`}>
                            {t("dashboard.conference.committee.errors.inviteFix")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsInviteDialogOpen(false)
                        setInviteEmail("")
                        setSelectedUsers([])
                        setSearchResults([])
                      }}
                      disabled={isInviting}
                    >
                      {t("common.actions.cancel")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleInvite}
                      disabled={isInviting || selectedUsers.length === 0}
                    >
                      {isInviting && <Loader2 className={`mr-2 ${iconSizes.sm} animate-spin`} />}
                      {t("dashboard.conference.committee.actions.sendInvite")}{" "}
                      {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className={spacing.subsection}>
            <div className="mb-4">
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t("dashboard.conference.committee.search.placeholder")}
                activeFilters={activeFilters}
                filterPopover={filterPopover}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
            {filteredReviewers.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center text-center ${spacing.subsection} py-12`}
              >
                <div className={`rounded-full bg-muted ${spacing.padding.cardLarge}`}>
                  <Users
                    className="text-muted-foreground"
                    style={{ width: "3rem", height: "3rem" }}
                  />
                </div>
                <div className={spacing.item}>
                  <h3 className={`${typography.h4} ${typography.semibold}`}>
                    {t("dashboard.conference.committee.empty.title")}
                  </h3>
                  <p className={`${typography.body} text-muted-foreground max-w-md`}>
                    {t("dashboard.conference.committee.empty.description")}
                  </p>
                </div>
              </div>
            ) : (
              <div className={spacing.item}>
                {filteredReviewers.map((reviewer) => (
                  <Card key={reviewer.id ?? reviewer.user_id}>
                    <CardContent className={`flex items-center justify-between py-4`}>
                      <div className={`flex items-center ${spacing.gap.md}`}>
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                          <Users className={`${iconSizes.md} text-muted-foreground`} />
                        </div>
                        <div>
                          <p className={typography.medium}>
                            {reviewer.email ||
                              t("dashboard.conference.committee.reviewers.unknown")}
                          </p>
                          {reviewer.domain && reviewer.domain.length > 0 && (
                            <div className={`mt-1 flex ${spacing.gap.sm}`}>
                              {reviewer.domain.slice(0, 3).map((d, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className={typography.bodySmall}
                                >
                                  {d}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center ${spacing.gap.sm}`}>
                        {getStatusBadge(reviewer.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Remove invite param and push to history (outside dialog)
                            const url = new URL(window.location.href)
                            url.searchParams.delete("invite")
                            window.history.pushState({}, "", url)
                            router.push(`/dashboard/users/${reviewer.email}`)
                          }}
                        >
                          <ExternalLink className={`mr-1 ${iconSizes.xs}`} />
                          {t("dashboard.conference.committee.actions.viewProfile")}
                        </Button>
                        <Dialog
                          open={reviewerToRemove?.id === reviewer.id}
                          onOpenChange={(open) => {
                            if (!open) setReviewerToRemove(null)
                            else setReviewerToRemove(reviewer)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className={`${iconSizes.sm} text-destructive`} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className={typography.h4}>
                                {t("dashboard.conference.committee.dialog.removeTitle")}
                              </DialogTitle>
                              <DialogDescription className={typography.body}>
                                {t("dashboard.conference.committee.dialog.removeDescription")}
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReviewerToRemove(null)}
                                disabled={isRemoving}
                              >
                                {t("common.actions.cancel")}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleRemove(reviewer)}
                                disabled={isRemoving}
                              >
                                {isRemoving && (
                                  <Loader2 className={`mr-2 ${iconSizes.sm} animate-spin`} />
                                )}
                                {t("common.actions.remove")}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {hasMoreReviewers && !searchQuery && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreReviewers}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore && <Loader2 className={`mr-2 ${iconSizes.sm} animate-spin`} />}
                      {t("dashboard.conference.committee.actions.loadMore")}
                    </Button>
                  </div>
                )}
                <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
