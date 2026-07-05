import type { TutorialRole } from "@/lib/onboarding-structure"
import {
  QUICK_START_STEP_COUNT,
  RUNBOOK_STAGE_COUNT,
  RUNBOOK_STAGE_ROLES,
  TUTORIAL_ROLE_ICONS,
  TUTORIAL_STEP_META,
} from "@/lib/onboarding-structure"

const QUICK_START_ICONS = ["login", "switch_account", "dashboard", "task_alt"] as const

export interface TutorialStep {
  title: string
  image: string
  href: string
  actionLabel: string
  bullets: string[]
}

export interface TutorialContent {
  icon: string
  label: string
  eyebrow: string
  title: string
  summary: string
  outcome: string
  checkpoints: string[]
  steps: TutorialStep[]
}

type Translate = (key: string, values?: Record<string, string | number>) => string
type TranslateList = (key: string) => string[]

export function buildTutorial(
  role: TutorialRole,
  t: Translate,
  tList: TranslateList,
): TutorialContent {
  const roleKey = `dashboard.onboarding.roles.${role}`

  return {
    icon: TUTORIAL_ROLE_ICONS[role],
    label: t(`${roleKey}.label`),
    eyebrow: t(`${roleKey}.eyebrow`),
    title: t(`${roleKey}.title`),
    summary: t(`${roleKey}.summary`),
    outcome: t(`${roleKey}.outcome`),
    checkpoints: tList(`${roleKey}.checkpoints`),
    steps: TUTORIAL_STEP_META[role].map((meta, index) => ({
      ...meta,
      title: t(`${roleKey}.steps.${index}.title`),
      actionLabel: t(`${roleKey}.steps.${index}.actionLabel`),
      bullets: tList(`${roleKey}.steps.${index}.bullets`),
    })),
  }
}

export function buildQuickStartSteps(t: Translate) {
  return Array.from({ length: QUICK_START_STEP_COUNT }, (_, index) => ({
    icon: QUICK_START_ICONS[index],
    label: t(`dashboard.onboarding.quickStart.${index}.label`),
    detail: t(`dashboard.onboarding.quickStart.${index}.detail`),
  }))
}

export function buildRunbookStages(t: Translate) {
  return Array.from({ length: RUNBOOK_STAGE_COUNT }, (_, index) => ({
    label: t(`dashboard.onboarding.runbook.${index}.label`),
    detail: t(`dashboard.onboarding.runbook.${index}.detail`),
    role: RUNBOOK_STAGE_ROLES[index],
  }))
}

export function getTutorialRoles(): TutorialRole[] {
  return ["chair", "author", "reviewer"]
}
