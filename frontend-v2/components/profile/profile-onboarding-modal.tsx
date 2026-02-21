"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { semanticScholarApi, type Author, type AuthorWithPapers } from "@/lib/api/semantic-scholar"
import { userApi } from "@/lib/api/user"
import { Search, Loader2, User, BookOpen, ExternalLink, CheckCircle } from "lucide-react"

interface ProfileOnboardingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userName?: string
  onComplete: (authorId?: string) => void
}

export function ProfileOnboardingModal({
  isOpen,
  onOpenChange,
  userName = "",
  onComplete,
}: ProfileOnboardingModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"search" | "confirm" | "success">("search")
  const [searchQuery, setSearchQuery] = useState(userName)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [searchResults, setSearchResults] = useState<Author[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorWithPapers | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return
    }

    setIsSearching(true)
    try {
      const response = await semanticScholarApi.searchAuthors(searchQuery.trim())
      setSearchResults(response.data || [])

      if ((response.data || []).length === 0) {
        toast({
          title: "No authors found",
          description: "Try a different name variation.",
          variant: "destructive",
        })
      }
    } catch {
      setSearchResults([])
      toast({
        title: "Search failed",
        description: "Could not search Semantic Scholar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectAuthor = async (author: Author) => {
    setIsLoadingDetails(true)
    try {
      const details = await semanticScholarApi.getAuthorDetails(author.authorId)
      setSelectedAuthor(details)
    } catch {
      setSelectedAuthor(author)
      toast({
        title: "Limited details",
        description: "Could not load full author details, showing basic profile.",
      })
    } finally {
      setIsLoadingDetails(false)
      setStep("confirm")
    }
  }

  const handleConfirm = async () => {
    if (!selectedAuthor) {
      return
    }

    setIsConfirming(true)
    try {
      await userApi.linkAcademicProfile(selectedAuthor.authorId)
      setStep("success")
      toast({
        title: "Academic profile linked",
        description: "Your publications will be synced to your profile.",
      })
      setTimeout(() => {
        onComplete(selectedAuthor.authorId)
        onOpenChange(false)
      }, 900)
    } catch {
      toast({
        title: "Link failed",
        description: "Could not link this profile. Please try again.",
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
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Connect Academic Profile</DialogTitle>
          <DialogDescription>
            Link your Semantic Scholar profile to sync publications and citation metrics.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 px-1">
          {step === "search" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={searchQuery}
                    placeholder="Search by name..."
                    className="pl-9"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleSearch()
                      }
                    }}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Found {searchResults.length} potential matches
              </div>

              <ScrollArea className="h-[320px] border rounded-md p-2">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <User className="h-12 w-12 mb-2 opacity-20" />
                    <p>Search for your name to find your profile</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((author) => (
                      <Card
                        key={author.authorId}
                        className="cursor-pointer hover:bg-accent/40 transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                        onClick={() => handleSelectAuthor(author)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{author.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {author.affiliations?.join(", ") || "No affiliation listed"}
                              </p>
                            </div>
                            {author.hIndex !== undefined && (
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
                                onClick={(event) => event.stopPropagation()}
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
              <div className="bg-muted/40 p-6 rounded-lg border text-center">
                <h3 className="text-xl font-bold mb-2">{selectedAuthor.name}</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedAuthor.affiliations?.[0] || "No affiliation listed"}
                </p>

                <div className="flex justify-center gap-8 mb-5">
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
              </div>

              {isLoadingDetails && (
                <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading author details...
                </div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">Profile Linked</h3>
              <p className="text-muted-foreground">
                Your publication data will appear after sync completes.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "search" && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("search")}>
                Back to search
              </Button>
              <Button onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Confirm and Link"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
