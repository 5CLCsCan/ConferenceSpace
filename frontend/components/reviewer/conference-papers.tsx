"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Inbox } from "lucide-react"
import type { AssignedPaper } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferencePapersProps {
  papers: AssignedPaper[]
  conferenceName: string
  onBack: () => void
  onSelectPaper: (paperId: string) => void
}

export function ConferencePapers({
  papers,
  conferenceName,
  onBack,
  onSelectPaper,
}: ConferencePapersProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <CardTitle>{conferenceName}</CardTitle>
            <CardDescription>
              {t("dashboard.roles.reviewer.papers.description", {
                count: papers.length,
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.papers.table.title")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.papers.table.status")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.papers.table.deadline")}
                </th>
              </tr>
            </thead>
            <tbody>
              {papers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <div className="rounded-full bg-muted p-6">
                        <Inbox className="size-12 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          {t("dashboard.roles.reviewer.papers.empty.title")}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {t("dashboard.roles.reviewer.papers.empty.description")}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                papers.map((paper) => (
                  <tr
                    key={paper.id}
                    className="border-b cursor-pointer hover:bg-muted"
                    onClick={() => onSelectPaper(paper.id)}
                  >
                    <td className="p-4 font-medium">{paper.title}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          paper.assignment_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {t(`dashboard.roles.reviewer.papers.statusValues.${paper.assignment_status}`)}
                      </span>
                    </td>
                    <td className="p-4">
                      {paper.due_date ? new Date(paper.due_date).toLocaleDateString() : "-"}
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
