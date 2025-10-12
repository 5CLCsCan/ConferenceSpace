"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { FileText, Users, BarChart3, GraduationCap, LogOut, Sparkles } from "lucide-react"
import type { UserRole } from "@/lib/types"

const roleConfig = {
  author: {
    title: "Tác giả",
    description: "Nộp và quản lý bài báo của bạn",
    icon: FileText,
    color: "bg-blue-500",
    path: "/author",
    features: ["Nộp bài mới", "Theo dõi trạng thái review", "Xem phản hồi từ reviewer", "Cập nhật camera-ready"],
  },
  reviewer: {
    title: "Reviewer",
    description: "Đánh giá và phản biện bài báo",
    icon: Users,
    color: "bg-green-500",
    path: "/dashboard/reviewer",
    features: ["Xem bài được phân công", "Viết review chi tiết", "AI hỗ trợ review", "Theo dõi deadline"],
  },
  chair: {
    title: "Chair",
    description: "Quản lý và tổ chức hội nghị",
    icon: BarChart3,
    color: "bg-purple-500",
    path: "/dashboard/chair",
    features: ["Phân công reviewer", "Xem thống kê hội nghị", "Quản lý submissions", "AI matching system"],
  },
  pc_member: {
    title: "PC Member",
    description: "Tham gia ban chương trình",
    icon: BarChart3,
    color: "bg-purple-500",
    path: "/dashboard/chair",
    features: ["Phân công reviewer", "Xem thống kê hội nghị", "Quản lý submissions", "AI matching system"],
  },
  admin: {
    title: "Admin",
    description: "Quản trị hệ thống",
    icon: BarChart3,
    color: "bg-red-500",
    path: "/dashboard/admin",
    features: ["Quản lý người dùng", "Cấu hình hệ thống", "Xem logs", "Quản lý quyền"],
  },
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, switchRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!user) {
    return null
  }

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role)
    const config = roleConfig[role]
    router.push(config.path)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Get unique roles (pc_member and chair both go to chair dashboard)
  const availableRoles = user.roles.filter((role) => role !== "admin")

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-neutral-900">ConferenceAI</span>
              <span className="text-xs text-neutral-600">Chọn vai trò của bạn</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Chào mừng, {user.name}!</h1>
            <p className="text-neutral-600 mb-1">{user.affiliation}</p>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Thông tin tài khoản</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{user.h_index || 0}</div>
                <div className="text-sm text-neutral-600">H-Index</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{user.total_papers || 0}</div>
                <div className="text-sm text-neutral-600">Tổng số bài</div>
              </div>
              <div className="text-center p-4 bg-neutral-50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{user.total_reviews || 0}</div>
                <div className="text-sm text-neutral-600">Tổng số reviews</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-neutral-700 mb-2">Lĩnh vực chuyên môn:</div>
              <div className="flex flex-wrap gap-2">
                {user.expertise.map((exp) => (
                  <span key={exp} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Chọn vai trò để tiếp tục</h2>
            <p className="text-neutral-600">Bạn có thể truy cập các chức năng sau dựa trên vai trò của mình</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {availableRoles.map((role) => {
              const config = roleConfig[role]
              const Icon = config.icon

              return (
                <Card
                  key={role}
                  className="bg-white border-2 border-neutral-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleRoleSelect(role)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors bg-transparent"
                      >
                        Chọn
                      </Button>
                    </div>
                    <CardTitle className="text-xl text-neutral-900">{config.title}</CardTitle>
                    <CardDescription className="text-neutral-600">{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {config.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-neutral-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {availableRoles.length === 0 && (
            <Card className="bg-white border border-neutral-200">
              <CardContent className="py-12 text-center">
                <p className="text-neutral-600">Tài khoản của bạn chưa được gán vai trò nào.</p>
                <p className="text-sm text-neutral-500 mt-2">Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
