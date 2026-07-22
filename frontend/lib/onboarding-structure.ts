import { ROUTES } from "@/lib/routes"

export type TutorialRole = "chair" | "author" | "reviewer"

export const TUTORIAL_ROLE_ICONS: Record<TutorialRole, string> = {
  chair: "gavel",
  author: "edit_document",
  reviewer: "rate_review",
}

export const TUTORIAL_STEP_META: Record<
  TutorialRole,
  Array<{ image: string; href: string }>
> = {
  chair: [
    { image: "/onboarding/chair/01-dashboard.png", href: ROUTES.CHAIR.DASHBOARD },
    { image: "/onboarding/chair/02-create-conference.png", href: ROUTES.CHAIR.NEW_CONFERENCE },
    { image: "/onboarding/chair/03-assign-reviewers.png", href: ROUTES.CHAIR.CONFERENCES },
    { image: "/onboarding/chair/04-decision.png", href: ROUTES.CHAIR.CONFERENCES },
  ],
  author: [
    { image: "/onboarding/author/01-conferences.png", href: ROUTES.AUTHOR.DASHBOARD },
    { image: "/onboarding/author/02-new-submission.png", href: ROUTES.AUTHOR.NEW_SUBMISSION },
    { image: "/onboarding/author/03-submission-detail.png", href: ROUTES.AUTHOR.SUBMISSIONS },
    { image: "/onboarding/author/04-rebuttal-or-camera-ready.png", href: ROUTES.AUTHOR.SUBMISSIONS },
  ],
  reviewer: [
    { image: "/onboarding/reviewer/01-dashboard.png", href: ROUTES.REVIEWER.DASHBOARD },
    { image: "/onboarding/reviewer/02-invitations.png", href: ROUTES.REVIEWER.INVITATIONS },
    { image: "/onboarding/reviewer/03-assignment-detail.png", href: ROUTES.REVIEWER.DASHBOARD },
    { image: "/onboarding/reviewer/04-review-form.png", href: ROUTES.REVIEWER.COMPLETED },
  ],
}

export const QUICK_START_STEP_COUNT = 4
export const RUNBOOK_STAGE_COUNT = 4

export const RUNBOOK_STAGE_ROLES: TutorialRole[] = ["chair", "author", "reviewer", "chair"]

export const ROLE_THEMES: Record<
  TutorialRole,
  {
    accent: string
    accentSoft: string
    ring: string
    panel: string
    step: string
  }
> = {
  chair: {
    accent: "#1B3C53",
    accentSoft: "bg-slate-50 text-slate-700 border-slate-200",
    ring: "ring-slate-200",
    panel: "from-white via-white to-slate-50",
    step: "bg-[#1B3C53]",
  },
  author: {
    accent: "#0f766e",
    accentSoft: "bg-teal-50 text-teal-700 border-teal-100",
    ring: "ring-teal-100",
    panel: "from-white via-white to-teal-50/30",
    step: "bg-teal-700",
  },
  reviewer: {
    accent: "#b45309",
    accentSoft: "bg-amber-50 text-amber-800 border-amber-100",
    ring: "ring-amber-100",
    panel: "from-white via-white to-amber-50/30",
    step: "bg-amber-700",
  },
}
