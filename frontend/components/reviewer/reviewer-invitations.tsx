"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { ReviewRequest } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { respondToReviewRequest } from "@/lib/api/reviewer"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface ReviewerInvitationsProps {
  invitations: ReviewRequest[]
  onInvitationHandled: () => void
  reviewerId: string
  onStatusFilterChange?: (status: string) => void
  currentStatusFilter?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function ReviewerInvitations({
  invitations,
  onInvitationHandled,
  reviewerId,
  onStatusFilterChange,
  currentStatusFilter = "",
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ReviewerInvitationsProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [handling, setHandling] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onLoadMore()
      }
    }, options)

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observerRef.current.observe(currentRef)
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoadingMore])

  const handleResponse = async (
    conferenceId: string,
    reviewerId: string,
    status: "accepted" | "rejected",
  ) => {
    setHandling(reviewerId)
    const apiResponse = await respondToReviewRequest(conferenceId, reviewerId, status)
    if (apiResponse.data) {
      toast({
        title: t("dashboard.roles.reviewer.invitations.toast.successTitle"),
        description: t("dashboard.roles.reviewer.invitations.toast.successDescription", {
          action: status === "accepted" ? t("common.actions.accept") : t("common.actions.decline"),
        }),
      })
      onInvitationHandled()
    } else {
      toast({
        variant: "destructive",
        title: t("dashboard.roles.reviewer.invitations.toast.errorTitle"),
        description:
          apiResponse.error || t("dashboard.roles.reviewer.invitations.toast.errorDescription"),
      })
    }
    setHandling(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 size-3" />
            {t("dashboard.roles.reviewer.invitations.status.accepted")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 size-3" />
            {t("dashboard.roles.reviewer.invitations.status.rejected")}
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge variant="outline">
            <Mail className="mr-1 size-3" />
            {t("dashboard.roles.reviewer.invitations.status.pending")}
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.roles.reviewer.invitations.title")}</CardTitle>
            <CardDescription>{t("dashboard.roles.reviewer.invitations.description")}</CardDescription>
          </div>
          {onStatusFilterChange && (
            <Select
              value={currentStatusFilter}
              onValueChange={onStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("dashboard.roles.reviewer.invitations.filter.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.roles.reviewer.invitations.filter.all")}</SelectItem>
                <SelectItem value="pending">{t("dashboard.roles.reviewer.invitations.filter.pending")}</SelectItem>
                <SelectItem value="accepted">{t("dashboard.roles.reviewer.invitations.filter.accepted")}</SelectItem>
                <SelectItem value="rejected">{t("dashboard.roles.reviewer.invitations.filter.rejected")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
            <div className="rounded-full bg-muted p-6">
              <Mail className="size-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {t("dashboard.roles.reviewer.invitations.empty.title")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t("dashboard.roles.reviewer.invitations.empty.description")}
              </p>
            </div>
          </div>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{invitation.conference_name}</h3>
                      {getStatusBadge(invitation.status)}
                    </div>
                    <p className="text-muted-foreground">
                      {t("dashboard.roles.reviewer.invitations.invitedBy")}:{" "}
                      {invitation.requested_by_name}
                    </p>
                    <p className="text-sm">
                      {t("dashboard.roles.reviewer.invitations.papersToReview")}:{" "}
                      {invitation.papers_count}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.roles.reviewer.invitations.requestedAt")}:{" "}
                      {new Date(invitation.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  {invitation.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleResponse(invitation.conference_id, invitation.id, "rejected")
                        }
                        disabled={handling === invitation.id}
                      >
                        {t("common.actions.decline")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleResponse(invitation.conference_id, invitation.id, "accepted")
                        }
                        disabled={handling === invitation.id}
                      >
                        {t("common.actions.accept")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {/* Infinite scroll sentinel and loading indicator */}
        {hasMore && (
          <div ref={loadMoreRef} className="p-4 text-center">
            {isLoadingMore && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {t("common.loading")}...
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
