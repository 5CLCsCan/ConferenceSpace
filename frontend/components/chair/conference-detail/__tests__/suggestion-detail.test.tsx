import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SuggestionDetail } from "../suggestion-detail"

const baseMetadata = {
  source: "auto_pass1" as const,
  matched_keywords: ["NLP", "Transformers"],
  unmatched_paper_keywords: ["Sentiment Analysis"],
  extra_reviewer_keywords: ["Computer Vision"],
  coi_checks: {
    self_author: "passed",
    declared_conflicts: "passed",
    relationship: "passed",
  },
  created_at: "2026-04-30T12:00:00Z",
}

describe("SuggestionDetail", () => {
  it("renders fallback message when metadata is null", () => {
    render(<SuggestionDetail metadata={null} assignmentCount={2} score={0.75} />)
    expect(
      screen.getByText("Detailed breakdown not available for suggestions created before this feature.")
    ).toBeDefined()
  })

  it("renders expanded detail panel for auto_pass1 with keywords", () => {
    render(<SuggestionDetail metadata={baseMetadata} assignmentCount={3} score={0.8} />)

    // Score Breakdown section
    expect(screen.getByText("Score Breakdown")).toBeDefined()

    // Matched keywords
    expect(screen.getByText("NLP")).toBeDefined()
    expect(screen.getByText("Transformers")).toBeDefined()

    // Paper-only keywords
    expect(screen.getByText("Sentiment Analysis")).toBeDefined()

    // Reviewer-only keywords
    expect(screen.getByText("Computer Vision")).toBeDefined()

    // Match Reasons — "Shares N keywords"
    expect(screen.getByText(/Shares 2 keywords:/)).toBeDefined()
    expect(screen.getByText(/NLP, Transformers/)).toBeDefined()

    // COI checks — all passed
    expect(screen.getAllByText("Passed")).toHaveLength(3)

    // Reviewer load
    expect(screen.getByText("3 papers assigned in this conference")).toBeDefined()

    // Source footer
    expect(screen.getByText(/Auto-assign Pass 1/)).toBeDefined()
  })

  it("renders fallback assignment reason for auto_pass2", () => {
    const metadata = {
      ...baseMetadata,
      source: "auto_pass2" as const,
    }
    render(<SuggestionDetail metadata={metadata} assignmentCount={2} score={0.5} />)

    expect(
      screen.getByText("Fallback assignment — added to satisfy minimum reviewers per paper")
    ).toBeDefined()
    expect(screen.getByText(/Auto-assign Pass 2 \(Fallback\)/)).toBeDefined()
  })

  it("renders manual suggestion correctly", () => {
    const metadata = {
      ...baseMetadata,
      source: "manual" as const,
      matched_keywords: [],
      unmatched_paper_keywords: [],
      extra_reviewer_keywords: [],
    }
    render(<SuggestionDetail metadata={metadata} assignmentCount={1} score={0} />)

    expect(screen.getByText("Manually added by chair — no computed score")).toBeDefined()
    expect(screen.getByText("No keyword data available")).toBeDefined()
    // Source footer contains "Manual" — match the footer paragraph by its combined text content
    expect(screen.getByText((_, element) => {
      return element?.tagName === "P" && (element.textContent ?? "").includes("Source: Manual")
    })).toBeDefined()
  })

  it("collapses and expands the detail panel on toggle", () => {
    render(<SuggestionDetail metadata={baseMetadata} assignmentCount={2} score={0.8} />)

    // Panel is expanded by default
    expect(screen.getByText("Score Breakdown")).toBeDefined()

    // Click to collapse
    fireEvent.click(screen.getByRole("button", { name: /Match Details/i }))

    // Content should be gone
    expect(screen.queryByText("Score Breakdown")).toBeNull()

    // Click to expand again
    fireEvent.click(screen.getByRole("button", { name: /Match Details/i }))

    // Content should be visible again
    expect(screen.getByText("Score Breakdown")).toBeDefined()
  })

  it("shows 'Skipped (graph database unavailable)' when neo4j is unavailable", () => {
    const metadata = {
      ...baseMetadata,
      coi_checks: {
        self_author: "passed",
        declared_conflicts: "passed",
        relationship: "skipped_neo4j_unavailable",
      },
    }
    render(<SuggestionDetail metadata={metadata} assignmentCount={2} score={0.7} />)

    expect(screen.getByText("Skipped (graph database unavailable)")).toBeDefined()
  })

  it("pluralizes reviewer load correctly for 1 paper", () => {
    render(<SuggestionDetail metadata={baseMetadata} assignmentCount={1} score={0.8} />)
    expect(screen.getByText("1 paper assigned in this conference")).toBeDefined()
  })

  it("pluralizes reviewer load correctly for 3 papers", () => {
    render(<SuggestionDetail metadata={baseMetadata} assignmentCount={3} score={0.8} />)
    expect(screen.getByText("3 papers assigned in this conference")).toBeDefined()
  })
})
