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

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200 bg-white shadow-sm sticky top-0 z-50 h-[7vh]">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={typography.h4}>{t("app.name")}</span>
            </div>
          </Link>
          <nav className={`flex items-center ${spacing.gap.md} sm:${spacing.gap.lg}`}>
            <a
              href="#features"
              className={`${typography.body} ${typography.medium} text-neutral-700 hover:text-primary transition-colors`}
            >
              {t("home.nav.features")}
            </a>
            <a
              href="#about"
              className={`${typography.body} ${typography.medium} text-neutral-700 hover:text-primary transition-colors`}
            >
              {t("home.nav.about")}
            </a>
            <LanguageSwitcher />
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
              >
                {t("common.actions.signIn")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                {t("common.actions.signUp")}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-20 text-center">
          <div
            className={`inline-flex items-center ${spacing.gap.sm} px-4 py-2 rounded-full bg-primary/10 text-primary ${typography.body} ${typography.medium} mb-6`}
          >
            <Sparkles className={iconSizes.sm} />
            {t("home.hero.badge")}
          </div>
          <h1 className={`text-5xl ${typography.bold} mb-6 text-neutral-900`}>
            {t("home.hero.title")}
          </h1>
          <p className={`text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed`}>
            {t("home.hero.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-medium px-8"
              >
                {t("common.actions.startNow")}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium px-8 bg-transparent"
              >
                {t("common.actions.signIn")}
              </Button>
            </Link>
          </div>

          <div
            className={`flex items-center justify-center gap-8 mt-12 ${typography.body} text-neutral-600`}
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

      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className={`${typography.h1} mb-4`}>{t("home.features.title")}</h2>
          <p className={`text-neutral-600 max-w-2xl mx-auto ${typography.body}`}>
            {t("home.features.subtitle")}
          </p>
        </div>
        <div className={`grid ${spacing.gap.lg} md:grid-cols-3`}>
          <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${spacing.subsection} py-6`}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className={`${iconSizes.lg} text-primary`} />
              </div>
              <CardTitle className={typography.h4}>
                {t("home.features.cards.submission.title")}
              </CardTitle>
              <CardDescription className={`text-neutral-600 leading-relaxed ${typography.body}`}>
                {t("home.features.cards.submission.description")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${spacing.subsection} py-6`}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className={`${iconSizes.lg} text-primary`} />
              </div>
              <CardTitle className={typography.h4}>
                {t("home.features.cards.review.title")}
              </CardTitle>
              <CardDescription className={`text-neutral-600 leading-relaxed ${typography.body}`}>
                {t("home.features.cards.review.description")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className={`${spacing.subsection} py-6`}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className={`${iconSizes.lg} text-primary`} />
              </div>
              <CardTitle className={typography.h4}>
                {t("home.features.cards.analytics.title")}
              </CardTitle>
              <CardDescription className={`text-neutral-600 leading-relaxed ${typography.body}`}>
                {t("home.features.cards.analytics.description")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="about" className="bg-neutral-50 border-y border-neutral-200">
        <div className="container mx-auto px-4 py-16">
          <div className={`grid md:grid-cols-4 ${spacing.gap.lg} text-center`}>
            <div className={spacing.item}>
              <div className={`text-4xl ${typography.bold} text-primary`}>247</div>
              <div className={`${typography.body} text-neutral-600 ${typography.medium}`}>
                {t("home.stats.papers")}
              </div>
            </div>
            <div className={spacing.item}>
              <div className={`text-4xl ${typography.bold} text-primary`}>486</div>
              <div className={`${typography.body} text-neutral-600 ${typography.medium}`}>
                {t("home.stats.reviews")}
              </div>
            </div>
            <div className={spacing.item}>
              <div className={`text-4xl ${typography.bold} text-primary`}>28.5%</div>
              <div className={`${typography.body} text-neutral-600 ${typography.medium}`}>
                {t("home.stats.acceptance")}
              </div>
            </div>
            <div className={spacing.item}>
              <div className={`text-4xl ${typography.bold} text-primary`}>95%</div>
              <div className={`${typography.body} text-neutral-600 ${typography.medium}`}>
                {t("home.stats.accuracy")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className={`flex items-center ${spacing.gap.sm}`}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className={`${iconSizes.md} text-white`} />
              </div>
              <span className={typography.semibold}>{t("app.name")}</span>
            </Link>
            <div className={`${typography.body} text-neutral-600`}>{t("app.footer")}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
