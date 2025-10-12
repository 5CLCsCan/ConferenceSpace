// API Layer for Conference Management
// This file provides the API interface for conference-related operations
// Currently uses mock data, but structured for easy backend integration

import type { Conference, ConferenceStats, Paper, User, Track } from "@/lib/types"
import { mockConference, mockConferenceStats, mockPapers, mockUsers, mockTracks } from "@/lib/mock-data"

// API Response wrapper for type safety
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

/**
 * Get conference details by ID
 * Backend endpoint: GET /api/conferences/:id
 * Database: conferences table
 * Fields: id, name, acronym, year, description, submission_deadline, review_deadline,
 *         camera_ready_deadline, notification_date, conference_date, location, website, status
 */
export async function getConferenceById(conferenceId: string): Promise<ApiResponse<Conference>> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock implementation - replace with actual API call
    // const response = await fetch(`/api/conferences/${conferenceId}`)
    // const data = await response.json()

    // if (conferenceId === mockConference.id) {
      return {
        data: mockConference,
        error: null,
        status: 200,
      }
    // }

    // return {
    //   data: null,
    //   error: "Conference not found",
    //   status: 404,
    // }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get conference statistics
 * Backend endpoint: GET /api/conferences/:id/stats
 * Database: Aggregated from papers, reviews, and submissions tables
 * Fields: total_submissions, total_reviews, avg_reviews_per_paper, acceptance_rate,
 *         submissions_by_track, submissions_over_time, review_progress, top_keywords
 */
export async function getConferenceStats(conferenceId: string): Promise<ApiResponse<ConferenceStats>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock implementation
    // const response = await fetch(`/api/conferences/${conferenceId}/stats`)
    // const data = await response.json()

    return {
      data: mockConferenceStats,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get all papers for a conference
 * Backend endpoint: GET /api/conferences/:id/papers?status=&track_id=
 * Database: papers table with joins to authors, reviews
 * Fields: id, title, abstract, keywords, authors, conference_id, track_id, status,
 *         submitted_at, updated_at, version
 */
export async function getConferencePapers(
  conferenceId: string,
  filters?: {
    status?: string
    track_id?: string
  },
): Promise<ApiResponse<Paper[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock implementation with filtering
    let papers = mockPapers.filter((p) => p.conference_id === conferenceId)

    if (filters?.status) {
      papers = papers.filter((p) => p.status === filters.status)
    }

    if (filters?.track_id) {
      papers = papers.filter((p) => p.track_id === filters.track_id)
    }

    return {
      data: papers,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get conference committee members
 * Backend endpoint: GET /api/conferences/:id/committee
 * Database: conference_committee table with join to users
 * Fields: user_id, name, email, affiliation, role (chair, pc_member), track_id
 */
export async function getConferenceCommittee(conferenceId: string): Promise<ApiResponse<User[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Mock implementation - return users who are chairs or PC members
    const committeeMembers = mockUsers.filter(
      (user) => user.roles.includes("chair") || user.roles.includes("pc_member"),
    )

    return {
      data: committeeMembers,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get conference tracks
 * Backend endpoint: GET /api/conferences/:id/tracks
 * Database: tracks table with join to users (chairs)
 * Fields: id, name, description, chairs (array of user_ids)
 */
export async function getConferenceTracks(conferenceId: string): Promise<ApiResponse<Track[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      data: mockTracks,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

/**
 * Get important dates for conference
 * Backend endpoint: GET /api/conferences/:id/dates
 * Database: conferences table + conference_dates table for additional milestones
 * Fields: submission_deadline, review_deadline, camera_ready_deadline,
 *         notification_date, conference_date, registration_deadline
 */
export interface ImportantDate {
  id: string
  title: string
  date: string
  description: string
  type: "deadline" | "notification" | "event"
  isPast: boolean
}

export async function getConferenceDates(conferenceId: string): Promise<ApiResponse<ImportantDate[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const now = new Date()
    const dates: ImportantDate[] = [
      {
        id: "date-1",
        title: "Paper Submission Deadline",
        date: mockConference.submission_deadline,
        description: "Final deadline for paper submissions",
        type: "deadline",
        isPast: new Date(mockConference.submission_deadline) < now,
      },
      {
        id: "date-2",
        title: "Review Deadline",
        date: mockConference.review_deadline,
        description: "Reviewers must complete their reviews",
        type: "deadline",
        isPast: new Date(mockConference.review_deadline) < now,
      },
      {
        id: "date-3",
        title: "Author Notification",
        date: mockConference.notification_date,
        description: "Authors will be notified of acceptance decisions",
        type: "notification",
        isPast: new Date(mockConference.notification_date) < now,
      },
      {
        id: "date-4",
        title: "Camera-Ready Deadline",
        date: mockConference.camera_ready_deadline,
        description: "Final version of accepted papers due",
        type: "deadline",
        isPast: new Date(mockConference.camera_ready_deadline) < now,
      },
      {
        id: "date-5",
        title: "Conference Date",
        date: mockConference.conference_date,
        description: "Main conference event",
        type: "event",
        isPast: new Date(mockConference.conference_date) < now,
      },
    ]

    return {
      data: dates,
      error: null,
      status: 200,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}
