"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/translation-context"
import { computerScienceKeywords, searchKeywords } from "@/lib/data/domain-keywords"
import { Check, Circle, Eye, EyeOff, GraduationCap, Loader2, Plus, X } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [domains, setDomains] = useState<string[]>([])
  const [domainInput, setDomainInput] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const addDomainValue = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || domains.includes(trimmed)) {
      return
    }
    setDomains([...domains, trimmed])
  }

  const suggestions: string[] = useMemo(() => {
    const pool = domainInput.trim() ? searchKeywords(domainInput) : computerScienceKeywords
    return pool.filter((keyword) => !domains.includes(keyword)).slice(0, 18)
  }, [domainInput, domains])

  type PasswordRuleKey = "length" | "lower" | "upper" | "number" | "special"

  const passwordChecks = useMemo(
    () =>
      ({
        length: formData.password.length >= 8,
        lower: /[a-z]/.test(formData.password),
        upper: /[A-Z]/.test(formData.password),
        number: /\d/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password),
      }) satisfies Record<PasswordRuleKey, boolean>,
    [formData.password],
  )

  const passwordRuleOrder: PasswordRuleKey[] = ["length", "lower", "upper", "number", "special"]

  const handleAddDomain = () => {
    addDomainValue(domainInput)
    setDomainInput("")
  }

  const handleRemoveDomain = (item: string) => {
    setDomains(domains.filter((domain) => domain !== item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"))
      return
    }

    const allRulesPassed = passwordRuleOrder.every((rule) => passwordChecks[rule])
    if (!allRulesPassed) {
      setError(t("auth.register.errors.passwordStrength"))
      return
    }

    if (domains.length === 0) {
      setError(t("auth.register.errors.domainsRequired"))
      return
    }

    setIsLoading(true)

    const result = await register({
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      domain: domains,
    })

    if (result.success) {
      router.push("/login?registered=1")
    } else {
      setError(result.error || t("auth.register.errors.failed"))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className={`text-center mb-8`}>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4"
          >
            <GraduationCap className={`${iconSizes.lg} text-white`} />
          </Link>
          <p className={`text-neutral-600 ${typography.body}`}>{t("auth.register.title")}</p>
        </div>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t("common.actions.signUp")}</CardTitle>
            <CardDescription>{t("auth.register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={spacing.subsection}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className={typography.body}>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="firstName">{t("common.labels.firstName")}</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Ada"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t("common.labels.lastName")}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Lovelace"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("common.labels.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ada.lovelace@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">{t("common.labels.domains")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    type="text"
                    placeholder="Machine Learning"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddDomain()
                      }
                    }}
                    disabled={isLoading}
                    className="border-neutral-300"
                  />
                  <Button
                    type="button"
                    onClick={handleAddDomain}
                    disabled={isLoading}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {domains.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {domains.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(item)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className={`mt-4 ${spacing.item}`}>
                  <p className={`${typography.bodySmall} ${typography.medium} text-neutral-500 uppercase tracking-wide`}>
                    {t("auth.register.suggestions.title")}
                  </p>
                  <p className={`${typography.bodySmall} text-neutral-500`}>
                    {t("auth.register.suggestions.subtitle")}
                  </p>
                  <div className={`flex flex-wrap ${spacing.gap.sm} min-h-[112px] max-h-[112px] overflow-y-auto overscroll-contain`}>
                    {suggestions.length > 0 ? (
                      suggestions.map((keyword) => (
                        <Button
                          key={keyword}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-dashed"
                          disabled={isLoading}
                          onClick={() => addDomainValue(keyword)}
                        >
                          {keyword}
                        </Button>
                      ))
                    ) : (
                      <span className={`${typography.bodySmall} text-neutral-400`}>
                        {t("auth.register.suggestions.empty")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("common.labels.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="border-neutral-300 pr-10"
                    aria-describedby="password-hint"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? t("auth.register.passwordHints.hide")
                        : t("auth.register.passwordHints.show")
                    }
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div
                  id="password-hint"
                  className={`mt-3 ${spacing.item} rounded-md bg-neutral-100 p-3 ${typography.bodySmall} text-neutral-600`}
                >
                  <p className={`${typography.medium} text-neutral-700 uppercase tracking-wide`}>
                    {t("auth.register.passwordHints.title")}
                  </p>
                  <ul className={spacing.tight}>
                    {passwordRuleOrder.map((rule) => {
                      const met = passwordChecks[rule]
                      return (
                        <li key={rule} className={`flex items-center ${spacing.gap.sm}`}>
                          {met ? (
                            <Check className={`${iconSizes.xs} text-success`} aria-hidden="true" />
                          ) : (
                            <Circle className={`${iconSizes.xs} text-neutral-400`} aria-hidden="true" />
                          )}
                          <span className={met ? "text-neutral-700" : "text-neutral-400"}>
                            {t(`auth.register.passwordHints.rules.${rule}`)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("common.labels.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="border-neutral-300 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? t("auth.register.passwordHints.hide")
                        : t("auth.register.passwordHints.show")
                    }
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className={`mr-2 ${iconSizes.sm} animate-spin`} />
                    {t("common.actions.signUp")}...
                  </>
                ) : (
                  t("common.actions.signUp")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className={`${typography.body} text-center text-neutral-600 w-full`}>
              {t("auth.register.haveAccount")}{" "}
              <Link href="/login" className={`text-primary hover:underline ${typography.medium}`}>
                {t("common.actions.signIn")}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
