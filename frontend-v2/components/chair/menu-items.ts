import type { NavItem } from "@/components/dashboard-sidebar"

export function getChairMenuItems(unreadCount: number): NavItem[] {
  return [
    { label: "Dashboard", href: "/role/chair", icon: "dashboard" },
    { label: "Conferences", href: "/role/chair/conferences", icon: "folder_open" },
    { label: "Schedules", href: "/role/chair/schedules", icon: "calendar_month" },
    {
      label: "Notifications",
      href: "/notifications",
      icon: "notifications",
      badge: unreadCount,
    },
  ]
}
