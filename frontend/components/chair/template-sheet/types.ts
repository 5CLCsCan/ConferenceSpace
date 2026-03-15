import { LucideIcon } from "lucide-react"
import type { ConferenceConfigTemplate, Conference } from "@/lib/types"
import type { ConferenceFormData } from "@/components/wizard/creation"
import type { ConferenceTemplateSection } from "@/lib/conference-form"

export type TemplateFlow = "home" | "templates" | "conferences" | "save"

export interface SectionMeta {
  id: ConferenceTemplateSection
  title: string
  description: string
  icon: LucideIcon
}

export interface SharedActionProps {
  onFlowChange: (flow: TemplateFlow) => void
  t: (key: string, options?: any) => string
  allowSave?: boolean
}

export interface SourceData {
  id: string
  name: string
  description: string
  acronym?: string
  topicsCount: number
  tracksCount: number
  hasDates: boolean
  updatedAt: string
}
