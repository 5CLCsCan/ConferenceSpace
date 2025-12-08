"use client"

import { useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { updateConferenceStatus } from "@/lib/api/conferences"
import type { ConferenceStatus } from "@/lib/types"

function useConferenceIdFromPath(): string | null {
  const pathname = usePathname()

  return useMemo(() => {
    if (!pathname) return null
    const parts = pathname.split("/").filter(Boolean)
    const dashboardIdx = parts.indexOf("dashboard")
    const conferenceIdx = parts.indexOf("conference")

    if (dashboardIdx === -1 || conferenceIdx === -1 || conferenceIdx + 1 >= parts.length) {
      return null
    }

    return parts[conferenceIdx + 1] || null
  }, [pathname])
}

export function ConferenceFloatingActions() {
  const { toast } = useToast()
  const conferenceId = useConferenceIdFromPath()
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<ConferenceStatus | "">("")
  const [loading, setLoading] = useState(false)

  if (!conferenceId) {
    return null
  }

  const handleConfirm = async () => {
    if (!stage) return
    setLoading(true)
    const result = await updateConferenceStatus(conferenceId, stage)
    setLoading(false)

    if (result.error || !result.data) {
      toast({
        title: "Failed to update status",
        description: result.error || "Backend did not return a valid response.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Conference stage updated",
      description: `Status switched to "${stage}".`,
    })
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-[5.5rem] z-50 rounded-full shadow-lg px-4 py-2 flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        <span className="whitespace-nowrap text-sm">Auto-assign Reviewer</span>
      </Button>

      <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto-assign Reviewer</DialogTitle>
            <DialogDescription>
              Choose the conference stage to switch to before running automatic reviewer assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Target stage</label>
            <Select
              value={stage}
              onValueChange={(value) => setStage(value as ConferenceStatus)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (submission)</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={!stage || loading}>
              {loading ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


