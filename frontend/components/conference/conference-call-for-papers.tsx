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
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, AlertCircle, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { typography, spacing, iconSizes } from "@/lib/typography"

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
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={typography.h1}>Call for Papers</h1>
        <p className={`mt-2 ${typography.body} leading-relaxed text-gray-600`}>
          Hướng dẫn và yêu cầu nộp bài cho {conference.acronym}
        </p>
      </div>

      {/* Submission Status */}
      <Card
        className={`border-2 ${spacing.padding.card} ${isSubmissionOpen ? "border-success bg-success/5" : "border-error bg-error/5"}`}
      >
        <div className={`flex items-start ${spacing.gap.md}`}>
          {isSubmissionOpen ? (
            <CheckCircle className={`${iconSizes.md} text-success`} />
          ) : (
            <AlertCircle className={`${iconSizes.md} text-error`} />
          )}
          <div className="flex-1">
            <h3 className={typography.h5}>
              {isSubmissionOpen ? "Đang Nhận Bài" : "Đã Đóng Nhận Bài"}
            </h3>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              Deadline:{" "}
              <span className={typography.semibold}>
                {formatDate(conference.submission_deadline)}
              </span>
            </p>
            {isSubmissionOpen && user && (
              <Button
                className={`mt-3 ${typography.bodySmall}`}
                size="sm"
                onClick={() => router.push("/author/submit")}
              >
                <Upload className={`mr-1.5 ${iconSizes.xs}`} />
                Nộp Bài Ngay
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Submission Guidelines */}
      <div>
        <h2 className={typography.h2}>Hướng Dẫn Nộp Bài</h2>
        <Card className={`mt-3 ${spacing.padding.card}`}>
          {conference.call_for_paper_text ? (
            <div className={`${typography.body} text-gray-600 whitespace-pre-wrap`}>
              {conference.call_for_paper_text}
            </div>
          ) : (
            <div className={spacing.subsection}>
              <div>
                <h3 className={`flex items-center ${spacing.gap.sm} ${typography.h5}`}>
                  <FileText className={`${iconSizes.sm} text-primary`} />
                  Yêu Cầu Định Dạng
                </h3>
                <ul className={`mt-2 ${spacing.item} ${typography.body} text-gray-600`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Bài báo phải được viết bằng tiếng Anh</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>
                      Độ dài: 6-8 trang cho full paper, 4 trang cho short paper (không bao gồm tài
                      liệu tham khảo)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Sử dụng template ACM hoặc IEEE (tải về từ website chính thức)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>File PDF, không quá 10MB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Bài nộp phải là nghiên cứu gốc, chưa được công bố trước đây</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`flex items-center ${spacing.gap.sm} ${typography.h5}`}>
                  <FileText className={`${iconSizes.sm} text-primary`} />
                  Nội Dung Bài Báo
                </h3>
                <ul className={`mt-2 ${spacing.item} ${typography.body} text-gray-600`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>
                      Abstract: 150-250 từ, tóm tắt rõ ràng vấn đề, phương pháp và kết quả
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Keywords: 3-5 từ khóa phản ánh nội dung chính</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Introduction: Giới thiệu vấn đề nghiên cứu và đóng góp chính</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Related Work: Tổng quan các nghiên cứu liên quan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Methodology: Mô tả chi tiết phương pháp nghiên cứu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Results & Discussion: Trình bày và phân tích kết quả</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Conclusion: Tóm tắt đóng góp và hướng phát triển</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`flex items-center ${spacing.gap.sm} ${typography.h5}`}>
                  <FileText className={`${iconSizes.sm} text-primary`} />
                  Quy Trình Review
                </h3>
                <ul className={`mt-2 ${spacing.item} ${typography.body} text-gray-600`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>
                      Double-blind review: Tác giả và reviewer không biết danh tính của nhau
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Mỗi bài sẽ được review bởi ít nhất 3 reviewers độc lập</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Tiêu chí đánh giá: Novelty, Technical Quality, Clarity, Relevance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>Kết quả: Accept, Minor Revision, Major Revision, hoặc Reject</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
