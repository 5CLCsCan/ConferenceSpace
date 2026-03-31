"use client"

import { Streamdown } from "streamdown"

import type { AssistantTurn as AssistantTurnModel } from "./transcript-view-model"
import { AssistantToolRow } from "./assistant-tool-row"

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
            <details
              key={`${item.messageId}-${index}`}
              className="mt-2 rounded-md border border-slate-200 bg-slate-50 text-[10px]"
              open
            >
              <summary className="cursor-pointer list-none px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[#456882]">
                Reasoning
              </summary>
              <div className="border-t border-slate-200 px-2.5 pb-2.5 pt-2">
                <div className="chatbot-markdown rounded border border-slate-200 bg-white p-1.5 font-mono text-[10px] leading-relaxed">
                  <Streamdown>{item.text}</Streamdown>
                </div>
              </div>
            </details>
          )
        }

        return <AssistantToolRow key={`${item.messageId}-${index}`} item={item} />
      })}
    </div>
  )
}
