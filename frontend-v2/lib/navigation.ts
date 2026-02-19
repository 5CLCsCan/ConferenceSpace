import { ROUTES } from "@/lib/routes"
import type { UserRole } from "@/lib/types"

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

type SidebarRole = Extract<UserRole, "author" | "reviewer" | "chair">

interface NavTemplateItem {
  label: string
  href: string
  icon: string
  withUnreadBadge?: boolean
}

const SIDEBAR_NAV_TEMPLATES: Record<SidebarRole, NavTemplateItem[]> = {
  author: [
    { label: "Conferences", href: ROUTES.AUTHOR.DASHBOARD, icon: "folder_open" },
    { label: "My Submissions", href: ROUTES.AUTHOR.SUBMISSIONS, icon: "description" },
    {
      label: "Notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
  reviewer: [
    { label: "Dashboard", href: ROUTES.REVIEWER.DASHBOARD, icon: "dashboard" },
    { label: "Conferences", href: ROUTES.REVIEWER.CONFERENCES, icon: "folder_open" },
    { label: "Invitations", href: ROUTES.REVIEWER.INVITATIONS, icon: "mail" },
    { label: "Completed", href: ROUTES.REVIEWER.COMPLETED, icon: "task_alt" },
    {
      label: "Notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
  chair: [
    { label: "Dashboard", href: ROUTES.CHAIR.DASHBOARD, icon: "dashboard" },
    { label: "Conferences", href: ROUTES.CHAIR.CONFERENCES, icon: "folder_open" },
    { label: "Schedules", href: ROUTES.CHAIR.SCHEDULES, icon: "calendar_month" },
    {
      label: "Notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
}

const FALLBACK_NAV_TEMPLATE: NavTemplateItem[] = [
  { label: "Dashboard", href: ROUTES.ROLE_SELECT, icon: "dashboard" },
  {
    label: "Notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: "notifications",
    withUnreadBadge: true,
  },
]

const isSidebarRole = (role: UserRole | null | undefined): role is SidebarRole =>
  role === "author" || role === "reviewer" || role === "chair"

export function getSidebarMenuItems(
  role: UserRole | null | undefined,
  unreadCount: number,
): NavItem[] {
  const template = isSidebarRole(role) ? SIDEBAR_NAV_TEMPLATES[role] : FALLBACK_NAV_TEMPLATE

  return template.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    ...(item.withUnreadBadge ? { badge: unreadCount } : {}),
  }))
}
