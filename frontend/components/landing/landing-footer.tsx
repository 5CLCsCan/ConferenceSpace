"use client"

import Link from "next/link"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

export function LandingFooter() {
  const { t } = useTranslation()
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <Link href={ROUTES.HOME} className="landing-logo">
          <div className="landing-logo-mark landing-logo-mark--sm">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="landing-logo-name">{t("runtime.app.page.text_conferencespace")}</span>
        </Link>
        <div className="landing-footer-copy">
          {t("runtime.app.page.text_academic_conference_operations_platform_role_based")}
        </div>
      </div>
    </footer>
  )
}
