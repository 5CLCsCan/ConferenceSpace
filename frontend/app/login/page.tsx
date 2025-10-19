"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Loader2, GraduationCap, CheckCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationIndicator = searchParams.get("registered")
  const { login, isAuthenticated } = useAuth()
  const { t } = useTranslation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showRegistrationMessage, setShowRegistrationMessage] = useState(
    registrationIndicator === "1",
  )

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (registrationIndicator === "1") {
      setShowRegistrationMessage(true)
    }
  }, [registrationIndicator])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email.trim(), password)

    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || t("auth.login.errors.failed"))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4"
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            <Link href="/">{t("auth.login.cta")}</Link>
          </h1>
          <p className="text-neutral-600">{t("auth.login.subtitle")}</p>
        </div>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t("auth.login.title")}</CardTitle>
            <CardDescription>{t("auth.login.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {showRegistrationMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>{t("auth.login.registrationComplete")}</AlertTitle>
                  <AlertDescription>{t("auth.login.registrationDetails")}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("common.labels.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ada.lovelace@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("common.labels.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.login.title")}...
                  </>
                ) : (
                  t("common.actions.signIn")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-neutral-600">
              {t("auth.login.noAccount")}{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                {t("common.actions.signUp")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
