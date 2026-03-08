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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { semanticScholarApi, type Author, type AuthorWithPapers } from "@/lib/api/semantic-scholar"
import { userApi } from "@/lib/api/user"
import { getProfileGradient, getProfileInitials } from "@/lib/profile/presentation"
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
          title: t(
            "runtime.components.profile.profile-onboarding-modal.prop_title_no_authors_found",
          ),
          description: t(
            "runtime.components.profile.profile-onboarding-modal.prop_description_try_a_different_name_variation",
          ),
          variant: "destructive",
        })
      }
    } catch {
      setSearchResults([])
      toast({
        title: t("runtime.components.profile.profile-onboarding-modal.prop_title_search_failed"),
        description: t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_could_not_search_semantic_scholar_please",
        ),
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
        description: t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_could_not_load_full_author_details",
        ),
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
        title: t(
          "runtime.components.profile.profile-onboarding-modal.prop_title_academic_profile_linked",
        ),
        description: t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_your_publications_will_be_synced_to",
        ),
      })
      setTimeout(() => {
        onComplete(selectedAuthor.authorId)
        onOpenChange(false)
      }, 900)
    } catch {
      toast({
        title: t("runtime.components.profile.profile-onboarding-modal.prop_title_link_failed"),
        description: t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_could_not_link_this_profile_please",
        ),
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

  const renderAuthorAvatar = (name: string, seed: string) => (
    <Avatar className="h-12 w-12 border border-white/70 shadow-sm">
      <AvatarFallback
        className="text-sm font-semibold text-white"
        style={{ backgroundImage: getProfileGradient(seed) }}
      >
        {getProfileInitials(name)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t("runtime.components.profile.profile-onboarding-modal.text_connect_academic_profile")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "runtime.components.profile.profile-onboarding-modal.text_link_your_semantic_scholar_profile_to",
            )}{" "}
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
                    placeholder={t(
                      "runtime.components.profile.profile-onboarding-modal.placeholder_search_by_name",
                    )}
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
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("runtime.components.profile.profile-onboarding-modal.text_search")
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {t("runtime.components.profile.profile-onboarding-modal.text_found")}{" "}
                {searchResults.length}{" "}
                {t(
                  "runtime.components.profile.profile-onboarding-modal.text_potential_matches",
                )}{" "}
              </div>

              <ScrollArea className="h-[320px] border rounded-md p-2">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <User className="h-12 w-12 mb-2 opacity-20" />
                    <p>
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_search_for_your_name_to_find",
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((author) => (
                      <Card
                        key={author.authorId}
                        className="cursor-pointer rounded-2xl border border-slate-200 transition-colors hover:border-slate-300 hover:bg-accent/40"
                        onClick={() => handleSelectAuthor(author)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {renderAuthorAvatar(author.name, author.authorId || author.name)}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-semibold">{author.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {author.affiliations?.join(", ") ||
                                      t(
                                        "runtime.components.profile.profile-onboarding-modal.text_no_affiliation_listed",
                                      )}
                                  </p>
                                </div>
                                {author.hIndex !== undefined && (
                                  <Badge variant="secondary" className="rounded-full">
                                    {t(
                                      "runtime.components.profile.profile-onboarding-modal.text_h_index",
                                    )}{" "}
                                    {author.hIndex}
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="rounded-full">
                                  <BookOpen className="mr-1 h-3 w-3" />
                                  {author.paperCount || 0}{" "}
                                  {t("runtime.components.profile.profile-onboarding-modal.text_papers")}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full">
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  {author.citationCount || 0}{" "}
                                  {t(
                                    "runtime.components.profile.profile-onboarding-modal.text_citations",
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-end">
                            {author.url && (
                              <a
                                href={author.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                {t(
                                  "runtime.components.profile.profile-onboarding-modal.text_view_profile",
                                )}{" "}
                                <ExternalLink className="h-3 w-3" />
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
              <div className="rounded-2xl border bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    {renderAuthorAvatar(
                      selectedAuthor.name,
                      selectedAuthor.authorId || selectedAuthor.name,
                    )}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold">{selectedAuthor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedAuthor.affiliations?.[0] ||
                            t(
                              "runtime.components.profile.profile-onboarding-modal.text_no_affiliation_listed",
                            )}
                        </p>
                      </div>
                      {selectedAuthor.affiliations?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedAuthor.affiliations.slice(0, 3).map((affiliation) => (
                            <Badge key={affiliation} variant="secondary" className="rounded-full">
                              {affiliation}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {selectedAuthor.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedAuthor.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {t("runtime.components.profile.profile-onboarding-modal.text_view_profile")}
                      </a>
                    </Button>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.paperCount || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">
                      {t("runtime.components.profile.profile-onboarding-modal.text_papers")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.citationCount || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">
                      {t("runtime.components.profile.profile-onboarding-modal.text_citations")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedAuthor.hIndex || 0}</div>
                    <div className="text-xs uppercase text-muted-foreground">
                      {t("runtime.components.profile.profile-onboarding-modal.text_h_index_2")}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAuthor.papers?.length ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_preview_publications",
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_we_will_sync_the_publications_shown_here",
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {selectedAuthor.papers.slice(0, 3).map((paper) => (
                      <div key={paper.paperId} className="rounded-2xl border bg-white p-4">
                        <p className="font-medium">{paper.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[paper.year, paper.venue, `${paper.citationCount || 0} ${t("runtime.components.profile.profile-onboarding-modal.text_citations").toLowerCase()}`]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {isLoadingDetails && (
                <div className="flex items-center justify-center py-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t(
                    "runtime.components.profile.profile-onboarding-modal.text_loading_author_details",
                  )}{" "}
                </div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">
                {t("runtime.components.profile.profile-onboarding-modal.text_profile_linked")}
              </h3>
              <p className="text-muted-foreground">
                {t(
                  "runtime.components.profile.profile-onboarding-modal.text_your_publication_data_will_appear_after",
                )}{" "}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "search" && (
            <Button variant="ghost" onClick={handleSkip}>
              {t("runtime.components.profile.profile-onboarding-modal.text_skip_for_now")}{" "}
            </Button>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("search")}>
                {t("runtime.components.profile.profile-onboarding-modal.text_back_to_search")}{" "}
              </Button>
              <Button onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("runtime.components.profile.profile-onboarding-modal.text_linking")}{" "}
                  </>
                ) : (
                  t("runtime.components.profile.profile-onboarding-modal.text_confirm_and_link")
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
