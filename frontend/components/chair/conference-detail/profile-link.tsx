"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"

const SEMANTIC_SCHOLAR_AUTHOR_URL = "https://www.semanticscholar.org/author"

export type ProfileLinkInfo = { href: string; external: boolean }

// Superset of fields the helper understands. Consumers can pass any subset:
//   - reviewer suggestions use `on_platform` + `email` / `platform_user_id` / `scholar_id`
//   - committee members use `is_external` + `email` / `scholar_id`
//   - search-dropdown items use just `email` (platform) or just `scholar_id` (external)
export interface ProfileLinkable {
  on_platform?: boolean
  is_external?: boolean
  email?: string | null
  platform_user_id?: number | null
  scholar_id?: string | null
}

// Resolve the profile link for a person. Rules:
//   1. If the person is known-external (is_external === true) and we have a
//      scholar_id, go to Semantic Scholar — even if an email happens to be
//      present, the canonical profile lives on Semantic Scholar for external
//      invitees.
//   2. Otherwise, if on_platform is true (or implicit: `is_external` is not
//      set and an email exists), prefer ROUTES.PROFILE(email). Fall back to
//      the numeric id if email is missing — it won't resolve today but keeps
//      behaviour defensive rather than crashing.
//   3. As a last resort, if we have a scholar_id, link to Semantic Scholar.
//   4. Return null when there is nothing to link to.
export function getProfileLink(info: ProfileLinkable): ProfileLinkInfo | null {
  if (info.is_external && info.scholar_id) {
    return {
      href: `${SEMANTIC_SCHOLAR_AUTHOR_URL}/${encodeURIComponent(info.scholar_id)}`,
      external: true,
    }
  }

  const onPlatform = info.on_platform ?? !info.is_external
  if (onPlatform) {
    if (info.email) {
      return { href: ROUTES.PROFILE(info.email), external: false }
    }
    if (info.platform_user_id) {
      return { href: ROUTES.PROFILE(String(info.platform_user_id)), external: false }
    }
  }

  if (info.scholar_id) {
    return {
      href: `${SEMANTIC_SCHOLAR_AUTHOR_URL}/${encodeURIComponent(info.scholar_id)}`,
      external: true,
    }
  }
  return null
}

export function ProfileLink({
  link,
  className,
  children,
  title,
  ariaLabel,
}: {
  link: ProfileLinkInfo | null
  className?: string
  children: ReactNode
  title?: string
  ariaLabel?: string
}) {
  if (!link) return <span className={className}>{children}</span>
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={link.href} className={className} title={title} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}

// Small icon-only button that links to a profile. Use inside tables, dropdowns,
// or anywhere a compact profile affordance is needed. Returns null when there
// is no link target, which lets callers avoid conditionals.
export function ProfileLinkIconButton({
  link,
  title,
  ariaLabel,
  className,
  iconClassName,
}: {
  link: ProfileLinkInfo | null
  title?: string
  ariaLabel?: string
  className?: string
  iconClassName?: string
}) {
  if (!link) return null
  // Intentionally use the same `person` glyph for on-platform and external
  // profiles. The platform-badge already communicates "on / not on platform"
  // in the row itself; re-encoding it here with a different icon (e.g.
  // `open_in_new`) duplicates that signal and makes the action column feel
  // inconsistent. External links still open in a new tab via `target=_blank`.
  const icon = (
    <span
      className={cn("material-symbols-outlined", iconClassName)}
      style={{
        fontSize: "14px",
        lineHeight: "1",
        width: "14px",
        height: "14px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      person
    </span>
  )
  const baseClasses =
    "inline-flex items-center justify-center p-1 rounded text-slate-400 hover:text-[#1B3C53] hover:bg-slate-100 transition-colors"
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClasses, className)}
        title={title}
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {icon}
      </a>
    )
  }
  return (
    <Link
      href={link.href}
      className={cn(baseClasses, className)}
      title={title}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {icon}
    </Link>
  )
}
