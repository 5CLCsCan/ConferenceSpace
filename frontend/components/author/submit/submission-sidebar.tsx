"use client"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChecklistItem } from "./checklist-item"

interface Checklist {
  titleProvided: boolean
  abstractLength: boolean
  subjectAreas: boolean
  keywords: boolean
  pdfUploaded: boolean
  coAuthorsListed: boolean
  coiDeclared: boolean
}

interface SubmissionSidebarProps {
  checklist: Checklist
}

export function SubmissionSidebar({ checklist }: SubmissionSidebarProps) {
  return (
    <div className="w-80 space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-1">Submission Checklist</h3>
          <p className="text-xs text-gray-600 mb-4">What you need before submitting</p>
          <div className="space-y-3">
            <ChecklistItem checked={checklist.titleProvided} label="Title provided" />
            <ChecklistItem checked={checklist.abstractLength} label="Abstract 150-250 words" />
            <ChecklistItem checked={checklist.subjectAreas} label="2-3 subject areas selected" />
            <ChecklistItem checked={checklist.keywords} label="At least 3 keywords added" />
            <ChecklistItem checked={checklist.pdfUploaded} label="PDF uploaded & validated" />
            <ChecklistItem checked={checklist.coAuthorsListed} label="All co-authors listed" />
            <ChecklistItem
              checked={checklist.coiDeclared}
              label="COI people/orgs/domains declared"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-1">Policy & Formatting</h3>
          <p className="text-xs text-gray-600 mb-4">Quick reference</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Double-blind: remove all identifying information.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Maximum 10 pages (excluding references).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>PDF ≤ 20MB; fonts embedded.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Use the official conference template.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
