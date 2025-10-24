"use client"

/**
 * Conference Committee Component
 * Displays organizing committee, PC members, and reviewers
 * Role-based visibility: Chair info is public, Reviewer list only visible to Chair
 *
 * Data Sources:
 * - Committee: GET /api/conferences/:id/committee (conference_committee table + users table)
 */

import { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getConferenceCommittee } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Building2, Award, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ConferenceCommitteeProps {
  conferenceId: string
}

export function ConferenceCommittee({ conferenceId }: ConferenceCommitteeProps) {
  const { currentRole } = useAuth()
  const [committee, setCommittee] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCommittee() {
      const response = await getConferenceCommittee(conferenceId)
      if (response.data) {
        setCommittee(response.data)
      }
      setLoading(false)
    }

    loadCommittee()
  }, [conferenceId])

  const chairs = committee.filter((member) => member.roles.includes("chair"))
  const pcMembers = committee.filter(
    (member) => member.roles.includes("pc_member") || member.roles.includes("reviewer"),
  )

  const isChair = currentRole === "chair"
  const canSeeReviewers = isChair

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ban Tổ Chức</h1>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">
          Danh sách các thành viên ban tổ chức
          {canSeeReviewers ? " và program committee" : ""}
        </p>
      </div>

      {/* Conference Chairs - Public for all roles */}
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          Conference Chairs
        </h2>
        <p className="mt-2 text-gray-600">Chủ tịch hội nghị và các track chairs</p>
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chairs.map((chair) => (
            <Card key={chair.id} className="p-6 transition-shadow hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{chair.name}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{chair.affiliation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${chair.email}`} className="hover:text-primary">
                        {chair.email}
                      </a>
                    </div>
                    {chair.h_index && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Award className="h-4 w-4" />
                        <span>h-index: {chair.h_index}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chair.expertise.slice(0, 3).map((exp) => (
                      <Badge key={exp} variant="secondary" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Program Committee & Reviewers - Only visible to Chair */}
      {
        canSeeReviewers && (
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              Program Committee & Reviewers
            </h2>
            <p className="mt-2 text-gray-600">Các thành viên tham gia review và đánh giá bài báo</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pcMembers.map((member) => (
                <Card key={member.id} className="p-6 transition-shadow hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span>{member.affiliation}</span>
                        </div>
                        {member.h_index && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Award className="h-4 w-4" />
                            <span>h-index: {member.h_index}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.expertise.slice(0, 2).map((exp) => (
                          <Badge key={exp} variant="secondary" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                      {member.total_reviews && (
                        <p className="mt-3 text-xs text-gray-500">
                          {member.total_reviews} reviews completed
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
        // : (
        //   <Card className="p-8 text-center">
        //     <Lock className="mx-auto h-12 w-12 text-gray-400" />
        //     <h3 className="mt-4 text-lg font-semibold text-gray-900">
        //       Thông Tin Hạn Chế
        //     </h3>
        //     <p className="mt-2 text-gray-600">
        //       Danh sách reviewers và program committee chỉ hiển thị cho Conference
        //       Chairs để đảm bảo tính công bằng trong quá trình review.
        //     </p>
        //   </Card>
        // )
      }

      {/* Statistics - Only for Chair */}
      {canSeeReviewers && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Thống Kê Ban Tổ Chức</h3>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Số Chairs</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{chairs.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Số PC Members</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{pcMembers.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Số Reviewers</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{committee.length}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
