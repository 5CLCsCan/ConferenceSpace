"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
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

  const handleResponse = async (
    conferenceId: string,
    reviewerId: string,
    status: "accepted" | "declined",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.roles.reviewer.invitations.title")}</CardTitle>
        <CardDescription>{t("dashboard.roles.reviewer.invitations.description")}</CardDescription>
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
                      onClick={() =>
                        handleResponse(invitation.conference_id, invitation.id, "declined")
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
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}
