import type { MessageVisibility, ParticipantRole, ThreadCategory } from "./types"

type TFn = (key: string) => string

export function getVisibilityLabel(visibility: MessageVisibility, t: TFn) {
  switch (visibility) {
    case "committee":
      return t("runtime.components.shared.discussion.config.visibility.committee.label")
    case "reviewers":
      return t("runtime.components.shared.discussion.config.visibility.reviewers.label")
    case "authors":
      return t("runtime.components.shared.discussion.config.visibility.authors.label")
    case "public":
      return t("runtime.components.shared.discussion.config.visibility.public.label")
  }
}

export function getVisibilityShortLabel(visibility: MessageVisibility, t: TFn) {
  switch (visibility) {
    case "committee":
      return t("runtime.components.shared.discussion.config.visibility.committee.short_label")
    case "reviewers":
      return t("runtime.components.shared.discussion.config.visibility.reviewers.short_label")
    case "authors":
      return t("runtime.components.shared.discussion.config.visibility.authors.short_label")
    case "public":
      return t("runtime.components.shared.discussion.config.visibility.public.short_label")
  }
}

export function getVisibilityDescription(visibility: MessageVisibility, t: TFn) {
  switch (visibility) {
    case "committee":
      return t("runtime.components.shared.discussion.config.visibility.committee.description")
    case "reviewers":
      return t("runtime.components.shared.discussion.config.visibility.reviewers.description")
    case "authors":
      return t("runtime.components.shared.discussion.config.visibility.authors.description")
    case "public":
      return t("runtime.components.shared.discussion.config.visibility.public.description")
  }
}

export function getCategoryLabel(category: ThreadCategory, t: TFn) {
  switch (category) {
    case "methodology":
      return t("runtime.components.shared.discussion.config.category.methodology")
    case "results":
      return t("runtime.components.shared.discussion.config.category.results")
    case "clarity":
      return t("runtime.components.shared.discussion.config.category.clarity")
    case "ethics":
      return t("runtime.components.shared.discussion.config.category.ethics")
    case "meta_review":
      return t("runtime.components.shared.discussion.config.category.meta_review")
    case "general":
      return t("runtime.components.shared.discussion.config.category.general")
  }
}

export function getRoleLabel(role: ParticipantRole, t: TFn) {
  switch (role) {
    case "reviewer":
      return t("runtime.components.shared.discussion.config.role.reviewer")
    case "area_chair":
      return t("runtime.components.shared.discussion.config.role.area_chair")
    case "senior_pc":
      return t("runtime.components.shared.discussion.config.role.senior_pc")
    case "author":
      return t("runtime.components.shared.discussion.config.role.author")
    case "system":
      return t("runtime.components.shared.discussion.config.role.system")
  }
}
