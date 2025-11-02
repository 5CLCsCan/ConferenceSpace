// import { PlatformHeader } from "@/components/chair/chair-header";
import { PlatformMetricCard } from "@/components/chair/chair-metric-card"
import { ConferenceTableRow, ConferenceCard } from "@/components/chair/conference-table-row"
import { TopReviewerRow } from "@/components/chair/top-reviewer-row"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Calendar, Users, FileText, AlertCircle, Search, Filter } from "lucide-react"
import { useEffect, useState } from "react"
import { listConferences, type Conference } from "@/lib/api/conferences"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function ChairDashboard() {
  const router = useRouter()
  const { t } = useTranslation()
  const [conferences, setConferences] = useState<
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

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        setLoading(true)
        const response = await listConferences({ limit: 50 })

        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          // Transform API data to component format
          const transformedConferences = response.data.conferences.map((conf) => ({
            id: conf.id,
            name: conf.name,
            acronym: conf.acronym,
            dates: conf.conference_date
              ? new Date(conf.conference_date).toLocaleDateString()
              : "TBD",
            status: conf.status as "active" | "upcoming" | "archived",
            submissions: 0, // TODO: Get actual submission count
          }))
          setConferences(transformedConferences)
        }
      } catch (err) {
        setError(t("dashboard.chair.dashboard.messages.error"))
      } finally {
        setLoading(false)
      }
    }

    fetchConferences()
  }, [])
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
            <Button variant="outline" onClick={() => router.push("/dashboard/chair/manage-users")}>
              {t("dashboard.chair.dashboard.manageUsers")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/chair/system-logs")}>
              {t("dashboard.chair.dashboard.viewSystemLogs")}
            </Button>
          </div>
        </section>

        {/* Platform-Wide Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t("dashboard.chair.dashboard.platformOverview")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlatformMetricCard title={t("dashboard.chair.dashboard.activeConferences")} value={12} icon={Calendar} />
            <PlatformMetricCard
              title={t("dashboard.chair.dashboard.totalUsers")}
              value={3847}
              icon={Users}
              trend="+127 this month"
            />
            <PlatformMetricCard
              title={t("dashboard.chair.dashboard.submissionsThisMonth")}
              value={542}
              icon={FileText}
              trend="+18% vs last month"
            />
            <PlatformMetricCard title={t("dashboard.chair.dashboard.actionItems")} value={7} icon={AlertCircle} />
          </div>
        </section>

        {/* Conference Management List */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">{t("dashboard.chair.dashboard.yourConferences")}</h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("dashboard.chair.dashboard.searchPlaceholder")} className="pl-10" />
            </div>
            <Button variant="outline" className="sm:w-auto bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              {t("dashboard.chair.dashboard.filterByStatus")}
            </Button>
          </div>

          {/* Desktop Table */}
          <Card className="shadow-sm overflow-hidden hidden md:block">
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-muted-foreground">{t("dashboard.chair.dashboard.messages.loading")}</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-destructive">{t("dashboard.chair.dashboard.messages.error")}: {error}</div>
              </div>
            ) : conferences.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-muted-foreground">
                  {t("dashboard.chair.dashboard.messages.noConferencesFound")}
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">
                      {t("dashboard.chair.dashboard.tableHeaders.conferenceName")}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">
                      {t("dashboard.chair.dashboard.tableHeaders.dates")}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">
                      {t("dashboard.chair.dashboard.tableHeaders.status")}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">
                      {t("dashboard.chair.dashboard.tableHeaders.submissions")}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">
                      {t("dashboard.chair.dashboard.tableHeaders.actions")}
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
              <div className="p-8 text-center">
                <div className="text-muted-foreground">{t("dashboard.chair.dashboard.messages.loading")}</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-destructive">{t("dashboard.chair.dashboard.messages.error")}: {error}</div>
              </div>
            ) : conferences.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-muted-foreground">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Announcements & Activity Feed */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t("dashboard.chair.dashboard.platformUpdates.title")}</h2>
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4 border-b border-border pb-4">
                <button className="text-sm font-semibold text-primary pb-2 border-b-2 border-primary">
                  {t("dashboard.chair.dashboard.platformUpdates.announcements")}
                </button>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {t("dashboard.chair.dashboard.platformUpdates.recentActivity")}
                </button>
              </div>

              <div className="space-y-4">
                <div className="pb-4 border-b border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      System Maintenance Scheduled
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Platform maintenance will occur on Sunday, 2 AM - 4 AM EST. All conferences will
                    be temporarily unavailable.
                  </p>
                  <p className="text-xs text-muted-foreground">Posted 1 day ago</p>
                </div>

                <div className="pb-4 border-b border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      New Feature: Bulk Email Tool
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Conference chairs can now send bulk emails to all participants from the
                    Communications panel.
                  </p>
                  <p className="text-xs text-muted-foreground">Posted 3 days ago</p>
                </div>

                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      Updated Privacy Policy
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Our privacy policy has been updated to comply with new data protection
                    regulations.
                  </p>
                  <p className="text-xs text-muted-foreground">Posted 1 week ago</p>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4 bg-transparent">
                {t("dashboard.chair.dashboard.platformUpdates.createAnnouncement")}
              </Button>
            </Card>
          </section>

          {/* Top Reviewers Leaderboard */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">{t("dashboard.chair.dashboard.topReviewers.title")}</h2>
            </div>
            <Card className="p-6 shadow-sm">
              <TopReviewerRow
                name="Dr. Sarah Johnson"
                affiliation="MIT Computer Science"
                completedReviews={127}
              />
              <TopReviewerRow
                name="Prof. Michael Chen"
                affiliation="Stanford AI Lab"
                completedReviews={114}
              />
              <TopReviewerRow
                name="Dr. Emily Rodriguez"
                affiliation="UC Berkeley EECS"
                completedReviews={98}
              />
              <TopReviewerRow
                name="Prof. David Kim"
                affiliation="Carnegie Mellon University"
                completedReviews={87}
              />
              <TopReviewerRow
                name="Dr. Lisa Wang"
                affiliation="Oxford Computer Science"
                completedReviews={76}
                isLast
              />

              <Button variant="outline" className="w-full mt-4 bg-transparent">
                {t("dashboard.chair.dashboard.topReviewers.manageAllUsers")}
              </Button>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted py-6 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
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
