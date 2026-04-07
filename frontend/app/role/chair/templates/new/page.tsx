"use client"

import dynamic from "next/dynamic"
import { useTranslation } from "@/lib/i18n/translation-context"

const ConferenceFormPage = dynamic(
  () => import("@/components/chair/conference-form-page").then((mod) => mod.ConferenceFormPage),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm text-slate-500">
        {t("runtime.app.role.chair.templates.new.page.text_loading_builder")}{" "}</div>
    ),
    ssr: false, // Builder is heavy and relies on browser APIs/client setup
  },
)

export default function NewTemplatePage() {
  const { t } = useTranslation()
  return <ConferenceFormPage mode="create" isTemplateMode={true} />
}
