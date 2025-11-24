"use client"

import type React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ConferenceFormData } from "@/app/dashboard/chair/create-conference/page"
import { typography, spacing } from "@/lib/typography"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function CfpConfigurationStep({ data, updateData }: Props) {
  return (
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h2} ${typography.semibold} text-foreground mb-1`}>
          Step 3: Call For Paper Configuration
        </h2>
        <p className={`${typography.body} text-muted-foreground`}>
          Enter the complete Call For Paper content that will be displayed to potential authors
        </p>
      </div>

      <div className={spacing.subsection}>
        <div className={spacing.item}>
          <Label htmlFor="callForPaperText" className={typography.label}>
            Call For Paper Content
          </Label>
          <Textarea
            id="callForPaperText"
            placeholder="Enter the complete Call For Paper text here. Include all submission guidelines, formatting requirements, review process details, and any other relevant information for authors..."
            value={data.callForPaperText}
            onChange={(e) => updateData({ callForPaperText: e.target.value })}
            className="min-h-[400px] font-mono text-sm"
          />
          <p className={typography.caption}>
            This content will be displayed on the conference Call For Papers page. You can include
            formatting requirements, content guidelines, review process, deadlines, and any other
            information relevant to paper submissions.
          </p>
        </div>
      </div>
    </div>
  )
}
