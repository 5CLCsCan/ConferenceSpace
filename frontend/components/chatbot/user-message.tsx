"use client"

import { Streamdown } from "streamdown"

type UserMessageProps = {
  text: string
}

export function UserMessage({ text }: UserMessageProps) {
  return (
    <div
      data-chat-turn="user"
      data-testid="chat-user-turn"
      className="ml-auto max-w-[82%] rounded-xl rounded-tr-sm bg-[#1B3C53] px-3 py-1.5 text-white"
    >
      <div className="chatbot-markdown text-white [&_*]:text-white [&_code]:bg-white/15">
        <Streamdown>{text}</Streamdown>
      </div>
    </div>
  )
}
