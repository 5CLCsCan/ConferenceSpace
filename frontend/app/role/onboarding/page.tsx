"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/lib/auth-context"
import { getSidebarMenuItems } from "@/lib/navigation"
import { ROUTES } from "@/lib/routes"
import type { UserRole } from "@/lib/types"
import { useNotifications } from "@/hooks/use-notifications"

type TutorialRole = "chair" | "author" | "reviewer"

interface TutorialStep {
  title: string
  image: string
  href: string
  actionLabel: string
  bullets: string[]
}

interface TutorialContent {
  icon: string
  label: string
  eyebrow: string
  title: string
  summary: string
  outcome: string
  checkpoints: string[]
  steps: TutorialStep[]
}

const TUTORIALS: Record<TutorialRole, TutorialContent> = {
  chair: {
    icon: "gavel",
    label: "Chair",
    eyebrow: "Quản lý hội nghị",
    title: "Điều phối hội nghị từ tạo CFP đến quyết định cuối",
    summary:
      "Dành cho người quản lý hội nghị: tạo hội nghị, cấu hình deadline, mời committee, theo dõi submission, phân công reviewer và ra quyết định.",
    outcome:
      "Sau 4 bước, Chair biết cách mở hội nghị, chuẩn bị reviewer và ra quyết định đúng thời điểm.",
    checkpoints: [
      "Có tài khoản được cấp quyền Chair hoặc PC.",
      "Chuẩn bị thông tin hội nghị, track, topic và deadline.",
      "Có reviewer/committee để mời trước khi chạy assignment.",
    ],
    steps: [
      {
        title: "Mở dashboard Chair",
        image: "/onboarding/chair/01-dashboard.png",
        href: ROUTES.CHAIR.DASHBOARD,
        actionLabel: "Mở dashboard",
        bullets: [
          "Kiểm tra số lượng hội nghị, submission, review và deadline đang mở.",
          "Dùng danh sách hội nghị gần đây để quay lại hội nghị đang xử lý.",
          "Nếu mới bắt đầu, chuyển sang bước tạo hội nghị mới.",
        ],
      },
      {
        title: "Tạo hội nghị và cấu hình CFP",
        image: "/onboarding/chair/02-create-conference.png",
        href: ROUTES.CHAIR.NEW_CONFERENCE,
        actionLabel: "Tạo hội nghị",
        bullets: [
          "Nhập tên, acronym, mô tả, loại hội nghị và nền tảng tổ chức.",
          "Thêm topics/tracks vì dữ liệu này dùng cho phân loại paper và matching reviewer.",
          "Kiểm tra policy, review type và deadline trước khi publish.",
        ],
      },
      {
        title: "Mời committee và phân công reviewer",
        image: "/onboarding/chair/03-assign-reviewers.png",
        href: ROUTES.CHAIR.CONFERENCES,
        actionLabel: "Mở danh sách hội nghị",
        bullets: [
          "Mời reviewer bằng email, đợi trạng thái invitation được accept nếu flow yêu cầu.",
          "Mở tab submissions/assignments để chạy suggested reviewers hoặc auto-assign.",
          "Luôn mở Match Details để xem keyword match, workload và COI trước khi confirm.",
        ],
      },
      {
        title: "Theo dõi review và ra quyết định",
        image: "/onboarding/chair/04-decision.png",
        href: ROUTES.CHAIR.CONFERENCES,
        actionLabel: "Quản lý hội nghị",
        bullets: [
          "Theo dõi review đã nộp, reviewer quá hạn và các discussion cần xử lý.",
          "Mở rebuttal nếu hội nghị có vòng phản hồi tác giả.",
          "Chỉ commit accept/reject sau khi kiểm tra review, COI và camera-ready requirements.",
        ],
      },
    ],
  },
  author: {
    icon: "edit_document",
    label: "Author",
    eyebrow: "Nộp bài",
    title: "Nộp bài và theo dõi toàn bộ vòng đời submission",
    summary:
      "Dành cho tác giả: tìm hội nghị đang mở, nộp paper, chỉnh sửa/rút bài, đọc review, gửi rebuttal và nộp camera-ready.",
    outcome:
      "Sau 4 bước, Author biết cách chọn hội nghị, nộp paper và theo dõi kết quả đến camera-ready.",
    checkpoints: [
      "Có tài khoản Author với domain chuyên môn phù hợp.",
      "Chuẩn bị title, abstract, keywords, co-author và file PDF hợp lệ.",
      "Chọn hội nghị còn hạn nhận bài hoặc còn mở vòng camera-ready.",
    ],
    steps: [
      {
        title: "Tìm hội nghị đang mở",
        image: "/onboarding/author/01-conferences.png",
        href: ROUTES.AUTHOR.DASHBOARD,
        actionLabel: "Mở hội nghị",
        bullets: [
          "Xem danh sách hội nghị và kiểm tra trạng thái nhận bài.",
          "Mở chi tiết hội nghị để đọc track, topics, deadline và policy.",
          "Chỉ bắt đầu submission khi conference còn mở full paper deadline.",
        ],
      },
      {
        title: "Tạo submission mới",
        image: "/onboarding/author/02-new-submission.png",
        href: ROUTES.AUTHOR.NEW_SUBMISSION,
        actionLabel: "Nộp bài mới",
        bullets: [
          "Nhập title, abstract, keywords và chọn track phù hợp.",
          "Thêm co-author và khai báo conflict of interest nếu có.",
          "Upload PDF hợp lệ rồi chạy precheck/autofill nếu tính năng AI đang hoạt động.",
        ],
      },
      {
        title: "Quản lý submission",
        image: "/onboarding/author/03-submission-detail.png",
        href: ROUTES.AUTHOR.SUBMISSIONS,
        actionLabel: "Bài nộp của tôi",
        bullets: [
          "Theo dõi trạng thái draft, submitted, under review, rebuttal hoặc decision.",
          "Sửa hoặc rút bài khi hệ thống còn cho phép theo deadline.",
          "Mở chi tiết submission để xem thông báo, discussion và review khi được công bố.",
        ],
      },
      {
        title: "Gửi rebuttal hoặc camera-ready",
        image: "/onboarding/author/04-rebuttal-or-camera-ready.png",
        href: ROUTES.AUTHOR.SUBMISSIONS,
        actionLabel: "Theo dõi kết quả",
        bullets: [
          "Đọc kỹ review trước khi viết rebuttal, trả lời theo từng điểm chính.",
          "Khi paper được accept, kiểm tra yêu cầu camera-ready và upload đúng file cuối.",
          "Theo dõi notification để không bỏ lỡ deadline phản hồi.",
        ],
      },
    ],
  },
  reviewer: {
    icon: "rate_review",
    label: "Reviewer",
    eyebrow: "Phản biện",
    title: "Nhận lời mời, đọc bài và gửi review có chất lượng",
    summary:
      "Dành cho reviewer: nhận/decline invitation, xem assignment, dùng briefing hỗ trợ đọc bài, chấm điểm và cập nhật sau rebuttal.",
    outcome:
      "Sau 4 bước, Reviewer biết cách nhận lời mời, đọc assignment và gửi review đủ chất lượng.",
    checkpoints: [
      "Email tài khoản phải trùng email được Chair mời.",
      "Domain chuyên môn nên được cập nhật để matching chính xác hơn.",
      "Chỉ accept khi đủ chuyên môn, còn thời gian và không có COI.",
    ],
    steps: [
      {
        title: "Mở dashboard Reviewer",
        image: "/onboarding/reviewer/01-dashboard.png",
        href: ROUTES.REVIEWER.DASHBOARD,
        actionLabel: "Mở dashboard",
        bullets: [
          "Kiểm tra invitation mới, assignment đang chờ review và deadline gần nhất.",
          "Ưu tiên xử lý lời mời trước để Chair biết reviewer có tham gia hay không.",
          "Dùng dashboard để quay lại các review chưa hoàn tất.",
        ],
      },
      {
        title: "Accept hoặc decline invitation",
        image: "/onboarding/reviewer/02-invitations.png",
        href: ROUTES.REVIEWER.INVITATIONS,
        actionLabel: "Xem lời mời",
        bullets: [
          "Đọc conference, paper summary, deadline và cảnh báo COI nếu có.",
          "Accept khi phù hợp chuyên môn và không có conflict.",
          "Decline với lý do rõ ràng nếu bận, lệch chuyên môn hoặc có xung đột lợi ích.",
        ],
      },
      {
        title: "Đọc assignment và briefing",
        image: "/onboarding/reviewer/03-assignment-detail.png",
        href: ROUTES.REVIEWER.DASHBOARD,
        actionLabel: "Xem assignment",
        bullets: [
          "Mở paper được phân công để xem metadata, file và review criteria.",
          "Dùng briefing/AI hỗ trợ đọc nhanh nếu màn hình này được bật.",
          "Ghi chú điểm mạnh, điểm yếu, câu hỏi và rủi ro kỹ thuật trước khi chấm.",
        ],
      },
      {
        title: "Gửi review và cập nhật sau rebuttal",
        image: "/onboarding/reviewer/04-review-form.png",
        href: ROUTES.REVIEWER.COMPLETED,
        actionLabel: "Review đã hoàn thành",
        bullets: [
          "Chấm điểm từng tiêu chí, recommendation và confidence nhất quán với nhận xét.",
          "Viết strengths/weaknesses cụ thể, tránh nhận xét quá ngắn như “good paper”.",
          "Sau rebuttal, đọc phản hồi của Author và cập nhật score nếu cần.",
        ],
      },
    ],
  },
}

