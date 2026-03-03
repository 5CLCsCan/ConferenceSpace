import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Chat service is temporarily unavailable. The previous ai-service implementation was removed and a new architecture will be introduced.",
    },
    { status: 503 },
  )
}
