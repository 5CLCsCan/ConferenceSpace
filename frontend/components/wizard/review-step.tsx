"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit2 } from "lucide-react"
import { format } from "date-fns"
import type { ConferenceFormData } from "@/app/conferences/new/page"
import { typography, spacing, iconSizes } from "@/lib/typography"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
  goToStep: (step: number) => void
}

export function ReviewStep({ data, updateData, goToStep }: Props) {
  return (
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h2} ${typography.semibold} text-foreground mb-1`}>
          Step 4: Review and Confirm
        </h2>
        <p className={`${typography.body} text-muted-foreground`}>
          Please review all information before creating the conference
        </p>
      </div>

      <div className={spacing.subsection}>
        {/* Conference Details */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              Conference Details
            </h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(1)} className={spacing.gap.sm}>
              <Edit2 className={iconSizes.xs} />
              Edit
            </Button>
          </div>
          <div className={`bg-muted/50 rounded-lg ${spacing.padding.card} ${spacing.item}`}>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Title:</span>
              <span className={typography.medium}>{data.title || "Not set"}</span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Acronym:</span>
              <span className={typography.medium}>{data.acronym || "Not set"}</span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Description:</span>
              <span className={typography.medium}>{data.description || "Not set"}</span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Website:</span>
              <span className={typography.medium}>{data.website || "Not provided"}</span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Dates:</span>
              <span className={typography.medium}>
                {data.dateRange.from && data.dateRange.to
                  ? `${format(data.dateRange.from, "PPP")} - ${format(data.dateRange.to, "PPP")}`
                  : "Not set"}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Location:</span>
              <span className={`${typography.medium} capitalize`}>
                {data.locationType}
                {(data.locationType === "in-person" || data.locationType === "hybrid") &&
                  data.venue &&
                  ` - ${data.venue}`}
              </span>
            </div>
            <div className={`grid grid-cols-[120px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Contact:</span>
              <span className={typography.medium}>{data.contactEmail || "Not set"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Topics & Submissions */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              Topics & Submissions
            </h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(2)} className={spacing.gap.sm}>
              <Edit2 className={iconSizes.xs} />
              Edit
            </Button>
          </div>
          <div className={`bg-muted/50 rounded-lg ${spacing.padding.card} ${spacing.item}`}>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Submissions Open:</span>
              <span className={typography.medium}>
                {data.submissionsOpen ? format(data.submissionsOpen, "PPP") : "Not set"}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Submission Deadline:</span>
              <span className={typography.medium}>
                {data.submissionDeadline ? format(data.submissionDeadline, "PPP") : "Not set"}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Review Deadline:</span>
              <span className={typography.medium}>
                {data.reviewDeadline ? format(data.reviewDeadline, "PPP") : "Not set"}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Author Notification:</span>
              <span className={typography.medium}>
                {data.authorNotification ? format(data.authorNotification, "PPP") : "Not set"}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Camera-Ready:</span>
              <span className={typography.medium}>
                {data.cameraReadyDeadline ? format(data.cameraReadyDeadline, "PPP") : "Not set"}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Topics:</span>
              <span className={typography.medium}>
                {data.topics.length > 0 ? data.topics.join(", ") : "No topics added"}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>Anonymity:</span>
              <span className={`${typography.medium} capitalize`}>
                {data.anonymity.replace("-", " ")}
              </span>
            </div>
            <div className={`grid grid-cols-[160px_1fr] ${spacing.gap.sm} ${typography.body}`}>
              <span className={typography.muted}>File Formats:</span>
              <span className={typography.medium}>{data.fileFormats.join(", ")}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Organizers */}
        <div className={spacing.gap.md}>
          <div className="flex items-center justify-between">
            <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>
              Conference Chairs
            </h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(3)} className={spacing.gap.sm}>
              <Edit2 className={iconSizes.xs} />
              Edit
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
              I have reviewed the details and am ready to create this conference
            </Label>
            <p className={typography.caption}>
              You can edit conference settings after creation from the conference dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