const ROLE_THEMES: Record<
  TutorialRole,
  {
    accent: string
    accentSoft: string
    ring: string
    panel: string
    step: string
  }
> = {
  chair: {
    accent: "#1B3C53",
    accentSoft: "bg-slate-50 text-slate-700 border-slate-200",
    ring: "ring-slate-200",
    panel: "from-white via-white to-slate-50",
    step: "bg-[#1B3C53]",
  },
  author: {
    accent: "#0f766e",
    accentSoft: "bg-teal-50 text-teal-700 border-teal-100",
    ring: "ring-teal-100",
    panel: "from-white via-white to-teal-50/30",
    step: "bg-teal-700",
  },
  reviewer: {
    accent: "#b45309",
    accentSoft: "bg-amber-50 text-amber-800 border-amber-100",
    ring: "ring-amber-100",
    panel: "from-white via-white to-amber-50/30",
    step: "bg-amber-700",
  },
}

const QUICK_START_STEPS = [
  { icon: "login", label: "Đăng nhập", detail: "Dùng tài khoản đã được cấp quyền." },
  { icon: "switch_account", label: "Chọn vai trò", detail: "Author, Reviewer hoặc Chair." },
  { icon: "dashboard", label: "Mở dashboard", detail: "Bắt đầu từ màn hình chính của vai trò." },
  {
    icon: "task_alt",
    label: "Làm theo checklist",
    detail: "Hoàn thành từng bước có ảnh minh họa.",
  },
]

