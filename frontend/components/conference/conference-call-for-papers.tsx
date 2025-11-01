"use client"

/**
 * Call for Papers Component
 * Displays submission guidelines, requirements, and tracks
 *
 * Data Sources:
 * - Conference info: GET /api/conferences/:id (conferences table)
 * - Tracks: GET /api/conferences/:id/tracks (tracks table)
 */

import type { Conference } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, AlertCircle, Calendar, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface ConferenceCallForPapersProps {
  conference: Conference
}

export function ConferenceCallForPapers({ conference }: ConferenceCallForPapersProps) {
  const { user } = useAuth()
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isSubmissionOpen = new Date(conference.submission_deadline) > new Date()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Call for Papers</h1>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">
          Hướng dẫn và yêu cầu nộp bài cho {conference.acronym}
        </p>
      </div>

      {/* Submission Status */}
      <Card
        className={`border-2 p-6 ${isSubmissionOpen ? "border-success bg-success/5" : "border-error bg-error/5"}`}
      >
        <div className="flex items-start gap-4">
          {isSubmissionOpen ? (
            <CheckCircle className="h-6 w-6 text-success" />
          ) : (
            <AlertCircle className="h-6 w-6 text-error" />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {isSubmissionOpen ? "Đang Nhận Bài" : "Đã Đóng Nhận Bài"}
            </h3>
            <p className="mt-1 text-gray-600">
              Deadline:{" "}
              <span className="font-semibold">{formatDate(conference.submission_deadline)}</span>
            </p>
            {isSubmissionOpen && user && (
              <Button className="mt-4" onClick={() => router.push("/author/submit")}>
                <Upload className="mr-2 h-4 w-4" />
                Nộp Bài Ngay
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Submission Guidelines */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hướng Dẫn Nộp Bài</h2>
        <Card className="mt-4 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-primary" />
                Yêu Cầu Định Dạng
              </h3>
              <ul className="mt-3 space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Bài báo phải được viết bằng tiếng Anh</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>
                    Độ dài: 6-8 trang cho full paper, 4 trang cho short paper (không bao gồm tài
                    liệu tham khảo)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Sử dụng template ACM hoặc IEEE (tải về từ website chính thức)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>File PDF, không quá 10MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Bài nộp phải là nghiên cứu gốc, chưa được công bố trước đây</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-primary" />
                Nội Dung Bài Báo
              </h3>
              <ul className="mt-3 space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Abstract: 150-250 từ, tóm tắt rõ ràng vấn đề, phương pháp và kết quả</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Keywords: 3-5 từ khóa phản ánh nội dung chính</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Introduction: Giới thiệu vấn đề nghiên cứu và đóng góp chính</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Related Work: Tổng quan các nghiên cứu liên quan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Methodology: Mô tả chi tiết phương pháp nghiên cứu</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Results & Discussion: Trình bày và phân tích kết quả</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Conclusion: Tóm tắt đóng góp và hướng phát triển</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-primary" />
                Quy Trình Review
              </h3>
              <ul className="mt-3 space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>
                    Double-blind review: Tác giả và reviewer không biết danh tính của nhau
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Mỗi bài sẽ được review bởi ít nhất 3 reviewers độc lập</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Tiêu chí đánh giá: Novelty, Technical Quality, Clarity, Relevance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span>Kết quả: Accept, Minor Revision, Major Revision, hoặc Reject</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Research Tracks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tracks Nghiên Cứu</h2>
        <p className="mt-2 text-gray-600">
          Chọn track phù hợp nhất với nội dung nghiên cứu của bạn
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {conference.tracks.map((track) => (
            <Card key={track.id} className="p-6 transition-shadow hover:shadow-lg">
              <Badge className="mb-3 bg-primary text-white">Track</Badge>
              <h3 className="text-lg font-semibold text-gray-900">{track.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{track.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Important Deadlines */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Calendar className="h-5 w-5 text-primary" />
          Các Mốc Thời Gian Quan Trọng
        </h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <span className="font-medium text-gray-700">Deadline Nộp Bài</span>
            <span className="text-gray-900">{formatDate(conference.submission_deadline)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <span className="font-medium text-gray-700">Thông Báo Kết Quả</span>
            <span className="text-gray-900">{formatDate(conference.notification_date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Camera-Ready Deadline</span>
            <span className="text-gray-900">{formatDate(conference.camera_ready_deadline)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
