"use client"
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, FileText, Info, Lightbulb } from "lucide-react"
import { mockTracks } from "@/lib/mock-data"
import { typography, spacing } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

interface PaperTabProps {
  title: string
  setTitle: (value: string) => void
  abstract: string
  setAbstract: (value: string) => void
  subjectAreas: string[]
  setSubjectAreas: (value: string[]) => void
  keywords: string[]
  setKeywords: (value: string[]) => void
  keywordInput: string
  setKeywordInput: (value: string) => void
  handleAddKeyword: () => void
  selectedTrack: string
  setSelectedTrack: (value: string) => void
  availableTracks: string[]
}

export function PaperTab({
  title,
  setTitle,
  abstract,
  setAbstract,
  subjectAreas,
  setSubjectAreas,
  keywords,
  setKeywords,
  keywordInput,
  setKeywordInput,
  handleAddKeyword,
  selectedTrack,
  setSelectedTrack,
  availableTracks,
}: PaperTabProps) {
  const wordCount = abstract.split(" ").filter(Boolean).length
  const { t, tList } = useTranslation()
  const paperTips = tList("dashboard.author.submit.paperTab.tips")
  const authoringTips = tList("dashboard.author.submit.paperTab.authoringTips")

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className={spacing.item}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="size-6 text-blue-600" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-foreground font-arial`}>
              {t("dashboard.author.submit.paperTab.title")}
            </h2>
            <p
              className={`${typography.body} text-muted-foreground font-arial ${spacing.margin.top.sm}`}
            >
              {t("dashboard.author.submit.paperTab.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-muted-foreground`}>
              <p className={`${typography.medium} text-foreground mb-2`}>
                {t("dashboard.author.submit.paperTab.tipsTitle")}
              </p>
              <ul className="space-y-1 ml-4 list-disc">
                {paperTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Title Field */}
      <div className={spacing.item}>
        <Label htmlFor="title" className={`${typography.label} text-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.titleLabel")}
        </Label>
        <Input
          id="title"
          placeholder={t("dashboard.author.submit.paperTab.fields.titleHelp")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${typography.bodyLarge} font-arial border-border focus:border-primary focus:ring-primary`}
        />
        <p className={`${typography.bodySmall} text-muted-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.titleHelp")}
        </p>
      </div>

      {/* Abstract Field */}
      <div className={spacing.item}>
        <div className="flex items-center justify-between">
          <Label htmlFor="abstract" className={`${typography.label} text-foreground font-arial`}>
            {t("dashboard.author.submit.paperTab.fields.abstractLabel")}
          </Label>
          <span className={`${typography.bodySmall} text-muted-foreground font-arial`}>
            {t("dashboard.author.submit.paperTab.fields.abstractCount", { count: wordCount })}
          </span>
        </div>
        <Textarea
          id="abstract"
          placeholder={t("dashboard.author.submit.paperTab.fields.abstractHelp")}
          rows={10}
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          className={`${typography.body} font-arial resize-none border-border focus:border-primary focus:ring-primary`}
        />
        <p className={`${typography.bodySmall} text-muted-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.abstractHelp")}
        </p>
      </div>

      {/* Conference Track Selection */}
      <div className={spacing.item}>
        <Label htmlFor="track" className={`${typography.label} text-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.trackLabel")}
        </Label>
        <Select value={selectedTrack} onValueChange={setSelectedTrack}>
          <SelectTrigger className={`${typography.body} font-arial border-border`}>
            <SelectValue
              placeholder={t("dashboard.author.submit.paperTab.fields.trackPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {availableTracks.length > 0 ? (
              availableTracks.map((track) => (
                <SelectItem key={track} value={track} className="font-arial">
                  {track}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-tracks" disabled className="font-arial text-muted-foreground">
                No tracks available for this conference
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className={`${typography.bodySmall} text-muted-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.trackHelp")}
        </p>
      </div>

      {/* Subject Areas Field */}
      <div className={spacing.item}>
        <Label htmlFor="subject-areas" className={`${typography.label} text-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.subjectLabel")}
        </Label>
        <Select value={subjectAreas[0]} onValueChange={(val) => setSubjectAreas([val])}>
          <SelectTrigger className={`${typography.body} font-arial border-border`}>
            <SelectValue
              placeholder={t("dashboard.author.submit.paperTab.fields.subjectPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {mockTracks.map((track) => (
              <SelectItem key={track.id} value={track.id} className="font-arial">
                {track.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className={`${typography.bodySmall} text-muted-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.subjectHelp")}
        </p>
      </div>

      {/* Keywords Field */}
      <div className={spacing.item}>
        <Label htmlFor="keywords" className={`${typography.label} text-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.keywordsLabel")}
        </Label>
        <div className={`flex ${spacing.gap.sm}`}>
          <Input
            id="keywords"
            placeholder={t("dashboard.author.submit.paperTab.fields.keywordsPlaceholder")}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddKeyword()
              }
            }}
            className={`${typography.body} font-arial border-border focus:border-primary focus:ring-primary`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddKeyword}
            size="icon"
            className="shrink-0 border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className={`flex flex-wrap ${spacing.gap.sm} mt-3`}>
            {keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className={`${spacing.gap.sm} px-3 py-1.5 ${typography.bodySmall} font-arial bg-muted text-foreground hover:bg-accent`}
              >
                {keyword}
                <button
                  onClick={() => setKeywords(keywords.filter((k) => k !== keyword))}
                  className="hover:text-red-600 transition-colors"
                  aria-label={`Remove ${keyword}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className={`${typography.bodySmall} text-muted-foreground font-arial`}>
          {t("dashboard.author.submit.paperTab.fields.keywordsHelp")}
        </p>
      </div>

      {/* Authoring Tips */}
      <details className="border-t border-border pt-4">
        <summary
          className={`cursor-pointer ${typography.label} text-muted-foreground hover:text-foreground flex items-center ${spacing.gap.sm} font-arial`}
        >
          <Lightbulb className="size-4 text-amber-500" />
          <span>{t("dashboard.author.submit.paperTab.authoringTipsTitle")}</span>
        </summary>
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className={`${typography.bodySmall} text-gray-700 space-y-2 font-arial`}>
            <p className={`${typography.medium} text-amber-900`}>
              {t("dashboard.author.submit.paperTab.authoringTipsTitle")}
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              {authoringTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
