"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit2 } from "lucide-react"
import { format } from "date-fns"
import type { ConferenceFormData } from "@/app/dashboard/chair/create-conference/page"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
  goToStep: (step: number) => void
}

export function ReviewStep({ data, updateData, goToStep }: Props) {
  const { t } = useTranslation()

  return (
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h2} ${typography.semibold} text-foreground mb-1`}>
          {t("dashboard.chair.createConference.steps.5.title")}
        </h2>
        <p className={`${typography.body} text-muted-foreground`}>
          {t("dashboard.chair.createConference.steps.5.description")}
        </p>
      </div>

      <div className={spacing.subsection}>
        {/* Conference Details */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              {t("dashboard.chair.createConference.steps.1.description")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(1)}
              className={spacing.gap.sm}
            >
              <Edit2 className={iconSizes.xs} />
              {t("common.actions.edit")}
            </Button>
          </div>
          <div className={`bg-muted/50 rounded-lg ${spacing.padding.card} ${spacing.item}`}>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.title")}:</span>
              <span className={typography.medium}>
                {data.title || t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.acronym")}:</span>
              <span className={typography.medium}>
                {data.acronym || t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.description")}:</span>
              <span className={typography.medium}>
                {data.description || t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.website")}:</span>
              <span className={typography.medium}>
                {data.website || t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.dates")}:</span>
              <span className={typography.medium}>
                {data.dateRange.from && data.dateRange.to
                  ? `${format(data.dateRange.from, "PPP")} - ${format(data.dateRange.to, "PPP")}`
                  : t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.location")}:</span>
              <span className={`${typography.medium} capitalize`}>
                {data.locationType}
                {(data.locationType === "in-person" || data.locationType === "hybrid") &&
                  data.venue &&
                  ` - ${data.venue}`}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.contact")}:</span>
              <span className={typography.medium}>
                {data.contactEmail || t("common.messages.notFound")}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Topics & Submissions */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              {t("dashboard.chair.createConference.steps.2.description")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(2)}
              className={spacing.gap.sm}
            >
              <Edit2 className={iconSizes.xs} />
              {t("common.actions.edit")}
            </Button>
          </div>
          <div className={`bg-muted/50 rounded-lg ${spacing.padding.card} ${spacing.item}`}>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.submissionsOpen")}:</span>
              <span className={typography.medium}>
                {data.submissionsOpen
                  ? format(data.submissionsOpen, "PPP")
                  : t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.submissionDeadline")}:</span>
              <span className={typography.medium}>
                {data.submissionDeadline
                  ? format(data.submissionDeadline, "PPP")
                  : t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.reviewDeadline")}:</span>
              <span className={typography.medium}>
                {data.reviewDeadline
                  ? format(data.reviewDeadline, "PPP")
                  : t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.authorNotification")}:</span>
              <span className={typography.medium}>
                {data.authorNotification
                  ? format(data.authorNotification, "PPP")
                  : t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.cameraReady")}:</span>
              <span className={typography.medium}>
                {data.cameraReadyDeadline
                  ? format(data.cameraReadyDeadline, "PPP")
                  : t("common.messages.notFound")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.topics")}:</span>
              <span className={typography.medium}>
                {data.topics.length > 0 ? data.topics.join(", ") : t("common.messages.noTopics")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.tracks")}:</span>
              <span className={typography.medium}>
                {data.tracks.length > 0 ? data.tracks.join(", ") : t("common.messages.noTracks")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.anonymity")}:</span>
              <span className={`${typography.medium} capitalize`}>
                {data.anonymity.replace("-", " ")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.fileFormats")}:</span>
              <span className={typography.medium}>{data.fileFormats.join(", ")}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Call For Paper Configuration */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              {t("dashboard.chair.createConference.steps.3.description")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(3)}
              className={spacing.gap.sm}
            >
              <Edit2 className={iconSizes.xs} />
              {t("common.actions.edit")}
            </Button>
          </div>
          <div className={`bg-muted/50 rounded-lg ${spacing.padding.card} ${spacing.item}`}>
            <div className={`grid grid-cols-[180px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>{t("common.labels.callForPaper")}:</span>
              <span className={typography.medium}>
                {data.callForPaperText
                  ? data.callForPaperText.length > 100
                    ? `${data.callForPaperText.substring(0, 100)}...`
                    : data.callForPaperText
                  : t("common.messages.noContent")}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Organizers */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              {t("dashboard.chair.createConference.steps.4.description")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(4)}
              className={spacing.gap.sm}
            >
              <Edit2 className={iconSizes.xs} />
              {t("common.actions.edit")}
            </Button>
          </div>
          <div className={`bg-muted/50 rounded-lg ${spacing.padding.card} ${spacing.item}`}>
            {data.organizers.map((organizer) => (
              <div
                key={organizer.id}
                className={`flex items-center justify-between ${typography.body}`}
              >
                <div>
                  <span className={typography.medium}>{organizer.name}</span>
                  <span className={`${typography.muted} ml-2`}>({organizer.email})</span>
                </div>
                <span className={typography.muted}>{organizer.role}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Confirmation */}
        <div
          className={`flex items-start ${spacing.gap.sm} ${spacing.padding.card} bg-primary/5 rounded-lg border border-primary/20`}
        >
          <Checkbox
            id="confirm"
            checked={data.confirmed}
            onCheckedChange={(checked) => updateData({ confirmed: checked as boolean })}
          />
          <div className={`grid ${spacing.tight} leading-none`}>
            <Label
              htmlFor="confirm"
              className={`${typography.body} ${typography.medium} leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer`}
            >
              {t("dashboard.chair.createConference.confirmLabel")}
            </Label>
            <p className={typography.caption}>
              {t("dashboard.chair.createConference.confirmDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
