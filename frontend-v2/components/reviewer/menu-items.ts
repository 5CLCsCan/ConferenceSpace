import type { NavItem } from "@/components/dashboard-sidebar"

export function getReviewerMenuItems(unreadCount: number): NavItem[] {
  return [
    { label: "Dashboard", href: "/role/reviewer", icon: "dashboard" },
    { label: "Conferences", href: "/role/reviewer/conferences", icon: "calendar_month" },
    { label: "Invitations", href: "/role/reviewer/invitations", icon: "mail" },
    { label: "Completed", href: "/role/reviewer/completed", icon: "task_alt" },
    {
      label: "Notifications",
      href: "/notifications",
      icon: "notifications",
      badge: unreadCount,
    },
  ]
}
