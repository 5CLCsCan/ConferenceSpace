import type { UserRole } from "@/lib/types"

export type NavigationRoleScope = "shared" | Extract<UserRole, "author" | "reviewer" | "chair">
export type NavigationParamLocation = "path" | "query"
export type NavigationDestinationKind = "hub" | "list" | "detail" | "create" | "edit"

export interface NavigationDestination {
  id: string
  label: string
  roleScope: NavigationRoleScope
  pathTemplate: string
  requiredParams: string[]
  optionalParams: string[]
  paramLocations: Record<string, NavigationParamLocation>
  parentId: string | null
  kind: NavigationDestinationKind
}

export interface NavigationSitemap {
  destinations: NavigationDestination[]
}

const DESTINATIONS: NavigationDestination[] = [
  {
    id: "role.select",
    label: "Role Selection",
    roleScope: "shared",
    pathTemplate: "/role",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: null,
    kind: "hub",
  },
  {
    id: "notifications.index",
    label: "Notifications",
    roleScope: "shared",
    pathTemplate: "/notifications",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: null,
    kind: "list",
  },
  {
    id: "profile.detail",
    label: "Profile Detail",
    roleScope: "shared",
    pathTemplate: "/profile/:user_id",
    requiredParams: ["user_id"],
    optionalParams: [],
    paramLocations: {
      user_id: "path",
    },
    parentId: null,
    kind: "detail",
  },
  {
    id: "author.dashboard",
    label: "Author Dashboard",
    roleScope: "author",
    pathTemplate: "/role/author",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "role.select",
    kind: "hub",
  },
  {
    id: "author.submissions.index",
    label: "Author Submissions",
    roleScope: "author",
    pathTemplate: "/role/author/submissions",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "author.dashboard",
    kind: "list",
  },
  {
    id: "author.submission.new",
    label: "Author New Submission",
    roleScope: "author",
    pathTemplate: "/role/author/submissions/new",
    requiredParams: [],
    optionalParams: ["conferenceId"],
    paramLocations: {
      conferenceId: "query",
    },
    parentId: "author.submissions.index",
    kind: "create",
  },
  {
    id: "author.submission.detail",
    label: "Author Submission Detail",
    roleScope: "author",
    pathTemplate: "/role/author/submissions/:submissionId",
    requiredParams: ["submissionId"],
    optionalParams: ["conferenceId", "tab"],
    paramLocations: {
      submissionId: "path",
      conferenceId: "query",
      tab: "query",
    },
    parentId: "author.submissions.index",
    kind: "detail",
  },
  {
    id: "author.submission.edit",
    label: "Author Submission Edit",
    roleScope: "author",
    pathTemplate: "/role/author/submissions/:submissionId/edit",
    requiredParams: ["submissionId"],
    optionalParams: ["conferenceId"],
    paramLocations: {
      submissionId: "path",
      conferenceId: "query",
    },
    parentId: "author.submission.detail",
    kind: "edit",
  },
  {
    id: "author.conference.detail",
    label: "Author Conference Detail",
    roleScope: "author",
    pathTemplate: "/role/author/conferences/:conferenceId",
    requiredParams: ["conferenceId"],
    optionalParams: [],
    paramLocations: {
      conferenceId: "path",
    },
    parentId: "author.dashboard",
    kind: "detail",
  },
  {
    id: "author.schedules.index",
    label: "Author Schedules",
    roleScope: "author",
    pathTemplate: "/role/author/schedules",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "author.dashboard",
    kind: "list",
  },
  {
    id: "reviewer.dashboard",
    label: "Reviewer Dashboard",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "role.select",
    kind: "hub",
  },
  {
    id: "reviewer.conferences.index",
    label: "Reviewer Conferences",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer/conferences",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "reviewer.dashboard",
    kind: "list",
  },
  {
    id: "reviewer.conference.submissions",
    label: "Reviewer Conference Submissions",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer/conferences/:conferenceId/submissions",
    requiredParams: ["conferenceId"],
    optionalParams: [],
    paramLocations: {
      conferenceId: "path",
    },
    parentId: "reviewer.conferences.index",
    kind: "detail",
  },
  {
    id: "reviewer.assignment.detail",
    label: "Reviewer Assignment Detail",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer/assignments/:assignmentId",
    requiredParams: ["assignmentId"],
    optionalParams: ["conferenceId", "tab"],
    paramLocations: {
      assignmentId: "path",
      conferenceId: "query",
      tab: "query",
    },
    parentId: "reviewer.dashboard",
    kind: "detail",
  },
  {
    id: "reviewer.invitations.index",
    label: "Reviewer Invitations",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer/invitations",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "reviewer.dashboard",
    kind: "list",
  },
  {
    id: "reviewer.completed.index",
    label: "Reviewer Completed Reviews",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer/completed",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "reviewer.dashboard",
    kind: "list",
  },
  {
    id: "reviewer.schedules.index",
    label: "Reviewer Schedules",
    roleScope: "reviewer",
    pathTemplate: "/role/reviewer/schedules",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "reviewer.dashboard",
    kind: "list",
  },
  {
    id: "chair.dashboard",
    label: "Chair Dashboard",
    roleScope: "chair",
    pathTemplate: "/role/chair",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "role.select",
    kind: "hub",
  },
  {
    id: "chair.conferences.index",
    label: "Chair Conferences",
    roleScope: "chair",
    pathTemplate: "/role/chair/conferences",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "chair.dashboard",
    kind: "list",
  },
  {
    id: "chair.conference.new",
    label: "Chair New Conference",
    roleScope: "chair",
    pathTemplate: "/role/chair/conferences/new",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "chair.conferences.index",
    kind: "create",
  },
  {
    id: "chair.conference.edit",
    label: "Chair Conference Edit",
    roleScope: "chair",
    pathTemplate: "/role/chair/conferences/:conferenceId/edit",
    requiredParams: ["conferenceId"],
    optionalParams: [],
    paramLocations: {
      conferenceId: "path",
    },
    parentId: "chair.conference.detail",
    kind: "edit",
  },
  {
    id: "chair.conference.submissions",
    label: "Chair Conference Submissions",
    roleScope: "chair",
    pathTemplate: "/role/chair/conferences/:conferenceId/submissions",
    requiredParams: ["conferenceId"],
    optionalParams: [],
    paramLocations: {
      conferenceId: "path",
    },
    parentId: "chair.conference.detail",
    kind: "detail",
  },
  {
    id: "chair.submission.detail",
    label: "Chair Submission Detail",
    roleScope: "chair",
    pathTemplate: "/role/chair/conferences/:conferenceId/submissions/:submissionId",
    requiredParams: ["conferenceId", "submissionId"],
    optionalParams: ["tab"],
    paramLocations: {
      conferenceId: "path",
      submissionId: "path",
      tab: "query",
    },
    parentId: "chair.conference.submissions",
    kind: "detail",
  },
  {
    id: "chair.conference.detail",
    label: "Chair Conference Detail",
    roleScope: "chair",
    pathTemplate: "/role/chair/conferences/:conferenceId",
    requiredParams: ["conferenceId"],
    optionalParams: [],
    paramLocations: {
      conferenceId: "path",
    },
    parentId: "chair.conferences.index",
    kind: "detail",
  },
  {
    id: "chair.schedules.index",
    label: "Chair Schedules",
    roleScope: "chair",
    pathTemplate: "/role/chair/schedules",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "chair.dashboard",
    kind: "list",
  },
  {
    id: "chair.template.new",
    label: "Chair New Template",
    roleScope: "chair",
    pathTemplate: "/role/chair/templates/new",
    requiredParams: [],
    optionalParams: [],
    paramLocations: {},
    parentId: "chair.dashboard",
    kind: "create",
  },
]

export const CHATBOT_NAVIGATION_SITEMAP: NavigationSitemap = {
  destinations: DESTINATIONS,
}

export const CHATBOT_NAVIGATION_DESTINATIONS: Record<string, NavigationDestination> =
  Object.fromEntries(DESTINATIONS.map((destination) => [destination.id, destination]))

export function getNavigationDestination(destinationId: string): NavigationDestination | undefined {
  return CHATBOT_NAVIGATION_DESTINATIONS[destinationId]
}
