import { APIRequestContext } from "@playwright/test"
import { faker } from "@faker-js/faker"
import * as fs from "fs"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080/api/v1"

export interface SubmissionInformation {
  co_authors?: string[]
  keywords?: string[]
  paper_type?: string
  track_name?: string
  additional_notes?: string
  metadata?: {
    language?: string
    page_count?: number
  }
}

export interface SubmissionData {
  title: string
  abstract: string
  link?: string
  domain: string[]
  status: "draft" | "published"
  information?: SubmissionInformation
}

export interface FileMetadata {
  filename: string
  original_name: string
  size: number
  mime_type: string
  path: string
}

export interface Submission {
  id: number
  conference_id: number
  author: string
  title: string
  abstract: string
  link?: string
  domain: string[]
  status: string
  information?: SubmissionInformation
  file?: FileMetadata
  cover_letter?: FileMetadata
  created_at: string
  updated_at: string
}

/**
 * Create a new submission via API with file upload
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the author user
 * @param conferenceId - Conference ID
 * @param submissionData - Submission data
 * @param filePath - Path to the PDF file to upload (optional for draft)
 * @returns Created submission object
 */
export async function createSubmission(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  submissionData: SubmissionData,
  filePath?: string,
): Promise<Submission> {
  // Prepare multipart form data
  // Wrap in { submission: ... } to match backend DTO structure (same as frontend lib/api/papers.ts)
  const formData: Record<string, any> = {
    submission: JSON.stringify({ submission: submissionData }),
  }

  // Add file if provided
  if (filePath) {
    formData.file = {
      name: filePath.split("/").pop() || filePath.split("\\").pop() || "paper.pdf",
      mimeType: "application/pdf",
      buffer: fs.readFileSync(filePath),
    }
  }

  console.log("Creating submission:", {
    conferenceId,
    title: submissionData.title,
    status: submissionData.status,
    hasFile: !!filePath,
  })

  const response = await request.post(`${API_BASE_URL}/conferences/${conferenceId}/submissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    multipart: formData,
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    console.error("Submission creation failed:", {
      status: response.status(),
      statusText: response.statusText(),
      body: errorBody,
      url: response.url(),
    })
    throw new Error(`Failed to create submission: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  return responseData.data
}

/**
 * Get a submission by ID via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token for authentication
 * @param conferenceId - Conference ID
 * @param submissionId - Submission ID
 * @returns Submission object
 */
export async function getSubmission(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  submissionId: number,
): Promise<Submission> {
  const response = await request.get(
    `${API_BASE_URL}/conferences/${conferenceId}/submissions/${submissionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to get submission ${submissionId}: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  return responseData.data
}

/**
 * List submissions for a conference via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token for authentication
 * @param conferenceId - Conference ID
 * @param filters - Optional filters (author, status, title, track)
 * @returns Array of submissions and total count
 */
export async function listSubmissions(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  filters?: {
    author?: string
    status?: string
    title?: string
    track?: string
    limit?: number
    offset?: number
  },
): Promise<{ submissions: Submission[]; total: number }> {
  const params = new URLSearchParams()
  if (filters?.author) params.append("author", filters.author)
  if (filters?.status) params.append("status", filters.status)
  if (filters?.title) params.append("title", filters.title)
  if (filters?.track) params.append("track", filters.track)
  if (filters?.limit) params.append("limit", filters.limit.toString())
  if (filters?.offset) params.append("offset", filters.offset.toString())

  const url = `${API_BASE_URL}/conferences/${conferenceId}/submissions${
    params.toString() ? "?" + params.toString() : ""
  }`

  const response = await request.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(`Failed to list submissions: ${response.status()} - ${errorBody}`)
  }

  const responseData = await response.json()
  return {
    submissions: responseData.data.submissions,
    total: responseData.data.total,
  }
}

/**
 * Update a submission via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the author user
 * @param conferenceId - Conference ID
 * @param submissionId - Submission ID
 * @param updates - Partial submission data to update
 * @param filePath - Optional new file path
 * @returns Updated submission object
 */
export async function updateSubmission(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  submissionId: number,
  updates: Partial<SubmissionData>,
  filePath?: string,
): Promise<Submission> {
  // Wrap in { submission: ... } to match backend DTO structure (same as frontend lib/api/papers.ts)
  const formData: Record<string, any> = {
    submission: JSON.stringify({ submission: updates }),
  }

  if (filePath) {
    formData.file = {
      name: filePath.split("/").pop() || filePath.split("\\").pop() || "paper.pdf",
      mimeType: "application/pdf",
      buffer: fs.readFileSync(filePath),
    }
  }

  const response = await request.put(
    `${API_BASE_URL}/conferences/${conferenceId}/submissions/${submissionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: formData,
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(
      `Failed to update submission ${submissionId}: ${response.status()} - ${errorBody}`,
    )
  }

  const responseData = await response.json()
  return responseData.data
}

/**
 * Publish a draft submission via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the author user
 * @param conferenceId - Conference ID
 * @param submissionId - Submission ID
 * @param filePath - Optional file path if not already uploaded
 * @returns Published submission object
 */
export async function publishSubmission(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  submissionId: number,
  filePath?: string,
): Promise<Submission> {
  const formData: Record<string, any> = {}

  if (filePath) {
    formData.file = {
      name: filePath.split("/").pop() || filePath.split("\\").pop() || "paper.pdf",
      mimeType: "application/pdf",
      buffer: fs.readFileSync(filePath),
    }
  }

  const response = await request.post(
    `${API_BASE_URL}/conferences/${conferenceId}/submissions/${submissionId}/publish`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: Object.keys(formData).length > 0 ? formData : undefined,
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(
      `Failed to publish submission ${submissionId}: ${response.status()} - ${errorBody}`,
    )
  }

  const responseData = await response.json()
  return responseData.data
}

/**
 * Delete a submission via API
 * @param request - Playwright APIRequestContext
 * @param token - JWT token of the author user
 * @param conferenceId - Conference ID
 * @param submissionId - Submission ID
 */
export async function deleteSubmission(
  request: APIRequestContext,
  token: string,
  conferenceId: number,
  submissionId: number,
): Promise<void> {
  const response = await request.delete(
    `${API_BASE_URL}/conferences/${conferenceId}/submissions/${submissionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok()) {
    const errorBody = await response.text()
    throw new Error(
      `Failed to delete submission ${submissionId}: ${response.status()} - ${errorBody}`,
    )
  }
}

/**
 * Generate random submission data using Faker
 * @param domain - Submission domain/topics
 * @param status - Submission status (default: 'published')
 * @param track - Optional track name
 * @returns SubmissionData object
 */
export function generateSubmissionData(
  domain: string[],
  status: "draft" | "published" = "published",
  track?: string,
): SubmissionData {
  const topics = [
    "Neural Networks",
    "Deep Learning",
    "Machine Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Reinforcement Learning",
    "Generative AI",
    "Transfer Learning",
  ]

  const topic = faker.helpers.arrayElement(topics)
  const application = faker.helpers.arrayElement([
    "Classification",
    "Prediction",
    "Optimization",
    "Detection",
    "Recognition",
    "Generation",
    "Analysis",
  ])

  const title = `${topic} for ${application}: ${faker.lorem.words(3)}`
  const abstract = faker.lorem.paragraphs(3)

  const keywords = [
    faker.helpers.arrayElement(topics).toLowerCase(),
    faker.helpers.arrayElement(["optimization", "accuracy", "performance", "efficiency"]),
    faker.helpers.arrayElement(["algorithm", "model", "framework", "architecture"]),
  ]

  return {
    title,
    abstract,
    link: faker.internet.url(),
    domain,
    status,
    information: {
      keywords,
      paper_type: "research",
      track_name: track || faker.helpers.arrayElement(["AI", "ML", "NLP", "CV"]),
      additional_notes: faker.lorem.sentence(),
      metadata: {
        language: "en",
        page_count: faker.number.int({ min: 6, max: 12 }),
      },
    },
  }
}
