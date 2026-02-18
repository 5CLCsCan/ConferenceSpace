"use client"

import dynamic from "next/dynamic"
import { WizardHeader } from "../wizard-header"
import { ConferenceFormData } from "../types"
import "@/styles/mdx-editor.css"

// Dynamic import to avoid SSR issues with MDXEditor
const RichEditor = dynamic(
  () => import("@/components/ui/mdx-editor").then((mod) => mod.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[300px] flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
        <span className="text-xs text-slate-400">Loading editor...</span>
      </div>
    ),
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
  const handleEditorChange = (markdown: string) => {
    updateData({ callForPaperText: markdown })
  }

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="flex flex-col gap-2">
        <WizardHeader
          title="Call for Papers"
          description="Compose the public Call for Papers content that will be displayed to potential authors."
        />
        <p className="text-[10px] font-light text-slate-400 leading-[12px]">
          Use the rich text editor below to compose your Call for Papers. Supports Markdown
          formatting including headings, lists, tables, code blocks, images, and more.
        </p>
      </div>

      <form className="flex flex-col gap-4 w-full relative" onSubmit={(e) => e.preventDefault()}>
        {/* Character count badge - floating above editor */}
        <div className="absolute -top-10 right-0 z-10 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {(data.callForPaperText || '').length} CHARACTERS
          </span>
        </div>

        {/* Call for Papers Text */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 w-full">
          <RichEditor
            markdown={data.callForPaperText || defaultCfpContent}
            onChange={handleEditorChange}
            placeholder="Start writing your Call for Papers..."
          />
        </div>
      </form>
    </div>
  )
}
