import type { UserRole } from "@/lib/types"

const BASE_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  REGISTER: "/register",
  NOTIFICATIONS: "/notifications",
  ROLE_SELECT: "/role",
  PROFILE: (userId: string) => `/profile/${userId}`,

  AUTHOR: {
    DASHBOARD: "/role/author",
    SUBMISSIONS: "/role/author/submissions",
    SUBMISSION_DETAIL: (id: string) => `/role/author/submissions/${id}`,
    SUBMISSION_EDIT: (id: string) => `/role/author/submissions/${id}/edit`,
    NEW_SUBMISSION: "/role/author/submissions/new",
    CONFERENCE_DETAIL: (id: string) => `/role/author/conferences/${id}`,
    SCHEDULES: "/role/author/schedules",
  },

  REVIEWER: {
    DASHBOARD: "/role/reviewer",
    CONFERENCES: "/role/reviewer/conferences",
    CONFERENCE_SUBMISSIONS: (id: string) => `/role/reviewer/conferences/${id}/submissions`,
    ASSIGNMENT: (id: string) => `/role/reviewer/assignments/${id}`,
    INVITATIONS: "/role/reviewer/invitations",
    COMPLETED: "/role/reviewer/completed",
    SCHEDULES: "/role/reviewer/schedules",
  },

  CHAIR: {
    DASHBOARD: "/role/chair",
    CONFERENCES: "/role/chair/conferences",
    NEW_CONFERENCE: "/role/chair/conferences/new",
    CONFERENCE_EDIT: (id: string) => `/role/chair/conferences/${id}/edit`,
    CONFERENCE_DETAIL: (id: string) => `/role/chair/conferences/${id}`,
    CONFERENCE_SUBMISSIONS: (id: string) => `/role/chair/conferences/${id}/submissions`,
    SUBMISSION_DETAIL: (cId: string, sId: string) =>
      `/role/chair/conferences/${cId}/submissions/${sId}`,
    SCHEDULES: "/role/chair/schedules",
  },
} as const

const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  author: BASE_ROUTES.AUTHOR.DASHBOARD,
  reviewer: BASE_ROUTES.REVIEWER.DASHBOARD,
  chair: BASE_ROUTES.CHAIR.DASHBOARD,
  admin: BASE_ROUTES.ROLE_SELECT,
}

export const ROUTES = {
  ...BASE_ROUTES,
  ROLE_ROUTE_MAP,
} as const
