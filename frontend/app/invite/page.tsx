"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { previewConferenceInvitation, respondToConferenceInvitation } from "@/lib/api/conferences"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"

function InvitationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const token = searchParams.get("token")?.trim() ?? ""

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<"accept" | "decline" | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [preview, setPreview] =
    useState<Awaited<ReturnType<typeof previewConferenceInvitation>>["data"]>(null)

  useEffect(() => {
    if (!token) {
      setError(t("runtime.app.invite.page.text_missing_invitation_token"))
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError("")

    void previewConferenceInvitation(token).then((result) => {
      if (cancelled) return
      if (result.error || !result.data) {
        setError(result.error || t("runtime.app.invite.page.text_failed_to_load_invitation"))
        setLoading(false)
        return
      }
      setPreview(result.data)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [t, token])

  const roleLabel = useMemo(() => {
    if (!preview) return ""
    if (preview.invitation.role === "reviewer") {
      return t("runtime.app.register.page.text_role_reviewer")
    }
    if (preview.invitation.role === "co_chair") {
      return t("runtime.app.register.page.text_role_co_chair")
    }
    return t("runtime.app.register.page.text_role_pc")
  }, [preview, t])

  const handleRespond = async (action: "accept" | "decline") => {
    if (!token) return
    setSubmitting(action)
    setError("")
    setSuccess("")
    const result = await respondToConferenceInvitation(token, action)
    setSubmitting(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(
      action === "accept"
        ? t("runtime.app.invite.page.text_invitation_accepted")
        : t("runtime.app.invite.page.text_invitation_declined"),
    )
  }

  const isWrongEmail =
    preview &&
    user?.email &&
    preview.invitation.invitee_email.toLowerCase() !== user.email.toLowerCase()

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-8 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
            {t("runtime.app.register.page.text_conferencespace")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1B3C53]">
            {t("runtime.app.invite.page.text_conference_invitation")}
          </h1>
        </div>

        <div className="space-y-5 px-8 py-7">
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("runtime.app.invite.page.text_loading_invitation")}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : preview ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-600">
                  {t("runtime.app.register.page.text_invited_to_join_conference", {
                    role: roleLabel,
                    conference: preview.conference_title,
                    inviter: preview.inviter_name,
                  })}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t("runtime.app.invite.page.text_invitation_sent_to_email", {
                    email: preview.invitation.invitee_email,
                  })}
                </p>
              </div>

              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              {!isAuthenticated ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  <p>{t("runtime.app.invite.page.text_sign_in_to_continue")}</p>
                  <div className="mt-3 flex gap-3">
                    <Link
                      href={`${ROUTES.LOGIN}?invite_token=${encodeURIComponent(token)}`}
                      className="inline-flex rounded-lg bg-[#1B3C53] px-4 py-2 text-white"
                    >
                      {t("common.actions.signIn")}
                    </Link>
                    <Link
                      href={`${ROUTES.REGISTER}?invite_token=${encodeURIComponent(token)}`}
                      className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-slate-700"
                    >
                      {t("common.actions.signUp")}
                    </Link>
                  </div>
                </div>
              ) : isWrongEmail ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  {t("runtime.app.invite.page.text_wrong_account_email", {
                    currentEmail: user?.email ?? "",
                    invitedEmail: preview.invitation.invitee_email,
                  })}
                </div>
              ) : preview.invitation.status !== "pending" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  {t("runtime.app.invite.page.text_invitation_status", {
                    status: preview.invitation.status,
                  })}
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleRespond("accept")}
                    disabled={submitting !== null}
                    className="inline-flex items-center rounded-lg bg-[#1B3C53] px-4 py-2 text-white disabled:opacity-60"
                  >
                    {submitting === "accept" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t("runtime.app.invite.page.text_accept_invitation")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRespond("decline")}
                    disabled={submitting !== null}
                    className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-slate-700 disabled:opacity-60"
                  >
                    {submitting === "decline" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t("runtime.app.invite.page.text_decline_invitation")}
                  </button>
                </div>
              )}

              <div className="pt-2 text-sm">
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.ROLE_SELECT)}
                  className="text-[#1B3C53] underline-offset-4 hover:underline"
                >
                  {t("runtime.app.invite.page.text_go_to_dashboard")}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#1B3C53]" />
        </div>
      }
    >
      <InvitationPageContent />
    </Suspense>
  )
}
