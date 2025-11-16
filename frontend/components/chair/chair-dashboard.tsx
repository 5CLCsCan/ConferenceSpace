import { ConferenceTableRow, ConferenceCard } from "@/components/chair/conference-table-row"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { Search, Filter, X } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { listConferences } from "@/lib/api/conferences"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { typography, spacing, iconSizes } from "@/lib/typography"

type ViewMode = "your" | "discover"
type StatusFilter = "active" | "upcoming" | "archived" | ""

export default function ChairDashboard() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>("your")
  const [allConferences, setAllConferences] = useState<
    Array<{
      id: string
      name: string
      acronym: string
      dates: string
      status: "active" | "upcoming" | "archived"
      submissions: number
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        setLoading(true)
        const filters =
          viewMode === "your" ? { limit: 50, myConferences: true, role: "chair" } : { limit: 50 }
        const response = await listConferences(filters)

        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          // Transform API data to component format
          let transformedConferences = response.data.conferences.map((conf) => ({
            id: conf.id,
            name: conf.name,
            acronym: conf.acronym,
            dates: conf.conference_date
              ? new Date(conf.conference_date).toLocaleDateString()
              : "TBD",
            status: conf.status as "active" | "upcoming" | "archived",
            submissions: 0, // TODO: Get actual submission count
            chair: conf.chair,
            primary_contact: conf.primary_contact,
            area_chair: conf.area_chair,
          }))

          // In "discover" mode, filter out conferences created by the current user
          if (viewMode === "discover" && user) {
            transformedConferences = transformedConferences.filter((conf) => {
              const isCreatedByUser =
                conf.chair === user.email ||
                (user.id &&
                  (conf.primary_contact?.toString() === user.id ||
                    conf.area_chair?.toString() === user.id))
              return !isCreatedByUser
            })
          }

          // Remove the extra fields before setting state
          const finalConferences = transformedConferences.map(
            ({ chair, primary_contact, area_chair, ...rest }) => rest,
          )
          setAllConferences(finalConferences)
        }
      } catch (err) {
        setError(t("dashboard.chair.dashboard.messages.error"))
      } finally {
        setLoading(false)
      }
    }

    fetchConferences()
  }, [viewMode, t, user])

  // Filter conferences based on search and status
  const conferences = useMemo(() => {
    let filtered = [...allConferences]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (conf) =>
          conf.name.toLowerCase().includes(query) || conf.acronym.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((conf) => conf.status === statusFilter)
    }

    return filtered
  }, [allConferences, searchQuery, statusFilter])

  const handleRemoveStatusFilter = () => {
    setStatusFilter("")
  }

  const hasActiveFilters = statusFilter !== ""
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          {/* <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, Administrator.
          </h1>
          <p className="text-base text-muted-foreground mb-6">
            Your central hub for managing all academic conferences.
          </p> */}

          <div className="flex flex-wrap gap-4">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push(`/dashboard/chair/create-conference`)}
            >
              {t("dashboard.chair.dashboard.createNewConference")}
            </Button>
          </div>
        </section>

        {/* Conference Management List */}
        <section className="mb-12">
          <div className={`flex items-center ${spacing.gap.md} mb-4`}>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 py-2 rounded-md ${
                viewMode === "your"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => {
                setViewMode("your")
                setSearchQuery("")
                setStatusFilter("")
              }}
            >
              {t("dashboard.chair.dashboard.yourConferences")}
            </h2>
            <span className="text-muted-foreground">/</span>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 py-2 rounded-md ${
                viewMode === "discover"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => {
                setViewMode("discover")
                setSearchQuery("")
                setStatusFilter("")
              }}
            >
              {t("dashboard.chair.dashboard.discoverConferences")}
            </h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-4">
            <div className={`relative flex items-center ${spacing.gap.sm} border rounded-md bg-background`}>
              <Search className={`absolute left-3 ${iconSizes.sm} text-muted-foreground`} />
              <div className={`flex-1 flex items-center ${spacing.gap.sm} pl-10 pr-2 py-2`}>
                {hasActiveFilters && (
                  <div className={`flex items-center ${spacing.gap.sm} flex-wrap`}>
                    {statusFilter && (
                      <Badge variant="secondary" className={spacing.gap.tight}>
                        {statusFilter === "active"
                          ? "Accepting Submissions"
                          : statusFilter === "upcoming"
                            ? "In Review"
                            : "Archived"}
                        <button
                          onClick={handleRemoveStatusFilter}
                          className="ml-1 hover:bg-muted rounded-full"
                        >
                          <X className={iconSizes.xs} />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
                <Input
                  placeholder={
                    hasActiveFilters ? "" : t("dashboard.chair.dashboard.searchPlaceholder")
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!border-0 focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!ring-offset-0 !shadow-none h-auto p-0 flex-1 min-w-[120px]"
                />
              </div>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 mr-2 ${hasActiveFilters ? "text-primary" : ""}`}
                  >
                    <Filter className={iconSizes.sm} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className={spacing.subsection}>
                    <div>
                      <h4 className={`${typography.semibold} ${typography.body} mb-3`}>Status</h4>
                      <div className={spacing.item}>
                        <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
                          <Checkbox
                            checked={statusFilter === "active"}
                            onCheckedChange={(checked) => setStatusFilter(checked ? "active" : "")}
                          />
                          <span className={typography.body}>Accepting Submissions</span>
                        </label>
                        <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
                          <Checkbox
                            checked={statusFilter === "upcoming"}
                            onCheckedChange={(checked) =>
                              setStatusFilter(checked ? "upcoming" : "")
                            }
                          />
                          <span className={typography.body}>In Review</span>
                        </label>
                        <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
                          <Checkbox
                            checked={statusFilter === "archived"}
                            onCheckedChange={(checked) =>
                              setStatusFilter(checked ? "archived" : "")
                            }
                          />
                          <span className={typography.body}>Archived</span>
                        </label>
                      </div>
                    </div>
                    <div className={`flex justify-end ${spacing.gap.sm} pt-2 border-t`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("")
                          setFilterOpen(false)
                        }}
                      >
                        Clear
                      </Button>
                      <Button size="sm" onClick={() => setFilterOpen(false)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Desktop Table */}
          <Card className="shadow-sm overflow-hidden hidden md:block">
            {loading ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <div className={typography.muted}>
                  {t("dashboard.chair.dashboard.messages.loading")}
                </div>
              </div>
            ) : error ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <div className={`text-destructive ${typography.body}`}>
                  {t("dashboard.chair.dashboard.messages.error")}: {error}
                </div>
              </div>
            ) : conferences.length === 0 ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <div className={typography.muted}>
                  {t("dashboard.chair.dashboard.messages.noConferencesFound")}
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className={`py-3 px-4 text-left ${typography.body} ${typography.semibold} text-foreground`}>
                      {t("dashboard.chair.dashboard.tableHeaders.conferenceName")}
                    </th>
                    <th className={`py-3 px-4 text-left ${typography.body} ${typography.semibold} text-foreground`}>
                      {t("dashboard.chair.dashboard.tableHeaders.dates")}
                    </th>
                    <th className={`py-3 px-4 text-left ${typography.body} ${typography.semibold} text-foreground`}>
                      {t("dashboard.chair.dashboard.tableHeaders.status")}
                    </th>
                    <th className={`py-3 px-4 text-left ${typography.body} ${typography.semibold} text-foreground`}>
                      {t("dashboard.chair.dashboard.tableHeaders.submissions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conferences.map((conference, index) => (
                    <ConferenceTableRow key={conference.id} {...conference} />
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {loading ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <div className={typography.muted}>
                  {t("dashboard.chair.dashboard.messages.loading")}
                </div>
              </div>
            ) : error ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <div className={`text-destructive ${typography.body}`}>
                  {t("dashboard.chair.dashboard.messages.error")}: {error}
                </div>
              </div>
            ) : conferences.length === 0 ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <div className={typography.muted}>
                  {t("dashboard.chair.dashboard.messages.noConferencesFound")}
                </div>
              </div>
            ) : (
              conferences.map((conference) => (
                <ConferenceCard key={conference.id} {...conference} />
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted py-6 mt-16">
        <div className="container mx-auto px-4">
          <div className={`flex flex-col sm:flex-row items-center justify-center ${spacing.gap.md} ${typography.body} text-muted-foreground`}>
            <span>© 2025 ConferenceHub</span>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Help
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
