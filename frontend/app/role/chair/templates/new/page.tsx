"use client"

import dynamic from "next/dynamic"

const ConferenceFormPage = dynamic(
  () => import("@/components/chair/conference-form-page").then((mod) => mod.ConferenceFormPage),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm text-slate-500">
        Loading builder...
      </div>
    ),
    ssr: false, // Builder is heavy and relies on browser APIs/client setup
  },
)

export default function NewTemplatePage() {
  return <ConferenceFormPage mode="create" isTemplateMode={true} />
}
