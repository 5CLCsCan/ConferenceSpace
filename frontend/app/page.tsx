"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ROUTES } from "@/lib/routes"

/* -----------------------------------------------------------------------
   HomeLanding — Scholar-Compact aesthetic
   Content sourced strictly from platform-recon.md and feature-mapping.md
   No fabricated benchmarks.
----------------------------------------------------------------------- */

// ---- Lifecycle data --------------------------------------------------
const STEPS = [
  {
    index: 1,
    icon: "event",
    label: "Conference Setup",
    sub: "Chair creates conference",
    description:
      "The chair defines the conference identity: title, acronym, venue, and operational timeline. Review type (single- or double-blind), submission constraints, CFP text, committee policy, and key dates are all configured through a six-step wizard before the conference becomes visible to authors.",
    detail: [
      "Six-step creation wizard",
      "Submission window enforcement",
      "Blind-review mode selection",
      "Committee and co-chair configuration",
      "CFP content and key-date publishing",
    ],
  },
  {
    index: 2,
    icon: "upload_file",
    label: "Submission Intake",
    sub: "Authors discover and submit",
    description:
      "Authors browse available conferences, inspect CFP details, and enter the submission wizard when a conference is open. The wizard guides them through paper details, co-author lookup against registered users, manuscript file upload (with pre-check diagnostics), conflict-of-interest declaration, and a final review before save-as-draft or publish.",
    detail: [
      "Conference discovery and CFP browsing",
      "Multi-step submission wizard",
      "Co-author search against user registry",
      "Manuscript pre-check before final submit",
      "Save draft or publish in one flow",
    ],
  },
  {
    index: 3,
    icon: "mail",
    label: "Reviewer Invitation",
    sub: "Chairs invite, reviewers respond",
    description:
      "The chair manages a reviewer committee per conference and sends invitations from the committee panel. Each invited reviewer receives a notification and explicit accept/decline controls. Accepted invitations unlock assignment execution. Declined invitations require the chair to find alternative coverage.",
    detail: [
      "Committee roster management",
      "Per-conference reviewer invitation",
      "Accept / decline invitation workflow",
      "Pending invitation status tracking",
      "Notification-driven invitation awareness",
    ],
  },
  {
    index: 4,
    icon: "rate_review",
    label: "Review Execution",
    sub: "Reviewers score and submit",
    description:
      "Reviewers open their assigned papers from a sortable backlog. The review workspace presents the paper alongside a scoring form — overall score, confidence, novelty, technical quality, clarity, and relevance — plus narrative comment sections for authors and the programme committee. Draft saves preserve progress; final submit gates on required field completion.",
    detail: [
      "Sortable assignment backlog",
      "Multi-criteria scoring form",
      "Draft save and final submit states",
      "Validation gate on required sections",
      "Completed review archive for history",
    ],
  },
  {
    index: 5,
    icon: "forum",
    label: "Discussion & Deliberation",
    sub: "Threaded cross-role collaboration",
    description:
      "Each submission has a shared discussion workspace. Authors, reviewers, and chairs can create threads and post replies from their respective role contexts. Thread visibility is role-framed in the UI, but message state is persisted at the submission level and provides an auditable collaboration record that informs decision-making.",
    detail: [
      "Per-submission threaded discussion",
      "Thread creation and message replies",
      "Cross-role participation (author / reviewer / chair)",
      "Persisted message history",
      "Discussion visible in submission detail workspace",
    ],
  },
  {
    index: 6,
    icon: "gavel",
    label: "Chair Decision",
    sub: "Accept or reject, persisted",
    description:
      "After reviewing the accumulated evidence — submitted reviews, discussion threads, COI analytics, and conference dashboard data — the chair selects an outcome for each submission. The current persisted decision states are accept and reject. Once committed, the submission status transitions and result notifications propagate to affected authors and reviewers.",
    detail: [
      "Submission evidence review (scores + discussions + COI)",
      "Accept / reject decision persistence",
      "COI dashboard and conflict relationship inspection",
      "Rebuild COI index on demand",
      "Decision triggers result notification delivery",
    ],
  },
]

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [panelKey, setPanelKey] = useState(0)
  const scrollerRef = useRef<HTMLElement | null>(null)

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
      const idx = Math.min(STEPS.length - 1, Math.floor(pct * STEPS.length))

      setActiveIdx((prev) => {
        if (prev !== idx) setPanelKey((k) => k + 1)
        return idx
      })
    }

    const target = scroller === document.documentElement ? window : scroller
    target.addEventListener("scroll", onScroll, { passive: true })
    onScroll() // compute initial state
    return () => target.removeEventListener("scroll", onScroll)
  }, [])

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
    const target = offsetTop + (i / STEPS.length) * scrollable + 1

    if (scroller === document.documentElement) {
      window.scrollTo({ top: target, behavior: "smooth" })
    } else {
      scroller.scrollTo({ top: target, behavior: "smooth" })
    }
  }

  const step = STEPS[activeIdx]

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="wf-scroll-container"
      // Total scroll height: 100vh anchor + (steps * 80vh) of scroll range
      style={{ height: `calc(100vh + ${STEPS.length * 80}vh)` }}
    >
      {/* Sticky panel — stays in viewport while user scrolls container */}
      <div className="wf-sticky">
        {/* ── Left: timeline nav ── */}
        <div className="wf-left">
          <div className="wf-left-header">
            <div className="wf-section-label">The lifecycle</div>
            <h2 className="wf-title">
              From setup to decision <br />— in one system
            </h2>
            <p className="wf-desc">
              Every stage of the conference paper lifecycle is wired together and role-gated. <br />
              Scroll to walk through it.
            </p>
          </div>

          <div className="wf-timeline">
            {STEPS.map((s, i) => (
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
                  {i < STEPS.length - 1 && <div className="wf-dot-line" />}
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
                Step {step.index} of {STEPS.length}
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
                style={{ width: `${((activeIdx + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <div className="wf-progress-label">
              {activeIdx + 1} / {STEPS.length}
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
            <span className="landing-logo-name">ConferenceSpace</span>
          </Link>
          <nav className="landing-nav-links">
            <a href="#how-it-works" className="landing-nav-link">
              Workflow
            </a>
            <a href="#roles" className="landing-nav-link">
              Roles
            </a>
            <a href="#features" className="landing-nav-link">
              Features
            </a>
          </nav>
          <div className="landing-nav-actions">
            <div className="landing-lang">
              <LanguageSwitcher />
            </div>
            <Link href={ROUTES.LOGIN} className="landing-btn landing-btn--ghost">
              Sign in
            </Link>
            <Link href={ROUTES.REGISTER} className="landing-btn landing-btn--primary">
              Register
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
            Academic Conference Operations Platform
          </div>
          <h1 className="landing-hero-title">
            One workspace.
            <br />
            Every role.
            <br />
            <span className="landing-hero-title-accent">Full lifecycle.</span>
          </h1>
          <p className="landing-hero-sub">
            ConferenceSpace coordinates conferences end-to-end — from the call for papers through
            submission, peer review, decision, and result notification — in a single, role-aware
            system for authors, reviewers, and chairs.
          </p>
          <div className="landing-hero-cta">
            <Link
              href={ROUTES.REGISTER}
              className="landing-btn landing-btn--primary landing-btn--lg"
            >
              Create an account
            </Link>
            <Link href={ROUTES.LOGIN} className="landing-btn landing-btn--outline landing-btn--lg">
              Sign in
            </Link>
          </div>
          <div className="landing-hero-props">
            <div className="landing-hero-prop">
              <span className="material-symbols-outlined">swap_horiz</span>
              Multi-role single account
            </div>
            <div className="landing-hero-prop">
              <span className="material-symbols-outlined">notifications</span>
              Real-time WebSocket notifications
            </div>
            <div className="landing-hero-prop">
              <span className="material-symbols-outlined">forum</span>
              Cross-role discussion threads
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
            <div className="landing-section-label">Role workspaces</div>
            <h2 className="landing-section-title">Three roles. One account.</h2>
            <p className="landing-section-desc">
              A single registered account can operate as Author, Reviewer, or Chair simultaneously.
              Switch active role context at any time — permissions and workspaces adjust
              accordingly.
            </p>
          </Reveal>
          <div className="landing-roles">
            <Reveal delay={0}>
              <RoleCard
                icon="edit_document"
                role="Author"
                color="green"
                desc="Researchers submitting work and tracking evaluation outcomes."
                caps={[
                  { icon: "search", text: "Discover and browse open conferences" },
                  { icon: "upload_file", text: "Create and publish paper submissions" },
                  { icon: "save", text: "Save drafts and return to continue later" },
                  { icon: "forum", text: "Participate in per-submission discussions" },
                  { icon: "visibility", text: "Track submission status through review" },
                  { icon: "download", text: "Download submission artifacts" },
                ]}
              />
            </Reveal>
            <Reveal delay={80}>
              <RoleCard
                icon="rate_review"
                role="Reviewer"
                color="blue"
                desc="Invited evaluators performing scholarly peer review."
                caps={[
                  { icon: "mail", text: "Accept or decline review invitations" },
                  { icon: "assignment", text: "Access full assignment queue and backlog" },
                  { icon: "star_rate", text: "Score papers on multiple criteria dimensions" },
                  { icon: "save", text: "Save review drafts and submit final reviews" },
                  { icon: "history", text: "Maintain a searchable completed-review archive" },
                  { icon: "forum", text: "Discuss privately with co-reviewers per paper" },
                ]}
              />
            </Reveal>
            <Reveal delay={160}>
              <RoleCard
                icon="manage_accounts"
                role="Chair"
                color="navy"
                desc="Conference owners governing policy, progress, and outcomes."
                caps={[
                  { icon: "add_circle", text: "Launch conferences through a 6-step wizard" },
                  { icon: "dashboard", text: "Monitor portfolio-level health and metrics" },
                  { icon: "person_search", text: "Inspect COI relationships and rebuild index" },
                  { icon: "gavel", text: "Persist accept / reject decisions per submission" },
                  { icon: "group", text: "Manage reviewer committee and send invitations" },
                  { icon: "bar_chart", text: "View submission and review analytics dashboards" },
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
            <div className="landing-section-label">Platform features</div>
            <h2 className="landing-section-title">Built for conference operations</h2>
            <p className="landing-section-desc">
              Every feature maps to a real conference workflow step — no placeholder sprinkle, no
              marketing fiction.
            </p>
          </Reveal>
          <div className="landing-features">
            {[
              {
                icon: "psychology",
                title: "Manuscript pre-check",
                desc: "Authors upload to a pre-check endpoint before final submission. Compliance diagnostics surface formatting issues before they block the intake pipeline.",
              },
              {
                icon: "gpp_good",
                title: "Conflict-of-interest monitoring",
                desc: "COI relationship analytics are computed per conference. Chairs can inspect reviewer-author conflict tables and trigger a manual index rebuild operation.",
              },
              {
                icon: "notifications_active",
                title: "Real-time notification feed",
                desc: "Workflow events push through a WebSocket channel in near-real-time alongside a persistent notification inbox with per-item read controls.",
              },
              {
                icon: "swap_horiz",
                title: "Role context switching",
                desc: "One account holds multiple role grants. The role-selection screen validates access before switching, ensuring the correct workspace and permission scope loads.",
              },
              {
                icon: "person_pin",
                title: "Semantic Scholar profile linking",
                desc: "Authors can search the Semantic Scholar author index and link their academic identity to their account, enriching profile and submission context.",
              },
              {
                icon: "route",
                title: "Multi-step submission wizard",
                desc: "The submission form guides authors through paper details, co-author search, file upload with pre-check, conflict-of-interest declaration, and a final review step.",
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
              Get started
            </div>
            <h2 className="landing-cta-title">
              Your entire conference workflow,
              <br />
              in one place.
            </h2>
            <p className="landing-cta-sub">
              Register once. Switch between Author, Reviewer, and Chair contexts. One system handles
              your full conference operations lifecycle.
            </p>
            <div className="landing-cta-actions">
              <Link
                href={ROUTES.REGISTER}
                className="landing-btn landing-btn--white landing-btn--lg"
              >
                Create your account
              </Link>
              <Link
                href={ROUTES.LOGIN}
                className="landing-btn landing-btn--outline-white landing-btn--lg"
              >
                Sign in
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
            <span className="landing-logo-name">ConferenceSpace</span>
          </Link>
          <div className="landing-footer-copy">
            Academic conference operations platform &mdash; Role-based, lifecycle-aware.
          </div>
        </div>
      </footer>
    </div>
  )
}
