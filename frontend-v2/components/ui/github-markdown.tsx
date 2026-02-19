"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import { typography } from "@/lib/typography"

import "github-markdown-css/github-markdown-light.css"

type GithubMarkdownProps = {
  content: string
  className?: string
}

export function GithubMarkdown({ content, className }: GithubMarkdownProps) {
  if (!content) {
    return null
  }

  return (
    <div
      className={cn(
        "markdown-body max-w-none leading-relaxed p-4",
        typography.body,
        "bg-transparent [&_*]:text-inherit",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
