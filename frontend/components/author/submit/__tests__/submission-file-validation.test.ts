import { describe, expect, it } from "vitest"

import {
  ACCEPTED_MANUSCRIPT_FILE_INPUT,
  getManuscriptUploadError,
  isAcceptedManuscriptFile,
  MAX_MANUSCRIPT_FILE_SIZE_BYTES,
} from "../submission-file-validation"

describe("submission file validation", () => {
  it("accepts pdf, docx, and tex manuscripts", () => {
    expect(
      isAcceptedManuscriptFile(new File(["%PDF-1.7"], "paper.pdf", { type: "application/pdf" })),
    ).toBe(true)

    expect(
      isAcceptedManuscriptFile(
        new File(["docx"], "paper.docx", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ),
    ).toBe(true)

    expect(isAcceptedManuscriptFile(new File(["\\documentclass{}"], "paper.tex"))).toBe(true)
  })

  it("rejects unsupported manuscript extensions", () => {
    expect(
      isAcceptedManuscriptFile(
        new File(["slides"], "slides.pptx", {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }),
      ),
    ).toBe(false)
  })

  it("returns a size error for oversized manuscripts", () => {
    const oversizedFile = {
      name: "paper.pdf",
      size: MAX_MANUSCRIPT_FILE_SIZE_BYTES + 1,
      type: "application/pdf",
    } as File

    expect(getManuscriptUploadError(oversizedFile)).toBe("Maximum file size is 20MB.")
  })

  it("exports the widened accept list for manuscript uploads", () => {
    expect(ACCEPTED_MANUSCRIPT_FILE_INPUT).toBe(".pdf,.docx,.tex")
  })
})
