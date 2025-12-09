"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award,
  GraduationCap,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { typography, spacing, iconSizes } from "@/lib/typography"

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  // Redirect removed to allow access to landing page
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     router.push("/dashboard")
  //   }
  // }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className={typography.h4}>{t("app.name")}</span>
            </div>
          </Link>
          <nav
            className={`flex flex-wrap items-center justify-start md:justify-end gap-3 ${spacing.gap.md}`}
          >
            <a
              href="#features"
              className={`${typography.body} ${typography.medium} text-muted-foreground hover:text-primary transition-colors`}
            >
              {t("home.nav.features")}
            </a>
            <a
              href="#about"
              className={`${typography.body} ${typography.medium} text-muted-foreground hover:text-primary transition-colors`}
            >
              {t("home.nav.about")}
            </a>
            <LanguageSwitcher />
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary hover:bg-primary/10"
              >
                {t("common.actions.signIn")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {t("common.actions.signUp")}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-background to-muted border-b border-border">
        <div className="container mx-auto px-4 py-16 sm:py-20 text-center">
          <div
            className={`inline-flex items-center ${spacing.gap.sm} px-4 py-2 rounded-full bg-primary/10 text-primary ${typography.body} ${typography.medium} mb-6`}
          >
            <Sparkles className={iconSizes.sm} />
            {t("home.hero.badge")}
          </div>
          <h1 className={`text-4xl sm:text-5xl ${typography.bold} mb-6 text-foreground`}>
            {t("home.hero.title")}
          </h1>
          <p
            className={`text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed`}
          >
            {t("home.hero.subtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                {t("common.actions.startNow")}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8"
              >
                {t("common.actions.signIn")}
              </Button>
            </Link>
          </div>

          <div
            className={`flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 ${typography.body} text-muted-foreground`}
          >
            <div className={`flex items-center ${spacing.gap.sm}`}>
              <CheckCircle2 className={`${iconSizes.md} text-success`} />
              <span>{t("home.metrics.accessibility")}</span>
            </div>
            <div className={`flex items-center ${spacing.gap.sm}`}>
              <Award className={`${iconSizes.md} text-success`} />
              <span>{t("home.metrics.adoption")}</span>
            </div>
            <div className={`flex items-center ${spacing.gap.sm}`}>
              <TrendingUp className={`${iconSizes.md} text-success`} />
              <span>{t("home.metrics.precision")}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-14 sm:py-16">
        <div className="text-center mb-12">
          <h2 className={`${typography.h1} mb-4`}>{t("home.features.title")}</h2>
          <p className={`text-muted-foreground max-w-2xl mx-auto ${typography.body}`}>
            {t("home.features.subtitle")}
          </p>
        </div>
        <div className={`grid ${spacing.gap.lg} md:grid-cols-3`}>
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${spacing.subsection} py-6`}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className={`${iconSizes.lg} text-primary`} />
              </div>
              <CardTitle className={typography.h4}>
                {t("home.features.cards.submission.title")}
              </CardTitle>
              <CardDescription
                className={`text-muted-foreground leading-relaxed ${typography.body}`}
              >
                {t("home.features.cards.submission.description")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${spacing.subsection} py-6`}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className={`${iconSizes.lg} text-primary`} />
              </div>
              <CardTitle className={typography.h4}>
                {t("home.features.cards.review.title")}
              </CardTitle>
              <CardDescription
                className={`text-muted-foreground leading-relaxed ${typography.body}`}
              >
                {t("home.features.cards.review.description")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${spacing.subsection} py-6`}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className={`${iconSizes.lg} text-primary`} />
              </div>
              <CardTitle className={typography.h4}>
                {t("home.features.cards.analytics.title")}
              </CardTitle>
              <CardDescription
                className={`text-muted-foreground leading-relaxed ${typography.body}`}
              >
                {t("home.features.cards.analytics.description")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="about" className="bg-muted/60 border-y border-border">
        <div className="container mx-auto px-4 py-14 sm:py-16">
          <div className={`grid sm:grid-cols-2 md:grid-cols-4 ${spacing.gap.lg} text-center`}>
            <div className={spacing.item}>
              <div className={`text-3xl sm:text-4xl ${typography.bold} text-primary`}>247</div>
              <div className={`${typography.body} text-muted-foreground ${typography.medium}`}>
                {t("home.stats.papers")}
              </div>
            </div>
            <div className={spacing.item}>
              <div className={`text-3xl sm:text-4xl ${typography.bold} text-primary`}>486</div>
              <div className={`${typography.body} text-muted-foreground ${typography.medium}`}>
                {t("home.stats.reviews")}
              </div>
            </div>
            <div className={spacing.item}>
              <div className={`text-3xl sm:text-4xl ${typography.bold} text-primary`}>28.5%</div>
              <div className={`${typography.body} text-muted-foreground ${typography.medium}`}>
                {t("home.stats.acceptance")}
              </div>
            </div>
            <div className={spacing.item}>
              <div className={`text-3xl sm:text-4xl ${typography.bold} text-primary`}>95%</div>
              <div className={`${typography.body} text-muted-foreground ${typography.medium}`}>
                {t("home.stats.accuracy")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className={`flex items-center ${spacing.gap.sm}`}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <GraduationCap className={`${iconSizes.md} text-primary-foreground`} />
              </div>
              <span className={typography.semibold}>{t("app.name")}</span>
            </Link>
            <div className={`${typography.body} text-muted-foreground`}>{t("app.footer")}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
