"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ConferenceFormData } from "@/app/conferences/new/page"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function TopicsSubmissionsStep({ data, updateData }: Props) {
  const [topicInput, setTopicInput] = useState("")

  const addTopic = () => {
    if (topicInput.trim() && !data.topics.includes(topicInput.trim())) {
      updateData({ topics: [...data.topics, topicInput.trim()] })
      setTopicInput("")
    }
  }

  const removeTopic = (topic: string) => {
    updateData({ topics: data.topics.filter((t) => t !== topic) })
  }

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTopic()
    }
  }

  const toggleFileFormat = (format: string) => {
    if (data.fileFormats.includes(format)) {
      updateData({
        fileFormats: data.fileFormats.filter((f) => f !== format),
      })
    } else {
      updateData({ fileFormats: [...data.fileFormats, format] })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">
          Step 2: Topics & Submission Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure submission deadlines and academic structure
        </p>
      </div>

      <div className="space-y-6">
        {/* Key Deadlines */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Key Deadlines</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Submissions Open */}
            <div className="space-y-2">
              <Label>Submissions Open</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.submissionsOpen && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.submissionsOpen ? (
                      format(data.submissionsOpen, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.submissionsOpen}
                    onSelect={(date) => updateData({ submissionsOpen: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submission Deadline */}
            <div className="space-y-2">
              <Label>
                Submission Deadline <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.submissionDeadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.submissionDeadline ? (
                      format(data.submissionDeadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.submissionDeadline}
                    onSelect={(date) => updateData({ submissionDeadline: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Review Deadline */}
            <div className="space-y-2">
              <Label>Review Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.reviewDeadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.reviewDeadline ? (
                      format(data.reviewDeadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.reviewDeadline}
                    onSelect={(date) => updateData({ reviewDeadline: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Author Notification */}
            <div className="space-y-2">
              <Label>Author Notification</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.authorNotification && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.authorNotification ? (
                      format(data.authorNotification, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.authorNotification}
                    onSelect={(date) => updateData({ authorNotification: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Camera-Ready Deadline */}
            <div className="space-y-2">
              <Label>Camera-Ready Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.cameraReadyDeadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.cameraReadyDeadline ? (
                      format(data.cameraReadyDeadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.cameraReadyDeadline}
                    onSelect={(date) => updateData({ cameraReadyDeadline: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Conference Tracks / Topics */}
        <div className="space-y-2">
          <Label htmlFor="topics">Conference Tracks / Topics</Label>
          <div className="flex gap-2">
            <Input
              id="topics"
              placeholder="e.g., AI & Ethics, Natural Language Processing"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleTopicKeyDown}
            />
            <Button type="button" onClick={addTopic}>
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter or click Add to create a topic tag
          </p>
          {data.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1 pr-1 pl-3">
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Submission Anonymity */}
        <div className="space-y-2">
          <Label>
            Submission Anonymity <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={data.anonymity}
            onValueChange={(value: "single-blind" | "double-blind") =>
              updateData({ anonymity: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single-blind" id="single-blind" />
              <Label htmlFor="single-blind" className="font-normal">
                Single-Blind (reviewers are anonymous to authors)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="double-blind" id="double-blind" />
              <Label htmlFor="double-blind" className="font-normal">
                Double-Blind (both reviewers and authors are anonymous)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Allowed File Formats */}
        <div className="space-y-2">
          <Label>
            Allowed File Formats <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-2">
            {["PDF", "DOCX", "ZIP"].map((format) => (
              <div key={format} className="flex items-center space-x-2">
                <Checkbox
                  id={format}
                  checked={data.fileFormats.includes(format)}
                  onCheckedChange={() => toggleFileFormat(format)}
                />
                <Label htmlFor={format} className="font-normal">
                  {format}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Guidelines */}
        <div className="space-y-2">
          <Label htmlFor="guidelines">Submission Guidelines</Label>
          <Textarea
            id="guidelines"
            placeholder="Detailed instructions for authors (e.g., page limits, formatting requirements)..."
            rows={5}
            value={data.submissionGuidelines}
            onChange={(e) => updateData({ submissionGuidelines: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
