"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sparkles, Search, Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { mockPapers, mockUsers } from "@/lib/mock-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export function ReviewerAssignment() {
  const [selectedPaper, setSelectedPaper] = useState("")
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const unassignedPapers = mockPapers.filter((p) => p.status === "submitted")

  const handleGetRecommendations = () => {
    setShowRecommendations(true)
  }

  // Mock recommended reviewers with AI scores
  const recommendedReviewers = [
    {
      user: mockUsers[1],
      match_score: 92,
      expertise_match: 95,
      availability: "high" as const,
      workload: 3,
      past_performance: 4.8,
      conflicts: [],
      reasoning: "Perfect expertise match in ML and NLP. High availability and excellent review quality.",
    },
    {
      user: mockUsers[4],
      match_score: 85,
      expertise_match: 88,
      availability: "medium" as const,
      workload: 5,
      past_performance: 4.6,
      conflicts: [],
      reasoning:
        "Strong technical background. Currently has moderate workload but consistently delivers quality reviews.",
    },
    {
      user: mockUsers[2],
      match_score: 78,
      expertise_match: 82,
      availability: "high" as const,
      workload: 2,
      past_performance: 4.5,
      conflicts: [],
      reasoning: "Good match for distributed systems aspects. Low current workload and reliable reviewer.",
    },
    {
      user: mockUsers[3],
      match_score: 65,
      expertise_match: 70,
      availability: "low" as const,
      workload: 7,
      past_performance: 4.7,
      conflicts: ["Co-author on related paper"],
      reasoning: "Relevant HCI expertise but high workload. Potential conflict detected.",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Paper Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Paper</CardTitle>
          <CardDescription>Choose a paper to assign reviewers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedPaper} onValueChange={setSelectedPaper}>
            <SelectTrigger>
              <SelectValue placeholder="Select a paper" />
            </SelectTrigger>
            <SelectContent>
              {unassignedPapers.map((paper) => (
                <SelectItem key={paper.id} value={paper.id}>
                  {paper.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPaper && (
            <div className="p-4 border border-border rounded-lg space-y-2">
              <h4 className="font-semibold">{unassignedPapers.find((p) => p.id === selectedPaper)?.title}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {unassignedPapers
                  .find((p) => p.id === selectedPaper)
                  ?.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {selectedPaper && !showRecommendations && (
            <Button onClick={handleGetRecommendations} className="w-full" size="lg">
              <Sparkles className="size-4 mr-2" />
              Get AI Reviewer Recommendations
            </Button>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {showRecommendations && (
        <>
          <Alert className="border-primary/50 bg-primary/5">
            <Sparkles className="size-4" />
            <AlertTitle>AI Matching Complete</AlertTitle>
            <AlertDescription>
              Found {recommendedReviewers.length} potential reviewers ranked by expertise match, availability, and past
              performance. Review the recommendations below.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended Reviewers</CardTitle>
                  <CardDescription>AI-ranked by suitability and availability</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reviewers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedReviewers.map((reviewer, index) => (
                <Card
                  key={reviewer.user.id}
                  className={`${
                    reviewer.conflicts.length > 0
                      ? "border-destructive/50 bg-destructive/5"
                      : reviewer.match_score >= 85
                        ? "border-primary/50 bg-primary/5"
                        : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{reviewer.user.name}</h3>
                              <Badge
                                variant={
                                  reviewer.match_score >= 85
                                    ? "default"
                                    : reviewer.match_score >= 70
                                      ? "secondary"
                                      : "outline"
                                }
                                className="gap-1"
                              >
                                <TrendingUp className="size-3" />
                                {reviewer.match_score}% match
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{reviewer.user.affiliation}</p>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Expertise Match</span>
                                  <span className="font-medium">{reviewer.expertise_match}%</span>
                                </div>
                                <Progress value={reviewer.expertise_match} className="h-2" />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Past Performance</span>
                                  <span className="font-medium">{reviewer.past_performance}/5.0</span>
                                </div>
                                <Progress value={(reviewer.past_performance / 5) * 100} className="h-2" />
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <Users className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Current workload: {reviewer.workload} papers
                                </span>
                              </div>
                              <Badge
                                variant={
                                  reviewer.availability === "high"
                                    ? "default"
                                    : reviewer.availability === "medium"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {reviewer.availability} availability
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">{reviewer.reasoning}</p>

                            {reviewer.conflicts.length > 0 && (
                              <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Potential Conflict Detected</AlertTitle>
                                <AlertDescription>{reviewer.conflicts.join(", ")}</AlertDescription>
                              </Alert>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              {reviewer.user.expertise.slice(0, 3).map((exp) => (
                                <Badge key={exp} variant="outline">
                                  {exp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={reviewer.conflicts.length > 0 ? "outline" : "default"}
                        disabled={reviewer.conflicts.length > 0}
                      >
                        {reviewer.conflicts.length > 0 ? "Conflict" : "Assign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Assignment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
              <CardDescription>Review your selections before finalizing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>Ready to Assign</AlertTitle>
                  <AlertDescription>
                    Select at least 3 reviewers for this paper. AI recommends assigning the top 3 matches for optimal
                    review quality.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                  <Button className="flex-1">Confirm Assignments</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
