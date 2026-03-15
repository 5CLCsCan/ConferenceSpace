import { apiFetch } from "./client"

export interface ConferenceRebuttalConfig {
  enabled: boolean
  phase: string
  start_at: string | null
  deadline: string | null
  char_limit_general: number
  char_limit_per_point: number
  allow_discussion: boolean
}

export interface RebuttalOverviewRow {
  submission_id: number
  title: string
  rebuttal_phase: string
  has_response: boolean
  total_reviewers: number
  acked_reviewers: number
}

export interface RebuttalOverviewResponse {
  settings: ConferenceRebuttalConfig
  submissions: RebuttalOverviewRow[]
}

export async function getRebuttalOverview(
  conferenceId: string,
): Promise<{ data: RebuttalOverviewResponse | null; error: string | null }> {
  try {
    const { data } = await apiFetch<{ data: RebuttalOverviewResponse }>(
      `/api/v1/conferences/${conferenceId}/rebuttal/settings`,
    )
    return { data: data.data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to load rebuttal overview" }
  }
}

export async function saveRebuttalSettings(
  conferenceId: string,
  settings: Partial<ConferenceRebuttalConfig>,
): Promise<{ data: ConferenceRebuttalConfig | null; error: string | null }> {
  try {
    const { data } = await apiFetch<{ data: ConferenceRebuttalConfig }>(
      `/api/v1/conferences/${conferenceId}/rebuttal/settings`,
      {
        method: "PATCH",
        body: JSON.stringify(settings),
      },
    )
    return { data: data.data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to save settings" }
  }
}

export async function openRebuttal(
  conferenceId: string,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/open`, { method: "POST" })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to open rebuttal" }
  }
}

export async function finalizeRebuttal(
  conferenceId: string,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/finalize`, { method: "POST" })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to finalize rebuttal" }
  }
}

export async function openDiscussion(
  conferenceId: string,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/open-discussion`, { method: "POST" })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to open discussion" }
  }
}
