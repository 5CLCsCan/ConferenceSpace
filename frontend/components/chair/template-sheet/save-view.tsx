"use client"

import { ArrowLeft, Sparkles, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ConferenceTemplateSection } from "@/lib/conference-form"
import type { SharedActionProps, SectionMeta } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface SaveViewProps extends SharedActionProps {
  templateName: string
  onTemplateNameChange: (name: string) => void
  templateDescription: string
  onTemplateDescriptionChange: (description: string) => void
  isSaving: boolean
  sectionMeta: SectionMeta[]
  selectedSections: ConferenceTemplateSection[]
  onSectionToggle: (section: ConferenceTemplateSection, checked: boolean) => void
  onSelectAllSections: () => void
  onClearSections: () => void
  onSave: () => void
}

export function SaveView({
  onFlowChange,
  templateName,
  onTemplateNameChange,
  templateDescription,
  onTemplateDescriptionChange,
  isSaving,
  sectionMeta,
  selectedSections,
  onSectionToggle,
  onSelectAllSections,
  onClearSections,
  onSave,
}: SaveViewProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col min-h-0 bg-slate-50/30">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 bg-white z-10">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-slate-200 text-slate-500 hover:text-[#1B3C53] hover:bg-slate-50"
            onClick={() => onFlowChange("home")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#1B3C53]">
              {t(
                "runtime.components.chair.conference-template-sheet.text_save_current_configuration",
              )}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {t(
                "runtime.components.chair.conference-template-sheet.text_save_current_configuration_description",
              )}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-6 py-8">
        <div className="mx-auto max-w-2xl space-y-8 pb-20">
          {/* Metadata Form */}
          <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-[#1B3C53]/10 p-2.5 text-[#1B3C53]">
                  <LayoutTemplate className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t("runtime.components.chair.template-sheet.save-view.text_template_details")}</h4>
                  <p className="text-xs text-slate-500">
                    {t("runtime.components.chair.template-sheet.save-view.text_only_visible_to_you_used_to")}{" "}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name" className="text-xs font-bold text-slate-700">
                    {t("runtime.components.chair.conference-template-sheet.text_template_name")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => onTemplateNameChange(e.target.value)}
                    placeholder={t(
                      "runtime.components.chair.conference-template-sheet.placeholder_template_name",
                    )}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:ring-[#1B3C53]"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-desc" className="text-xs font-bold text-slate-700">
                    {t("runtime.components.chair.conference-template-sheet.text_description")}{" "}
                    <span className="text-slate-400 font-normal">{t("runtime.components.chair.template-sheet.save-view.text_optional")}</span>
                  </Label>
                  <Textarea
                    id="template-desc"
                    value={templateDescription}
                    onChange={(e) => onTemplateDescriptionChange(e.target.value)}
                    placeholder={t(
                      "runtime.components.chair.conference-template-sheet.placeholder_template_description",
                    )}
                    className="min-h-[100px] resize-none rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:bg-white focus:ring-[#1B3C53]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Snapshot Picker Form */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t(
                    "runtime.components.chair.conference-template-sheet.text_saved_snapshot_includes",
                  )}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 max-w-[480px]">
                  {t(
                    "runtime.components.chair.conference-template-sheet.text_saved_snapshot_includes_description",
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-[10px] font-bold tracking-wider uppercase rounded-md bg-white border-slate-200"
                  onClick={onSelectAllSections}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_select_all")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-[10px] font-bold tracking-wider uppercase text-slate-500 rounded-md hover:bg-slate-200/50"
                  onClick={onClearSections}
                >
                  {t("runtime.components.chair.conference-template-sheet.text_clear")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sectionMeta.map((section) => {
                const checked = selectedSections.includes(section.id)
                const Icon = section.icon

                return (
                  <label
                    key={section.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-[16px] border p-4 transition-all duration-200",
                      checked
                        ? "border-[#1B3C53] bg-white ring-1 ring-[#1B3C53]/10"
                        : "border-slate-200 bg-slate-50/50 hover:border-[#1B3C53]/30 hover:bg-white",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => onSectionToggle(section.id, Boolean(value))}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn("size-4", checked ? "text-[#1B3C53]" : "text-slate-400")}
                        />
                        <span
                          className={cn(
                            "text-xs font-bold tracking-tight",
                            checked ? "text-[#1B3C53]" : "text-slate-900",
                          )}
                        >
                          {section.title}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {section.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Action bottom bar */}
      <div className="border-t border-slate-200 bg-white p-5 px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Badge
            variant="outline"
            className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-slate-200"
          >
            {t("runtime.components.chair.conference-template-sheet.text_only_you_can_use_it")}
          </Badge>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-full px-5 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => onFlowChange("home")}
              disabled={isSaving}
            >
              {t("runtime.components.chair.conference-template-sheet.text_cancel")}
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full bg-[#1B3C53] px-6 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#1B3C53]/90 gap-2"
              onClick={onSave}
              disabled={isSaving || !templateName.trim() || selectedSections.length === 0}
            >
              {isSaving && <Sparkles className="size-3.5 animate-pulse" />}
              {isSaving
                ? t("runtime.components.chair.conference-template-sheet.text_saving_template")
                : t("runtime.components.chair.conference-template-sheet.text_save_template")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
