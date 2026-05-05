"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api/client"
import {
  parseSemanticScholarAuthorInput,
  semanticScholarApi,
  type Author,
  type AuthorExternalIds,
  type AuthorWithPapers,
  type Paper,
} from "@/lib/api/semantic-scholar"
import { userApi } from "@/lib/api/user"
import { getProfileGradient, getProfileInitials } from "@/lib/profile/presentation"
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Globe,
  GraduationCap,
  Link2,
  Loader2,
  Search,
  User,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ProfileOnboardingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userName?: string
  onComplete: (authorId?: string) => void
}

type Step = "paste" | "search" | "confirm" | "success"

const AUTHOR_URL_EXAMPLES = [
  "https://www.semanticscholar.org/author/1741101",
  "1741101",
]

function isAlreadyLinkedProfileError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    /already linked to another account/i.test(error.message)
  )
}

function getHomepageDomain(homepage?: string) {
  if (!homepage) return null
  try {
    return new URL(homepage).hostname.replace(/^www\./, "")
  } catch {
    return homepage.replace(/^https?:\/\//, "").replace(/^www\./, "")
  }
}

function getPrimaryAffiliation(author: Author | AuthorWithPapers) {
  return (
    author.normalizedAffiliations?.[0]?.rorDisplayName ||
    author.affiliations?.[0] ||
    undefined
  )
}

function getSecondaryAffiliation(author: Author | AuthorWithPapers) {
  return (
    author.normalizedAffiliations?.[1]?.rorDisplayName ||
    author.affiliations?.[1] ||
    undefined
  )
}

function getExternalIdValue(externalIds: AuthorExternalIds | undefined, key: string) {
  const value = externalIds?.[key]
  if (Array.isArray(value)) {
    return value.find(Boolean) || null
  }
  return value || null
}

function AuthorPreviewPaper({
  paper,
  citationsLabel,
}: {
  paper: Paper
  citationsLabel: string
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-[1.35] text-[#1B3C53] line-clamp-2">
            {paper.title}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-1">
            {[paper.year, paper.venue, `${paper.citationCount || 0} ${citationsLabel.toLowerCase()}`]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
        {paper.url ? (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 shrink-0 items-center rounded-md border border-slate-200 px-2 text-[9px] font-bold uppercase tracking-wider text-[#1B3C53] transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View
          </a>
        ) : null}
      </div>
    </article>
  )
}

export function ProfileOnboardingModal({
  isOpen,
  onOpenChange,
  userName = "",
  onComplete,
}: ProfileOnboardingModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("paste")
  const [selectionSource, setSelectionSource] = useState<"paste" | "search">("paste")
  const [profileInput, setProfileInput] = useState("")
  const [profileInputError, setProfileInputError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(userName)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isResolvingProfile, setIsResolvingProfile] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [searchResults, setSearchResults] = useState<Author[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorWithPapers | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setStep("paste")
      setSelectionSource("paste")
      setProfileInput("")
      setProfileInputError(null)
      setSearchQuery(userName)
      setSearchError(null)
      setSearchResults([])
      setSelectedAuthor(null)
    }
  }, [isOpen, userName])

  const parsedInputState = useMemo(
    () => parseSemanticScholarAuthorInput(profileInput),
    [profileInput],
  )
  const derivedProfileInputError = useMemo(() => {
    if (!profileInput.trim()) {
      return null
    }

    if (parsedInputState.error === "unsupported_url") {
      return t(
        "runtime.components.profile.profile-onboarding-modal.prop_description_only_semantic_scholar_links_are_supported",
      )
    }

    if (parsedInputState.error === "invalid_format") {
      return t(
        "runtime.components.profile.profile-onboarding-modal.prop_description_enter_a_valid_semantic_scholar_profile_link",
      )
    }

    return null
  }, [parsedInputState.error, profileInput, t])
  const activeProfileInputError = profileInputError || derivedProfileInputError

  const canContinueWithPaste = !!parsedInputState.authorId

  const handleResolveAuthor = async (authorId: string, source: "paste" | "search") => {
    setIsResolvingProfile(true)
    try {
      const details = await semanticScholarApi.getAuthorDetails(authorId)
      setSelectedAuthor(details)
      setSelectionSource(source)
      setStep("confirm")
      if (source === "paste") {
        setProfileInputError(null)
      }
      setSearchError(null)
    } catch {
      if (source === "paste") {
        setProfileInputError(
          t(
            "runtime.components.profile.profile-onboarding-modal.prop_description_we_could_not_find_a_profile_for_that_link",
          ),
        )
      } else {
        toast({
          title: t("runtime.components.profile.profile-onboarding-modal.prop_title_limited_details"),
          description: t(
            "runtime.components.profile.profile-onboarding-modal.prop_description_could_not_load_full_author_details",
          ),
        })
      }
    } finally {
      setIsResolvingProfile(false)
    }
  }

  const handleContinueFromPaste = async () => {
    if (parsedInputState.error === "empty") {
      setProfileInputError(
        t("runtime.components.profile.profile-onboarding-modal.prop_description_paste_a_profile_link"),
      )
      return
    }

    if (parsedInputState.error === "unsupported_url") {
      setProfileInputError(
        t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_only_semantic_scholar_links_are_supported",
        ),
      )
      return
    }

    if (parsedInputState.error === "invalid_format" || !parsedInputState.authorId) {
      setProfileInputError(
        t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_enter_a_valid_semantic_scholar_profile_link",
        ),
      )
      return
    }

    await handleResolveAuthor(parsedInputState.authorId, "paste")
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError(
        t(
          "runtime.components.profile.profile-onboarding-modal.prop_description_enter_your_name_to_search",
        ),
      )
      return
    }

    setSearchError(null)
    setIsSearching(true)
    try {
      const response = await semanticScholarApi.searchAuthors(searchQuery.trim())
      setSearchResults(response.data || [])

      if ((response.data || []).length === 0) {
        setSearchError(
          t(
            "runtime.components.profile.profile-onboarding-modal.prop_description_try_a_different_name_variation",
          ),
        )
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
    } catch (error) {
      const isAlreadyLinked = isAlreadyLinkedProfileError(error)
      toast({
        title: isAlreadyLinked
          ? t("runtime.components.profile.profile-onboarding-modal.prop_title_profile_already_connected")
          : t("runtime.components.profile.profile-onboarding-modal.prop_title_link_failed"),
        description: isAlreadyLinked
          ? t(
              "runtime.components.profile.profile-onboarding-modal.prop_description_this_profile_has_already_been_connected_to_an_account_on_the_platform",
            )
          : t(
              "runtime.components.profile.profile-onboarding-modal.prop_description_could_not_link_this_profile_please",
            ),
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
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
      <DialogContent className="flex h-[86vh] max-h-[860px] max-w-[860px] flex-col overflow-hidden border-slate-200 bg-white p-0 sm:h-[82vh]">
        <DialogHeader className="border-b border-slate-200 bg-white px-5 py-4">
          <DialogTitle className="text-[16px] font-bold tracking-tight text-[#1B3C53]">
            {t("runtime.components.profile.profile-onboarding-modal.text_connect_academic_profile")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50/55 px-5 py-4">
          {step === "paste" && (
            <div className="mx-auto max-w-[760px]">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <div className="rounded-lg bg-[#1B3C53]/10 p-1.5 text-[#1B3C53]">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </div>
                  <span>{t("runtime.components.profile.profile-onboarding-modal.text_find_your_profile_on_semantic_scholar")}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
                  <span>{t("runtime.components.profile.profile-onboarding-modal.text_search_your_name_or_paper_title")}</span>
                  <span className="hidden text-slate-300 sm:inline">•</span>
                  <span>{t("runtime.components.profile.profile-onboarding-modal.text_open_your_author_page_and_paste_the_url")}</span>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="semantic-scholar-profile-input"
                    className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
                  >
                    {t(
                      "runtime.components.profile.profile-onboarding-modal.text_semantic_scholar_profile_url_or_author_id",
                    )}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="semantic-scholar-profile-input"
                        autoFocus
                        value={profileInput}
                        placeholder={t(
                          "runtime.components.profile.profile-onboarding-modal.placeholder_paste_profile_url_or_author_id",
                        )}
                        className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-[12px] shadow-none focus-visible:ring-[#1B3C53]/20"
                        onChange={(event) => {
                          setProfileInput(event.target.value)
                          if (profileInputError) {
                            setProfileInputError(null)
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && canContinueWithPaste) {
                            void handleContinueFromPaste()
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => void handleContinueFromPaste()}
                      disabled={!canContinueWithPaste || isResolvingProfile}
                      className="h-11 rounded-xl bg-[#1B3C53] px-4 text-[12px] hover:bg-[#234C6A]"
                    >
                      {isResolvingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("runtime.components.profile.profile-onboarding-modal.text_continue")
                      )}
                    </Button>
                  </div>
                  {activeProfileInputError ? (
                    <p className="mt-2 text-[10px] text-rose-600">{activeProfileInputError}</p>
                    ) : (
                      <div className="mt-2 space-y-1 text-[7px] leading-relaxed text-slate-400">
                        <p>
                          {t("runtime.components.profile.profile-onboarding-modal.text_example")}{" "}
                          {AUTHOR_URL_EXAMPLES[0]}
                      </p>
                      <p>
                        {t("runtime.components.profile.profile-onboarding-modal.text_or")}{" "}
                        {AUTHOR_URL_EXAMPLES[1]}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href="https://www.semanticscholar.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#1B3C53] hover:text-[#234C6A]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("runtime.components.profile.profile-onboarding-modal.text_open_semantic_scholar")}
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500 hover:text-[#1B3C53]"
                      onClick={() => {
                        setStep("search")
                        setProfileInputError(null)
                      }}
                    >
                      <Search className="h-3.5 w-3.5" />
                      {t("runtime.components.profile.profile-onboarding-modal.text_search_by_name_instead")}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 px-0 text-[11px] text-slate-500 hover:bg-transparent hover:text-[#1B3C53]"
                    onClick={() => {
                      onOpenChange(false)
                      onComplete(undefined)
                    }}
                  >
                    {t("runtime.components.profile.profile-onboarding-modal.text_skip_for_now")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "search" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-[#1B3C53]">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_choose_the_profile_that_best_matches_your_publications_and_affiliation",
                      )}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_search_results_show_affiliation_homepage_and_sample_publications",
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 px-2.5 text-[11px] text-slate-500 hover:text-[#1B3C53]"
                    onClick={() => setStep("paste")}
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    {t("runtime.components.profile.profile-onboarding-modal.text_back_to_paste")}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      autoFocus
                      value={searchQuery}
                      placeholder={t(
                        "runtime.components.profile.profile-onboarding-modal.placeholder_search_by_name",
                      )}
                      className="h-10 rounded-xl border-slate-200 pl-10 text-[12px] shadow-none"
                      onChange={(event) => {
                        setSearchQuery(event.target.value)
                        if (searchError) {
                          setSearchError(null)
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void handleSearch()
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => void handleSearch()}
                    disabled={isSearching}
                    className="h-10 rounded-xl bg-[#1B3C53] px-4 text-[12px] hover:bg-[#234C6A]"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("runtime.components.profile.profile-onboarding-modal.text_search")
                    )}
                  </Button>
                </div>
                {searchError ? (
                  <p className="mt-2 text-[10px] text-rose-600">{searchError}</p>
                ) : (
                  <p className="mt-2 text-[10px] text-slate-400">
                    {t("runtime.components.profile.profile-onboarding-modal.text_found")}{" "}
                    {searchResults.length}{" "}
                    {t(
                      "runtime.components.profile.profile-onboarding-modal.text_potential_matches",
                    )}
                  </p>
                )}
              </div>

              <ScrollArea className="h-[560px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center text-slate-500">
                    <User className="mb-3 h-10 w-10 opacity-30" />
                    <p className="text-[12px]">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_search_for_your_name_to_find",
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((author) => {
                      const primaryAffiliation = getPrimaryAffiliation(author)
                      const secondaryAffiliation = getSecondaryAffiliation(author)
                      const homepageDomain = getHomepageDomain(author.homepage)
                      const orcid = getExternalIdValue(author.externalIds, "ORCID")
                      const dblp = getExternalIdValue(author.externalIds, "DBLP")
                      const previewPapers = author.papers?.slice(0, 2) || []

                      return (
                        <button
                          key={author.authorId}
                          type="button"
                          className="group w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#1B3C53]/35 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3C53]/30 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.995]"
                          onClick={() => void handleResolveAuthor(author.authorId, "search")}
                        >
                          <div className="flex items-start gap-3 p-3.5">
                            {renderAuthorAvatar(author.name, author.authorId || author.name)}
                            <div className="min-w-0 flex-1 space-y-2.5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="text-[13px] font-semibold text-[#1B3C53] transition-colors group-hover:text-[#163246]">
                                    {author.name}
                                  </h3>
                                  <p className="mt-1 text-[11px] text-slate-600">
                                    {primaryAffiliation ||
                                      t(
                                        "runtime.components.profile.profile-onboarding-modal.text_no_affiliation_listed",
                                      )}
                                  </p>
                                  {secondaryAffiliation ? (
                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                      {secondaryAffiliation}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                                  >
                                    {t(
                                      "runtime.components.profile.profile-onboarding-modal.text_h_index_2",
                                    )}{" "}
                                    {author.hIndex || 0}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                                  >
                                    {author.paperCount || 0}{" "}
                                    {t(
                                      "runtime.components.profile.profile-onboarding-modal.text_papers",
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                                  >
                                    {author.citationCount || 0}{" "}
                                    {t(
                                      "runtime.components.profile.profile-onboarding-modal.text_citations",
                                    )}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {homepageDomain ? (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#456882]"
                                  >
                                    <Globe className="mr-1 h-3 w-3" />
                                    {homepageDomain}
                                  </Badge>
                                ) : null}
                                {orcid ? (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#456882]"
                                  >
                                    ORCID
                                  </Badge>
                                ) : null}
                                {dblp ? (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#456882]"
                                  >
                                    DBLP
                                  </Badge>
                                ) : null}
                              </div>

                              {previewPapers.length > 0 ? (
                                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                                  {previewPapers.map((paper) => (
                                    <div
                                      key={`${author.authorId}-${paper.paperId}`}
                                      className="rounded-lg bg-white px-3 py-2 transition-colors group-hover:bg-slate-50"
                                    >
                                      <p className="text-[11px] font-medium leading-relaxed text-slate-700 line-clamp-1">
                                        {paper.title}
                                      </p>
                                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                                        {[paper.year, paper.venue].filter(Boolean).join(" • ")}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              <div className="flex items-center justify-end pt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1B3C53] opacity-0 transition-opacity group-hover:opacity-100">
                                  {t(
                                    "runtime.components.profile.profile-onboarding-modal.text_select_this_profile",
                                  )}
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {step === "confirm" && selectedAuthor && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-gradient-to-br from-[#1B3C53] via-[#234C6A] to-[#456882] px-4 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      {renderAuthorAvatar(
                        selectedAuthor.name,
                        selectedAuthor.authorId || selectedAuthor.name,
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[17px] font-bold text-white">{selectedAuthor.name}</h3>
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-white/15 text-white/90 border border-white/20">
                            {t(
                              "runtime.components.profile.profile-onboarding-modal.text_semantic_scholar_profile",
                            )}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] text-white/80">
                          {getPrimaryAffiliation(selectedAuthor) ||
                            t(
                              "runtime.components.profile.profile-onboarding-modal.text_no_affiliation_listed",
                            )}
                        </p>
                        {getSecondaryAffiliation(selectedAuthor) ? (
                          <p className="mt-1 text-[10px] text-white/60">
                            {getSecondaryAffiliation(selectedAuthor)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {selectedAuthor.url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-white/20 bg-white/10 px-3 text-[11px] text-white hover:bg-white/20 hover:text-white"
                        asChild
                      >
                        <a href={selectedAuthor.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t(
                            "runtime.components.profile.profile-onboarding-modal.text_view_profile",
                          )}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2.5 px-4 py-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <div className="text-lg font-bold text-[#1B3C53]">
                      {selectedAuthor.paperCount || 0}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("runtime.components.profile.profile-onboarding-modal.text_papers")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <div className="text-lg font-bold text-[#1B3C53]">
                      {selectedAuthor.citationCount || 0}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("runtime.components.profile.profile-onboarding-modal.text_citations")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <div className="text-lg font-bold text-[#1B3C53]">
                      {selectedAuthor.hIndex || 0}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("runtime.components.profile.profile-onboarding-modal.text_h_index_2")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[12px] font-semibold text-[#1B3C53]">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_preview_publications",
                      )}
                    </h4>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {t(
                        "runtime.components.profile.profile-onboarding-modal.text_we_will_sync_the_publications_shown_here",
                      )}
                    </p>
                  </div>
                  {selectedAuthor.homepage ? (
                    <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#456882] sm:inline-flex">
                      {getHomepageDomain(selectedAuthor.homepage)}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {selectedAuthor.papers?.slice(0, 3).map((paper) => (
                    <AuthorPreviewPaper
                      key={paper.paperId}
                      paper={paper}
                      citationsLabel={t(
                        "runtime.components.profile.profile-onboarding-modal.text_citations",
                      )}
                    />
                  ))}
                </div>
              </div>
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
                )}
              </p>
            </div>
          )}
        </div>

        {step === "confirm" && (
          <DialogFooter className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-3">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 px-3 text-[11px]"
                  onClick={() => setStep(selectionSource === "search" ? "search" : "paste")}
                >
                  {selectionSource === "search"
                    ? t("runtime.components.profile.profile-onboarding-modal.text_back_to_search")
                    : t("runtime.components.profile.profile-onboarding-modal.text_back_to_paste")}
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 px-2.5 text-[11px]"
                  onClick={() => setStep(selectionSource === "search" ? "search" : "paste")}
                >
                  {t("runtime.components.profile.profile-onboarding-modal.text_this_is_not_me")}
                </Button>
              </div>
              <Button
                onClick={() => void handleConfirm()}
                disabled={isConfirming}
                className="h-9 px-3.5 text-[12px]"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("runtime.components.profile.profile-onboarding-modal.text_linking")}
                  </>
                ) : (
                  t("runtime.components.profile.profile-onboarding-modal.text_link_this_profile")
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
