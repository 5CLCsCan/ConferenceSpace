export const ACCEPTED_MANUSCRIPT_FILE_INPUT = ".pdf,.docx,.tex"
export const MAX_MANUSCRIPT_FILE_SIZE_BYTES = 20 * 1024 * 1024

const ACCEPTED_MANUSCRIPT_EXTENSIONS = new Set([".pdf", ".docx", ".tex"])

function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".")
  if (lastDotIndex === -1) {
    return ""
  }

  return filename.slice(lastDotIndex).toLowerCase()
}

export function isAcceptedManuscriptFile(file: Pick<File, "name">): boolean {
  return ACCEPTED_MANUSCRIPT_EXTENSIONS.has(getFileExtension(file.name))
}

export function getManuscriptUploadError(file: Pick<File, "name" | "size">): string | null {
  if (!isAcceptedManuscriptFile(file)) {
    return "Please upload a PDF, DOCX, or TEX manuscript file."
  }

  if (file.size > MAX_MANUSCRIPT_FILE_SIZE_BYTES) {
    return "Maximum file size is 20MB."
  }

  return null
}
