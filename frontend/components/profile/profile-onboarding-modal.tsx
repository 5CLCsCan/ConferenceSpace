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
import { useTranslation } from "@/lib/i18n/translation-context"

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
  const { t } = useTranslation()
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
          title: t("runtime.components.profile.profile-onboarding-modal.prop_title_no_authors_found"),
          description: t("runtime.components.profile.profile-onboarding-modal.prop_description_try_a_different_name_variation"),
          variant: "destructive",
        })
      }
    } catch {
      setSearchResults([])
      toast({
        title: t("runtime.components.profile.profile-onboarding-modal.prop_title_search_failed"),
        description: t("runtime.components.profile.profile-onboarding-modal.prop_description_could_not_search_semantic_scholar_please"),
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
        title: t("runtime.components.profile.profile-onboarding-modal.prop_title_limited_details"),
        description: t("runtime.components.profile.profile-onboarding-modal.prop_description_could_not_load_full_author_details"),
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
        title: t("runtime.components.profile.profile-onboarding-modal.prop_title_academic_profile_linked"),
        description: t("runtime.components.profile.profile-onboarding-modal.prop_description_your_publications_will_be_synced_to"),
      })
      setTimeout(() => {
        onComplete(selectedAuthor.authorId)
        onOpenChange(false)
      }, 900)
    } catch {
      toast({
        title: t("runtime.components.profile.profile-onboarding-modal.prop_title_link_failed"),
        description: t("runtime.components.profile.profile-onboarding-modal.prop_description_could_not_link_this_profile_please"),
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
          <DialogTitle>{t("runtime.components.profile.profile-onboarding-modal.text_connect_academic_profile")}</DialogTitle>
          <DialogDescription>
            {t("runtime.components.profile.profile-onboarding-modal.text_link_your_semantic_scholar_profile_to")}{" "}</DialogDescription>
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
                    placeholder={t("runtime.components.profile.profile-onboarding-modal.placeholder_search_by_name")}
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
                {t("runtime.components.profile.profile-onboarding-modal.text_found")}{" "}{searchResults.length} {t("runtime.components.profile.profile-onboarding-modal.text_potential_matches")}{" "}</div>

              <ScrollArea className="h-[320px] border rounded-md p-2">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <User className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t("runtime.components.profile.profile-onboarding-modal.text_search_for_your_name_to_find")}</p>
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
                              <Badge variant="secondary">{t("runtime.components.profile.profile-onboarding-modal.text_h_index")}{" "}{author.hIndex}</Badge>
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
                                {t("runtime.components.profile.profile-onboarding-modal.text_view_profile")}{" "}<ExternalLink className="h-3 w-3" />
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
                    <div className="text-xs uppercase text-muted-foreground">{t("runtime.components.profile.profile-onboarding-modal.text_papers")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.citationCount || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">{t("runtime.components.profile.profile-onboarding-modal.text_citations")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.hIndex || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">{t("runtime.components.profile.profile-onboarding-modal.text_h_index_2")}</div>
                  </div>
                </div>
              </div>

              {isLoadingDetails && (
                <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("runtime.components.profile.profile-onboarding-modal.text_loading_author_details")}{" "}</div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">{t("runtime.components.profile.profile-onboarding-modal.text_profile_linked")}</h3>
              <p className="text-muted-foreground">
                {t("runtime.components.profile.profile-onboarding-modal.text_your_publication_data_will_appear_after")}{" "}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "search" && (
            <Button variant="ghost" onClick={handleSkip}>
              {t("runtime.components.profile.profile-onboarding-modal.text_skip_for_now")}{" "}</Button>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("search")}>
                {t("runtime.components.profile.profile-onboarding-modal.text_back_to_search")}{" "}</Button>
              <Button onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("runtime.components.profile.profile-onboarding-modal.text_linking")}{" "}</>
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
