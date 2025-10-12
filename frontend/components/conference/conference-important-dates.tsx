"use client"

/**
 * Important Dates Component
 * Displays timeline of key conference dates
 *
 * Data Sources:
 * - Dates: GET /api/conferences/:id/dates (conferences table + conference_dates table)
 */

import { useEffect, useState } from "react"
import { getConferenceDates, type ImportantDate } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2 } from "lucide-react"

interface ConferenceImportantDatesProps {
  conferenceId: string
}

export function ConferenceImportantDates({ conferenceId }: ConferenceImportantDatesProps) {
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDates() {
      const response = await getConferenceDates(conferenceId)
      if (response.data) {
        setDates(response.data)
      }
      setLoading(false)
    }

    loadDates()
  }, [conferenceId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deadline":
        return "bg-error text-white"
      case "notification":
        return "bg-primary text-white"
      case "event":
        return "bg-success text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "deadline":
        return "Deadline"
      case "notification":
        return "Thông Báo"
      case "event":
        return "Sự Kiện"
      default:
        return type
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thời Gian Quan Trọng</h1>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">Timeline các mốc thời gian quan trọng của hội nghị</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200" />

        {/* Date items */}
        <div className="space-y-8">
          {dates.map((date, index) => (
            <div key={date.id} className="relative flex gap-6">
              {/* Timeline dot */}
              <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    date.isPast ? "bg-gray-300" : "bg-primary"
                  }`}
                >
                  {date.isPast ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <Calendar className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>

              {/* Content card */}
              <Card className={`flex-1 p-6 ${date.isPast ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900">{date.title}</h3>
                      <Badge className={getTypeColor(date.type)}>{getTypeLabel(date.type)}</Badge>
                      {date.isPast && (
                        <Badge variant="outline" className="border-gray-400 text-gray-600">
                          Đã Qua
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-gray-600">{date.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(date.date)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-primary bg-primary/5 p-6">
        <h3 className="text-lg font-semibold text-gray-900">Lưu Ý</h3>
        <ul className="mt-3 space-y-2 text-gray-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>Tất cả thời gian đều theo múi giờ UTC</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>Hệ thống sẽ gửi email nhắc nhở trước mỗi deadline 7 ngày và 1 ngày</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>Không chấp nhận bài nộp muộn sau deadline</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
