import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { initialFormData } from "../../types"
import { CommitteesStep } from "../committees"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn().mockResolvedValue({ data: { data: { users: [] } } }),
}))

describe("CommitteesStep", () => {
  it("renders the direct-add email action with visible quotes", async () => {
    render(<CommitteesStep data={initialFormData} updateData={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText("colleague@university.edu"), {
      target: { value: "author@gmail.com" },
    })

    await waitFor(() => {
      expect(screen.getByText('Add directly: "author@gmail.com"')).toBeInTheDocument()
    })
    expect(screen.queryByText(/&ldquo;|&rdquo;/)).not.toBeInTheDocument()
  })
})
