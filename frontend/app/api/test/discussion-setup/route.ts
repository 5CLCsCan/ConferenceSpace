"use server"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/config"

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"

const COOKIE_MAX_AGE = Number(process.env.JWT_EXPIRY_SECONDS ?? 60 * 60 * 24)

const TEST_AUTHOR = {
  email: "test.discussion.author@example.com",
  first_name: "Test",
  last_name: "Author",
}

const TEST_REVIEWER = {
  email: "test.discussion.reviewer@example.com",
  first_name: "Test",
  last_name: "Reviewer",
}

const TEST_CHAIR = {
  email: "test.discussion.chair@example.com",
  first_name: "Test",
  last_name: "Chair",
}

async function backendLogin(userData: { email: string; first_name: string; last_name: string }) {
  const response = await fetch(`${BACKEND_API_BASE_URL}/api/v1/auth/test-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || "Backend login failed")
  }

  // Backend wraps response in "data" field
  const payload = data?.data ?? data
  return payload
}

async function backendCall(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON: ${text.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(data?.error || `API call failed: ${response.status}`)
  }

  return data
}

async function backendFormDataCall(
  path: string,
  token: string,
  formData: FormData
) {
  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const text = await response.text()
  console.log(`[backendFormDataCall] ${path} status:`, response.status)
  console.log(`[backendFormDataCall] ${path} response:`, text.substring(0, 500))

  if (!text) {
    throw new Error(`Empty response from ${path} (status: ${response.status})`)
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from ${path}: ${text.substring(0, 200)}`)
  }

  if (!response.ok) {
    throw new Error(data?.error || `API call failed: ${response.status}`)
  }

  return data
}

export async function POST(request: Request) {
  try {
    const { role } = await request.json()

    if (role !== "author" && role !== "reviewer") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Step 1: Login as reviewer to get user ID
    const reviewerLogin = await backendLogin(TEST_REVIEWER)
    const reviewerToken = reviewerLogin.token
    const reviewerUserId = reviewerLogin.user?.id
    if (!reviewerUserId) {
      return NextResponse.json({ error: "Could not get reviewer user ID" }, { status: 500 })
    }

    // Step 2: Login as chair
    const chairLogin = await backendLogin(TEST_CHAIR)
    const chairToken = chairLogin.token

    // Step 3: Create conference
    const confData = await backendCall("/api/v1/conferences", chairToken, {
      method: "POST",
      body: JSON.stringify({
        conference: {
          title: "Discussion Test Conference",
          acronym: `DTC${Date.now()}`,
          chair: TEST_CHAIR.email,
          domain: ["AI", "ML"],
        },
      }),
    })

    const conferenceId = confData.data?.id
    if (!conferenceId) {
      return NextResponse.json(
        { error: `Failed to get conference ID: ${JSON.stringify(confData)}` },
        { status: 500 }
      )
    }

    // Step 4: Add reviewer to conference
    const addReviewerData = await backendCall(
      `/api/v1/conferences/${conferenceId}/reviewers`,
      chairToken,
      {
        method: "POST",
        body: JSON.stringify({
          reviewers: [{ user_id: reviewerUserId, domain: ["AI", "ML"] }],
        }),
      }
    )

    const reviewerRecordId = addReviewerData.data?.success?.[0]?.id
    if (!reviewerRecordId) {
      return NextResponse.json(
        { error: `Failed to get reviewer record ID: ${JSON.stringify(addReviewerData)}` },
        { status: 500 }
      )
    }

    // Step 5: Accept reviewer invitation (use reviewer token)
    await backendCall(
      `/api/v1/conferences/${conferenceId}/reviewers/${reviewerRecordId}/status`,
      reviewerToken,
      {
        method: "PUT",
        body: JSON.stringify({ status: "accepted" }),
      }
    )

    // Step 6: Login as author
    const authorLogin = await backendLogin(TEST_AUTHOR)
    const authorToken = authorLogin.token

    // Step 7: Create submission with file
    const formData = new FormData()
    // Backend expects JSON wrapped in {"submission": {...}}
    formData.append(
      "submission",
      JSON.stringify({
        submission: {
          title: "Test Paper for Discussion",
          abstract:
            "This is a test paper to test the discussion feature between reviewers and authors.",
          domain: ["AI"],
          status: "draft",
        },
      })
    )
    // Create a minimal valid-looking PDF using File class (Node.js 20+)
    const pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    const pdfFile = new File([pdfContent], "test_paper.pdf", { type: "application/pdf" })
    formData.append("file", pdfFile)

    const subData = await backendFormDataCall(
      `/api/v1/conferences/${conferenceId}/submissions`,
      authorToken,
      formData
    )

    const submissionId = subData.data?.id
    if (!submissionId) {
      return NextResponse.json(
        { error: `Failed to get submission ID: ${JSON.stringify(subData)}` },
        { status: 500 }
      )
    }

    // Step 8: Publish the submission
    const publishFormData = new FormData()
    // Backend expects JSON wrapped in {"submission": {...}}
    publishFormData.append(
      "submission",
      JSON.stringify({
        submission: {
          title: "Test Paper for Discussion",
          abstract:
            "This is a test paper to test the discussion feature between reviewers and authors.",
          domain: ["AI"],
          status: "submitted",
        },
      })
    )
    publishFormData.append("file", pdfFile)

    await backendFormDataCall(
      `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/publish`,
      authorToken,
      publishFormData
    )

    // Step 9: Transition conference to reviewing phase (triggers auto-assign)
    await backendCall(`/api/v1/conferences/${conferenceId}/status`, chairToken, {
      method: "PUT",
      body: JSON.stringify({ conference_id: conferenceId, new_status: "reviewing" }),
    })

    // Step 10: Get the assignment ID for the reviewer
    // The reviewer dashboard has recent_assignments with assignment_id and paper_id
    const dashboardData = await backendCall(
      `/api/v1/reviewer/${TEST_REVIEWER.email}/dashboard`,
      reviewerToken
    )

    console.log("Dashboard data:", JSON.stringify(dashboardData, null, 2))

    // Find the assignment for our submission (paper_id = submission_id)
    let assignmentId: number | undefined

    // Handle different response structures
    const dashboard = dashboardData.data || dashboardData
    const recentAssignments = Array.isArray(dashboard?.recent_assignments)
      ? dashboard.recent_assignments
      : (dashboard?.recent_assignments?.data || [])

    for (const assignment of recentAssignments) {
      if (assignment.paper_id === submissionId) {
        assignmentId = assignment.assignment_id
        break
      }
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: `Could not find assignment for submission ${submissionId}. Dashboard keys: ${Object.keys(dashboard || {}).join(', ')}. Recent assignments: ${JSON.stringify(recentAssignments)}` },
        { status: 500 }
      )
    }

    // Step 11: Login as the requested role and set cookie
    const targetUser = role === "author" ? TEST_AUTHOR : TEST_REVIEWER
    const finalLogin = await backendLogin(targetUser)

    const cookieStore = await cookies()
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: finalLogin.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })
    cookieStore.set({
      name: "conference_ws_token",
      value: finalLogin.token,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })

    return NextResponse.json({
      user: finalLogin.user,
      conferenceId,
      submissionId,
      assignmentId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    console.error("Discussion setup error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
