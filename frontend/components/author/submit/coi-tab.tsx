"use client"
import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, X, AlertCircle } from "lucide-react"

interface COITabProps {
  coiPeople: string[]
  setCoiPeople: (value: string[]) => void
  coiOrgs: string[]
  setCoiOrgs: (value: string[]) => void
  coiDomains: string[]
  setCoiDomains: (value: string[]) => void
  coiPersonInput: string
  setCoiPersonInput: (value: string) => void
  coiOrgInput: string
  setCoiOrgInput: (value: string) => void
  coiDomainInput: string
  setCoiDomainInput: (value: string) => void
}

export function COITab({
  coiPeople,
  setCoiPeople,
  coiOrgs,
  setCoiOrgs,
  coiDomains,
  setCoiDomains,
  coiPersonInput,
  setCoiPersonInput,
  coiOrgInput,
  setCoiOrgInput,
  coiDomainInput,
  setCoiDomainInput,
}: COITabProps) {
  const handleAddCOIPerson = () => {
    if (coiPersonInput.trim() && !coiPeople.includes(coiPersonInput.trim())) {
      setCoiPeople([...coiPeople, coiPersonInput.trim()])
      setCoiPersonInput("")
    }
  }

  const handleAddCOIOrg = () => {
    if (coiOrgInput.trim() && !coiOrgs.includes(coiOrgInput.trim())) {
      setCoiOrgs([...coiOrgs, coiOrgInput.trim()])
      setCoiOrgInput("")
    }
  }

  const handleAddCOIDomain = () => {
    if (coiDomainInput.trim() && !coiDomains.includes(coiDomainInput.trim())) {
      setCoiDomains([...coiDomains, coiDomainInput.trim()])
      setCoiDomainInput("")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">COI Declaration (Conflicts of Interest)</h2>
        <p className="text-sm text-gray-600">
          List people, organizations, and domains that must not review this paper
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>People (emails or full names) *</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="e.g., jane.doe@univ.edu or 'Jane Doe'"
              value={coiPersonInput}
              onChange={(e) => setCoiPersonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCOIPerson()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddCOIPerson} size="icon">
              <Plus className="size-4" />
            </Button>
          </div>
          {coiPeople.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {coiPeople.map((person) => (
                <Badge key={person} variant="secondary" className="gap-1 px-3 py-1">
                  {person}
                  <button
                    onClick={() => setCoiPeople(coiPeople.filter((p) => p !== person))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Organizations / Labs</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="e.g., Example University, AI Lab"
              value={coiOrgInput}
              onChange={(e) => setCoiOrgInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCOIOrg()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddCOIOrg} size="icon">
              <Plus className="size-4" />
            </Button>
          </div>
          {coiOrgs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {coiOrgs.map((org) => (
                <Badge key={org} variant="secondary" className="gap-1 px-3 py-1">
                  {org}
                  <button
                    onClick={() => setCoiOrgs(coiOrgs.filter((o) => o !== org))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Email Domains</Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="e.g., example.edu"
              value={coiDomainInput}
              onChange={(e) => setCoiDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCOIDomain()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddCOIDomain} size="icon">
              <Plus className="size-4" />
            </Button>
          </div>
          {coiDomains.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {coiDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="gap-1 px-3 py-1">
                  {domain}
                  <button
                    onClick={() => setCoiDomains(coiDomains.filter((d) => d !== domain))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <details className="border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
          <span>COI policy quick summary</span>
        </summary>
        <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              By submitting, you confirm your COI list is accurate. Missing conflicts may lead to desk
              rejection.
            </p>
          </div>
        </div>
      </details>
    </div>
  )
}