"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, LayoutDashboard, Mail } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ReviewerSidebarProps {
  activeNav: string
  setActiveNav: (nav: string) => void
}

export function ReviewerSidebar({ activeNav, setActiveNav }: ReviewerSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className="w-64 border-r bg-sidebar">
      <div className="flex flex-col p-4 space-y-2">
        <Button
          variant="ghost"
          className={`justify-start cursor-pointer ${activeNav === "overview" ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : ""}`}
          onClick={() => setActiveNav("overview")}
        >
          <LayoutDashboard className="mr-2 size-4" />
          {t("dashboard.roles.reviewer.nav.overview")}
        </Button>
        <Button
          variant="ghost"
          className={`justify-start cursor-pointer ${activeNav === "conferences" ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : ""}`}
          onClick={() => setActiveNav("conferences")}
        >
          <BookOpen className="mr-2 size-4" />
          {t("dashboard.roles.reviewer.nav.myConferences")}
        </Button>
        <Button
          variant="ghost"
          className={`justify-start cursor-pointer ${activeNav === "invitations" ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : ""}`}
          onClick={() => setActiveNav("invitations")}
        >
          <Mail className="mr-2 size-4" />
          {t("dashboard.roles.reviewer.nav.invitations")}
        </Button>
      </div>
    </div>
  )
}
