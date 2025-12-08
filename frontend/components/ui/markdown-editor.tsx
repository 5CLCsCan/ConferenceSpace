"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter markdown content...",
  height = 400,
  className,
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"} className={className}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        preview="edit"
        textareaProps={{
          placeholder,
        }}
      />
    </div>
  )
}
