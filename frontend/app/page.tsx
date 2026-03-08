"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

/* -----------------------------------------------------------------------
   HomeLanding — Scholar-Compact aesthetic
   Content sourced strictly from platform-recon.md and feature-mapping.md
   No fabricated benchmarks.
----------------------------------------------------------------------- */

// ---- Sticky-scroll workflow section ----------------------------------
function getScrollParent(el: HTMLElement | null): HTMLElement {
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el)
    if (/auto|scroll/.test(style.overflowY)) return el
    el = el.parentElement
  }
  return document.documentElement
}

function WorkflowScroll() {
  const { t, tList } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [panelKey, setPanelKey] = useState(0)
  const scrollerRef = useRef<HTMLElement | null>(null)
  const steps = useMemo(
    () => [
      {
        index: 1,
        icon: "event",
        label: t("runtime.app.page.prop_label_conference_setup"),
        sub: t("runtime.app.page.workflow.steps.conference_setup.sub"),
        description: t(
          "runtime.app.page.prop_description_the_chair_defines_the_conference_identity",
        ),
        detail: tList("runtime.app.page.workflow.steps.conference_setup.detail"),
      },
      {
        index: 2,
        icon: "upload_file",
        label: t("runtime.app.page.prop_label_submission_intake"),
        sub: t("runtime.app.page.workflow.steps.submission_intake.sub"),
        description: t(
          "runtime.app.page.prop_description_authors_browse_available_conferences_inspect_cfp",
        ),
        detail: tList("runtime.app.page.workflow.steps.submission_intake.detail"),
      },
      {
        index: 3,
        icon: "mail",
        label: t("runtime.app.page.prop_label_reviewer_invitation"),
        sub: t("runtime.app.page.workflow.steps.reviewer_invitation.sub"),
        description: t("runtime.app.page.prop_description_the_chair_manages_a_reviewer_committee"),
        detail: tList("runtime.app.page.workflow.steps.reviewer_invitation.detail"),
      },
      {
        index: 4,
        icon: "rate_review",
        label: t("runtime.app.page.prop_label_review_execution"),
        sub: t("runtime.app.page.workflow.steps.review_execution.sub"),
        description: t(
          "runtime.app.page.prop_description_reviewers_open_their_assigned_papers_from",
        ),
        detail: tList("runtime.app.page.workflow.steps.review_execution.detail"),
      },
      {
        index: 5,
        icon: "forum",
        label: t("runtime.app.page.prop_label_discussion_deliberation"),
        sub: t("runtime.app.page.workflow.steps.discussion_deliberation.sub"),
        description: t("runtime.app.page.prop_description_each_submission_has_a_shared_discussion"),
        detail: tList("runtime.app.page.workflow.steps.discussion_deliberation.detail"),
      },
      {
        index: 6,
        icon: "gavel",
        label: t("runtime.app.page.prop_label_chair_decision"),
        sub: t("runtime.app.page.workflow.steps.chair_decision.sub"),
        description: t(
          "runtime.app.page.prop_description_after_reviewing_the_accumulated_evidence_submitted",
        ),
        detail: tList("runtime.app.page.workflow.steps.chair_decision.detail"),
      },
    ],
    [t, tList],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Find the actual scrollable container (the Next.js <main> element)
    scrollerRef.current = getScrollParent(container)
    const scroller = scrollerRef.current

    const onScroll = () => {
      const container = containerRef.current
      if (!container) return
      // scrollTop of the parents scroller vs. where our container starts within it
      const scrollerScrollTop =
        scroller === document.documentElement ? window.scrollY : (scroller as HTMLElement).scrollTop

      // offsetTop relative to the scroller
      let offsetTop = 0
      let el: HTMLElement | null = container
      while (el && el !== scroller && el !== document.documentElement) {
        offsetTop += el.offsetTop
        el = el.offsetParent as HTMLElement | null
      }

      const scrolled = scrollerScrollTop - offsetTop
      const scrollable = container.offsetHeight - scroller.clientHeight
      const pct = Math.max(0, Math.min(1, scrolled / scrollable))
      const idx = Math.min(steps.length - 1, Math.floor(pct * steps.length))

      setActiveIdx((prev) => {
        if (prev !== idx) setPanelKey((k) => k + 1)
        return idx
      })
    }

    const target = scroller === document.documentElement ? window : scroller
    target.addEventListener("scroll", onScroll, { passive: true })
    onScroll() // compute initial state
    return () => target.removeEventListener("scroll", onScroll)
  }, [steps.length])

  const jumpToStep = (i: number) => {
    const container = containerRef.current
    const scroller = scrollerRef.current
    if (!container || !scroller) return

    let offsetTop = 0
    let el: HTMLElement | null = container
    while (el && el !== scroller && el !== document.documentElement) {
      offsetTop += el.offsetTop
      el = el.offsetParent as HTMLElement | null
    }

    const scrollable = container.offsetHeight - scroller.clientHeight
    const target = offsetTop + (i / steps.length) * scrollable + 1

    if (scroller === document.documentElement) {
      window.scrollTo({ top: target, behavior: "smooth" })
    } else {
      scroller.scrollTo({ top: target, behavior: "smooth" })
    }
  }

  const step = steps[activeIdx] || steps[0]

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="wf-scroll-container"
      // Total scroll height: 100vh anchor + (steps * 80vh) of scroll range
      style={{ height: `calc(100vh + ${steps.length * 80}vh)` }}
    >
      {/* Sticky panel — stays in viewport while user scrolls container */}
      <div className="wf-sticky">
        {/* ── Left: timeline nav ── */}
        <div className="wf-left">
          <div className="wf-left-header">
            <div className="wf-section-label">{t("runtime.app.page.text_the_lifecycle")}</div>
            <h2 className="wf-title">
              {t("runtime.app.page.text_from_setup_to_decision")} <br />
              {t("runtime.app.page.text_in_one_system")}{" "}
            </h2>
            <p className="wf-desc">
              {t("runtime.app.page.text_every_stage_of_the_conference_paper")} <br />
              {t("runtime.app.page.text_scroll_to_walk_through_it")}{" "}
            </p>
          </div>

          <div className="wf-timeline">
            {steps.map((s, i) => (
              <button
                key={s.index}
                className={`wf-timeline-item${i === activeIdx ? " wf-timeline-item--active" : i < activeIdx ? " wf-timeline-item--done" : ""}`}
                onClick={() => jumpToStep(i)}
                type="button"
              >
                <div className="wf-dot-wrap">
                  <div className="wf-dot">
                    {i < activeIdx ? (
                      <span className="material-symbols-outlined wf-dot-icon">check</span>
                    ) : (
                      <span className="wf-dot-num">{s.index}</span>
                    )}
                  </div>
                  {i < steps.length - 1 && <div className="wf-dot-line" />}
                </div>
                <div className="wf-tl-body">
                  <div className="wf-tl-label">{s.label}</div>
                  <div className="wf-tl-sub">{s.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="wf-divider" />

        {/* ── Right: animated content panel ── */}
        <div className="wf-right" key={panelKey}>
          <div className="wf-panel">
            <div className="wf-panel-eyebrow">
              <div className="wf-panel-mark">
                <span className="material-symbols-outlined">{step.icon}</span>
              </div>
              <span className="wf-panel-step-num">
                {t("runtime.app.page.text_step")} {step.index} / {steps.length}
              </span>
            </div>
            <h3 className="wf-panel-title">{step.label}</h3>
            <p className="wf-panel-body">{step.description}</p>
            <div className="wf-panel-details">
              {step.detail.map((d, i) => (
                <div
                  key={i}
                  className="wf-panel-detail-row"
                  style={{ animationDelay: `${i * 60 + 200}ms` }}
                >
                  <span className="material-symbols-outlined wf-panel-detail-icon">
                    arrow_right
                  </span>
                  {d}
                </div>
              ))}
            </div>

            {/* Progress bar at bottom */}
            <div className="wf-progress-track">
              <div
                className="wf-progress-fill"
                style={{ width: `${((activeIdx + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="wf-progress-label">
              {activeIdx + 1} / {steps.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---- useInView -------------------------------------------------------
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ---- Reveal ----------------------------------------------------------
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`landing-reveal${inView ? " landing-reveal--in" : ""}`}
    >
      {children}
    </div>
  )
}

// ---- Cap (capability row) -------------------------------------------
function Cap({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="landing-cap">
      <span className="material-symbols-outlined landing-cap-icon">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

// ---- RoleCard --------------------------------------------------------
function RoleCard({
  icon,
  role,
  color,
  desc,
  caps,
}: {
  icon: string
  role: string
  color: string
  desc: string
  caps: { icon: string; text: string }[]
}) {
  return (
    <div className={`landing-role-card landing-role-card--${color}`}>
      <div className="landing-role-top">
        <div className={`landing-role-mark landing-role-mark--${color}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <div className="landing-role-tag">{role}</div>
          <p className="landing-role-desc">{desc}</p>
        </div>
      </div>
      <div className="landing-role-caps">
        {caps.map((c, i) => (
          <Cap key={i} icon={c.icon} text={c.text} />
        ))}
      </div>
    </div>
  )
}

// ---- Main page -------------------------------------------------------
export default function HomePage() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    // The layout wraps content in <main class="overflow-y-auto"> — not window
    const main = document.querySelector("main") as HTMLElement | null
    if (!main) return
    const onScroll = () => setScrolled(main.scrollTop > 60)
    main.addEventListener("scroll", onScroll, { passive: true })
    return () => main.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="landing-shell">
      {/* ── Nav ── */}
      <header className={`landing-nav${scrolled ? " landing-nav--scrolled" : ""}`}>
        <div className="landing-nav-inner">
          <Link href={ROUTES.HOME} className="landing-logo">
            <div className="landing-logo-mark">
              <span className="material-symbols-outlined">school</span>
            </div>
            <span className="landing-logo-name">{t("runtime.app.page.text_conferencespace")}</span>
          </Link>
          <nav className="landing-nav-links">
            <a href="#how-it-works" className="landing-nav-link">
              {t("runtime.app.page.text_workflow")}{" "}
            </a>
            <a href="#roles" className="landing-nav-link">
              {t("runtime.app.page.text_roles")}{" "}
            </a>
            <a href="#features" className="landing-nav-link">
              {t("runtime.app.page.text_features")}{" "}
            </a>
          </nav>
          <div className="landing-nav-actions">
            <div className="landing-lang">
              <LanguageSwitcher />
            </div>
            <Link href={ROUTES.LOGIN} className="landing-btn landing-btn--ghost">
              {t("runtime.app.page.text_sign_in")}{" "}
            </Link>
            <Link href={ROUTES.REGISTER} className="landing-btn landing-btn--primary">
              {t("runtime.app.page.text_register")}{" "}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-grid" aria-hidden />
        <div className="landing-hero-inner">
          <div className="landing-hero-eyebrow">
            <span className="material-symbols-outlined">deployed_code</span>
            {t("runtime.app.page.text_academic_conference_operations_platform")}{" "}
          </div>
          <h1 className="landing-hero-title">
            {t("runtime.app.page.text_one_workspace")} <br />
            {t("runtime.app.page.text_every_role")} <br />
            <span className="landing-hero-title-accent">
              {t("runtime.app.page.text_full_lifecycle")}
            </span>
          </h1>
          <p className="landing-hero-sub">
            {t("runtime.app.page.text_conferencespace_coordinates_conferences_end_to_end")}{" "}
          </p>
          <div className="landing-hero-cta">
            <Link
              href={ROUTES.REGISTER}
              className="landing-btn landing-btn--primary landing-btn--lg"
            >
              {t("runtime.app.page.text_create_an_account")}{" "}
            </Link>
            <Link href={ROUTES.LOGIN} className="landing-btn landing-btn--outline landing-btn--lg">
              {t("runtime.app.page.text_sign_in")}{" "}
            </Link>
          </div>
          <div className="landing-hero-props">
            <div className="landing-hero-prop">
              <span className="material-symbols-outlined">swap_horiz</span>
              {t("runtime.app.page.text_multi_role_single_account")}{" "}
            </div>
            <div className="landing-hero-prop">
              <span className="material-symbols-outlined">notifications</span>
              {t("runtime.app.page.text_real_time_websocket_notifications")}{" "}
            </div>
            <div className="landing-hero-prop">
              <span className="material-symbols-outlined">forum</span>
              {t("runtime.app.page.text_cross_role_discussion_threads")}{" "}
            </div>
          </div>
        </div>
        <div className="landing-hero-scroll-hint" aria-hidden>
          <span className="material-symbols-outlined">keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── Workflow sticky-scroll ── */}
      <WorkflowScroll />

      {/* ── Roles ── */}
      <section id="roles" className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <Reveal>
            <div className="landing-section-label">
              {t("runtime.app.page.text_role_workspaces")}
            </div>
            <h2 className="landing-section-title">
              {t("runtime.app.page.text_three_roles_one_account")}
            </h2>
            <p className="landing-section-desc">
              {t("runtime.app.page.text_a_single_registered_account_can_operate")}{" "}
            </p>
          </Reveal>
          <div className="landing-roles">
            <Reveal delay={0}>
              <RoleCard
                icon="edit_document"
                role={t("runtime.app.page.roles.author.role")}
                color="green"
                desc={t("runtime.app.page.roles.author.description")}
                caps={[
                  {
                    icon: "search",
                    text: t("runtime.app.page.prop_text_discover_and_browse_open_conferences"),
                  },
                  {
                    icon: "upload_file",
                    text: t("runtime.app.page.prop_text_create_and_publish_paper_submissions"),
                  },
                  {
                    icon: "save",
                    text: t("runtime.app.page.prop_text_save_drafts_and_return_to_continue"),
                  },
                  {
                    icon: "forum",
                    text: t("runtime.app.page.prop_text_participate_in_per_submission_discussions"),
                  },
                  {
                    icon: "visibility",
                    text: t("runtime.app.page.prop_text_track_submission_status_through_review"),
                  },
                  {
                    icon: "download",
                    text: t("runtime.app.page.prop_text_download_submission_artifacts"),
                  },
                ]}
              />
            </Reveal>
            <Reveal delay={80}>
              <RoleCard
                icon="rate_review"
                role={t("runtime.app.page.roles.reviewer.role")}
                color="blue"
                desc={t("runtime.app.page.roles.reviewer.description")}
                caps={[
                  {
                    icon: "mail",
                    text: t("runtime.app.page.prop_text_accept_or_decline_review_invitations"),
                  },
                  {
                    icon: "assignment",
                    text: t("runtime.app.page.prop_text_access_full_assignment_queue_and_backlog"),
                  },
                  {
                    icon: "star_rate",
                    text: t(
                      "runtime.app.page.prop_text_score_papers_on_multiple_criteria_dimensions",
                    ),
                  },
                  {
                    icon: "save",
                    text: t("runtime.app.page.prop_text_save_review_drafts_and_submit_final"),
                  },
                  {
                    icon: "history",
                    text: t(
                      "runtime.app.page.prop_text_maintain_a_searchable_completed_review_archive",
                    ),
                  },
                  {
                    icon: "forum",
                    text: t("runtime.app.page.prop_text_discuss_privately_with_co_reviewers_per"),
                  },
                ]}
              />
            </Reveal>
            <Reveal delay={160}>
              <RoleCard
                icon="manage_accounts"
                role={t("runtime.app.page.roles.chair.role")}
                color="navy"
                desc={t("runtime.app.page.roles.chair.description")}
                caps={[
                  {
                    icon: "add_circle",
                    text: t("runtime.app.page.prop_text_launch_conferences_through_a_6_step"),
                  },
                  {
                    icon: "dashboard",
                    text: t(
                      "runtime.app.page.prop_text_monitor_portfolio_level_health_and_metrics",
                    ),
                  },
                  {
                    icon: "person_search",
                    text: t(
                      "runtime.app.page.prop_text_inspect_coi_relationships_and_rebuild_index",
                    ),
                  },
                  {
                    icon: "gavel",
                    text: t(
                      "runtime.app.page.prop_text_persist_accept_reject_decisions_per_submission",
                    ),
                  },
                  {
                    icon: "group",
                    text: t(
                      "runtime.app.page.prop_text_manage_reviewer_committee_and_send_invitations",
                    ),
                  },
                  {
                    icon: "bar_chart",
                    text: t(
                      "runtime.app.page.prop_text_view_submission_and_review_analytics_dashboards",
                    ),
                  },
                ]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <Reveal>
            <div className="landing-section-label">
              {t("runtime.app.page.text_platform_features")}
            </div>
            <h2 className="landing-section-title">
              {t("runtime.app.page.text_built_for_conference_operations")}
            </h2>
            <p className="landing-section-desc">
              {t("runtime.app.page.text_every_feature_maps_to_a_real")}{" "}
            </p>
          </Reveal>
          <div className="landing-features">
            {[
              {
                icon: "psychology",
                title: t("runtime.app.page.prop_title_manuscript_pre_check"),
                desc: t("runtime.app.page.features.manuscript_pre_check"),
              },
              {
                icon: "gpp_good",
                title: t("runtime.app.page.prop_title_conflict_of_interest_monitoring"),
                desc: t("runtime.app.page.features.conflict_of_interest_monitoring"),
              },
              {
                icon: "notifications_active",
                title: t("runtime.app.page.prop_title_real_time_notification_feed"),
                desc: t("runtime.app.page.features.real_time_notification_feed"),
              },
              {
                icon: "swap_horiz",
                title: t("runtime.app.page.prop_title_role_context_switching"),
                desc: t("runtime.app.page.features.role_context_switching"),
              },
              {
                icon: "person_pin",
                title: t("runtime.app.page.prop_title_semantic_scholar_profile_linking"),
                desc: t("runtime.app.page.features.semantic_scholar_profile_linking"),
              },
              {
                icon: "route",
                title: t("runtime.app.page.prop_title_multi_step_submission_wizard"),
                desc: t("runtime.app.page.features.multi_step_submission_wizard"),
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="landing-feature-card">
                  <div className="landing-feature-icon">
                    <span className="material-symbols-outlined">{f.icon}</span>
                  </div>
                  <div>
                    <div className="landing-feature-title">{f.title}</div>
                    <p className="landing-feature-desc">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-section">
        <div className="landing-cta-grid" aria-hidden />
        <Reveal>
          <div className="landing-cta-inner">
            <div className="landing-section-label" style={{ color: "rgba(255,255,255,0.5)" }}>
              {t("runtime.app.page.text_get_started")}{" "}
            </div>
            <h2 className="landing-cta-title">
              {t("runtime.app.page.text_your_entire_conference_workflow")} <br />
              {t("runtime.app.page.text_in_one_place")}{" "}
            </h2>
            <p className="landing-cta-sub">
              {t("runtime.app.page.text_register_once_switch_between_author_reviewer")}{" "}
            </p>
            <div className="landing-cta-actions">
              <Link
                href={ROUTES.REGISTER}
                className="landing-btn landing-btn--white landing-btn--lg"
              >
                {t("runtime.app.page.text_create_your_account")}{" "}
              </Link>
              <Link
                href={ROUTES.LOGIN}
                className="landing-btn landing-btn--outline-white landing-btn--lg"
              >
                {t("runtime.app.page.text_sign_in")}{" "}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Link href={ROUTES.HOME} className="landing-logo">
            <div className="landing-logo-mark landing-logo-mark--sm">
              <span className="material-symbols-outlined">school</span>
            </div>
            <span className="landing-logo-name">{t("runtime.app.page.text_conferencespace")}</span>
          </Link>
          <div className="landing-footer-copy">
            {t("runtime.app.page.text_academic_conference_operations_platform_role_based")}{" "}
          </div>
        </div>
      </footer>
    </div>
  )
}
