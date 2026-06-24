import type { PointCategory, RebuttalPhase, ResponseStatus } from "./types"

type TFn = (key: string) => string

export function getPointCategoryLabel(category: PointCategory, t: TFn) {
  switch (category) {
    case "weakness":
      return t("runtime.components.shared.rebuttal.config.category.weakness")
    case "question":
      return t("runtime.components.shared.rebuttal.config.category.question")
    case "clarification":
      return t("runtime.components.shared.rebuttal.config.category.clarification")
    case "suggestion":
      return t("runtime.components.shared.rebuttal.config.category.suggestion")
  }
}

export function getResponseStatusLabel(status: ResponseStatus, t: TFn) {
  switch (status) {
    case "addressed":
      return t("runtime.components.shared.rebuttal.config.status.addressed")
    case "partially_addressed":
      return t("runtime.components.shared.rebuttal.config.status.partially_addressed")
    case "not_addressed":
      return t("runtime.components.shared.rebuttal.config.status.not_addressed")
    case "pending_review":
      return t("runtime.components.shared.rebuttal.config.status.pending_review")
  }
}

export function getPhaseLabel(phase: RebuttalPhase, t: TFn) {
  switch (phase) {
    case "awaiting":
      return t("runtime.components.shared.rebuttal.config.phase.awaiting.label")
    case "submitted":
      return t("runtime.components.shared.rebuttal.config.phase.submitted.label")
    case "discussion":
      return t("runtime.components.shared.rebuttal.config.phase.discussion.label")
    case "finalized":
      return t("runtime.components.shared.rebuttal.config.phase.finalized.label")
  }
}

export function getPhaseDescription(
  phase: RebuttalPhase,
  role: "reviewer" | "author" | "chair",
  t: TFn,
) {
  if (phase === "awaiting") {
    if (role === "author") {
      return t("runtime.components.shared.rebuttal.config.phase.awaiting.author_description")
    }
    if (role === "chair") {
      return t("runtime.components.shared.rebuttal.config.phase.awaiting.chair_description")
    }
    return t("runtime.components.shared.rebuttal.config.phase.awaiting.reviewer_description")
  }

  if (phase === "submitted") {
    if (role === "author") {
      return t("runtime.components.shared.rebuttal.config.phase.submitted.author_description")
    }
    if (role === "chair") {
      return t("runtime.components.shared.rebuttal.config.phase.submitted.chair_description")
    }
    return t("runtime.components.shared.rebuttal.config.phase.submitted.reviewer_description")
  }

  if (phase === "discussion") {
    if (role === "author") {
      return t("runtime.components.shared.rebuttal.config.phase.discussion.author_description")
    }
    if (role === "chair") {
      return t("runtime.components.shared.rebuttal.config.phase.discussion.chair_description")
    }
    return t("runtime.components.shared.rebuttal.config.phase.discussion.reviewer_description")
  }

  if (role === "author") {
    return t("runtime.components.shared.rebuttal.config.phase.finalized.author_description")
  }
  if (role === "chair") {
    return t("runtime.components.shared.rebuttal.config.phase.finalized.chair_description")
  }
  return t("runtime.components.shared.rebuttal.config.phase.finalized.reviewer_description")
}
