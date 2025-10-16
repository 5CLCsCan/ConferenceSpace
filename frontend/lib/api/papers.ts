import { mockPapers } from "@/lib/mock-data"
import type { Paper } from "@/lib/types"

/**
 * API: POST /api/papers
 *
 * Submit a new paper to a conference
 *
 * Database Query (Golang):
 * INSERT INTO papers (title, abstract, keywords, conference_id, track_id, status, submitted_at, version)
 * VALUES (?, ?, ?, ?, ?, 'submitted', NOW(), 1)
 * RETURNING id
 *
 * Then insert authors:
 * INSERT INTO paper_authors (paper_id, user_id, name, email, affiliation, is_corresponding, order)
 * VALUES (?, ?, ?, ?, ?, ?, ?)
 *
 * Tables: papers, paper_authors
 * Fields: All paper fields + author information
 */
export async function submitPaper(data: any): Promise<{ data: Paper | null; error: string | null }> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock implementation - in real app, this would POST to backend
    // const response = await fetch('/api/papers', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // })
    // const result = await response.json()

    const newPaper: Paper = {
      id: `paper-${Date.now()}`,
      title: data.title,
      abstract: data.abstract,
      keywords: data.keywords,
      authors: data.authors,
      conference_id: data.conference_id,
      track_id: data.track_id,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      reviews: [],
    }

    return { data: newPaper, error: null }
  } catch (error) {
    return { data: null, error: "Failed to submit paper" }
  }
}

/**
 * API: GET /api/papers/:id
 *
 * Get paper details by ID
 *
 * Database Query (Golang):
 * SELECT p.*, GROUP_CONCAT(pa.user_id) as author_ids
 * FROM papers p
 * LEFT JOIN paper_authors pa ON p.id = pa.paper_id
 * WHERE p.id = ?
 * GROUP BY p.id
 *
 * Tables: papers, paper_authors
 */
export async function getPaperById(paperId: string): Promise<{ data: Paper | null; error: string | null }> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const paper = mockPapers.find((p) => p.id === paperId)

    if (paper) {
      return { data: paper, error: null }
    }

    return { data: null, error: "Paper not found" }
  } catch (error) {
    return { data: null, error: "Failed to fetch paper" }
  }
}

/**
 * API: POST /api/papers/:id/camera-ready
 *
 * Submit camera ready version of accepted paper
 *
 * Database Query (Golang):
 * UPDATE papers
 * SET status = 'camera_ready', version = version + 1, updated_at = NOW()
 * WHERE id = ? AND status = 'accepted'
 *
 * Then insert file record:
 * INSERT INTO paper_files (paper_id, file_type, file_path, uploaded_at)
 * VALUES (?, 'camera_ready', ?, NOW())
 *
 * Tables: papers, paper_files
 */
export async function submitCameraReady(paperId: string, file: File): Promise<{ data: boolean; error: string | null }> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock implementation
    // const formData = new FormData()
    // formData.append('file', file)
    // const response = await fetch(`/api/papers/${paperId}/camera-ready`, {
    //   method: 'POST',
    //   body: formData
    // })

    return { data: true, error: null }
  } catch (error) {
    return { data: false, error: "Failed to submit camera ready version" }
  }
}
