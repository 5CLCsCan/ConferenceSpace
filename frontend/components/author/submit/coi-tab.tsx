"use client"
import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, X, AlertCircle, UserX, Info, Lightbulb } from "lucide-react"
import { typography, spacing } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

interface COITabProps {
  coiPeople: string[]
  setCoiPeople: (value: string[]) => void
  coiPersonInput: string
  setCoiPersonInput: (value: string) => void
}

export function COITab({
  coiPeople,
  setCoiPeople,
  coiPersonInput,
  setCoiPersonInput,
}: COITabProps) {
  const { t, tList } = useTranslation()
  const declarationTips = tList("dashboard.author.submit.coiTab.declarations")
  const bestPractices = tList("dashboard.author.submit.coiTab.bestPractices")
  const handleAddCOIPerson = () => {
    if (coiPersonInput.trim() && !coiPeople.includes(coiPersonInput.trim())) {
      setCoiPeople([...coiPeople, coiPersonInput.trim()])
      setCoiPersonInput("")
    }
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className={spacing.item}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <UserX className="size-6 text-amber-600" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-foreground font-arial`}>
              {t("dashboard.author.submit.coiTab.title")}
            </h2>
            <p
              className={`${typography.body} text-muted-foreground font-arial ${spacing.margin.top.sm}`}
            >
              {t("dashboard.author.submit.coiTab.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-gray-700 font-arial`}>
              <p className={`${typography.medium} text-amber-900 mb-2`}>
                {t("dashboard.author.submit.coiTab.whatToDeclare")}
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                {declarationTips.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Input Section */}
      <div className={spacing.item}>
        <Label htmlFor="coi-people" className={`${typography.label} text-foreground font-arial`}>
          {t("dashboard.author.submit.coiTab.conflictedLabel")}
        </Label>
        <p className={`${typography.bodySmall} text-muted-foreground font-arial mb-2`}>
          {t("dashboard.author.submit.coiTab.conflictedDescription")}
        </p>
        <div className={`flex ${spacing.gap.sm}`}>
          <Input
            id="coi-people"
            placeholder={t("dashboard.author.submit.coiTab.conflictedPlaceholder")}
            value={coiPersonInput}
            onChange={(e) => setCoiPersonInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddCOIPerson()
              }
            }}
            className={`flex-1 ${typography.body} font-arial border-border focus:border-primary focus:ring-primary`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCOIPerson}
            size="icon"
            className="shrink-0 border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Display Added COIs */}
      {coiPeople.length > 0 && (
        <div className={spacing.item}>
          <div className="flex items-center justify-between mb-3">
            <Label className={`${typography.label} text-muted-foreground font-arial`}>
              {t("dashboard.author.submit.coiTab.declaredLabel", { count: coiPeople.length })}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCoiPeople([])}
              className={`${typography.bodySmall} text-destructive hover:text-destructive hover:bg-destructive/10 font-arial`}
            >
              {t("dashboard.author.submit.coiTab.clearAll")}
            </Button>
          </div>
          <div className={`flex flex-wrap ${spacing.gap.sm}`}>
            {coiPeople.map((person) => (
              <Badge
                key={person}
                variant="secondary"
                className={`${spacing.gap.sm} px-3 py-2 ${typography.bodySmall} font-arial bg-muted text-foreground hover:bg-accent transition-colors`}
              >
                <span>{person}</span>
                <button
                  onClick={() => setCoiPeople(coiPeople.filter((p) => p !== person))}
                  className="hover:text-red-600 transition-colors"
                  aria-label={`Remove ${person}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {coiPeople.length === 0 && (
        <Card className="border-dashed border-2 border-border">
          <div className="p-8 text-center">
            <UserX className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className={`${typography.body} text-muted-foreground font-arial`}>
              {t("dashboard.author.submit.coiTab.empty")}
            </p>
          </div>
        </Card>
      )}

      {/* Warning */}
      <Card className="bg-amber-50 border-amber-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.normal} text-gray-700 font-arial`}>
              <p className={`${typography.semibold} text-amber-900 mb-1`}>
                {t("dashboard.author.submit.coiTab.warningTitle")}
              </p>
              <p className={`${typography.bodySmall} text-gray-700 font-arial`}>
                {t("dashboard.author.submit.coiTab.warningDescription")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Best Practices */}
      <details className="border-t border-border pt-4">
        <summary
          className={`cursor-pointer ${typography.label} text-muted-foreground hover:text-foreground flex items-center ${spacing.gap.sm} font-arial`}
        >
          <Lightbulb className="size-4 text-amber-500" />
          <span>{t("dashboard.author.submit.coiTab.bestPracticesTitle")}</span>
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <div className={`${typography.bodySmall} text-gray-700 space-y-2 font-arial`}>
            <p className={`${typography.medium} text-gray-900`}>
              {t("dashboard.author.submit.coiTab.bestPracticesTitle")}
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              {bestPractices.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
