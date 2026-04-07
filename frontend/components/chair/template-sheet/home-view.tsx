"use client"

import { ArrowRight, Copy, LayoutTemplate, PlusCircle, Search, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { SharedActionProps } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface HomeViewProps extends SharedActionProps {
  templatesCount: number
  conferencesCount: number
}

export function HomeView({
  onFlowChange,
  templatesCount,
  conferencesCount,
  allowSave = true,
}: HomeViewProps) {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <>
      <div className="border-b px-6 py-4">
        <h3 className="text-sm font-bold tracking-tight text-[#1B3C53]">
          {t("runtime.components.chair.conference-template-sheet.text_choose_action")}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">
          {t("runtime.components.chair.conference-template-sheet.text_choose_action_description")}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-6 py-5">
        <div className="space-y-6 pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Templates Card */}
            <button
              type="button"
              className="group text-left h-full flex"
              onClick={() => onFlowChange("templates")}
            >
              <Card className="flex flex-col flex-1 overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-all duration-300 hover:border-[#1B3C53]/30 hover:shadow-lg">
                <div className="h-24 bg-slate-50 relative overflow-hidden flex items-center px-6">
                  <div className="absolute -right-4 -top-4 rounded-full bg-white/40 p-8 blur-2xl" />
                  <div className="rounded-2xl bg-white p-3 text-[#1B3C53] shadow-sm ring-1 ring-slate-100 relative z-10 transition-transform duration-300 group-hover:scale-110">
                    <LayoutTemplate className="size-5" />
                  </div>
                </div>
                <CardContent className="flex flex-col flex-1 p-5 pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-[#1B3C53]">
                        {t(
                          "runtime.components.chair.conference-template-sheet.text_saved_templates",
                        )}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-slate-100 px-2 text-[9px] font-bold text-slate-500"
                      >
                        {templatesCount}
                      </Badge>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-3">
                      {t(
                        "runtime.components.chair.conference-template-sheet.text_browse_saved_templates_desc",
                      )}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#1B3C53]">
                    {t("runtime.components.chair.template-sheet.home-view.text_browse_saved")}{" "}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </button>

            {/* Conferences Card */}
            <button
              type="button"
              className="group text-left h-full flex"
              onClick={() => onFlowChange("conferences")}
            >
              <Card className="flex flex-col flex-1 overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-all duration-300 hover:border-[#1B3C53]/30 hover:shadow-lg">
                <div className="h-24 bg-slate-50 relative overflow-hidden flex items-center px-6">
                  <div className="absolute -right-4 -top-4 rounded-full bg-white/40 p-8 blur-2xl" />
                  <div className="rounded-2xl bg-white p-3 text-[#1B3C53] shadow-sm ring-1 ring-slate-100 relative z-10 transition-transform duration-300 group-hover:scale-110">
                    <Copy className="size-5" />
                  </div>
                </div>
                <CardContent className="flex flex-col flex-1 p-5 pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-[#1B3C53]">
                        {t(
                          "runtime.components.chair.conference-template-sheet.text_copy_from_conference",
                        )}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-slate-100 px-2 text-[9px] font-bold text-slate-500"
                      >
                        {conferencesCount}
                      </Badge>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-3">
                      {t(
                        "runtime.components.chair.conference-template-sheet.text_copy_from_conference_desc",
                      )}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#1B3C53]">
                    {t("runtime.components.chair.template-sheet.home-view.text_copy_config")}{" "}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </button>

            {/* Create New Card */}
            <button
              type="button"
              className="group text-left h-full flex"
              onClick={() => router.push("/role/chair/templates/new")}
            >
              <Card className="flex flex-col flex-1 overflow-hidden rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all duration-300 hover:border-[#1B3C53]/40 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50">
                <div className="h-24 relative overflow-hidden flex items-center px-6">
                  <div className="rounded-2xl bg-white p-3 text-[#1B3C53] shadow-sm ring-1 ring-slate-100 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#1B3C53] group-hover:text-white group-hover:ring-0">
                    <PlusCircle className="size-5" />
                  </div>
                </div>
                <CardContent className="flex flex-col flex-1 p-5 pb-6">
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-bold text-[#1B3C53]">
                      {t(
                        "runtime.components.chair.conference-template-sheet.text_create_new_template",
                      )}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-3">
                      {t(
                        "runtime.components.chair.conference-template-sheet.text_create_template_from_scratch_desc",
                      )}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#1B3C53]">
                    {t("runtime.components.chair.template-sheet.home-view.text_build_template")}{" "}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>

          <div className="rounded-[20px] bg-[#1B3C53]/5 px-5 py-4 text-[11px] font-medium leading-relaxed text-slate-600 border border-[#1B3C53]/10 flex items-center gap-3">
            <div className="shrink-0 rounded-full bg-[#1B3C53]/20 p-1">
              <Sparkles className="size-3 text-[#1B3C53]" />
            </div>
            {t("runtime.components.chair.conference-template-sheet.text_identity_preserved")}
          </div>
        </div>
      </ScrollArea>
    </>
  )
}
