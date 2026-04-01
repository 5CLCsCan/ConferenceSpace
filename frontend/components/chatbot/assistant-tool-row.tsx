"use client"

import * as React from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { TranscriptToolItem } from "./transcript-view-model"

type AssistantToolRowProps = {
  item: TranscriptToolItem
}

export function AssistantToolRow({ item }: AssistantToolRowProps) {
  const [showOutput, setShowOutput] = React.useState(false)
  
  const isRunning = item.state === "input-streaming" || item.state === "input-available"
  const isError = item.state === "output-error" || item.state === "timeout"

  return (
    <details
      className={cn(
        "group mt-2 rounded-md border text-[9px]",
        isError
          ? "border-red-200 bg-red-50/60"
          : "border-slate-200 bg-slate-50",
      )}
      open={isRunning || isError}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wide",
          isError ? "text-red-500" : "text-[#456882]",
        )}
      >
        {isRunning ? (
          <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
        ) : (
          <span
            className="material-symbols-outlined shrink-0"
            style={{ fontSize: "10px", fontVariationSettings: '"FILL" 0, "wght" 400' }}
          >
            {isError ? "error" : "settings"}
          </span>
        )}
        <span className="min-w-0 truncate">{`Tool: ${getToolDisplayName(item.toolName)}`}</span>
        
        <div className="flex-1" />
        <span className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
          isRunning ? "bg-blue-100 text-blue-600" : isError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
        )}>
          {isRunning ? "Executing" : isError ? "Error" : "Finished"}
        </span>

        <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="space-y-1 border-t border-slate-200 px-2 pb-2 pt-1.5">
        <div>
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">State</span>
          <div className="mt-0.5 text-[9px] font-mono text-slate-600">{item.state}</div>
        </div>
        {item.input !== undefined && (
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
              Input
            </span>
            <pre className="mt-0.5 overflow-auto rounded border border-slate-200 bg-white p-1 text-[9px] leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(item.input, null, 2)}
            </pre>
          </div>
        )}
        {item.output !== undefined && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                Output
              </span>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setShowOutput(!showOutput)
                }} 
                className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 hover:text-[#1B3C53] transition-colors"
              >
                {showOutput ? "Hide" : "View"}
              </button>
            </div>
            {showOutput && (
              <pre className="mt-0.5 overflow-auto rounded border border-slate-200 bg-white p-1 text-[9px] leading-relaxed whitespace-pre-wrap break-words">
                {JSON.stringify(item.output, null, 2)}
              </pre>
            )}
          </div>
        )}
        {item.errorText && (
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
              Error
            </span>
            <div className="mt-0.5 text-[9px] font-mono text-red-500">{item.errorText}</div>
          </div>
        )}
      </div>
    </details>
  )
}

function getToolDisplayName(toolName: string): string {
  const aliases: Record<string, string> = {
    getPageContext: "Get Page Context",
    getCurrentNavigation: "Get Current Navigation",
    performAction: "Perform Action",
    navigate: "Navigate",
  }

  return aliases[toolName] || toolName
}
