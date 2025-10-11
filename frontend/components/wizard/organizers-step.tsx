"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Search, UserPlus } from "lucide-react"
import type { ConferenceFormData } from "@/app/conferences/new/page"

type Props = {
  data: ConferenceFormData
  updateData: (data: Partial<ConferenceFormData>) => void
}

// Mock user search results
const MOCK_USERS = [
  { id: "2", name: "Dr. Sarah Johnson", email: "sarah.j@university.edu" },
  { id: "3", name: "Prof. Michael Chen", email: "mchen@research.org" },
  { id: "4", name: "Dr. Emily Rodriguez", email: "emily.r@institute.com" },
  { id: "5", name: "Prof. David Kim", email: "dkim@academic.edu" },
]

const ROLES = ["General Chair", "Program Chair", "Submissions Chair", "Publicity Chair", "Local Arrangements Chair"]

export function OrganizersStep({ data, updateData }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !data.organizers.some((org) => org.id === user.id),
  )

  const addOrganizer = (user: { id: string; name: string; email: string }) => {
    updateData({
      organizers: [...data.organizers, { ...user, role: "Program Chair" }],
    })
    setSearchQuery("")
    setShowResults(false)
  }

  const removeOrganizer = (id: string) => {
    // Prevent removing the first organizer (current admin)
    if (id === "1") return
    updateData({
      organizers: data.organizers.filter((org) => org.id !== id),
    })
  }

  const updateOrganizerRole = (id: string, role: string) => {
    updateData({
      organizers: data.organizers.map((org) => (org.id === id ? { ...org, role } : org)),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">Step 3: Assign Conference Chairs</h2>
        <p className="text-sm text-muted-foreground">Add team members and assign their roles</p>
      </div>

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="space-y-2">
          <Label htmlFor="search">Search for Users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(e.target.value.length > 0)
              }}
              onFocus={() => setShowResults(searchQuery.length > 0)}
              className="pl-9"
            />
            {showResults && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addOrganizer(user)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Search for registered platform users to add as conference chairs
          </p>
        </div>

        {/* Organizers List */}
        <div className="space-y-2">
          <Label>Conference Chairs</Label>
          <div className="space-y-2">
            {data.organizers.map((organizer, index) => (
              <div
                key={organizer.id}
                className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{organizer.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{organizer.email}</div>
                </div>
                <Select
                  value={organizer.role}
                  onValueChange={(value) => updateOrganizerRole(organizer.id, value)}
                  disabled={index === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {index !== 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOrganizer(organizer.id)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {data.organizers.length === 1 && (
            <p className="text-xs text-muted-foreground">
              You are automatically added as the General Chair. Search above to add more team members.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
