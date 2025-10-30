"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReviewerConference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ReviewerConferencesProps {
  conferences: ReviewerConference[]
  onSelectConference: (conferenceId: number) => void
}

export function ReviewerConferences({ conferences, onSelectConference }: ReviewerConferencesProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.roles.reviewer.conferences.title")}</CardTitle>
        <CardDescription>{t("dashboard.roles.reviewer.conferences.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.conferences.table.name")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("review.conferences.columns.domain")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.conferences.table.progress")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("review.conferences.columns.timeline")}
                </th>
              </tr>
            </thead>
            <tbody>
              {conferences.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("review.conferences.noConferences")}
                  </td>
                </tr>
              ) : (
                conferences.map((conference) => (
                  <tr
                    key={conference.id}
                    className="border-b cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectConference(Number(conference.id))}
                  >
                    <td className="p-4">
                      <div className="font-medium">{conference.name}</div>
                      {conference.acronym && (
                        <div className="text-sm text-muted-foreground">{conference.acronym}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{conference.domain || "-"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {conference.reviewed_papers || 0}/{conference.total_papers || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("common.actions.complete")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {conference.conference_date ? (
                          <>
                            <div>{new Date(conference.conference_date).toLocaleDateString()}</div>
                            {conference.submission_deadline && (
                              <div className="text-xs text-muted-foreground">
                                {t("review.conferences.submission")}: {new Date(conference.submission_deadline).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
