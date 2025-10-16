"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar, MapPin, Users } from "lucide-react"
import { mockConferences } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import type { Conference } from "@/lib/types"

export function AuthorDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConferences = mockConferences.filter(
    (conf) =>
      conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hội Nghị Khoa Học</h1>
        <p className="text-gray-600 mb-6">Khám phá và tham gia các hội nghị phù hợp với lĩnh vực nghiên cứu của bạn</p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm hội nghị theo tên, từ viết tắt, địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConferences.map((conference) => (
          <ConferenceCard key={conference.id} conference={conference} />
        ))}
      </div>

      {filteredConferences.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Không tìm thấy hội nghị phù hợp</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ConferenceCard({ conference }: { conference: Conference }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-700"
      case "open":
        return "bg-green-100 text-green-700"
      case "closed":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra"
      case "open":
        return "Đang mở"
      case "closed":
        return "Đã đóng"
      default:
        return status
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div>
            <CardTitle className="text-xl mb-1">{conference.acronym}</CardTitle>
            <CardDescription className="text-sm">{conference.name}</CardDescription>
          </div>
          <Badge className={`${getStatusColor(conference.status)} border-0`}>{getStatusLabel(conference.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="size-4" />
            <span>{formatDate(conference.submission_deadline)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="size-4" />
            <span>{conference.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="size-4" />
            <span>{conference.tracks.length} Lĩnh Vực Nghiên Cứu</span>
          </div>
          <div className="pt-2">
            <p className="text-gray-700 line-clamp-3">{conference.description}</p>
          </div>
          <div className="pt-2">
            <div className="text-xs text-gray-500 italic">Hạn Nộp Bài: {formatDate(conference.submission_deadline)}</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button asChild className="w-full">
            <Link href={`/dashboard/conference/${conference.id}`}>Xem Chi Tiết</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
