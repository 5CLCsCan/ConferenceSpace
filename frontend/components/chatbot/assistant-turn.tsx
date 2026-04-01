"use client"

import { useEffect, useState } from "react"
import { Streamdown } from "streamdown"

import type { AssistantTurn as AssistantTurnModel } from "./transcript-view-model"
import { AssistantToolRow } from "./assistant-tool-row"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type AssistantTurnProps = {
  turn: AssistantTurnModel
}

export function AssistantTurn({ turn }: AssistantTurnProps) {
  return (
    <div data-chat-turn="assistant" data-testid="chat-assistant-turn" className="w-full">
      {turn.items.map((item, index) => {
        if (item.kind === "text") {
          return (
            <div key={`${item.messageId}-${index}`} className="chatbot-markdown text-[#141414]">
              <Streamdown>{item.text}</Streamdown>
            </div>
          )
        }

        if (item.kind === "reasoning") {
          return (
            <ThoughtsBlock
              key={`${item.messageId}-${index}`}
              text={item.text}
              isStreaming={item.rawPart.state === "streaming"}
            />
          )
        }

        return <AssistantToolRow key={`${item.messageId}-${index}`} item={item} />
      })}
    </div>
  )
}

type ThoughtsBlockProps = {
  text: string
  isStreaming: boolean
}

function ThoughtsBlock({ text, isStreaming }: ThoughtsBlockProps) {
  const [open, setOpen] = useState(isStreaming)

  useEffect(() => {
    if (isStreaming) {
      setOpen(true)
    }
  }, [isStreaming])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mt-2 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/70 text-[10px]"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <span className="text-[10px] font-semibold tracking-tight text-amber-900">Thoughts</span>
        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-amber-700/80">
          {open ? "Hide" : "Show"}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-amber-200/80 px-3 pb-3 pt-2">
        <div className="chatbot-markdown text-[10px] leading-relaxed text-amber-950">
          <Streamdown>{text}</Streamdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
