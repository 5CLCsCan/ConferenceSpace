"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ReviewerPlaceholderPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-lg text-center space-y-4 bg-white border rounded-xl p-8">
        <h1 className="text-2xl font-bold text-neutral-900">Reviewer Migration Pending</h1>
        <p className="text-neutral-600">
          Reviewer workflows are not migrated in this phase. You can return to role selection.
        </p>
        <Button asChild>
          <Link href="/role">Back To Role Selection</Link>
        </Button>
      </div>
    </main>
  )
}
