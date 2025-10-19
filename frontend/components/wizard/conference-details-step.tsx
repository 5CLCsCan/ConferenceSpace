"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ConferenceFormData } from "@/app/conferences/new/page"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function ConferenceDetailsStep({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          Step 1: Core Conference Details
        </h2>
        <p className="text-sm text-muted-foreground">
          Provide the essential information about your conference
        </p>
      </div>

      <div className="space-y-4">
        {/* Conference Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Conference Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g., International Conference on Artificial Intelligence"
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
          />
        </div>

        {/* Acronym */}
        <div className="space-y-2">
          <Label htmlFor="acronym">
            Acronym <span className="text-destructive">*</span>
          </Label>
          <Input
            id="acronym"
            placeholder="e.g., ICAI 2026"
            value={data.acronym}
            onChange={(e) => updateData({ acronym: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            A short, unique identifier for your conference
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="A brief overview of the conference theme and scope..."
            rows={4}
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
          />
        </div>

        {/* Conference Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Conference Website (Optional)</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            value={data.website}
            onChange={(e) => updateData({ website: e.target.value })}
          />
        </div>

        {/* Conference Dates */}
        <div className="space-y-2">
          <Label>
            Conference Dates <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !data.dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.dateRange.from ? (
                    format(data.dateRange.from, "PPP")
                  ) : (
                    <span>Start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.dateRange.from}
                  onSelect={(date) =>
                    updateData({
                      dateRange: { ...data.dateRange, from: date },
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !data.dateRange.to && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.dateRange.to ? format(data.dateRange.to, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.dateRange.to}
                  onSelect={(date) =>
                    updateData({
                      dateRange: { ...data.dateRange, to: date },
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Location Type */}
        <div className="space-y-2">
          <Label>
            Location <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={data.locationType}
            onValueChange={(value: "in-person" | "virtual" | "hybrid") =>
              updateData({ locationType: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="in-person" id="in-person" />
              <Label htmlFor="in-person" className="font-normal">
                In-Person
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="virtual" id="virtual" />
              <Label htmlFor="virtual" className="font-normal">
                Virtual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hybrid" id="hybrid" />
              <Label htmlFor="hybrid" className="font-normal">
                Hybrid
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Venue (conditional) */}
        {(data.locationType === "in-person" || data.locationType === "hybrid") && (
          <div className="space-y-2">
            <Label htmlFor="venue">
              Venue / City, Country <span className="text-destructive">*</span>
            </Label>
            <Input
              id="venue"
              placeholder="e.g., Grand Hotel, Paris, France"
              value={data.venue}
              onChange={(e) => updateData({ venue: e.target.value })}
            />
          </div>
        )}

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">
            Contact Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="contact@conference.com"
            value={data.contactEmail}
            onChange={(e) => updateData({ contactEmail: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">The primary public contact for inquiries</p>
        </div>
      </div>
    </div>
  )
}
