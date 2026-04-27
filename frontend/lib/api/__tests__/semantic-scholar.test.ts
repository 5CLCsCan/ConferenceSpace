import { describe, expect, it } from "vitest"
import { parseSemanticScholarAuthorInput } from "../semantic-scholar"

describe("parseSemanticScholarAuthorInput", () => {
  it("accepts a raw Semantic Scholar author ID", () => {
    expect(parseSemanticScholarAuthorInput("1741101")).toEqual({ authorId: "1741101" })
  })

  it("extracts the author ID from a Semantic Scholar author URL", () => {
    expect(
      parseSemanticScholarAuthorInput("https://www.semanticscholar.org/author/Grace-Hopper/1741101"),
    ).toEqual({ authorId: "1741101" })
  })

  it("rejects non-Semantic-Scholar URLs", () => {
    expect(
      parseSemanticScholarAuthorInput("https://scholar.google.com/citations?user=abc123"),
    ).toEqual({ error: "unsupported_url" })
  })
})
