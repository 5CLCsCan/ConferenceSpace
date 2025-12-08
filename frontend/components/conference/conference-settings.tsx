"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  updateConference,
  updateConferenceStatus,
  getConferenceById,
  type Conference,
} from "@/lib/api/conferences"
import { Loader2, X, Plus, Calendar, FileText, Users, Tag, Settings, Save } from "lucide-react"
import { typography, spacing } from "@/lib/typography"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n/translation-context"

type SettingsSection =
  | "general"
  | "dates"
  | "cfp"
  | "co-chairs"
  | "tracks-domains"
  | "submission"
  | "advanced"

// Helper to format date for datetime-local input
function formatDateForInput(dateString?: string): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ""
  }
}

interface ConferenceSettingsProps {
  conferenceId: string
  initialConference: Conference | null
  onUpdate?: (conference: Conference) => void
}

export function ConferenceSettings({
  conferenceId,
  initialConference,
  onUpdate,
}: ConferenceSettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general")
  const [conference, setConference] = useState<Conference | null>(initialConference)
  const [isLoading, setIsLoading] = useState(!initialConference)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const form = useForm({
    defaultValues: {
      title: conference?.name || "",
      acronym: conference?.acronym || "",
      description: conference?.description || "",
      website: conference?.website || "",
      venue: conference?.location || "",
      startDate: formatDateForInput(conference?.configurations?.start_date),
      endDate: formatDateForInput(conference?.configurations?.end_date),
      abstractDeadline: formatDateForInput(
        conference?.configurations?.abstract_submission_deadline,
      ),
      submissionDeadline: formatDateForInput(
        conference?.configurations?.full_paper_submission_deadline,
      ),
      cameraReadyDeadline: formatDateForInput(conference?.configurations?.camera_ready_deadline),
      callForPaperText: conference?.call_for_paper_text || "",
      coChairs: conference?.co_chairs || [],
      tracks: conference?.tracks || [],
      domains: conference?.domain || [],
      reviewType: conference?.configurations?.review_type || "double-blind",
      submissionFormat: conference?.configurations?.submission_format || "PDF",
      maximumPages: conference?.configurations?.maximum_pages || 8,
      haveCOI: conference?.configurations?.have_coi ?? true,
      requireCompleteProfile: conference?.configurations?.require_complete_author_profile ?? true,
      allowWithdrawals: conference?.configurations?.allow_paper_withdrawls ?? true,
      status: conference?.status || "open",
    },
  })

  useEffect(() => {
    if (initialConference) {
      setConference(initialConference)
      form.reset({
        title: initialConference.name || "",
        acronym: initialConference.acronym || "",
        description: initialConference.description || "",
        website: initialConference.website || "",
        venue: initialConference.location || "",
        startDate: formatDateForInput(initialConference.configurations?.start_date),
        endDate: formatDateForInput(initialConference.configurations?.end_date),
        abstractDeadline: formatDateForInput(
          initialConference.configurations?.abstract_submission_deadline,
        ),
        submissionDeadline: formatDateForInput(
          initialConference.configurations?.full_paper_submission_deadline,
        ),
        cameraReadyDeadline: formatDateForInput(
          initialConference.configurations?.camera_ready_deadline,
        ),
        callForPaperText: initialConference.call_for_paper_text || "",
        coChairs: initialConference.co_chairs || [],
        tracks: initialConference.tracks || [],
        domains: initialConference.domain || [],
        reviewType: initialConference.configurations?.review_type || "double-blind",
        submissionFormat: initialConference.configurations?.submission_format || "PDF",
        maximumPages: initialConference.configurations?.maximum_pages || 8,
        haveCOI: initialConference.configurations?.have_coi ?? true,
        requireCompleteProfile:
          initialConference.configurations?.require_complete_author_profile ?? true,
        allowWithdrawals: initialConference.configurations?.allow_paper_withdrawls ?? true,
        status: initialConference.status || "open",
      })
      setIsLoading(false)
    } else {
      loadConference()
    }
  }, [conferenceId, initialConference])

  const loadConference = async () => {
    setIsLoading(true)
    const response = await getConferenceById(conferenceId)
    if (response.data) {
      setConference(response.data)
      form.reset({
        title: response.data.name || "",
        acronym: response.data.acronym || "",
        description: response.data.description || "",
        website: response.data.website || "",
        venue: response.data.location || "",
        startDate: formatDateForInput(response.data.configurations?.start_date),
        endDate: formatDateForInput(response.data.configurations?.end_date),
        abstractDeadline: formatDateForInput(
          response.data.configurations?.abstract_submission_deadline,
        ),
        submissionDeadline: formatDateForInput(
          response.data.configurations?.full_paper_submission_deadline,
        ),
        cameraReadyDeadline: formatDateForInput(
          response.data.configurations?.camera_ready_deadline,
        ),
        callForPaperText: response.data.call_for_paper_text || "",
        coChairs: response.data.co_chairs || [],
        tracks: response.data.tracks || [],
        domains: response.data.domain || [],
        reviewType: response.data.configurations?.review_type || "double-blind",
        submissionFormat: response.data.configurations?.submission_format || "PDF",
        maximumPages: response.data.configurations?.maximum_pages || 8,
        haveCOI: response.data.configurations?.have_coi ?? true,
        requireCompleteProfile:
          response.data.configurations?.require_complete_author_profile ?? true,
        allowWithdrawals: response.data.configurations?.allow_paper_withdrawls ?? true,
        status: response.data.status || "open",
      })
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const values = form.getValues()

    try {
      const updatePayload: any = {
        title: values.title,
        acronym: values.acronym,
        description: values.description,
        venue: values.venue,
        domain: values.domains,
        tracks: values.tracks,
        co_chairs: values.coChairs,
        configurations: {
          start_date: values.startDate ? new Date(values.startDate).toISOString() : undefined,
          end_date: values.endDate ? new Date(values.endDate).toISOString() : undefined,
          abstract_submission_deadline: values.abstractDeadline
            ? new Date(values.abstractDeadline).toISOString()
            : undefined,
          full_paper_submission_deadline: values.submissionDeadline
            ? new Date(values.submissionDeadline).toISOString()
            : undefined,
          camera_ready_deadline: values.cameraReadyDeadline
            ? new Date(values.cameraReadyDeadline).toISOString()
            : undefined,
          call_for_paper_text: values.callForPaperText || undefined,
          review_type: values.reviewType,
          submission_format: values.submissionFormat,
          maximum_pages: values.maximumPages,
          have_coi: values.haveCOI,
          require_complete_author_profile: values.requireCompleteProfile,
          allow_paper_withdrawls: values.allowWithdrawals,
        },
      }

      // Update conference settings
      const response = await updateConference(conferenceId, updatePayload)

      if (response.error) {
        toast({
          title: t("common.messages.error"),
          description: response.error,
          variant: "destructive",
        })
        return
      }

      // Update status separately if it changed (status has its own endpoint)
      let finalConference = response.data
      if (response.data && values.status !== conference?.status) {
        const statusResponse = await updateConferenceStatus(conferenceId, values.status as any)
        if (statusResponse.error) {
          toast({
            title: t("common.messages.error"),
            description: t("dashboard.conference.settings.messages.statusUpdateWarning", {
              error: statusResponse.error,
            }),
            variant: "destructive",
          })
        } else if (statusResponse.data) {
          finalConference = statusResponse.data
        }
      }

      if (finalConference) {
        setConference(finalConference)
        setHasChanges(false)
        toast({
          title: t("common.messages.success"),
          description: t("dashboard.conference.settings.messages.saveSuccess"),
        })
        onUpdate?.(finalConference)
      }
    } catch (error) {
      toast({
        title: t("common.messages.error"),
        description:
          error instanceof Error
            ? error.message
            : t("dashboard.conference.settings.messages.saveError"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const sections: Array<{ id: SettingsSection; labelKey: string; icon: React.ReactNode }> = [
    {
      id: "general",
      labelKey: "dashboard.conference.settings.sections.general",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "dates",
      labelKey: "dashboard.conference.settings.sections.dates",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "cfp",
      labelKey: "dashboard.conference.settings.sections.cfp",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "co-chairs",
      labelKey: "dashboard.conference.settings.sections.coChairs",
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "tracks-domains",
      labelKey: "dashboard.conference.settings.sections.tracksDomains",
      icon: <Tag className="w-4 h-4" />,
    },
    {
      id: "submission",
      labelKey: "dashboard.conference.settings.sections.submission",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "advanced",
      labelKey: "dashboard.conference.settings.sections.advanced",
      icon: <Settings className="w-4 h-4" />,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {section.icon}
              <span>{t(section.labelKey)}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card className="p-6">
          {activeSection === "general" && <GeneralSection form={form} />}
          {activeSection === "dates" && <DatesSection form={form} />}
          {activeSection === "cfp" && <CfPSection form={form} />}
          {activeSection === "co-chairs" && <CoChairsSection form={form} conference={conference} />}
          {activeSection === "tracks-domains" && <TracksDomainsSection form={form} />}
          {activeSection === "submission" && <SubmissionSection form={form} />}
          {activeSection === "advanced" && <AdvancedSection form={form} />}

          <Separator className="my-6" />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                form.reset()
                setHasChanges(false)
              }}
            >
              {t("dashboard.conference.settings.actions.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("dashboard.conference.settings.actions.saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t("dashboard.conference.settings.actions.saveChanges")}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// General Settings Section
function GeneralSection({ form }: { form: any }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.general.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.general.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">{t("dashboard.conference.settings.general.conferenceName")}</Label>
          <Input
            id="title"
            className="mt-2"
            {...form.register("title", { required: true })}
            placeholder="International Conference on..."
          />
        </div>

        <div>
          <Label htmlFor="acronym">{t("dashboard.conference.settings.general.acronym")}</Label>
          <Input
            id="acronym"
            className="mt-2"
            {...form.register("acronym", { required: true })}
            placeholder="ICAI"
          />
        </div>

        <div>
          <Label htmlFor="description">
            {t("dashboard.conference.settings.general.descriptionLabel")}
          </Label>
          <Textarea
            id="description"
            className="mt-2"
            {...form.register("description")}
            placeholder="A brief description of your conference..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="website">{t("dashboard.conference.settings.general.website")}</Label>
          <Input
            id="website"
            type="url"
            className="mt-2"
            {...form.register("website")}
            placeholder="https://conference.example.com"
          />
        </div>

        <div>
          <Label htmlFor="venue">{t("dashboard.conference.settings.general.venue")}</Label>
          <Input
            id="venue"
            className="mt-2"
            {...form.register("venue")}
            placeholder="City, Country or Virtual"
          />
        </div>
      </div>
    </div>
  )
}

// Dates & Deadlines Section
function DatesSection({ form }: { form: any }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.dates.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.dates.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="startDate">{t("dashboard.conference.settings.dates.startDate")}</Label>
          <Input
            id="startDate"
            type="datetime-local"
            className="mt-2"
            {...form.register("startDate")}
          />
        </div>

        <div>
          <Label htmlFor="endDate">{t("dashboard.conference.settings.dates.endDate")}</Label>
          <Input
            id="endDate"
            type="datetime-local"
            className="mt-2"
            {...form.register("endDate")}
          />
        </div>

        <div>
          <Label htmlFor="abstractDeadline">
            {t("dashboard.conference.settings.dates.abstractDeadline")}
          </Label>
          <Input
            id="abstractDeadline"
            type="datetime-local"
            className="mt-2"
            {...form.register("abstractDeadline")}
          />
        </div>

        <div>
          <Label htmlFor="submissionDeadline">
            {t("dashboard.conference.settings.dates.submissionDeadline")}
          </Label>
          <Input
            id="submissionDeadline"
            type="datetime-local"
            className="mt-2"
            {...form.register("submissionDeadline")}
          />
        </div>

        <div>
          <Label htmlFor="cameraReadyDeadline">
            {t("dashboard.conference.settings.dates.cameraReadyDeadline")}
          </Label>
          <Input
            id="cameraReadyDeadline"
            type="datetime-local"
            className="mt-2"
            {...form.register("cameraReadyDeadline")}
          />
        </div>
      </div>
    </div>
  )
}

// Call for Papers Section
function CfPSection({ form }: { form: any }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.cfp.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.cfp.description")}
        </p>
      </div>

      <div>
        <Label htmlFor="callForPaperText">{t("dashboard.conference.settings.cfp.text")}</Label>
        <Textarea
          id="callForPaperText"
          className="mt-2 font-mono text-sm"
          {...form.register("callForPaperText")}
          placeholder="Enter the call for papers content..."
          rows={12}
        />
        <p className={`mt-1 ${typography.bodySmall} text-gray-500`}>
          {t("dashboard.conference.settings.cfp.markdownHint")}
        </p>
      </div>
    </div>
  )
}

// Co-Chairs Section
function CoChairsSection({ form, conference }: { form: any; conference: Conference | null }) {
  const { t } = useTranslation()
  const [newCoChairEmail, setNewCoChairEmail] = useState("")
  const coChairs = form.watch("coChairs") || []

  const addCoChair = () => {
    if (newCoChairEmail.trim() && !coChairs.includes(newCoChairEmail.trim())) {
      form.setValue("coChairs", [...coChairs, newCoChairEmail.trim()])
      setNewCoChairEmail("")
    }
  }

  const removeCoChair = (email: string) => {
    form.setValue(
      "coChairs",
      coChairs.filter((e: string) => e !== email),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.coChairs.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.coChairs.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="chair">{t("dashboard.conference.settings.coChairs.mainChair")}</Label>
          <Input id="chair" value={conference?.chair || ""} disabled className="mt-2 bg-gray-50" />
          <p className={`mt-1 ${typography.bodySmall} text-gray-500`}>
            {t("dashboard.conference.settings.coChairs.mainChairHint")}
          </p>
        </div>

        <div>
          <Label htmlFor="newCoChair">
            {t("dashboard.conference.settings.coChairs.addCoChair")}
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="newCoChair"
              type="email"
              value={newCoChairEmail}
              onChange={(e) => setNewCoChairEmail(e.target.value)}
              placeholder={t("dashboard.conference.settings.coChairs.placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCoChair()
                }
              }}
            />
            <Button type="button" onClick={addCoChair}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {coChairs.length > 0 && (
          <div className="space-y-2">
            <Label>{t("dashboard.conference.settings.coChairs.currentCoChairs")}</Label>
            <div className="space-y-2">
              {coChairs.map((email: string) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm">{email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCoChair(email)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Tracks & Domains Section
function TracksDomainsSection({ form }: { form: any }) {
  const { t } = useTranslation()
  const [newTrack, setNewTrack] = useState("")
  const [newDomain, setNewDomain] = useState("")
  const tracks = form.watch("tracks") || []
  const domains = form.watch("domains") || []

  const addTrack = () => {
    if (newTrack.trim() && !tracks.includes(newTrack.trim())) {
      form.setValue("tracks", [...tracks, newTrack.trim()])
      setNewTrack("")
    }
  }

  const removeTrack = (track: string) => {
    form.setValue(
      "tracks",
      tracks.filter((t: string) => t !== track),
    )
  }

  const addDomain = () => {
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      form.setValue("domains", [...domains, newDomain.trim()])
      setNewDomain("")
    }
  }

  const removeDomain = (domain: string) => {
    form.setValue(
      "domains",
      domains.filter((d: string) => d !== domain),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.tracksDomains.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.tracksDomains.description")}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="newTrack">
            {t("dashboard.conference.settings.tracksDomains.tracks")}
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="newTrack"
              value={newTrack}
              onChange={(e) => setNewTrack(e.target.value)}
              placeholder={t("dashboard.conference.settings.tracksDomains.trackPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTrack()
                }
              }}
            />
            <Button type="button" onClick={addTrack}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tracks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tracks.map((track: string) => (
                <div
                  key={track}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <span>{track}</span>
                  <button
                    type="button"
                    onClick={() => removeTrack(track)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="newDomain">
            {t("dashboard.conference.settings.tracksDomains.domains")}
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="newDomain"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder={t("dashboard.conference.settings.tracksDomains.domainPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addDomain()
                }
              }}
            />
            <Button type="button" onClick={addDomain}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {domains.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {domains.map((domain: string) => (
                <div
                  key={domain}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <span>{domain}</span>
                  <button
                    type="button"
                    onClick={() => removeDomain(domain)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Submission Settings Section
function SubmissionSection({ form }: { form: any }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.submission.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.submission.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="reviewType">
            {t("dashboard.conference.settings.submission.reviewType")}
          </Label>
          <Select
            value={form.watch("reviewType")}
            onValueChange={(value) => form.setValue("reviewType", value)}
          >
            <SelectTrigger id="reviewType" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single-blind">
                {t("dashboard.conference.settings.submission.reviewTypeSingle")}
              </SelectItem>
              <SelectItem value="double-blind">
                {t("dashboard.conference.settings.submission.reviewTypeDouble")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="submissionFormat">
            {t("dashboard.conference.settings.submission.submissionFormat")}
          </Label>
          <Input
            id="submissionFormat"
            className="mt-2"
            {...form.register("submissionFormat")}
            placeholder={t("dashboard.conference.settings.submission.submissionFormatPlaceholder")}
          />
        </div>

        <div>
          <Label htmlFor="maximumPages">
            {t("dashboard.conference.settings.submission.maximumPages")}
          </Label>
          <Input
            id="maximumPages"
            type="number"
            className="mt-2"
            {...form.register("maximumPages", { valueAsNumber: true })}
            min={1}
            max={50}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="requireCompleteProfile">
              {t("dashboard.conference.settings.submission.requireCompleteProfile")}
            </Label>
            <p className={`${typography.bodySmall} text-gray-500`}>
              {t("dashboard.conference.settings.submission.requireCompleteProfileHint")}
            </p>
          </div>
          <Switch
            id="requireCompleteProfile"
            checked={form.watch("requireCompleteProfile")}
            onCheckedChange={(checked) => form.setValue("requireCompleteProfile", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allowWithdrawals">
              {t("dashboard.conference.settings.submission.allowWithdrawals")}
            </Label>
            <p className={`${typography.bodySmall} text-gray-500`}>
              {t("dashboard.conference.settings.submission.allowWithdrawalsHint")}
            </p>
          </div>
          <Switch
            id="allowWithdrawals"
            checked={form.watch("allowWithdrawals")}
            onCheckedChange={(checked) => form.setValue("allowWithdrawals", checked)}
          />
        </div>
      </div>
    </div>
  )
}

// Advanced Section
function AdvancedSection({ form }: { form: any }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${typography.h3} ${typography.bold} mb-1`}>
          {t("dashboard.conference.settings.advanced.title")}
        </h2>
        <p className={`${typography.bodySmall} text-gray-600`}>
          {t("dashboard.conference.settings.advanced.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="status">{t("dashboard.conference.settings.advanced.status")}</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value)}
          >
            <SelectTrigger id="status" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                {t("dashboard.conference.settings.advanced.statusOpen")}
              </SelectItem>
              <SelectItem value="reviewing">
                {t("dashboard.conference.settings.advanced.statusReviewing")}
              </SelectItem>
              <SelectItem value="completed">
                {t("dashboard.conference.settings.advanced.statusCompleted")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="haveCOI">{t("dashboard.conference.settings.advanced.haveCOI")}</Label>
            <p className={`${typography.bodySmall} text-gray-500`}>
              {t("dashboard.conference.settings.advanced.haveCOIHint")}
            </p>
          </div>
          <Switch
            id="haveCOI"
            checked={form.watch("haveCOI")}
            onCheckedChange={(checked) => form.setValue("haveCOI", checked)}
          />
        </div>
      </div>
    </div>
  )
}
