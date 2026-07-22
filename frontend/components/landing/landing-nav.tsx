"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

interface LandingNavProps {
  /**
   * Keep the solid navy treatment from the first paint. The translucent variant
   * only reads well over the dark hero, so pages without one opt in to solid.
   */
  solid?: boolean
  /** Prefix for the landing-page hash anchors, e.g. "/" when linking from another route. */
  anchorPrefix?: string
  /** Nav entry to mark as current. */
  active?: "guide"
}

export function LandingNav({ solid = false, anchorPrefix = "", active }: LandingNavProps) {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (solid) return
    // The layout wraps content in <main class="overflow-y-auto"> — not window
    const main = document.querySelector("main") as HTMLElement | null
    if (!main) return
    const onScroll = () => setScrolled(main.scrollTop > 60)
    main.addEventListener("scroll", onScroll, { passive: true })
    return () => main.removeEventListener("scroll", onScroll)
  }, [solid])

  return (
    <header className={`landing-nav${solid || scrolled ? " landing-nav--scrolled" : ""}`}>
      <div className="landing-nav-inner">
        <Link href={ROUTES.HOME} className="landing-logo">
          <div className="landing-logo-mark">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="landing-logo-name">{t("runtime.app.page.text_conferencespace")}</span>
        </Link>
        <nav className="landing-nav-links">
          <a href={`${anchorPrefix}#how-it-works`} className="landing-nav-link">
            {t("runtime.app.page.text_workflow")}
          </a>
          <Link
            href={ROUTES.GUIDE}
            className={`landing-nav-link${active === "guide" ? " landing-nav-link--active" : ""}`}
          >
            {t("runtime.app.page.public_guide.nav_label")}
          </Link>
          <a href={`${anchorPrefix}#roles`} className="landing-nav-link">
            {t("runtime.app.page.text_roles")}
          </a>
          <a href={`${anchorPrefix}#features`} className="landing-nav-link">
            {t("runtime.app.page.text_features")}
          </a>
        </nav>
        <div className="landing-nav-actions">
          <div className="landing-lang">
            <LanguageSwitcher />
          </div>
          <Link href={ROUTES.LOGIN} className="landing-btn landing-btn--ghost">
            {t("runtime.app.page.text_sign_in")}
          </Link>
          <Link href={ROUTES.REGISTER} className="landing-btn landing-btn--primary">
            {t("runtime.app.page.text_register")}
          </Link>
        </div>
      </div>
    </header>
  )
}
