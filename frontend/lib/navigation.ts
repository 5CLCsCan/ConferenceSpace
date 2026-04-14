import { ROUTES } from "@/lib/routes"
import type { UserRole } from "@/lib/types"

export interface NavItem {
  labelKey: string
  href: string
  icon: string
  badge?: number
}

type SidebarRole = Extract<UserRole, "author" | "reviewer" | "chair" | "pc">

interface NavTemplateItem {
  labelKey: string
  href: string
  icon: string
  withUnreadBadge?: boolean
}

const SIDEBAR_NAV_TEMPLATES: Record<SidebarRole, NavTemplateItem[]> = {
  author: [
    {
      labelKey: "dashboard.sidebar.nav.author.conferences",
      href: ROUTES.AUTHOR.DASHBOARD,
      icon: "folder_open",
    },
    {
      labelKey: "dashboard.sidebar.nav.author.mySubmissions",
      href: ROUTES.AUTHOR.SUBMISSIONS,
      icon: "description",
    },
    {
      labelKey: "dashboard.sidebar.nav.author.schedules",
      href: ROUTES.AUTHOR.SCHEDULES,
      icon: "calendar_month",
    },
    {
      labelKey: "dashboard.sidebar.nav.common.notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
  reviewer: [
    {
      labelKey: "dashboard.sidebar.nav.reviewer.dashboard",
      href: ROUTES.REVIEWER.DASHBOARD,
      icon: "dashboard",
    },
    {
      labelKey: "dashboard.sidebar.nav.reviewer.conferences",
      href: ROUTES.REVIEWER.CONFERENCES,
      icon: "folder_open",
    },
    {
      labelKey: "dashboard.sidebar.nav.reviewer.invitations",
      href: ROUTES.REVIEWER.INVITATIONS,
      icon: "mail",
    },
    {
      labelKey: "dashboard.sidebar.nav.reviewer.completed",
      href: ROUTES.REVIEWER.COMPLETED,
      icon: "task_alt",
    },
    {
      labelKey: "dashboard.sidebar.nav.reviewer.schedules",
      href: ROUTES.REVIEWER.SCHEDULES,
      icon: "calendar_month",
    },
    {
      labelKey: "dashboard.sidebar.nav.common.notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
  chair: [
    {
      labelKey: "dashboard.sidebar.nav.chair.dashboard",
      href: ROUTES.CHAIR.DASHBOARD,
      icon: "dashboard",
    },
    {
      labelKey: "dashboard.sidebar.nav.chair.conferences",
      href: ROUTES.CHAIR.CONFERENCES,
      icon: "folder_open",
    },
    {
      labelKey: "dashboard.sidebar.nav.chair.schedules",
      href: ROUTES.CHAIR.SCHEDULES,
      icon: "calendar_month",
    },
    {
      labelKey: "dashboard.sidebar.nav.common.notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
  pc: [
    {
      labelKey: "dashboard.sidebar.nav.chair.dashboard",
      href: ROUTES.CHAIR.DASHBOARD,
      icon: "dashboard",
    },
    {
      labelKey: "dashboard.sidebar.nav.chair.conferences",
      href: ROUTES.CHAIR.CONFERENCES,
      icon: "folder_open",
    },
    {
      labelKey: "dashboard.sidebar.nav.chair.schedules",
      href: ROUTES.CHAIR.SCHEDULES,
      icon: "calendar_month",
    },
    {
      labelKey: "dashboard.sidebar.nav.common.notifications",
      href: ROUTES.NOTIFICATIONS,
      icon: "notifications",
      withUnreadBadge: true,
    },
  ],
}

const FALLBACK_NAV_TEMPLATE: NavTemplateItem[] = [
  {
    labelKey: "dashboard.sidebar.nav.common.dashboard",
    href: ROUTES.ROLE_SELECT,
    icon: "dashboard",
  },
  {
    labelKey: "dashboard.sidebar.nav.common.notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: "notifications",
    withUnreadBadge: true,
  },
]

const isSidebarRole = (role: UserRole | null | undefined): role is SidebarRole =>
  role === "author" || role === "reviewer" || role === "chair" || role === "pc"

export function getSidebarMenuItems(
  role: UserRole | null | undefined,
  unreadCount: number,
): NavItem[] {
  const template = isSidebarRole(role) ? SIDEBAR_NAV_TEMPLATES[role] : FALLBACK_NAV_TEMPLATE

  return template.map((item) => ({
    labelKey: item.labelKey,
    href: item.href,
    icon: item.icon,
    ...(item.withUnreadBadge ? { badge: unreadCount } : {}),
  }))
}
