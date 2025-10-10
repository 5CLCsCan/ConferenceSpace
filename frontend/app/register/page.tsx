"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Loader2, GraduationCap, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    affiliation: "",
  })
  const [expertise, setExpertise] = useState<string[]>([])
  const [expertiseInput, setExpertiseInput] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()])
      setExpertiseInput("")
    }
  }

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    if (expertise.length === 0) {
      setError("Vui lòng thêm ít nhất một lĩnh vực chuyên môn")
      return
    }

    setIsLoading(true)

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      affiliation: formData.affiliation,
      expertise,
    })

    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Đăng ký thất bại")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Conference Management System</h1>
          <p className="text-neutral-600">Tạo tài khoản mới</p>
        </div>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle>Đăng ký</CardTitle>
            <CardDescription>Điền thông tin để tạo tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation">Đơn vị công tác</Label>
                <Input
                  id="affiliation"
                  type="text"
                  placeholder="University Name"
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertise">Lĩnh vực chuyên môn</Label>
                <div className="flex gap-2">
                  <Input
                    id="expertise"
                    type="text"
                    placeholder="Machine Learning"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddExpertise()
                      }
                    }}
                    disabled={isLoading}
                    className="border-neutral-300"
                  />
                  <Button type="button" onClick={handleAddExpertise} disabled={isLoading} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expertise.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpertise(item)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-neutral-300"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  "Đăng ký"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-center text-neutral-600 w-full">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
