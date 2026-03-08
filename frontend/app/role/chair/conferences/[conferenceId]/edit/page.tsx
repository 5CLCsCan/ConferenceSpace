"use client"

import { useParams } from "next/navigation"
import { ConferenceFormPage } from "@/components/chair/conference-form-page"

export default function EditConferencePage() {
  const params = useParams()
  const conferenceId = params.conferenceId as string

  return <ConferenceFormPage mode="edit" conferenceId={conferenceId} />
}
