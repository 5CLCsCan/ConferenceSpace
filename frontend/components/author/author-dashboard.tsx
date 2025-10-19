"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search } from "lucide-react"
import { mockConferences } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import type { Conference } from "@/lib/types"

// Tạo một số trạng thái bài nộp mẫu cho các hội nghị đã tham gia
const mySubmittedConferences = mockConferences.slice(0, 5).map((conf) => ({
  ...conf,
  submissionStatus: ["Đã nộp", "Được chấp nhận", "Bị từ chối"][Math.floor(Math.random() * 3)],
}))

const categories = [
  { value: "all", label: "Tất cả" },
  { value: "technology", label: "Công nghệ" },
  { value: "healthcare", label: "Y học" },
  { value: "education", label: "Giáo dục" },
]

export function AuthorDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filterConferences = (conferences: Array<Conference & { submissionStatus?: string }>) => {
    return conferences.filter((conf) => {
      const matchesSearch =
        conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.location.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === "all" ||
        conf.tracks.some((track) => track.name.toLowerCase() === selectedCategory.toLowerCase())
      return matchesSearch && matchesCategory
    })
  }

  // Lọc ra các hội nghị chưa tham gia
  const exploreConferences = mockConferences.filter(
    (conf) => !mySubmittedConferences.some((myConf) => myConf.id === conf.id),
  )

  const renderStatusBadge = (status: string) => {
    const variants = {
      "Được chấp nhận": "bg-green-100 text-green-800",
      "Bị từ chối": "bg-red-100 text-red-800",
      "Đã nộp": "bg-yellow-100 text-yellow-800",
    }
    return (
      <Badge
        className={`${variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, Author!
        </h1>
        <p className="text-gray-600 mb-6">
          Quản lý bài báo và khám phá hội nghị mới
        </p> */}

        {/* Thanh tìm kiếm và Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm hội nghị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section: Hội nghị của tôi */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Hội nghị của tôi</h2>
        <Card>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="hidden md:flex items-center gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-500">
              <div className="flex-1 min-w-0">Tên hội nghị</div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="w-36">Ngày diễn ra</div>
                <div className="w-36">Địa điểm</div>
                <div className="w-32">Hạn nộp bài</div>
                <div className="w-28">Trạng thái</div>
              </div>
            </div>

            {filterConferences(mySubmittedConferences).length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">Không tìm thấy hội nghị phù hợp</p>
              </div>
            ) : (
              filterConferences(mySubmittedConferences).map((conference, index, array) => (
                <div
                  key={conference.id}
                  className={`flex flex-col md:flex-row md:items-center gap-4 p-4 ${
                    index !== array.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/conference/${conference.id}`}
                      className="text-blue-600 hover:underline block font-medium truncate"
                    >
                      {conference.name}
                    </Link>
                    <div className="text-sm text-gray-500">{conference.acronym}</div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-gray-600 ml-auto">
                    <div className="md:w-36">{formatDate(conference.conference_date)}</div>
                    <div className="md:w-36">{conference.location}</div>
                    <div className="md:w-32">{formatDate(conference.submission_deadline)}</div>
                    <div className="md:w-28">
                      {renderStatusBadge(conference.submissionStatus || "")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* Section: Khám phá Hội nghị */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Khám phá Hội nghị</h2>
        <Card>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="hidden md:flex items-center gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-500">
              <div className="flex-1 min-w-0">Tên hội nghị</div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="w-36">Ngày diễn ra</div>
                <div className="w-36">Địa điểm</div>
                <div className="w-32">Hạn nộp bài</div>
                <div className="w-28">Thao tác</div>
              </div>
            </div>

            {filterConferences(exploreConferences).length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">Không tìm thấy hội nghị phù hợp</p>
              </div>
            ) : (
              filterConferences(exploreConferences).map((conference, index, array) => (
                <div
                  key={conference.id}
                  className={`flex flex-col md:flex-row md:items-center gap-4 p-4 ${
                    index !== array.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/conference/${conference.id}`}
                      className="text-blue-600 hover:underline block font-medium truncate"
                    >
                      {conference.name}
                    </Link>
                    <div className="text-sm text-gray-500">{conference.acronym}</div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-gray-600 ml-auto">
                    <div className="md:w-36">{formatDate(conference.conference_date)}</div>
                    <div className="md:w-36">{conference.location}</div>
                    <div className="md:w-32">{formatDate(conference.submission_deadline)}</div>
                    <Button variant="outline" size="sm" className="md:w-28" asChild>
                      <Link href={`/dashboard/conference/${conference.id}`}>Tham gia ngay</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
