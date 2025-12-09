"use client"
import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChecklistItem } from "./checklist-item"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing } from "@/lib/typography"
import { CheckCircle2, AlertCircle, FileCheck, Shield } from "lucide-react"

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
  const { t } = useTranslation()

  const allComplete = Object.values(checklist).every((v) => v === true)
  const completedCount = Object.values(checklist).filter((v) => v === true).length
  const totalCount = Object.values(checklist).length

  return (
    <div className="w-80 space-y-6">
      {/* Checklist Card */}
      <Card className="border-[#DEE2E6]">
        <CardContent className={spacing.padding.cardLarge}>
          <h3 className={`${typography.h4} text-[#212529] font-arial mb-1`}>
            {t("dashboard.author.submit.checklist.title") || "Submission Checklist"}
          </h3>
          <p className={`${typography.bodySmall} text-[#6C757D] font-arial mb-4`}>
            {t("dashboard.author.submit.checklist.subtitle") || "Required before submitting"}
          </p>
          <div className="space-y-3">
            <ChecklistItem
              checked={checklist.titleProvided}
              label={t("dashboard.author.submit.checklist.titleProvided") || "Paper title provided"}
            />
            <ChecklistItem
              checked={checklist.abstractLength}
              label={t("dashboard.author.submit.checklist.abstractLength") || "Abstract provided"}
            />
            <ChecklistItem
              checked={checklist.subjectAreas}
              label={t("dashboard.author.submit.checklist.subjectAreas") || "Subject area selected"}
            />
            <ChecklistItem
              checked={checklist.keywords}
              label={t("dashboard.author.submit.checklist.keywords") || "Keywords added (min. 3)"}
            />
            <ChecklistItem
              checked={checklist.pdfUploaded}
              label={
                t("dashboard.author.submit.checklist.pdfUploaded") || "PDF manuscript uploaded"
              }
            />
            <ChecklistItem
              checked={checklist.coAuthorsListed}
              label={t("dashboard.author.submit.checklist.coAuthorsListed") || "Authors listed"}
            />
            <ChecklistItem
              checked={checklist.coiDeclared}
              label={t("dashboard.author.submit.checklist.coiDeclared") || "COI reviewers declared"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Policy Card */}
      <Card className="border-[#DEE2E6]">
        <CardContent className={spacing.padding.cardLarge}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="size-5 text-primary" />
            <h3 className={`${typography.h5} text-[#212529] font-arial`}>Policy & Formatting</h3>
          </div>
          <p className={`${typography.bodySmall} text-[#6C757D] font-arial mb-4`}>
            Quick reference guidelines
          </p>
          <ul className={`space-y-2 ${typography.bodySmall} text-[#495057] font-arial`}>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Double-blind: remove all identifying information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Maximum 10 pages (excluding references)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>PDF ≤ 20MB with embedded fonts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Use the official conference template</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className={spacing.padding.card}>
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p
                className={`${typography.bodySmall} ${typography.medium} text-amber-900 font-arial mb-1`}
              >
                Need Help?
              </p>
              <p className={`${typography.bodySmall} text-amber-800 font-arial`}>
                Save your work as a draft at any time. You can return to complete it later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
