"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Conference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ReviewerConferencesProps {
  conferences: Conference[]
  onSelectConference: (conferenceId: string) => void
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
                  {t("dashboard.roles.reviewer.conferences.table.role")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.conferences.table.progress")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.conferences.table.deadline")}
                </th>
              </tr>
            </thead>
            <tbody>
              {conferences.map((conference) => (
                <tr
                  key={conference.id}
                  className="border-b cursor-pointer hover:bg-muted"
                  onClick={() => onSelectConference(conference.id)}
                >
                  <td className="p-4">
                    <div className="font-medium">{conference.name}</div>
                    <div className="text-sm text-muted-foreground">{conference.acronym}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                      {t("dashboard.roles.reviewer.name")}
                    </span>
                  </td>
                  <td className="p-4">
                    {/* Placeholder for progress */}
                    <div className="text-sm">0/5 {t("common.actions.complete")}</div>
                  </td>
                  <td className="p-4">
                    {new Date(conference.review_deadline).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
