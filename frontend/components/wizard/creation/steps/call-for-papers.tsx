"use client"

import dynamic from "next/dynamic"
import { WizardHeader } from "../wizard-header"
import { ConferenceFormData } from "../types"
import "@/styles/mdx-editor.css"
import { useTranslation } from "@/lib/i18n/translation-context"

function EditorLoadingFallback() {
  const { t } = useTranslation()

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
      <span className="text-xs text-slate-400">
        {t("runtime.components.wizard.creation.steps.call-for-papers.text_loading_editor")}
      </span>
    </div>
  )
}

// Dynamic import to avoid SSR issues with MDXEditor
const RichEditor = dynamic(
  () => import("@/components/ui/mdx-editor").then((mod) => mod.RichEditor),
  {
    ssr: false,
    loading: () => <EditorLoadingFallback />,
  },
)

interface CallForPapersStepProps {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

const defaultCfpContent = `# Call for Papers

We invite submissions on all aspects of **[Conference Theme]**.

## Topics of Interest

The conference welcomes both theoretical and applied contributions in the following areas:

- Topic 1
- Topic 2
- Topic 3
- Topic 4

## Submission Types

We welcome the following types of submissions:

| Type | Page Limit | Description |
|------|------------|-------------|
| Full Paper | 8-10 pages | Original research contributions |
| Short Paper | 4-6 pages | Preliminary results or work-in-progress |
| Demo Paper | 2-4 pages | System demonstrations |

## Important Notes

> Authors are encouraged to submit original research that has not been published elsewhere.

For more details, please refer to the submission guidelines.
`

export function CallForPapersStep({ data, updateData }: CallForPapersStepProps) {
  const { t } = useTranslation()
  const handleEditorChange = (markdown: string) => {
    updateData({ callForPaperText: markdown })
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="flex flex-col gap-2">
        <WizardHeader
          title={t("runtime.components.wizard.creation.steps.call-for-papers.title_call_for_papers")}
          description="Compose the public Call for Papers content that will be displayed to potential authors."
        />
        <p className="text-[10px] font-light text-slate-400 leading-[12px]">
          {t("runtime.components.wizard.creation.steps.call-for-papers.text_use_the_rich_text_editor_below")}{" "}</p>
      </div>

      <form className="flex flex-col gap-4 w-full relative" onSubmit={(e) => e.preventDefault()}>
        {/* Character count badge - floating above editor */}
        <div className="absolute -top-10 right-0 z-10 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {(data.callForPaperText || '').length} {t("runtime.components.wizard.creation.steps.call-for-papers.text_characters")}{" "}</span>
        </div>

        {/* Call for Papers Text */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 w-full">
          <RichEditor
            markdown={data.callForPaperText || defaultCfpContent}
            onChange={handleEditorChange}
            placeholder={t("runtime.components.wizard.creation.steps.call-for-papers.placeholder_start_writing_your_call_for_papers")}
          />
        </div>
      </form>
    </div>
  )
}
