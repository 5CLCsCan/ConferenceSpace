"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  semanticScholarApi,
  Author,
  AuthorWithPapers,
  SearchResponse,
} from "@/lib/api/semantic-scholar"
import { userApi } from "@/lib/api/user"
import { Search, Loader2, User, BookOpen, ExternalLink, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProfileOnboardingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  userName?: string
  onComplete: (authorId?: string) => void
}

export function ProfileOnboardingModal({
  isOpen,
  onOpenChange,
  userEmail,
  userName = "",
  onComplete,
}: ProfileOnboardingModalProps) {
  const [step, setStep] = useState<"search" | "confirm" | "success">("search")
  const [searchQuery, setSearchQuery] = useState(userName)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [searchResults, setSearchResults] = useState<Author[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorWithPapers | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await semanticScholarApi.searchAuthors(searchQuery)
      const authorsArray = response.data || []

      setSearchResults(authorsArray)

      if (authorsArray.length === 0) {
        toast({
          title: "No authors found",
          description: "Try a different spelling or name variation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search failed",
        description: "Could not search for authors. Please try again.",
        variant: "destructive",
      })
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectAuthor = async (author: Author) => {
    setIsLoadingDetails(true)
    try {
      // Fetch full author details including papers
      const fullDetails = await semanticScholarApi.getAuthorDetails(author.authorId)
      setSelectedAuthor(fullDetails)
      setStep("confirm")
    } catch (error) {
      console.error("Error fetching author details:", error)
      // Fallback to basic author info if API fails
      setSelectedAuthor(author)
      setStep("confirm")
      toast({
        title: "Limited information",
        description: "Could not fetch full author details, showing basic information.",
        variant: "default",
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedAuthor) return

    setIsConfirming(true)
    try {
      await userApi.linkAcademicProfile(selectedAuthor.authorId)

      toast({
        title: "Profile Linked Successfully",
        description: "Your academic profile is being synced. This may take a few minutes.",
      })

      // Wait a bit to show success state before closing
      setStep("success")
      setTimeout(() => {
        onComplete(selectedAuthor.authorId)
        onOpenChange(false)
      }, 1000)
    } catch (error) {
      console.error("Link error:", error)
      toast({
        title: "Linking failed",
        description: "Could not link profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
    onComplete(undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Connect Academic Profile</DialogTitle>
          <DialogDescription>
            Link your Semantic Scholar profile to automatically import your papers and research
            history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {step === "search" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Found {searchResults.length} potential matches
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-2">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                    <User className="h-12 w-12 mb-2 opacity-20" />
                    <p>Search for your name to find your profile</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((author) => (
                      <Card
                        key={author.authorId}
                        className="cursor-pointer hover:bg-accent/50 transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                        onClick={() => handleSelectAuthor(author)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{author.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {author.affiliations && author.affiliations.length > 0
                                  ? author.affiliations.join(", ")
                                  : "No affiliation listed"}
                              </p>
                            </div>
                            {author.hIndex && (
                              <Badge variant="secondary">h-index: {author.hIndex}</Badge>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {author.paperCount || 0} papers
                              </div>
                              <div className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {author.citationCount || 0} citations
                              </div>
                            </div>
                            {author.url && (
                              <a
                                href={author.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                View Profile <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {step === "confirm" && selectedAuthor && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg border text-center">
                <h3 className="text-xl font-bold mb-2">{selectedAuthor.name}</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedAuthor.affiliations && selectedAuthor.affiliations.length > 0
                    ? selectedAuthor.affiliations[0]
                    : "No affiliation listed"}
                </p>

                <div className="flex justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.paperCount || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">Papers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.citationCount || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">Citations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.hIndex || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">h-index</div>
                  </div>
                </div>

                {selectedAuthor.homepage && (
                  <a
                    href={selectedAuthor.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    View Homepage <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Papers List */}
              {selectedAuthor.papers && selectedAuthor.papers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Publications ({selectedAuthor.papers.length})
                  </h4>
                  <ScrollArea className="h-[200px] border rounded-md">
                    <div className="p-3 space-y-3">
                      {selectedAuthor.papers.slice(0, 10).map((paper) => (
                        <div
                          key={paper.paperId}
                          className="p-3 bg-background rounded border hover:bg-accent/30 transition-colors"
                        >
                          <h5 className="font-medium text-sm line-clamp-2">
                            {paper.url ? (
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary hover:underline"
                              >
                                {paper.title}
                              </a>
                            ) : (
                              paper.title
                            )}
                          </h5>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            {paper.year && <span>{paper.year}</span>}
                            {paper.venue && (
                              <span className="truncate max-w-[150px]">{paper.venue}</span>
                            )}
                            {paper.citationCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {paper.citationCount} citations
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200">
                <p>
                  Is this you? Confirming will link this profile to your account and import your
                  publication history.
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">Profile Linked!</h3>
              <p className="text-muted-foreground">
                Your academic profile has been successfully connected. We are importing your papers
                in the background.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          {step === "search" && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("search")}>
                Back to results
              </Button>
              <Button onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Confirm & Link Profile"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
