"use client"
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { mockTracks } from "@/lib/mock-data"

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Paper Information</h2>
        <p className="text-sm text-gray-600">Title, abstract, topical areas, and keywords</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Concise, informative title of your paper"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-gray-500">
          Put key terms near the beginning; avoid abbreviations.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="abstract">Abstract * (150-250 words)</Label>
        <Textarea
          id="abstract"
          placeholder="Summarize contribution, methods, results, implications."
          rows={10}
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          className="text-base resize-none"
        />
        <p className="text-xs text-gray-500">{abstract.split(" ").filter(Boolean).length} words</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject-areas">Subject Areas *</Label>
        <Select value={subjectAreas[0]} onValueChange={(val) => setSubjectAreas([val])}>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {mockTracks.map((track) => (
              <SelectItem key={track.id} value={track.id}>
                {track.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Choose the track topic most relevant to your paper.</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="keywords">Keywords</Label>
          <button className="text-xs text-primary hover:underline">◊</button>
        </div>
        <div className="flex gap-2">
          <Input
            id="keywords"
            placeholder="Add a keyword and press +"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddKeyword()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddKeyword} size="icon">
            <Plus className="size-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1 px-3 py-1">
                {keyword}
                <button
                  onClick={() => setKeywords(keywords.filter((k) => k !== keyword))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <details className="border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          Authoring tips
        </summary>
        <div className="mt-3 text-sm text-gray-600 space-y-2">
          <p>• Keep your title concise and descriptive</p>
          <p>• Abstract should summarize key contributions</p>
          <p>• Choose keywords that researchers would search for</p>
        </div>
      </details>
    </div>
  )
}
