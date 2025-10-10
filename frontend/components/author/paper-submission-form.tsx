"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Upload, X, Plus, TrendingUp, Users, FileText, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockTracks } from "@/lib/mock-data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export function PaperSubmissionForm() {
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [selectedTrack, setSelectedTrack] = useState("")
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleGetAISuggestions = () => {
    setShowAISuggestions(true)
  }

  // Mock AI quality scores
  const qualityScores = {
    title: 85,
    abstract: 78,
    keywords: 92,
  }

  return (
    <div className="space-y-6">
      {/* AI Quality Assessment */}
      {(title || abstract || keywords.length > 0) && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <CardTitle className="text-lg">AI Quality Assessment</CardTitle>
            </div>
            <CardDescription>Real-time feedback on your submission quality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {title && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Title Effectiveness</span>
                  <span className="font-medium">{qualityScores.title}%</span>
                </div>
                <Progress value={qualityScores.title} className="h-2" />
              </div>
            )}
            {abstract && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Abstract Clarity</span>
                  <span className="font-medium">{qualityScores.abstract}%</span>
                </div>
                <Progress value={qualityScores.abstract} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Consider adding quantitative results to strengthen your abstract
                </p>
              </div>
            )}
            {keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Keyword Relevance</span>
                  <span className="font-medium">{qualityScores.keywords}%</span>
                </div>
                <Progress value={qualityScores.keywords} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>Paper Information</CardTitle>
          <CardDescription>Provide details about your research paper</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Paper Title *</Label>
            <Input
              id="title"
              placeholder="Enter your paper title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract *</Label>
            <Textarea
              id="abstract"
              placeholder="Enter your paper abstract (250-300 words recommended)"
              rows={8}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{abstract.split(" ").filter(Boolean).length} words</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords *</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="Add a keyword"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddKeyword()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                <Plus className="size-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1 hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="track">Conference Track *</Label>
            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
              <SelectTrigger>
                <SelectValue placeholder="Select a track" />
              </SelectTrigger>
              <SelectContent>
                {mockTracks.map((track) => (
                  <SelectItem key={track.id} value={track.id}>
                    {track.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Paper (PDF) *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">PDF up to 10MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions Button */}
      {title && abstract && keywords.length > 0 && !showAISuggestions && (
        <Button onClick={handleGetAISuggestions} className="w-full" size="lg">
          <Sparkles className="size-4 mr-2" />
          Get AI Recommendations
        </Button>
      )}

      {/* AI Suggestions */}
      {showAISuggestions && (
        <div className="space-y-6">
          {/* Track Recommendation */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                <CardTitle className="text-lg">Recommended Track</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="size-4" />
                <AlertTitle>Machine Learning & AI (95% confidence)</AlertTitle>
                <AlertDescription>
                  Based on your paper content, this track is the best fit. Your keywords and abstract strongly align
                  with ML/AI research themes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Reviewer Recommendations */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <CardTitle className="text-lg">Suggested Reviewers</CardTitle>
              </div>
              <CardDescription>AI-matched reviewers based on expertise and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Prof. Michael Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Stanford University</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">85% match</Badge>
                      <Badge variant="outline">High availability</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Strong background in NLP and transformer architectures. Has reviewed 12 similar papers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Prof. James Anderson</div>
                    <div className="text-sm text-muted-foreground">Carnegie Mellon University</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">72% match</Badge>
                      <Badge variant="outline">Medium availability</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Experience with computational efficiency and model optimization.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Papers */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <CardTitle className="text-lg">Similar Published Papers</CardTitle>
              </div>
              <CardDescription>Related work that might be relevant to cite</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg">
                  <div className="font-medium text-sm mb-1">Lightweight Transformers for Multilingual NLP</div>
                  <div className="text-xs text-muted-foreground mb-2">Wang et al. • ACL 2024</div>
                  <Badge variant="secondary" className="text-xs">
                    87% similarity
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Similar approach to model compression for multilingual tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 bg-transparent">
          Save as Draft
        </Button>
        <Button className="flex-1" size="lg">
          Submit Paper
        </Button>
      </div>
    </div>
  )
}
