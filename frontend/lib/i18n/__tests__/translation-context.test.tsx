import { describe, it, expect, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import { TranslationProvider, useTranslation } from "../translation-context"

function TranslationProbe({
  keyValue,
  values,
}: {
  keyValue: unknown
  values?: Record<string, string | number>
}) {
  const { t } = useTranslation()
  return <span>{t(keyValue as any, values)}</span>
}

describe("translation-context", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("does not crash when t() receives an undefined key at runtime", () => {
    expect(() =>
      render(
        <TranslationProvider>
          <TranslationProbe keyValue={undefined} />
        </TranslationProvider>,
      ),
    ).not.toThrow()
  })

  it("interpolates double-brace placeholders without leaving braces behind", () => {
    const { getByText } = render(
      <TranslationProvider>
        <TranslationProbe
          keyValue="dashboard.roles.reviewer.papers.description"
          values={{ count: 0 }}
        />
      </TranslationProvider>,
    )

    expect(getByText("0 papers assigned to you in this conference.")).toBeDefined()
  })
})
