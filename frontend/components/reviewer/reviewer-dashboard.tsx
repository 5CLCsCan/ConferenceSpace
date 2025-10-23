"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Mail,
  LayoutDashboard,
} from "lucide-react";
import {
  mockReviewAssignments,
  mockPapers,
  mockConferences,
} from "@/lib/mock-data";
import { formatDate, daysUntilDeadline } from "@/lib/utils";
import Link from "next/link";
import type { ReviewAssignment, Paper } from "@/lib/types";

export function ReviewerDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const currentReviewerId = "user-2";
  const assignments = mockReviewAssignments.filter(
    (a) => a.reviewer_id === currentReviewerId
  );

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  };

  // Lọc các hội nghị có paper cần review
  const myConferences = mockConferences.filter((conf) =>
    assignments.some(
      (assignment) =>
        mockPapers.find((p) => p.id === assignment.paper_id)?.conference_id ===
        conf.id
    )
  );

  // Mock data cho lời mời phản biện
  const invitations = [
    {
      id: "inv-1",
      conferenceName: "International Conference on Advanced Computing 2025",
      inviterName: "Dr. Sarah Chen",
      paperTitle: "Novel Approaches in Quantum Computing",
      dueDate: "2025-05-15T23:59:59Z",
    },
    {
      id: "inv-2",
      conferenceName: "Neural Information Processing Systems 2025",
      inviterName: "Prof. Michael Rodriguez",
      paperTitle: "Deep Learning for Climate Change Prediction",
      dueDate: "2025-07-20T23:59:59Z",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar cố định */}
      <div className="w-64 border-r bg-card">
        <div className="flex flex-col p-4 space-y-2">
          <Button
            variant={activeNav === "overview" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setActiveNav("overview")}
          >
            <LayoutDashboard className="mr-2 size-4" />
            Tổng quan
          </Button>
          <Button
            variant={activeNav === "conferences" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setActiveNav("conferences")}
          >
            <BookOpen className="mr-2 size-4" />
            Hội nghị của tôi
          </Button>
          <Button
            variant={activeNav === "invitations" ? "secondary" : "ghost"}
            className="justify-start"
            onClick={() => setActiveNav("invitations")}
          >
            <Mail className="mr-2 size-4" />
            Lời mời
          </Button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 p-8 space-y-8">
        {activeNav === "overview" && (
          <>
            {/* Thống kê */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tổng số hội nghị
                  </CardTitle>
                  <BookOpen className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {myConferences.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đang tham gia phản biện
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Đã phản biện
                  </CardTitle>
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    Bài báo đã hoàn thành
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Chờ phản biện
                  </CardTitle>
                  <Clock className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Bài báo cần xử lý
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Các tác vụ cần làm */}
            <Card>
              <CardHeader>
                <CardTitle>Các tác vụ cần làm</CardTitle>
                <CardDescription>
                  Những việc cần được ưu tiên xử lý
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignments
                  .filter((a) => a.status !== "completed")
                  .map((assignment) => {
                    const paper = mockPapers.find(
                      (p) => p.id === assignment.paper_id
                    );
                    if (!paper) return null;
                    const daysLeft = daysUntilDeadline(assignment.due_date);
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{paper.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Hạn: {formatDate(assignment.due_date)} ({daysLeft}{" "}
                            ngày)
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/reviewer/papers/${paper.id}`}>
                            Bắt đầu
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </>
        )}

        {activeNav === "conferences" && (
          <Card>
            <CardHeader>
              <CardTitle>Hội nghị tham gia phản biện</CardTitle>
              <CardDescription>
                Danh sách các hội nghị bạn đang phản biện
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">
                        Tên hội nghị
                      </th>
                      <th className="text-left p-4 font-medium">Vai trò</th>
                      <th className="text-left p-4 font-medium">Tiến độ</th>
                      <th className="text-left p-4 font-medium">Hạn chót</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myConferences.map((conference) => {
                      const conferenceAssignments = assignments.filter(
                        (a) =>
                          mockPapers.find((p) => p.id === a.paper_id)
                            ?.conference_id === conference.id
                      );
                      const completed = conferenceAssignments.filter(
                        (a) => a.status === "completed"
                      ).length;
                      const total = conferenceAssignments.length;

                      return (
                        <tr
                          key={conference.id}
                          className="border-b last:border-0"
                        >
                          <td className="p-4">
                            <a
                              href="#"
                              className="text-primary hover:underline font-medium"
                            >
                              {conference.name}
                            </a>
                          </td>
                          <td className="p-4">Reviewer</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(completed / total) * 100}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">
                                {completed}/{total}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {formatDate(conference.review_deadline)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeNav === "invitations" && (
          <div className="grid gap-6">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {invitation.conferenceName}
                      </h3>
                      <p className="text-muted-foreground">
                        {invitation.paperTitle}
                      </p>
                      <p className="text-sm">
                        Người mời:{" "}
                        <span className="font-medium">
                          {invitation.inviterName}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Hạn phản hồi: {formatDate(invitation.dueDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Từ chối
                      </Button>
                      <Button size="sm">Chấp nhận</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
