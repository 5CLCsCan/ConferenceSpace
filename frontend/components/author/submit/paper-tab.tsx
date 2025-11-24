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
}: PaperTabProps) {
  const wordCount = abstract.split(" ").filter(Boolean).length

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className={spacing.item}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="size-6 text-blue-600" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-[#212529] font-arial`}>Paper Information</h2>
            <p className={`${typography.body} text-[#6C757D] font-arial ${spacing.margin.top.sm}`}>
              Provide the core details about your research paper
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-gray-700`}>
              <p className={`${typography.medium} text-blue-900 mb-2`}>Quick Tips:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Choose a clear, descriptive title that highlights your contribution</li>
                <li>Write an abstract that summarizes your methods and key findings</li>
                <li>Select subject areas that best match your research domain</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Title Field */}
      <div className={spacing.item}>
        <Label htmlFor="title" className={`${typography.label} text-[#212529] font-arial`}>
          Paper Title *
        </Label>
        <Input
          id="title"
          placeholder="Enter a concise, informative title for your paper"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${typography.bodyLarge} font-arial border-[#DEE2E6] focus:border-[#0056A3] focus:ring-[#0056A3]`}
        />
        <p className={`${typography.bodySmall} text-[#6C757D] font-arial`}>
          Place key terms at the beginning and avoid abbreviations
        </p>
      </div>

      {/* Abstract Field */}
      <div className={spacing.item}>
        <div className="flex items-center justify-between">
          <Label htmlFor="abstract" className={`${typography.label} text-[#212529] font-arial`}>
            Abstract *
          </Label>
          <span className={`${typography.bodySmall} text-[#6C757D] font-arial`}>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>
        <Textarea
          id="abstract"
          placeholder="Summarize your contribution, methodology, key results, and implications..."
          rows={10}
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          className={`${typography.body} font-arial resize-none border-[#DEE2E6] focus:border-[#0056A3] focus:ring-[#0056A3]`}
        />
        <p className={`${typography.bodySmall} text-[#6C757D] font-arial`}>
          Provide a clear summary of your research contribution
        </p>
      </div>

      {/* Subject Areas Field */}
      <div className={spacing.item}>
        <Label htmlFor="subject-areas" className={`${typography.label} text-[#212529] font-arial`}>
          Subject Area *
        </Label>
        <Select value={subjectAreas[0]} onValueChange={(val) => setSubjectAreas([val])}>
          <SelectTrigger className={`${typography.body} font-arial border-[#DEE2E6]`}>
            <SelectValue placeholder="Select the most relevant topic area" />
          </SelectTrigger>
          <SelectContent>
            {mockTracks.map((track) => (
              <SelectItem key={track.id} value={track.id} className="font-arial">
                {track.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className={`${typography.bodySmall} text-[#6C757D] font-arial`}>
          Choose the track topic most relevant to your paper
        </p>
      </div>

      {/* Keywords Field */}
      <div className={spacing.item}>
        <Label htmlFor="keywords" className={`${typography.label} text-[#212529] font-arial`}>
          Keywords * (minimum 3)
        </Label>
        <div className={`flex ${spacing.gap.sm}`}>
          <Input
            id="keywords"
            placeholder="Enter a keyword and press Enter or click +"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddKeyword()
              }
            }}
            className={`${typography.body} font-arial border-[#DEE2E6] focus:border-[#0056A3] focus:ring-[#0056A3]`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddKeyword}
            size="icon"
            className="shrink-0 border-[#0056A3] text-[#0056A3] hover:bg-[#0056A3]/10"
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
                className={`${spacing.gap.sm} px-3 py-1.5 ${typography.bodySmall} font-arial bg-[#E9ECEF] text-[#212529] hover:bg-[#DEE2E6]`}
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
        <p className={`${typography.bodySmall} text-[#6C757D] font-arial`}>
          Add terms that researchers would use to find your work
        </p>
      </div>

      {/* Authoring Tips */}
      <details className="border-t border-[#DEE2E6] pt-4">
        <summary
          className={`cursor-pointer ${typography.label} text-[#495057] hover:text-[#212529] flex items-center ${spacing.gap.sm} font-arial`}
        >
          <Lightbulb className="size-4 text-amber-500" />
          <span>Authoring Best Practices</span>
        </summary>
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className={`${typography.bodySmall} text-gray-700 space-y-2 font-arial`}>
            <p className={`${typography.medium} text-amber-900`}>Writing Tips:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Keep your title concise yet descriptive (10-15 words ideal)</li>
              <li>Abstract should be self-contained and highlight novelty</li>
              <li>Choose keywords that balance specificity and discoverability</li>
              <li>Avoid jargon and define technical terms when necessary</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
