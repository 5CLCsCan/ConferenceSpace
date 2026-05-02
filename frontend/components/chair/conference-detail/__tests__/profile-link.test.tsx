import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  ProfileLink,
  ProfileLinkIconButton,
  getProfileLink,
} from "../profile-link"

describe("getProfileLink", () => {
  describe("on-platform users (reviewer suggestions)", () => {
    it("returns an internal profile link when on_platform is true and email is present", () => {
      const link = getProfileLink({
        on_platform: true,
        email: "alice@example.com",
        scholar_id: "s-123",
      })
      expect(link).toEqual({ href: "/profile/alice@example.com", external: false })
    })

    it("falls back to platform_user_id when on_platform and email is missing", () => {
      const link = getProfileLink({
        on_platform: true,
        email: null,
        platform_user_id: 42,
      })
      expect(link).toEqual({ href: "/profile/42", external: false })
    })

    it("falls back to scholar_id as last resort when on_platform but no email/user id", () => {
      const link = getProfileLink({
        on_platform: true,
        email: null,
        platform_user_id: null,
        scholar_id: "s-999",
      })
      expect(link).toEqual({
        href: "https://www.semanticscholar.org/author/s-999",
        external: true,
      })
    })
  })

  describe("external (not on-platform) users", () => {
    it("returns a Semantic Scholar link when on_platform is false and scholar_id is present", () => {
      const link = getProfileLink({
        on_platform: false,
        email: "",
        scholar_id: "abc-123",
      })
      expect(link).toEqual({
        href: "https://www.semanticscholar.org/author/abc-123",
        external: true,
      })
    })

    it("prefers scholar_id over email for is_external users (committee table case)", () => {
      // An external invitee may carry an email but the canonical profile still
      // lives on Semantic Scholar.
      const link = getProfileLink({
        is_external: true,
        email: "bob@elsewhere.com",
        scholar_id: "s-456",
      })
      expect(link).toEqual({
        href: "https://www.semanticscholar.org/author/s-456",
        external: true,
      })
    })

    it("returns null when is_external is true but scholar_id is missing", () => {
      const link = getProfileLink({ is_external: true, scholar_id: null })
      expect(link).toBeNull()
    })
  })

  describe("committee members (no explicit on_platform flag)", () => {
    it("links to the platform profile when only email is provided", () => {
      const link = getProfileLink({ email: "chair@example.com" })
      expect(link).toEqual({ href: "/profile/chair@example.com", external: false })
    })

    it("URL-encodes the scholar_id so it is safe in paths", () => {
      const link = getProfileLink({ is_external: true, scholar_id: "s 100/x" })
      expect(link?.href).toBe(
        "https://www.semanticscholar.org/author/s%20100%2Fx",
      )
    })
  })

  describe("empty / null cases", () => {
    it("returns null when no identifying fields are present", () => {
      expect(getProfileLink({})).toBeNull()
    })

    it("returns null when on_platform is true but everything else is missing", () => {
      expect(
        getProfileLink({ on_platform: true, email: null, platform_user_id: null }),
      ).toBeNull()
    })
  })
})

describe("<ProfileLink>", () => {
  it("renders an internal <a> (Next <Link>) for non-external links", () => {
    render(
      <ProfileLink link={{ href: "/profile/u@x.com", external: false }}>
        <span>Me</span>
      </ProfileLink>,
    )
    const anchor = screen.getByText("Me").closest("a")
    expect(anchor).not.toBeNull()
    expect(anchor).toHaveAttribute("href", "/profile/u@x.com")
    expect(anchor).not.toHaveAttribute("target")
  })

  it("renders a new-tab <a> with noopener rel for external links", () => {
    render(
      <ProfileLink link={{ href: "https://example.com/x", external: true }}>
        <span>External</span>
      </ProfileLink>,
    )
    const anchor = screen.getByText("External").closest("a")
    expect(anchor).not.toBeNull()
    expect(anchor).toHaveAttribute("href", "https://example.com/x")
    expect(anchor).toHaveAttribute("target", "_blank")
    expect(anchor).toHaveAttribute("rel", expect.stringContaining("noopener"))
  })

  it("renders a plain <span> wrapper when the link is null", () => {
    const { container } = render(
      <ProfileLink link={null}>
        <span>None</span>
      </ProfileLink>,
    )
    // No anchor element should be rendered.
    expect(container.querySelector("a")).toBeNull()
    expect(screen.getByText("None")).toBeInTheDocument()
  })
})

describe("<ProfileLinkIconButton>", () => {
  it("renders nothing when the link is null", () => {
    const { container } = render(<ProfileLinkIconButton link={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders a `person` icon that links to the platform profile for internal links", () => {
    render(
      <ProfileLinkIconButton
        link={{ href: "/profile/u@x.com", external: false }}
        ariaLabel="View profile for u@x.com"
      />,
    )
    const anchor = screen.getByRole("link", { name: /View profile for u@x\.com/ })
    expect(anchor).toHaveAttribute("href", "/profile/u@x.com")
    expect(anchor).not.toHaveAttribute("target")
    // The Material Symbols icon name is rendered as text inside the span.
    expect(anchor.textContent).toBe("person")
  })

  it("renders the same `person` icon for external links, but opens in a new tab", () => {
    // Consistency matters in the committee UI: using a different glyph
    // (open_in_new) for external invitees duplicates what the PlatformBadge
    // already tells the chair. We keep the icon identical and signal
    // externalness via target=_blank + rel.
    render(
      <ProfileLinkIconButton
        link={{ href: "https://example.com/s/1", external: true }}
        ariaLabel="Open Semantic Scholar"
      />,
    )
    const anchor = screen.getByRole("link", { name: /Open Semantic Scholar/ })
    expect(anchor).toHaveAttribute("href", "https://example.com/s/1")
    expect(anchor).toHaveAttribute("target", "_blank")
    expect(anchor).toHaveAttribute("rel", expect.stringContaining("noopener"))
    expect(anchor.textContent).toBe("person")
  })
})
