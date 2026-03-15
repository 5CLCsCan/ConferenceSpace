import { describe, expect, it } from "vitest"

import { initialFormData } from "@/components/wizard/creation/types"
import type { Conference } from "@/lib/types"

import { buildConferenceMutationPayload, mapConferenceToFormData } from "../conference-form"

function makeConference(overrides?: Partial<Conference>): Conference {
  return {
    id: "conf-1",
    name: "Conference Space 2026",
    acronym: "CS26",
    year: 2026,
    description: "Test conference",
    submission_deadline: "",
    review_deadline: "",
    camera_ready_deadline: "",
    notification_date: "",
    conference_date: "",
    location: "Ho Chi Minh City",
    status: "open",
    tracks: ["Main Track"],
    ...overrides,
  }
}

describe("conference-form submission gating mapping", () => {
  it("keeps optional gating rules inactive when the conference has no desk rejection settings", () => {
    const formData = mapConferenceToFormData(makeConference())

    expect(formData.gatingEnabled).toBe(false)
    expect(formData.gatingMinReferences).toBeNull()
    expect(formData.gatingRequiredSections).toEqual([])
    expect(formData.gatingTitleMaxWords).toBeNull()
    expect(formData.gatingAnonymizationRequired).toBe(false)
    expect(formData.gatingBannedPhrases).toEqual([])
    expect(formData.gatingScopeKeywords).toEqual([])
    expect(formData.gatingPrompt).toBe("")
  })

  it("maps desk rejection settings into the wizard gating fields", () => {
    const conference = makeConference({
      configurations: {
        desk_rejection_settings: {
          enabled: true,
          min_references: 12,
          required_sections: ["Abstract", "Methods", "References"],
          title_max_words: 18,
          custom_rules: {
            author_anonymization_required: false,
            banned_phrases: ["state of the art", "breakthrough"],
          },
          scope_keywords: ["workflow", "ai"],
          prompt_fragments: ["Focus on reproducibility and novelty."],
        },
      },
    })

    const formData = mapConferenceToFormData(conference)

    expect(formData.gatingEnabled).toBe(true)
    expect(formData.gatingMinReferences).toBe(12)
    expect(formData.gatingRequiredSections).toEqual(["Abstract", "Methods", "References"])
    expect(formData.gatingTitleMaxWords).toBe(18)
    expect(formData.gatingAnonymizationRequired).toBe(false)
    expect(formData.gatingBannedPhrases).toEqual(["state of the art", "breakthrough"])
    expect(formData.gatingScopeKeywords).toEqual(["workflow", "ai"])
    expect(formData.gatingPrompt).toBe("Focus on reproducibility and novelty.")
  })

  it("serializes wizard gating fields into desk rejection settings", () => {
    const formData = {
      ...initialFormData,
      title: "Conference Space 2026",
      acronym: "CS26",
      description: "Submission gating enabled",
      topics: ["ai", "systems"],
      tracks: ["Main Track"],
      gatingEnabled: true,
      gatingMinReferences: 10,
      gatingRequiredSections: ["Abstract", "Introduction", "Conclusion", "References"],
      gatingTitleMaxWords: 16,
      gatingAnonymizationRequired: true,
      gatingBannedPhrases: ["chatgpt", "lorem ipsum"],
      gatingScopeKeywords: ["workflow", "review"],
      gatingPrompt: "Flag thin empirical support, but never block on content alone.",
    }

    const existingConference = makeConference({
      configurations: {
        desk_rejection_settings: {
          max_sentence_words: 30,
          thresholds: {
            desk_reject_score: 0.25,
            accept_score: 0.75,
          },
          custom_rules: {
            min_datasets: 2,
          },
        },
      },
    })

    const payload = buildConferenceMutationPayload(formData, existingConference)

    expect(payload.configurations.desk_rejection_settings).toEqual({
      enabled: true,
      required_sections: ["Abstract", "Introduction", "Conclusion", "References"],
      title_max_words: 16,
      max_sentence_words: 30,
      min_references: 10,
      thresholds: {
        desk_reject_score: 0.25,
        accept_score: 0.75,
      },
      weights: undefined,
      custom_rules: {
        min_datasets: 2,
        author_anonymization_required: true,
        banned_phrases: ["chatgpt", "lorem ipsum"],
      },
      scope_keywords: ["workflow", "review"],
      prompt_fragments: ["Flag thin empirical support, but never block on content alone."],
    })
  })

  it("does not create implicit gating rules from frontend defaults", () => {
    const payload = buildConferenceMutationPayload(
      {
        ...initialFormData,
        title: "Conference Space 2026",
        acronym: "CS26",
        gatingEnabled: true,
      },
      makeConference(),
    )

    expect(payload.configurations.desk_rejection_settings).toEqual({
      enabled: true,
      required_sections: [],
      title_max_words: undefined,
      max_sentence_words: 25,
      min_references: undefined,
      thresholds: {
        desk_reject_score: 0.3,
        accept_score: 0.7,
      },
      weights: undefined,
      custom_rules: {
        min_datasets: 1,
        author_anonymization_required: undefined,
        banned_phrases: [],
      },
      scope_keywords: [],
      prompt_fragments: [],
    })
  })
})