const RUNBOOK_STAGES = [
  { label: "Mở nhận bài", detail: "Chair mở hội nghị", role: "chair" as TutorialRole },
  { label: "Nộp bài", detail: "Author gửi submission", role: "author" as TutorialRole },
  { label: "Phản biện", detail: "Reviewer gửi review", role: "reviewer" as TutorialRole },
  { label: "Quyết định", detail: "Chair công bố kết quả", role: "chair" as TutorialRole },
]

function getDefaultTutorialRole(currentRole: UserRole | null): TutorialRole {
  if (currentRole === "author" || currentRole === "reviewer" || currentRole === "chair") {
    return currentRole
  }
  return "chair"
}

function ScreenshotFrame({ src, alt, role }: { src: string; alt: string; role: TutorialRole }) {
  const [isAvailable, setIsAvailable] = useState(true)
  const theme = ROLE_THEMES[role]

  useEffect(() => {
    setIsAvailable(true)
  }, [src])

  if (!isAvailable) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[8px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <div>
          <span className="material-symbols-outlined text-3xl text-slate-400">image</span>
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Ảnh chụp thật sẽ hiển thị tại đây khi thêm tệp:
          </p>
          <code className="mt-1 block break-all text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {src}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group/screen onboarding-glint relative overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm ring-1 ${theme.ring} transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950`}
    >
      <div className="flex h-8 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          ConferenceSpace
        </span>
      </div>
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={1050}
        loading="lazy"
        className="aspect-[16/9] w-full bg-slate-100 object-cover object-top transition duration-500 group-hover/screen:scale-[1.01] dark:bg-neutral-900"
        onError={() => setIsAvailable(false)}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/18 to-transparent opacity-0 transition duration-500 group-hover/screen:opacity-100" />
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isAuthenticated, isAuthLoading, currentRole } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const defaultRole = useMemo(() => getDefaultTutorialRole(currentRole), [currentRole])
  const [activeRole, setActiveRole] = useState<TutorialRole>(defaultRole)
  const sidebarRole = currentRole ?? defaultRole

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
    }
  }, [isAuthLoading, isAuthenticated, router])

  useEffect(() => {
    setActiveRole(defaultRole)
  }, [defaultRole])

  if (isAuthLoading || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#f8fafc] font-sans text-slate-800 dark:bg-[#191919] dark:text-white md:flex-row">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes onboarding-fade-up {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes onboarding-line {
              from { transform: scaleY(0); }
              to { transform: scaleY(1); }
            }
            @keyframes onboarding-glint {
              0%, 72% { transform: translateX(-120%); opacity: 0; }
              82% { opacity: 0.16; }
              100% { transform: translateX(120%); opacity: 0; }
            }
            .onboarding-enter {
              animation: onboarding-fade-up 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .onboarding-ledger {
              background-image:
                linear-gradient(to right, rgba(15, 23, 42, 0.055) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
              background-size: 28px 28px;
            }
            .onboarding-line {
              transform-origin: top;
              animation: onboarding-line 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .onboarding-glint::after {
              content: "";
              position: absolute;
              inset: 0;
              background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.8), transparent 65%);
              animation: onboarding-glint 5200ms ease-in-out infinite;
              pointer-events: none;
            }
            @media (prefers-reduced-motion: reduce) {
              .onboarding-enter,
              .onboarding-line,
              .onboarding-glint::after {
                animation: none;
              }
              .onboarding-enter {
                opacity: 1;
                transform: none;
              }
            }
            @media (max-width: 640px) {
              button[data-chatbot-ui="true"] {
                bottom: 1rem !important;
                right: 1rem !important;
                height: 2.75rem !important;
                width: 2.75rem !important;
              }
            }
          `,
        }}
      />
      <DashboardSidebar menuItems={getSidebarMenuItems(sidebarRole, unreadCount)} />

      <main className="flex h-screen flex-grow flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto onboarding-ledger px-5 py-6 pb-24 sm:px-8 md:px-12 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <section className="onboarding-enter overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="p-5 sm:p-7">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1B3C53] dark:text-slate-200">
                    <span className="material-symbols-outlined text-base">route</span>
                    Hướng dẫn sử dụng
                  </div>
                  <h1 className="mt-3 max-w-4xl text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">
                    Hướng dẫn nhanh theo vai trò trong ConferenceSpace
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Chọn vai trò để xem từng bước sử dụng ConferenceSpace, từ màn hình đầu tiên đến
                    thao tác cuối cùng trong quy trình.
                  </p>

                  <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {QUICK_START_STEPS.map((item, index) => (
                      <div
                        key={item.label}
                        className="rounded-[8px] border border-slate-200 bg-slate-50/80 p-3 transition duration-200 hover:border-slate-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/70"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#1B3C53] shadow-sm dark:bg-neutral-900 dark:text-slate-100">
                            <span className="material-symbols-outlined text-base">{item.icon}</span>
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-[#102A43] p-5 text-white dark:border-neutral-800 lg:border-l lg:border-t-0 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                        Quy trình hội nghị
                      </p>
                      <h2 className="mt-2 text-lg font-black leading-tight">
                        Từ mở hội nghị đến quyết định
                      </h2>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-white/10">
                      <span className="material-symbols-outlined text-2xl">account_tree</span>
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {RUNBOOK_STAGES.map((stage, index) => {
                      const stageTheme = ROLE_THEMES[stage.role]
                      const isActiveStage = activeRole === stage.role

                      return (
                        <button
                          key={`${stage.label}-${index}`}
                          type="button"
                          onClick={() => setActiveRole(stage.role)}
                          className={`group/stage relative flex w-full items-center gap-3 rounded-[8px] border p-3 text-left transition duration-300 ${
                            isActiveStage
                              ? "border-white/35 bg-white text-slate-950 shadow-lg"
                              : "border-white/15 bg-white/[0.07] text-white hover:border-white/30 hover:bg-white/[0.12]"
                          }`}
                        >
                          {index < RUNBOOK_STAGES.length - 1 && (
                            <span
                              className="onboarding-line absolute left-[27px] top-[calc(100%-2px)] h-5 w-px bg-white/25"
                              style={{ animationDelay: `${index * 120}ms` }}
                            />
                          )}
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                            style={{ backgroundColor: stageTheme.accent }}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-black">{stage.label}</span>
                            <span
                              className={`mt-0.5 block text-xs leading-5 ${
                                isActiveStage ? "text-slate-500" : "text-slate-300"
                              }`}
                            >
                              {stage.detail}
                            </span>
                          </span>
                          <span className="material-symbols-outlined text-base opacity-70 transition duration-200 group-hover/stage:translate-x-0.5">
                            arrow_forward
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 rounded-[8px] border border-white/15 bg-white/[0.08] p-3">
                    <p className="text-xs font-bold leading-5 text-slate-100">
                      Gợi ý: bắt đầu với vai trò hiện tại của bạn. Sau đó xem thêm vai trò khác để
                      hiểu toàn bộ quy trình làm việc.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Tabs
              value={activeRole}
              onValueChange={(value) => setActiveRole(value as TutorialRole)}
              className="gap-5"
              id="onboarding-journey"
            >
              <div className="sticky top-0 z-20 flex flex-col gap-3 rounded-[8px] border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 sm:flex-row sm:items-center sm:justify-between">
                <div className="hidden px-2 sm:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Chọn hướng dẫn
                  </p>
                </div>
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-[8px] bg-slate-100 p-1 dark:bg-neutral-950 sm:w-fit">
                  {(Object.keys(TUTORIALS) as TutorialRole[]).map((role) => (
                    <TabsTrigger
                      key={role}
                      value={role}
                      className="gap-2 rounded-[7px] px-3 py-2.5 text-xs font-black transition duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-white sm:px-5"
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{
                          color: activeRole === role ? ROLE_THEMES[role].accent : undefined,
                        }}
                      >
                        {TUTORIALS[role].icon}
                      </span>
                      {TUTORIALS[role].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {(Object.keys(TUTORIALS) as TutorialRole[]).map((role) => {
                const tutorial = TUTORIALS[role]

                return (
                  <TabsContent key={role} value={role} className="mt-0 onboarding-enter">
                    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
                      <div className="min-w-0">
                        <div
                          className={`mb-5 overflow-hidden rounded-[8px] border border-slate-200 bg-gradient-to-br p-5 shadow-sm dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 sm:p-6 ${ROLE_THEMES[role].panel}`}
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${ROLE_THEMES[role].accentSoft}`}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {tutorial.icon}
                                </span>
                                {tutorial.eyebrow}
                              </span>
                              <h2 className="mt-3 max-w-3xl text-xl font-black leading-tight text-slate-950 dark:text-white md:text-2xl">
                                {tutorial.title}
                              </h2>
                              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {tutorial.summary}
                              </p>
                            </div>
                            <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[240px]">
                              <div className="rounded-[8px] border border-white bg-white/85 px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                                <p className="text-2xl font-black text-slate-950 dark:text-white">
                                  {tutorial.steps.length}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  bước
                                </p>
                              </div>
                              <div className="rounded-[8px] border border-white bg-white/85 px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                                <p className="text-2xl font-black text-slate-950 dark:text-white">
                                  {tutorial.checkpoints.length}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  kiểm tra
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 rounded-[8px] border border-slate-200 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                              Bạn sẽ biết
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                              {tutorial.outcome}
                            </p>
                          </div>
                        </div>

                        <div className="relative space-y-5 before:absolute before:left-5 before:top-8 before:hidden before:h-[calc(100%-4rem)] before:w-px before:bg-slate-200 dark:before:bg-neutral-800 md:before:block">
                          {tutorial.steps.map((step, index) => (
                            <Card
                              key={step.title}
                              className="group/step onboarding-enter overflow-hidden rounded-[8px] border-slate-200 bg-white py-0 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                              style={{ animationDelay: `${index * 90}ms` }}
                            >
                              <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(430px,1.1fr)]">
                                <div className="flex flex-col gap-4 p-5 sm:p-6">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ${ROLE_THEMES[role].step}`}
                                    >
                                      {index + 1}
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                        Màn hình {index + 1}
                                      </p>
                                      <h3 className="mt-1 text-base font-black leading-tight text-slate-950 dark:text-white md:text-lg">
                                        {step.title}
                                      </h3>
                                    </div>
                                  </div>

                                  <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {step.bullets.map((bullet) => (
                                      <li key={bullet} className="flex gap-2">
                                        <span className="material-symbols-outlined mt-0.5 text-base text-emerald-600">
                                          check_circle
                                        </span>
                                        <span>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  <Button
                                    asChild
                                    variant="outline"
                                    className="mt-auto w-fit rounded-[8px] bg-white transition duration-300 group-hover/step:border-slate-400 dark:bg-neutral-950"
                                  >
                                    <Link href={step.href}>
                                      {step.actionLabel}
                                      <span className="material-symbols-outlined text-base">
                                        arrow_forward
                                      </span>
                                    </Link>
                                  </Button>
                                </div>

                                <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950 xl:border-l xl:border-t-0">
                                  <ScreenshotFrame src={step.image} alt={step.title} role={role} />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <aside className="h-fit rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[8px] text-white shadow-lg"
                          style={{ backgroundColor: ROLE_THEMES[role].accent }}
                        >
                          <span className="material-symbols-outlined text-2xl">
                            {tutorial.icon}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white md:text-lg">
                          Chuẩn bị trước khi bắt đầu
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          Kiểm tra nhanh để tránh đi sai flow hoặc thiếu dữ liệu ở bước sau.
                        </p>

                        <div className="my-5 h-px bg-slate-200 dark:bg-neutral-800" />

                        <h4 className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                          <span className="material-symbols-outlined text-lg text-[#1B3C53]">
                            checklist
                          </span>
                          Cần chuẩn bị
                        </h4>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {tutorial.checkpoints.map((checkpoint) => (
                            <li key={checkpoint} className="flex gap-2">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: ROLE_THEMES[role].accent }}
                              />
                              <span>{checkpoint}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          asChild
                          className="mt-5 w-full rounded-[8px] text-white hover:opacity-90"
                          style={{ backgroundColor: ROLE_THEMES[role].accent }}
                        >
                          <Link href={tutorial.steps[0]?.href ?? ROUTES.ROLE_SELECT}>
                            Mở màn hình đầu tiên
                            <span className="material-symbols-outlined text-base">
                              arrow_forward
                            </span>
                          </Link>
                        </Button>
                      </aside>
                    </section>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
