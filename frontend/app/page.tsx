"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, BarChart3, Sparkles, CheckCircle2, TrendingUp, Award, GraduationCap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-neutral-900">ConferenceAI</span>
              <span className="text-xs text-neutral-600">Academic Conference Management</span>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
              Tính năng
            </a>
            <a href="#about" className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
              Giới thiệu
            </a>
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
              >
                Đăng nhập
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                Đăng ký
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Hệ thống quản lý hội nghị với AI
          </div>
          <h1 className="text-5xl font-bold mb-6 text-balance text-neutral-900">
            Tối ưu hóa quy trình tổ chức hội nghị khoa học
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Gợi ý thông minh, phân tích tự động và công cụ quản lý toàn diện cho nộp bài, phản biện và tổ chức hội nghị.
            Được xây dựng bởi nhà nghiên cứu, dành cho nhà nghiên cứu.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium px-8">
                Bắt đầu ngay
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium px-8 bg-transparent"
              >
                Đăng nhập
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Tuân thủ WCAG</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-success" />
              <span>50+ hội nghị tin dùng</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span>95% độ chính xác AI</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-neutral-900">Quản lý hội nghị toàn diện</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Từ nộp bài đến xuất bản camera-ready, nền tảng của chúng tôi hỗ trợ mọi giai đoạn của chu trình hội nghị.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-neutral-900">Nộp bài thông minh</CardTitle>
              <CardDescription className="text-neutral-600 leading-relaxed">
                Gợi ý AI cho reviewer, từ khóa và track. Nhận phản hồi tức thì về chất lượng bài nộp, hiệu quả tiêu đề
                và độ rõ ràng của abstract trước khi nộp.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-neutral-900">Ghép cặp reviewer thông minh</CardTitle>
              <CardDescription className="text-neutral-600 leading-relaxed">
                Tự động ghép bài với reviewer phù hợp dựa trên chuyên môn, khả năng, cân bằng khối lượng công việc và
                hiệu suất trong quá khứ. Phát hiện xung đột lợi ích tự động.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-neutral-900">Phân tích thời gian thực</CardTitle>
              <CardDescription className="text-neutral-600 leading-relaxed">
                Dashboard toàn diện với trực quan hóa dữ liệu cho xu hướng nộp bài, tiến độ review, tỷ lệ chấp nhận và
                thống kê hội nghị. Ra quyết định dựa trên dữ liệu.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="about" className="bg-neutral-50 border-y border-neutral-200">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">247</div>
              <div className="text-sm text-neutral-600 font-medium">Tổng số bài nộp</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">486</div>
              <div className="text-sm text-neutral-600 font-medium">Reviews hoàn thành</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">28.5%</div>
              <div className="text-sm text-neutral-600 font-medium">Tỷ lệ chấp nhận</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">95%</div>
              <div className="text-sm text-neutral-600 font-medium">Độ chính xác AI</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-neutral-900">ConferenceAI</span>
            </div>
            <div className="text-sm text-neutral-600">© 2025 ConferenceAI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
