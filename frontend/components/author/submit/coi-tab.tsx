"use client"
import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, X, AlertCircle, UserX, Info, Lightbulb } from "lucide-react"
import { typography, spacing } from "@/lib/typography"

interface COITabProps {
  coiPeople: string[]
  setCoiPeople: (value: string[]) => void
  coiPersonInput: string
  setCoiPersonInput: (value: string) => void
}

export function COITab({
  coiPeople,
  setCoiPeople,
  coiPersonInput,
  setCoiPersonInput,
}: COITabProps) {
  const handleAddCOIPerson = () => {
    if (coiPersonInput.trim() && !coiPeople.includes(coiPersonInput.trim())) {
      setCoiPeople([...coiPeople, coiPersonInput.trim()])
      setCoiPersonInput("")
    }
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className={spacing.item}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <UserX className="size-6 text-amber-600" />
          </div>
          <div>
            <h2 className={`${typography.h2} text-[#212529] font-arial`}>
              Conflict of Interest Declaration
            </h2>
            <p className={`${typography.body} text-[#6C757D] font-arial ${spacing.margin.top.sm}`}>
              Identify individuals who should not review your submission
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <Info className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-gray-700 font-arial`}>
              <p className={`${typography.medium} text-amber-900 mb-2`}>What to declare:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Current or recent collaborators (past 3 years)</li>
                <li>Co-authors on recent publications</li>
                <li>Colleagues from your institution</li>
                <li>PhD advisors and students</li>
                <li>Close personal or professional relationships</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Input Section */}
      <div className={spacing.item}>
        <Label htmlFor="coi-people" className={`${typography.label} text-[#212529] font-arial`}>
          Conflicted Reviewers *
        </Label>
        <p className={`${typography.bodySmall} text-[#6C757D] font-arial mb-2`}>
          Enter email addresses or full names of individuals with potential conflicts
        </p>
        <div className={`flex ${spacing.gap.sm}`}>
          <Input
            id="coi-people"
            placeholder="e.g., jane.doe@university.edu or 'Dr. Jane Doe'"
            value={coiPersonInput}
            onChange={(e) => setCoiPersonInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddCOIPerson()
              }
            }}
            className={`flex-1 ${typography.body} font-arial border-[#DEE2E6] focus:border-[#0056A3] focus:ring-[#0056A3]`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCOIPerson}
            size="icon"
            className="shrink-0 border-[#0056A3] text-[#0056A3] hover:bg-[#0056A3]/10"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Display Added COIs */}
      {coiPeople.length > 0 && (
        <div className={spacing.item}>
          <div className="flex items-center justify-between mb-3">
            <Label className={`${typography.label} text-[#495057] font-arial`}>
              Declared Conflicts ({coiPeople.length})
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCoiPeople([])}
              className={`${typography.bodySmall} text-red-600 hover:text-red-700 hover:bg-red-50 font-arial`}
            >
              Clear all
            </Button>
          </div>
          <div className={`flex flex-wrap ${spacing.gap.sm}`}>
            {coiPeople.map((person) => (
              <Badge
                key={person}
                variant="secondary"
                className={`${spacing.gap.sm} px-3 py-2 ${typography.bodySmall} font-arial bg-[#E9ECEF] text-[#212529] hover:bg-[#DEE2E6] transition-colors`}
              >
                <span>{person}</span>
                <button
                  onClick={() => setCoiPeople(coiPeople.filter((p) => p !== person))}
                  className="hover:text-red-600 transition-colors"
                  aria-label={`Remove ${person}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {coiPeople.length === 0 && (
        <Card className="border-dashed border-2 border-[#DEE2E6]">
          <div className="p-8 text-center">
            <UserX className="size-12 text-[#ADB5BD] mx-auto mb-3" />
            <p className={`${typography.body} text-[#6C757D] font-arial`}>
              No conflicts declared yet. Add at least one conflicted reviewer above.
            </p>
          </div>
        </Card>
      )}

      {/* Warning */}
      <Card className="bg-amber-50 border-amber-200">
        <div className={spacing.padding.card}>
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className={`${typography.bodySmall} text-gray-700 font-arial`}>
              <p className={`${typography.semibold} text-amber-900 mb-1`}>Important Notice</p>
              <p>
                By submitting, you confirm that your conflict of interest declaration is accurate
                and complete. Failure to declare relevant conflicts may result in desk rejection or
                withdrawal of your submission.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Best Practices */}
      <details className="border-t border-[#DEE2E6] pt-4">
        <summary
          className={`cursor-pointer ${typography.label} text-[#495057] hover:text-[#212529] flex items-center ${spacing.gap.sm} font-arial`}
        >
          <Lightbulb className="size-4 text-amber-500" />
          <span>COI Declaration Best Practices</span>
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
          <div className={`${typography.bodySmall} text-gray-700 space-y-2 font-arial`}>
            <p className={`${typography.medium} text-gray-900`}>Guidelines:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Declare anyone you've collaborated with in the past 3 years</li>
              <li>Include co-authors from recent publications</li>
              <li>List colleagues from your current and recent institutions</li>
              <li>When in doubt, declare the conflict - it's better to be safe</li>
              <li>Use full names or email addresses for clarity</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
