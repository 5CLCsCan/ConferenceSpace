"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useMemo, useRef, useState } from "react"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"
import { Reveal } from "@/components/landing/reveal"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

/* -----------------------------------------------------------------------
   Guide — the full per-role walkthrough.
   The landing page carries a short teaser that links here; this page owns
   the step-by-step detail so the landing page stays scannable.
----------------------------------------------------------------------- */

type RoleKey = "chair" | "author" | "reviewer"

// ---- AI showcase -----------------------------------------------------
// Screenshots here are entry points — the panels as they look before you
// invoke them. Generated output is not shown, so nothing is fabricated.
function AiShowcase() {
  const { t } = useTranslation()

  const featured = useMemo(
    () => [
      {
        key: "agent" as const,
        icon: "smart_toy",
        image: "/onboarding/ai/01-agent.png",
        tag: t("runtime.app.guide.page.ai.featured.agent.tag"),
        title: t("runtime.app.guide.page.ai.featured.agent.title"),
        description: t("runtime.app.guide.page.ai.featured.agent.description"),
      },
      {
        key: "autofill" as const,
        icon: "auto_fix_high",
        image: "/onboarding/ai/02-autofill.png",
        tag: t("runtime.app.guide.page.ai.featured.autofill.tag"),
        title: t("runtime.app.guide.page.ai.featured.autofill.title"),
        description: t("runtime.app.guide.page.ai.featured.autofill.description"),
      },
      {
        key: "suggestions" as const,
        icon: "person_search",
        image: "/onboarding/ai/03-reviewer-suggestions.png",
        tag: t("runtime.app.guide.page.ai.featured.suggestions.tag"),
        title: t("runtime.app.guide.page.ai.featured.suggestions.title"),
        description: t("runtime.app.guide.page.ai.featured.suggestions.description"),
      },
      {
        key: "briefing" as const,
        icon: "menu_book",
        image: "/onboarding/ai/04-briefing.png",
        tag: t("runtime.app.guide.page.ai.featured.briefing.tag"),
        title: t("runtime.app.guide.page.ai.featured.briefing.title"),
        description: t("runtime.app.guide.page.ai.featured.briefing.description"),
      },
      {
        key: "quality" as const,
        icon: "fact_check",
        image: "/onboarding/ai/05-review-audit.png",
        tag: t("runtime.app.guide.page.ai.featured.quality.tag"),
        title: t("runtime.app.guide.page.ai.featured.quality.title"),
        description: t("runtime.app.guide.page.ai.featured.quality.description"),
      },
      {
        key: "copilot" as const,
        icon: "gavel",
        image: "/onboarding/ai/06-decision-brief.png",
        tag: t("runtime.app.guide.page.ai.featured.copilot.tag"),
        title: t("runtime.app.guide.page.ai.featured.copilot.title"),
        description: t("runtime.app.guide.page.ai.featured.copilot.description"),
      },
    ],
    [t],
  )

  const more = useMemo(
    () => [
      {
        icon: "policy",
        title: t("runtime.app.guide.page.ai.more.gating.title"),
        description: t("runtime.app.guide.page.ai.more.gating.description"),
      },
      {
        icon: "hub",
        title: t("runtime.app.guide.page.ai.more.coi.title"),
        description: t("runtime.app.guide.page.ai.more.coi.description"),
      },
      {
        icon: "sell",
        title: t("runtime.app.guide.page.ai.more.tracks.title"),
        description: t("runtime.app.guide.page.ai.more.tracks.description"),
      },
    ],
    [t],
  )

  return (
    <section id="ai" className="guide-ai">
      <div className="guide-ai-inner">
        <Reveal>
          <div className="guide-ai-head">
            <div className="guide-ai-label">{t("runtime.app.guide.page.ai.label")}</div>
            <h2>{t("runtime.app.guide.page.ai.title")}</h2>
            <p>{t("runtime.app.guide.page.ai.description")}</p>
          </div>
        </Reveal>

        <div className="guide-ai-featured">
          {featured.map((item, i) => (
            <Reveal key={item.key} delay={i * 90}>
              <article className="guide-ai-card">
                <figure className="guide-ai-shot">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={1440}
                    height={1050}
                    className="guide-ai-image"
                    sizes="(max-width: 900px) 100vw, 33vw"
                  />
                </figure>
                <div className="guide-ai-card-copy">
                  <div className="guide-ai-card-top">
                    <span className="guide-ai-card-icon">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </span>
                    <span className="guide-ai-tag">{item.tag}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="guide-ai-grid">
          {more.map((item, i) => (
            <Reveal key={item.title} delay={i * 50}>
              <div className="guide-ai-tile">
                <span className="material-symbols-outlined">{item.icon}</span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="guide-ai-note">
            <span className="material-symbols-outlined">info</span>
            {t("runtime.app.guide.page.ai.note")}
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export default function GuidePage() {
  const { t, tList } = useTranslation()
  const [activeRole, setActiveRole] = useState<RoleKey>("chair")
  const switcherRef = useRef<HTMLDivElement>(null)

  // Switching role swaps the whole step list, so bring the reader back to the
  // top of the walkthrough instead of stranding them mid-way down the old one.
  const selectRole = useCallback((role: RoleKey) => {
    setActiveRole(role)
    switcherRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Translation keys are spelled out rather than composed, so the i18n
  // extraction scripts in scripts/ can still find them statically.
  const roles = useMemo(
    () => [
      {
        key: "chair" as const,
        icon: "gavel",
        label: t("runtime.app.guide.page.roles.chair.label"),
        title: t("runtime.app.guide.page.roles.chair.title"),
        description: t("runtime.app.guide.page.roles.chair.description"),
        steps: [
          {
            image: "/onboarding/chair/01-dashboard.png",
            title: t("runtime.app.guide.page.roles.chair.steps.dashboard.title"),
            bullets: tList("runtime.app.guide.page.roles.chair.steps.dashboard.bullets"),
            capability: t("runtime.app.guide.page.roles.chair.steps.dashboard.capability"),
          },
          {
            image: "/onboarding/chair/02-create-conference.png",
            title: t("runtime.app.guide.page.roles.chair.steps.create.title"),
            bullets: tList("runtime.app.guide.page.roles.chair.steps.create.bullets"),
            capability: t("runtime.app.guide.page.roles.chair.steps.create.capability"),
          },
          {
            image: "/onboarding/chair/03-assign-reviewers.png",
            title: t("runtime.app.guide.page.roles.chair.steps.assign.title"),
            bullets: tList("runtime.app.guide.page.roles.chair.steps.assign.bullets"),
            capability: t("runtime.app.guide.page.roles.chair.steps.assign.capability"),
          },
          {
            image: "/onboarding/chair/04-decision.png",
            title: t("runtime.app.guide.page.roles.chair.steps.decision.title"),
            bullets: tList("runtime.app.guide.page.roles.chair.steps.decision.bullets"),
            capability: t("runtime.app.guide.page.roles.chair.steps.decision.capability"),
          },
        ],
      },
      {
        key: "author" as const,
        icon: "edit_document",
        label: t("runtime.app.guide.page.roles.author.label"),
        title: t("runtime.app.guide.page.roles.author.title"),
        description: t("runtime.app.guide.page.roles.author.description"),
        steps: [
          {
            image: "/onboarding/author/01-conferences.png",
            title: t("runtime.app.guide.page.roles.author.steps.conferences.title"),
            bullets: tList("runtime.app.guide.page.roles.author.steps.conferences.bullets"),
            capability: t("runtime.app.guide.page.roles.author.steps.conferences.capability"),
          },
          {
            image: "/onboarding/author/02-new-submission.png",
            title: t("runtime.app.guide.page.roles.author.steps.submit.title"),
            bullets: tList("runtime.app.guide.page.roles.author.steps.submit.bullets"),
            capability: t("runtime.app.guide.page.roles.author.steps.submit.capability"),
          },
          {
            image: "/onboarding/author/03-submission-detail.png",
            title: t("runtime.app.guide.page.roles.author.steps.manage.title"),
            bullets: tList("runtime.app.guide.page.roles.author.steps.manage.bullets"),
            capability: t("runtime.app.guide.page.roles.author.steps.manage.capability"),
          },
          {
            image: "/onboarding/author/04-rebuttal-or-camera-ready.png",
            title: t("runtime.app.guide.page.roles.author.steps.final.title"),
            bullets: tList("runtime.app.guide.page.roles.author.steps.final.bullets"),
            capability: t("runtime.app.guide.page.roles.author.steps.final.capability"),
          },
        ],
      },
      {
        key: "reviewer" as const,
        icon: "rate_review",
        label: t("runtime.app.guide.page.roles.reviewer.label"),
        title: t("runtime.app.guide.page.roles.reviewer.title"),
        description: t("runtime.app.guide.page.roles.reviewer.description"),
        steps: [
          {
            image: "/onboarding/reviewer/01-dashboard.png",
            title: t("runtime.app.guide.page.roles.reviewer.steps.dashboard.title"),
            bullets: tList("runtime.app.guide.page.roles.reviewer.steps.dashboard.bullets"),
            capability: t("runtime.app.guide.page.roles.reviewer.steps.dashboard.capability"),
          },
          {
            image: "/onboarding/reviewer/02-invitations.png",
            title: t("runtime.app.guide.page.roles.reviewer.steps.invitations.title"),
            bullets: tList("runtime.app.guide.page.roles.reviewer.steps.invitations.bullets"),
            capability: t("runtime.app.guide.page.roles.reviewer.steps.invitations.capability"),
          },
          {
            image: "/onboarding/reviewer/03-assignment-detail.png",
            title: t("runtime.app.guide.page.roles.reviewer.steps.assignment.title"),
            bullets: tList("runtime.app.guide.page.roles.reviewer.steps.assignment.bullets"),
            capability: t("runtime.app.guide.page.roles.reviewer.steps.assignment.capability"),
          },
          {
            image: "/onboarding/reviewer/04-review-form.png",
            title: t("runtime.app.guide.page.roles.reviewer.steps.review.title"),
            bullets: tList("runtime.app.guide.page.roles.reviewer.steps.review.bullets"),
            capability: t("runtime.app.guide.page.roles.reviewer.steps.review.capability"),
          },
        ],
      },
    ],
    [t, tList],
  )

  const active = roles.find((role) => role.key === activeRole) ?? roles[0]

  return (
    <div className="landing-shell">
      <LandingNav solid anchorPrefix="/" active="guide" />

      {/* ── Header ── */}
      <section className="guide-hero">
        <div className="guide-hero-grid" aria-hidden />
        <div className="guide-hero-inner">
          <Link href={ROUTES.HOME} className="guide-back">
            <span className="material-symbols-outlined">arrow_back</span>
            {t("runtime.app.guide.page.back_home")}
          </Link>
          <div className="guide-hero-eyebrow">{t("runtime.app.guide.page.eyebrow")}</div>
          <h1 className="guide-hero-title">{t("runtime.app.guide.page.title")}</h1>
          <p className="guide-hero-sub">{t("runtime.app.guide.page.description")}</p>
          <div className="guide-hero-cta">
            <Link href={ROUTES.REGISTER} className="landing-btn landing-btn--white landing-btn--lg">
              {t("runtime.app.page.text_create_an_account")}
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="landing-btn landing-btn--outline-white landing-btn--lg"
            >
              {t("runtime.app.page.text_sign_in")}
            </Link>
            <a href="#ai" className="guide-ai-jump">
              {t("runtime.app.guide.page.ai.jump")}
              <span className="material-symbols-outlined">arrow_downward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Sticky role switcher ── */}
      <div className="guide-switcher" ref={switcherRef}>
        <div className="guide-switcher-inner">
          <span className="guide-switcher-label">{t("runtime.app.guide.page.roles_label")}</span>
          <div className="guide-tabs" role="tablist" aria-label={t("runtime.app.guide.page.title")}>
            {roles.map((role) => (
              <button
                key={role.key}
                type="button"
                role="tab"
                aria-selected={activeRole === role.key}
                className={`guide-tab guide-tab--${role.key}${activeRole === role.key ? " guide-tab--active" : ""}`}
                onClick={() => selectRole(role.key)}
              >
                <span className="material-symbols-outlined">{role.icon}</span>
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Walkthrough ── */}
      <section className={`guide-body guide-body--${active.key}`}>
        <div className="guide-body-inner">
          <Reveal>
            <div className="guide-summary">
              <div className="guide-summary-mark">
                <span className="material-symbols-outlined">{active.icon}</span>
              </div>
              <div>
                <div className="guide-summary-role">{active.label}</div>
                <h2>{active.title}</h2>
                <p>{active.description}</p>
              </div>
              <div className="guide-summary-count">
                <strong>{active.steps.length}</strong>
                <span>{t("runtime.app.guide.page.steps_label")}</span>
              </div>
            </div>
          </Reveal>

          <ol className="guide-steps">
            {active.steps.map((step, index) => (
              <li className="guide-step" key={`${active.key}-${step.title}`}>
                <div className="guide-step-rail" aria-hidden>
                  <div className="guide-step-index">{index + 1}</div>
                  {index < active.steps.length - 1 && <div className="guide-step-line" />}
                </div>
                <div className="guide-step-body">
                  <div className="guide-step-copy">
                    <div className="guide-step-label">
                      {t("runtime.app.guide.page.step_label")} {index + 1} / {active.steps.length}
                    </div>
                    <h3>{step.title}</h3>
                    <ul>
                      {step.bullets.map((bullet) => (
                        <li key={bullet}>
                          <span className="material-symbols-outlined">check</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    <div className="guide-capability">
                      <span className="material-symbols-outlined">auto_awesome</span>
                      <div>
                        <div className="guide-capability-label">
                          {t("runtime.app.guide.page.capability_label")}
                        </div>
                        <p>{step.capability}</p>
                      </div>
                    </div>
                  </div>
                  <figure className="guide-shot">
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={1440}
                      height={1050}
                      className="guide-shot-image"
                      sizes="(max-width: 900px) 100vw, 52vw"
                      priority={index === 0}
                    />
                  </figure>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── AI capabilities ── */}
      <AiShowcase />

      {/* ── CTA ── */}
      <section className="landing-cta-section">
        <div className="landing-cta-grid" aria-hidden />
        <Reveal>
          <div className="landing-cta-inner">
            <div className="landing-section-label" style={{ color: "rgba(255,255,255,0.5)" }}>
              {t("runtime.app.guide.page.outro.label")}
            </div>
            <h2 className="landing-cta-title">{t("runtime.app.guide.page.outro.title")}</h2>
            <p className="landing-cta-sub">{t("runtime.app.guide.page.outro.description")}</p>
            <div className="landing-cta-actions">
              <Link
                href={ROUTES.REGISTER}
                className="landing-btn landing-btn--white landing-btn--lg"
              >
                {t("runtime.app.page.text_create_your_account")}
              </Link>
              <Link
                href={ROUTES.LOGIN}
                className="landing-btn landing-btn--outline-white landing-btn--lg"
              >
                {t("runtime.app.page.text_sign_in")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  )
}
