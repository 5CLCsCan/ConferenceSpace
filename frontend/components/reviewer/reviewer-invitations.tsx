"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ReviewRequest } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { respondToReviewRequest } from "@/lib/api/reviewer"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ReviewerInvitationsProps {
  invitations: ReviewRequest[]
  onInvitationHandled: () => void
  reviewerId: string
}

export function ReviewerInvitations({
  invitations,
  onInvitationHandled,
  reviewerId,
}: ReviewerInvitationsProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [handling, setHandling] = useState<string | null>(null)

  const handleResponse = async (requestId: string, response: "accepted" | "declined") => {
    setHandling(requestId)
    const apiResponse = await respondToReviewRequest(reviewerId, requestId, response)
    if (apiResponse.data) {
      toast({
        title: t("dashboard.roles.reviewer.invitations.toast.successTitle"),
        description: t("dashboard.roles.reviewer.invitations.toast.successDescription", {
          action:
            response === "accepted" ? t("common.actions.accept") : t("common.actions.decline"),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.roles.reviewer.invitations.title")}</CardTitle>
        <CardDescription>{t("dashboard.roles.reviewer.invitations.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {invitations.length === 0 ? (
          <p className="text-muted-foreground">{t("dashboard.roles.reviewer.invitations.empty")}</p>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{invitation.conference_name}</h3>
                    <p className="text-muted-foreground">
                      {t("dashboard.roles.reviewer.invitations.invitedBy")}:{" "}
                      {invitation.requested_by_name}
                    </p>
                    <p className="text-sm">
                      {t("dashboard.roles.reviewer.invitations.papersToReview")}:{" "}
                      {invitation.papers_count}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.roles.reviewer.invitations.responseDeadline")}:{" "}
                      {new Date(invitation.requested_at).toLocaleDateString()} {/* Placeholder */}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResponse(invitation.id, "declined")}
                      disabled={handling === invitation.id}
                    >
                      {t("common.actions.decline")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResponse(invitation.id, "accepted")}
                      disabled={handling === invitation.id}
                    >
                      {t("common.actions.accept")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}
