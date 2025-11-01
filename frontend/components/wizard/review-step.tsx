"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit2 } from "lucide-react"
import { format } from "date-fns"
import type { ConferenceFormData } from "@/app/conferences/new/page"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
  goToStep: (step: number) => void
}

export function ReviewStep({ data, updateData, goToStep }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">Step 4: Review and Confirm</h2>
        <p className="text-sm text-muted-foreground">
          Please review all information before creating the conference
        </p>
      </div>

      <div className="space-y-6">
        {/* Conference Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Conference Details</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(1)} className="gap-2">
              <Edit2 className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Title:</span>
              <span className="font-medium">{data.title || "Not set"}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Acronym:</span>
              <span className="font-medium">{data.acronym || "Not set"}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium">{data.description || "Not set"}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Website:</span>
              <span className="font-medium">{data.website || "Not provided"}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Dates:</span>
              <span className="font-medium">
                {data.dateRange.from && data.dateRange.to
                  ? `${format(data.dateRange.from, "PPP")} - ${format(data.dateRange.to, "PPP")}`
                  : "Not set"}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium capitalize">
                {data.locationType}
                {(data.locationType === "in-person" || data.locationType === "hybrid") &&
                  data.venue &&
                  ` - ${data.venue}`}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium">{data.contactEmail || "Not set"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Topics & Submissions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Topics & Submissions</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(2)} className="gap-2">
              <Edit2 className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Submissions Open:</span>
              <span className="font-medium">
                {data.submissionsOpen ? format(data.submissionsOpen, "PPP") : "Not set"}
              </span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Submission Deadline:</span>
              <span className="font-medium">
                {data.submissionDeadline ? format(data.submissionDeadline, "PPP") : "Not set"}
              </span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Review Deadline:</span>
              <span className="font-medium">
                {data.reviewDeadline ? format(data.reviewDeadline, "PPP") : "Not set"}
              </span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Author Notification:</span>
              <span className="font-medium">
                {data.authorNotification ? format(data.authorNotification, "PPP") : "Not set"}
              </span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Camera-Ready:</span>
              <span className="font-medium">
                {data.cameraReadyDeadline ? format(data.cameraReadyDeadline, "PPP") : "Not set"}
              </span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Topics:</span>
              <span className="font-medium">
                {data.topics.length > 0 ? data.topics.join(", ") : "No topics added"}
              </span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Anonymity:</span>
              <span className="font-medium capitalize">{data.anonymity.replace("-", " ")}</span>
            </div>
            <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">File Formats:</span>
              <span className="font-medium">{data.fileFormats.join(", ")}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Organizers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Conference Chairs</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(3)} className="gap-2">
              <Edit2 className="w-3 h-3" />
              Edit
            </Button>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            {data.organizers.map((organizer) => (
              <div key={organizer.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{organizer.name}</span>
                  <span className="text-muted-foreground ml-2">({organizer.email})</span>
                </div>
                <span className="text-muted-foreground">{organizer.role}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Confirmation */}
        <div className="flex items-start space-x-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Checkbox
            id="confirm"
            checked={data.confirmed}
            onCheckedChange={(checked) => updateData({ confirmed: checked as boolean })}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have reviewed the details and am ready to create this conference
            </Label>
            <p className="text-xs text-muted-foreground">
              You can edit conference settings after creation from the conference dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
