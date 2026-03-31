"use client"

import type { UIMessage } from "ai"

import { AssistantTurn } from "./assistant-turn"
import { buildTranscriptTurns } from "./transcript-view-model"
import { UserMessage } from "./user-message"

type ChatTranscriptProps = {
  messages: UIMessage[]
  status: string
}

export function ChatTranscript({ messages }: ChatTranscriptProps) {
  const turns = buildTranscriptTurns(messages)

  return (
    <div className="space-y-4">
      {turns.map((turn, index) => (
        <div
          key={turn.kind === "user-turn" ? turn.messageId : turn.messageIds.join("-") || `turn-${index}`}
          className={turn.kind === "user-turn" ? "flex justify-end" : "flex justify-start"}
        >
          {turn.kind === "user-turn" ? (
            <UserMessage text={turn.items.map((item) => item.text).join("")} />
          ) : (
            <AssistantTurn turn={turn} />
          )}
        </div>
      ))}
    </div>
  )
}
