import { describe, it, expect, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import { TranslationProvider, useTranslation } from "../translation-context"

function TranslationProbe({ keyValue }: { keyValue: unknown }) {
  const { t } = useTranslation()
  return <span>{t(keyValue as any)}</span>
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
})

