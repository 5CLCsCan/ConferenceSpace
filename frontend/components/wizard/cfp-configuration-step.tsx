"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Upload, FileImage } from "lucide-react"
import type { ConferenceFormData } from "@/app/dashboard/chair/create-conference/page"
import { typography, spacing, iconSizes } from "@/lib/typography"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function CfpConfigurationStep({ data, updateData }: Props) {
  const [formattingInput, setFormattingInput] = useState("")
  const [contentInput, setContentInput] = useState("")
  const [reviewProcessInput, setReviewProcessInput] = useState("")

  const addItem = (
    field: "cfpFormattingRequirements" | "cfpContentGuidelines" | "cfpReviewProcess",
    value: string,
    setter: (value: string) => void,
  ) => {
    if (value.trim() && !data[field].includes(value.trim())) {
      updateData({ [field]: [...data[field], value.trim()] })
      setter("")
    }
  }

  const removeItem = (
    field: "cfpFormattingRequirements" | "cfpContentGuidelines" | "cfpReviewProcess",
    item: string,
  ) => {
    updateData({ [field]: data[field].filter((i) => i !== item) })
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: "cfpFormattingRequirements" | "cfpContentGuidelines" | "cfpReviewProcess",
    value: string,
    setter: (value: string) => void,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addItem(field, value, setter)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image (PNG, JPG, JPEG) or PDF file")
        return
      }
      updateData({ cfpCoverImage: file })
    }
  }

  return (
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h2} ${typography.semibold} text-foreground mb-1`}>
          Step 3: Call For Paper Configuration
        </h2>
        <p className={`${typography.body} text-muted-foreground`}>
          Configure metadata for generating the Call For Paper document
        </p>
      </div>

      <div className={spacing.subsection}>
        {/* Section A: CFP Metadata Inputs */}
        <div className={spacing.subsection}>
          <h3 className={`${typography.h4} ${typography.medium} text-foreground mb-2`}>
            CFP Metadata
          </h3>
          <p className={`${typography.bodySmall} text-muted-foreground mb-4`}>
            Add keywords and phrases that will be used to generate the Call For Paper document
          </p>

          {/* Formatting Requirements */}
          <div className={spacing.item}>
            <Label htmlFor="formatting" className={typography.label}>
              Formatting Requirements
            </Label>
            <div className={`flex ${spacing.gap.sm}`}>
              <Input
                id="formatting"
                placeholder="e.g., IEEE format, 10 pages maximum, Times New Roman 12pt"
                value={formattingInput}
                onChange={(e) => setFormattingInput(e.target.value)}
                onKeyDown={(e) =>
                  handleKeyDown(e, "cfpFormattingRequirements", formattingInput, setFormattingInput)
                }
              />
              <Button
                type="button"
                onClick={() =>
                  addItem("cfpFormattingRequirements", formattingInput, setFormattingInput)
                }
                size="icon"
                variant="outline"
              >
                <Plus className={iconSizes.sm} />
              </Button>
            </div>
            <p className={typography.caption}>
              Press Enter or click + to add a formatting requirement
            </p>
            {data.cfpFormattingRequirements.length > 0 && (
              <div className={`flex flex-wrap ${spacing.gap.sm} mt-2`}>
                {data.cfpFormattingRequirements.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1 pr-1 pl-3">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem("cfpFormattingRequirements", item)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className={iconSizes.xs} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Paper Content Guidelines */}
          <div className={spacing.item}>
            <Label htmlFor="content" className={typography.label}>
              Paper Content Guidelines
            </Label>
            <div className={`flex ${spacing.gap.sm}`}>
              <Input
                id="content"
                placeholder="e.g., Original research, Clear methodology, Reproducible results"
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                onKeyDown={(e) =>
                  handleKeyDown(e, "cfpContentGuidelines", contentInput, setContentInput)
                }
              />
              <Button
                type="button"
                onClick={() => addItem("cfpContentGuidelines", contentInput, setContentInput)}
                size="icon"
                variant="outline"
              >
                <Plus className={iconSizes.sm} />
              </Button>
            </div>
            <p className={typography.caption}>
              Press Enter or click + to add a content guideline
            </p>
            {data.cfpContentGuidelines.length > 0 && (
              <div className={`flex flex-wrap ${spacing.gap.sm} mt-2`}>
                {data.cfpContentGuidelines.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1 pr-1 pl-3">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem("cfpContentGuidelines", item)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className={iconSizes.xs} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Review Process */}
          <div className={spacing.item}>
            <Label htmlFor="review" className={typography.label}>
              Review Process
            </Label>
            <div className={`flex ${spacing.gap.sm}`}>
              <Input
                id="review"
                placeholder="e.g., Double-blind peer review, 3 reviewers per paper"
                value={reviewProcessInput}
                onChange={(e) => setReviewProcessInput(e.target.value)}
                onKeyDown={(e) =>
                  handleKeyDown(e, "cfpReviewProcess", reviewProcessInput, setReviewProcessInput)
                }
              />
              <Button
                type="button"
                onClick={() =>
                  addItem("cfpReviewProcess", reviewProcessInput, setReviewProcessInput)
                }
                size="icon"
                variant="outline"
              >
                <Plus className={iconSizes.sm} />
              </Button>
            </div>
            <p className={typography.caption}>
              Press Enter or click + to add a review process detail
            </p>
            {data.cfpReviewProcess.length > 0 && (
              <div className={`flex flex-wrap ${spacing.gap.sm} mt-2`}>
                {data.cfpReviewProcess.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1 pr-1 pl-3">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeItem("cfpReviewProcess", item)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className={iconSizes.xs} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section B: CFP Cover Image Upload */}
        <div className={spacing.subsection}>
          <h3 className={`${typography.h4} ${typography.medium} text-foreground mb-2`}>
            CFP Cover Image
          </h3>
          <div className={spacing.item}>
            <Label htmlFor="coverImage" className={typography.label}>
              Upload CFP Cover Image
            </Label>
            <div
              className={`border-2 border-dashed border-border rounded-lg ${spacing.padding.card} text-center hover:border-primary transition-colors cursor-pointer`}
            >
              <input
                id="coverImage"
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="coverImage" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-2">
                  {data.cfpCoverImage ? (
                    <>
                      <FileImage className={`${iconSizes.lg} text-primary`} />
                      <div>
                        <p className={`${typography.body} ${typography.medium} text-foreground`}>
                          {data.cfpCoverImage.name}
                        </p>
                        <p className={`${typography.caption} text-muted-foreground`}>
                          {(data.cfpCoverImage.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          updateData({ cfpCoverImage: null })
                        }}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className={`${iconSizes.lg} text-muted-foreground`} />
                      <div>
                        <p className={`${typography.body} ${typography.medium} text-foreground`}>
                          Click to upload or drag and drop
                        </p>
                        <p className={`${typography.caption} text-muted-foreground`}>
                          PNG, JPG, JPEG or PDF (max 10MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
