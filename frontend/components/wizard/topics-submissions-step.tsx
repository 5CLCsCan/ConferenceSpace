"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ConferenceFormData } from "@/app/dashboard/chair/create-conference/page"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

export function TopicsSubmissionsStep({ data, updateData }: Props) {
  const { t } = useTranslation()
  const [topicInput, setTopicInput] = useState("")
  const [trackInput, setTrackInput] = useState("")

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

  const addTrack = () => {
    if (trackInput.trim() && !data.tracks.includes(trackInput.trim())) {
      updateData({ tracks: [...data.tracks, trackInput.trim()] })
      setTrackInput("")
    }
  }

  const removeTrack = (track: string) => {
    updateData({ tracks: data.tracks.filter((t) => t !== track) })
  }

  const handleTrackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTrack()
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
    <div className={spacing.subsection}>
      <div>
        <h2 className={`${typography.h2} ${typography.semibold} text-foreground mb-1`}>
          {t("dashboard.chair.createConference.step2.heading")}
        </h2>
        <p className={`${typography.body} text-muted-foreground`}>
          {t("dashboard.chair.createConference.step2.subheading")}
        </p>
      </div>

      <div className={spacing.subsection}>
        {/* Key Deadlines */}
        <div className={spacing.subsection}>
          <h3 className={`${typography.h4} ${typography.medium} text-foreground`}>{t("dashboard.chair.createConference.step2.keyDeadlines")}</h3>

          <div className={`grid ${spacing.gap.md} md:grid-cols-2`}>
            {/* Submissions Open */}
            <div className={spacing.item}>
              <Label className={typography.label}>{t("dashboard.chair.createConference.step2.submissionsOpen")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.submissionsOpen && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className={`mr-2 ${iconSizes.sm}`} />
                    {data.submissionsOpen ? (
                      format(data.submissionsOpen, "PPP")
                    ) : (
                      <span>{t("dashboard.chair.createConference.step2.pickDate")}</span>
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
            <div className={spacing.item}>
              <Label className={typography.label}>
                {t("dashboard.chair.createConference.step2.submissionDeadline")} <span className="text-destructive">*</span>
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
                    <CalendarIcon className={`mr-2 ${iconSizes.sm}`} />
                    {data.submissionDeadline ? (
                      format(data.submissionDeadline, "PPP")
                    ) : (
                      <span>{t("dashboard.chair.createConference.step2.pickDate")}</span>
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
            <div className={spacing.item}>
              <Label className={typography.label}>{t("dashboard.chair.createConference.step2.reviewDeadline")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.reviewDeadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className={`mr-2 ${iconSizes.sm}`} />
                    {data.reviewDeadline ? (
                      format(data.reviewDeadline, "PPP")
                    ) : (
                      <span>{t("dashboard.chair.createConference.step2.pickDate")}</span>
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
            <div className={spacing.item}>
              <Label className={typography.label}>{t("dashboard.chair.createConference.step2.authorNotification")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.authorNotification && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className={`mr-2 ${iconSizes.sm}`} />
                    {data.authorNotification ? (
                      format(data.authorNotification, "PPP")
                    ) : (
                      <span>{t("dashboard.chair.createConference.step2.pickDate")}</span>
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
            <div className={spacing.item}>
              <Label className={typography.label}>{t("dashboard.chair.createConference.step2.cameraReadyDeadline")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.cameraReadyDeadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className={`mr-2 ${iconSizes.sm}`} />
                    {data.cameraReadyDeadline ? (
                      format(data.cameraReadyDeadline, "PPP")
                    ) : (
                      <span>{t("dashboard.chair.createConference.step2.pickDate")}</span>
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

        {/* Research Topics / Domains */}
        <div className={spacing.item}>
          <Label htmlFor="topics" className={typography.label}>
            {t("dashboard.chair.createConference.step2.researchTopics")}
          </Label>
          <div className={`flex ${spacing.gap.sm}`}>
            <Input
              id="topics"
              placeholder={t("dashboard.chair.createConference.step2.researchTopicsPlaceholder")}
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={handleTopicKeyDown}
            />
            <Button type="button" onClick={addTopic}>
              {t("dashboard.chair.createConference.step2.add")}
            </Button>
          </div>
          <p className={typography.caption}>{t("dashboard.chair.createConference.step2.researchTopicsHint")}</p>
          {data.topics.length > 0 && (
            <div className={`flex flex-wrap ${spacing.gap.sm} mt-2`}>
              {data.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="gap-1 pr-1 pl-3">
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className={iconSizes.xs} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Conference Tracks */}
        <div className={spacing.item}>
          <Label htmlFor="tracks" className={typography.label}>
            {t("dashboard.chair.createConference.step2.conferenceTracks")}
          </Label>
          <div className={`flex ${spacing.gap.sm}`}>
            <Input
              id="tracks"
              placeholder={t("dashboard.chair.createConference.step2.conferenceTracksPlaceholder")}
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              onKeyDown={handleTrackKeyDown}
            />
            <Button type="button" onClick={addTrack}>
              {t("dashboard.chair.createConference.step2.add")}
            </Button>
          </div>
          <p className={typography.caption}>
            {t("dashboard.chair.createConference.step2.conferenceTracksHint")}
          </p>
          {data.tracks.length > 0 && (
            <div className={`flex flex-wrap ${spacing.gap.sm} mt-2`}>
              {data.tracks.map((track) => (
                <Badge key={track} variant="default" className="gap-1 pr-1 pl-3">
                  {track}
                  <button
                    type="button"
                    onClick={() => removeTrack(track)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className={iconSizes.xs} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Submission Anonymity */}
        <div className={spacing.item}>
          <Label className={typography.label}>
            {t("dashboard.chair.createConference.step2.submissionAnonymity")} <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={data.anonymity}
            onValueChange={(value: "single-blind" | "double-blind") =>
              updateData({ anonymity: value })
            }
          >
            <div className={`flex items-center ${spacing.gap.sm}`}>
              <RadioGroupItem value="single-blind" id="single-blind" />
              <Label htmlFor="single-blind" className={typography.normal}>
                {t("dashboard.chair.createConference.step2.singleBlind")}
              </Label>
            </div>
            <div className={`flex items-center ${spacing.gap.sm}`}>
              <RadioGroupItem value="double-blind" id="double-blind" />
              <Label htmlFor="double-blind" className={typography.normal}>
                {t("dashboard.chair.createConference.step2.doubleBlind")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Allowed File Formats */}
        <div className={spacing.item}>
          <Label className={typography.label}>
            {t("dashboard.chair.createConference.step2.allowedFileFormats")} <span className="text-destructive">*</span>
          </Label>
          <div className={spacing.item}>
            {["PDF", "DOCX", "ZIP"].map((format) => (
              <div key={format} className={`flex items-center ${spacing.gap.sm}`}>
                <Checkbox
                  id={format}
                  checked={data.fileFormats.includes(format)}
                  onCheckedChange={() => toggleFileFormat(format)}
                />
                <Label htmlFor={format} className={typography.normal}>
                  {format}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
