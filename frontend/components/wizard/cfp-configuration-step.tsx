"use client"

import { Label } from "@/components/ui/label"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
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
          Enter the complete Call For Paper content that will be displayed to potential authors.
          Markdown formatting is supported.
        </p>
      </div>

      <div className={spacing.subsection}>
        <div className={spacing.item}>
          <Label htmlFor="callForPaperText" className={typography.label}>
            Call For Paper Content
          </Label>
          <MarkdownEditor
            value={data.callForPaperText}
            onChange={(value) => updateData({ callForPaperText: value })}
            placeholder="# Call for Papers

## Important Dates
- Submission deadline: ...
- Author notification: ...
- Camera-ready deadline: ...

## Topics of Interest
- Topic 1
- Topic 2

## Submission Guidelines
Papers should be submitted via..."
            height={450}
          />
          <p className={typography.caption}>
            Use the toolbar to format your content with headings, lists, links, and more. The
            preview mode lets you see how the content will appear to authors.
          </p>
        </div>
      </div>
    </div>
  )
}
