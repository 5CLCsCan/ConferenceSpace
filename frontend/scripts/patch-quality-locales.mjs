#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const FRONTEND_ROOT = path.resolve(process.cwd())
const EN_PATH = path.join(FRONTEND_ROOT, "locales", "en.json")
const VI_PATH = path.join(FRONTEND_ROOT, "locales", "vi.json")

const patches = {
  en: {
    app: { name: "ConferenceSpace" },
    common: {
      errors: {
        unexpected: "An unexpected error occurred. Please try again.",
        failedToLoadConference: "Failed to load conference",
        failedToLoadSubmissions: "Failed to load submissions",
        failedToLoadRebuttal: "Failed to load rebuttal",
        failedToLoadDiscussions: "Failed to load discussions",
        failedToLoadCompletedReviews: "Failed to load completed reviews",
        failedToLoadDashboard: "Failed to load dashboard",
        failedToLoadSettings: "Failed to load settings",
        failedToLoadSubmission: "Failed to load submission",
        failedToLoadDates: "Failed to load dates",
        failedToLoadCfp: "Failed to load call for papers",
        failedToLoadCoi: "Failed to load conflict of interest data",
        failedToLoadOverview: "Failed to load overview",
        failedToLoadSuggestions: "Failed to load suggestions",
        failedToLoadAssignments: "Failed to load confirmed assignments",
        failedToLoadReview: "Failed to load review",
        invalidDiscussionContext: "Invalid discussion context",
        unableToSubmit: "Unable to submit due to an unknown error.",
        conferenceNotAccepting: "This conference is not currently accepting submissions. Please submit during the open phase.",
        precheckFailed: "Precheck failed",
        autosaveFailed: "Autosave failed",
        unsavedChanges: "Unsaved changes",
        submissionSuccess: "Your paper has been submitted successfully!",
        finalSubmitBlocked: "Final submit is blocked until precheck decision is Accept for Review.",
        reviewAuditIncomplete: "Review audit could not be completed.",
        noDataReturned: "No data returned from server",
        retry: "Try again",
      },
      emptyStates: {
        author: {
          myConferences: {
            title: "No submissions yet",
            description:
              "You haven't submitted any papers yet. Explore conferences and submit your research.",
          },
          explore: {
            title: "No conferences to explore",
            description: "There are no open conferences available at this time.",
          },
          archived: {
            title: "No archived submissions",
            description: "Your past submissions and completed conferences will appear here.",
          },
        },
      },
      dataTable: {
        empty: "No data available",
        loading: "Loading...",
      },
      time: {
        justNow: "Just now",
      },
      notifications: {
        newCount: "{count} new",
      },
      roles: {
        author: "Author",
        chair: "Chair",
        reviewer: "Reviewer",
      },
    },
    dashboard: {
      onboarding: {
        page: {
          eyebrow: "User Guide",
          title: "Quick role-based guide in ConferenceSpace",
          description:
            "Choose a role to walk through ConferenceSpace step by step, from the first screen to the final action in each workflow.",
          screenshotPlaceholder: "A real screenshot will appear here when the file is added:",
          stepsLabel: "steps",
          checkpointsLabel: "checks",
          youWillLearn: "You will learn",
          screenLabel: "Screen {number}",
          prepareTitle: "Prepare before you start",
          prepareDescription:
            "Run through this quick checklist to avoid wrong flows or missing data in later steps.",
          prepareChecklist: "What to prepare",
          openFirstScreen: "Open first screen",
          selectGuide: "Select a guide",
          workflowTitle: "Conference workflow",
          workflowSubtitle: "From opening to decision",
          tip: "Tip: start with your current role, then explore other roles to understand the full workflow.",
          brandLabel: "ConferenceSpace",
        },
        quickStart: [
          { label: "Sign in", detail: "Use an account with the right role permissions." },
          { label: "Choose a role", detail: "Author, Reviewer, or Chair." },
          { label: "Open dashboard", detail: "Start from the main screen for your role." },
          {
            label: "Follow the checklist",
            detail: "Complete each illustrated step in order.",
          },
        ],
        runbook: [
          { label: "Open submissions", detail: "Chair opens the conference" },
          { label: "Submit paper", detail: "Author sends a submission" },
          { label: "Review", detail: "Reviewer submits a review" },
          { label: "Decision", detail: "Chair publishes the outcome" },
        ],
        roles: {
          chair: {
            label: "Chair",
            eyebrow: "Conference management",
            title: "Run a conference from CFP setup to final decisions",
            summary:
              "For conference managers: create conferences, configure deadlines, invite the committee, track submissions, assign reviewers, and make decisions.",
            outcome:
              "After 4 steps, you will know how to open a conference, prepare reviewers, and make timely decisions.",
            checkpoints: [
              "An account with Chair or PC permissions.",
              "Conference details ready: tracks, topics, and deadlines.",
              "Reviewers and committee members invited before running assignments.",
            ],
            steps: [
              {
                title: "Open the Chair dashboard",
                actionLabel: "Open dashboard",
                bullets: [
                  "Check conference, submission, review, and open deadline counts.",
                  "Use recent conferences to return to active work.",
                  "If you are new, move on to creating a conference.",
                ],
              },
              {
                title: "Create a conference and configure the CFP",
                actionLabel: "Create conference",
                bullets: [
                  "Enter name, acronym, description, conference type, and venue.",
                  "Add topics and tracks for paper classification and reviewer matching.",
                  "Review policy, review type, and deadlines before publishing.",
                ],
              },
              {
                title: "Invite the committee and assign reviewers",
                actionLabel: "Open conferences",
                bullets: [
                  "Invite reviewers by email and wait for accepted invitations when required.",
                  "Open submissions/assignments to run suggestions or auto-assign.",
                  "Always open Match Details to review keyword fit, workload, and COI before confirming.",
                ],
              },
              {
                title: "Track reviews and make decisions",
                actionLabel: "Manage conferences",
                bullets: [
                  "Monitor submitted reviews, overdue reviewers, and open discussions.",
                  "Open rebuttal if the conference has an author response round.",
                  "Commit accept/reject only after checking reviews, COI, and camera-ready requirements.",
                ],
              },
            ],
          },
          author: {
            label: "Author",
            eyebrow: "Submissions",
            title: "Submit papers and track the full submission lifecycle",
            summary:
              "For authors: find open conferences, submit papers, edit or withdraw, read reviews, send rebuttals, and upload camera-ready files.",
            outcome:
              "After 4 steps, you will know how to choose a conference, submit a paper, and track outcomes through camera-ready.",
            checkpoints: [
              "An Author account with relevant expertise domains.",
              "Title, abstract, keywords, co-authors, and a valid PDF ready.",
              "A conference that is still open for submission or camera-ready.",
            ],
            steps: [
              {
                title: "Find an open conference",
                actionLabel: "Open conferences",
                bullets: [
                  "Browse conferences and check submission status.",
                  "Open conference details to read tracks, topics, deadlines, and policy.",
                  "Start a submission only while the full paper deadline is open.",
                ],
              },
              {
                title: "Create a new submission",
                actionLabel: "New submission",
                bullets: [
                  "Enter title, abstract, keywords, and the right track.",
                  "Add co-authors and declare conflicts of interest when needed.",
                  "Upload a valid PDF and run precheck/autofill if AI features are enabled.",
                ],
              },
              {
                title: "Manage your submission",
                actionLabel: "My submissions",
                bullets: [
                  "Track draft, submitted, under review, rebuttal, or decision status.",
                  "Edit or withdraw while the system still allows it under deadline rules.",
                  "Open submission details for notifications, discussion, and published reviews.",
                ],
              },
              {
                title: "Send a rebuttal or camera-ready file",
                actionLabel: "Track outcomes",
                bullets: [
                  "Read reviews carefully before writing a point-by-point rebuttal.",
                  "After acceptance, check camera-ready requirements and upload the final file.",
                  "Watch notifications so you do not miss response deadlines.",
                ],
              },
            ],
          },
          reviewer: {
            label: "Reviewer",
            eyebrow: "Peer review",
            title: "Accept invitations, read papers, and submit quality reviews",
            summary:
              "For reviewers: accept or decline invitations, open assignments, use reading support, score papers, and update after rebuttal.",
            outcome:
              "After 4 steps, you will know how to accept invitations, read assignments, and submit high-quality reviews.",
            checkpoints: [
              "Your account email must match the address the Chair invited.",
              "Update expertise domains so matching works better.",
              "Accept only when you have expertise, time, and no conflict of interest.",
            ],
            steps: [
              {
                title: "Open the Reviewer dashboard",
                actionLabel: "Open dashboard",
                bullets: [
                  "Check new invitations, pending assignments, and nearest deadlines.",
                  "Respond to invitations first so the Chair knows your availability.",
                  "Use the dashboard to return to incomplete reviews.",
                ],
              },
              {
                title: "Accept or decline invitations",
                actionLabel: "View invitations",
                bullets: [
                  "Read conference details, paper summary, deadline, and any COI warnings.",
                  "Accept when the topic fits and there is no conflict.",
                  "Decline with a clear reason if you are unavailable, off-topic, or conflicted.",
                ],
              },
              {
                title: "Read the assignment and briefing",
                actionLabel: "View assignments",
                bullets: [
                  "Open the assigned paper to see metadata, files, and review criteria.",
                  "Use briefing or AI reading support when available.",
                  "Note strengths, weaknesses, questions, and technical risks before scoring.",
                ],
              },
              {
                title: "Submit a review and update after rebuttal",
                actionLabel: "Completed reviews",
                bullets: [
                  "Score each criterion with recommendation and confidence aligned to your comments.",
                  "Write specific strengths and weaknesses instead of vague praise.",
                  "After rebuttal, read the author response and update your score if needed.",
                ],
              },
            ],
          },
        },
      },
      wizard: {
        topicsDeadlines: {
          description:
            "Define the thematic scope and critical submission dates for your conference.",
          topicsTooltip:
            "Topics tag submissions and help match reviewers. They help authors categorize work and support qualified reviewer assignment.",
          tracksTooltip:
            "Tracks are thematic streams within your conference. Authors choose a track when submitting, and reviews stay within that track.",
          datesTooltip:
            "Set key dates for the review process. All times default to 23:59 AoE (Anywhere on Earth).",
        },
        policyGuidelines: {
          formattingTooltip:
            "Define formatting and length requirements for paper submissions.",
          screeningTooltip:
            "Define deterministic submission screening rules and an optional advisory AI steering prompt.",
          blindReviewTooltip:
            "Configure blind review and conflict of interest policies.",
          supplementaryTooltip:
            "Configure additional materials authors can submit alongside papers.",
        },
      },
      profile: {
        saving: "Saving...",
        saveChanges: "Save changes",
      },
      copilot: {
        generate: "Generate",
        regenerate: "Regenerate",
        generating: "Generating...",
      },
      author: {
        submit: {
          uploading: "Uploading...",
          replaceFile: "Replace File",
          uploadPdf: "Upload PDF",
        },
      },
      reviewer: {
        rebuttal: {
          openingDiscussion: "Opening discussion...",
          discussionOpen: "Discussion is open for this conference.",
          unacknowledged: "{count, plural, one {# point unacknowledged} other {# points unacknowledged}}",
          hide: "Hide",
          update: "Update",
        },
        completedReviews: {
          loadError: "We couldn't load your completed reviews. Please try again.",
          missingReviewer: "Reviewer information is unavailable.",
        },
        dashboard: {
          loadError: "We couldn't load your dashboard. Please try again.",
        },
      },
      discussion: {
        attachFile: "Attach file",
        uploading: "Uploading…",
        close: "Close",
        attachNotAvailable: "File attachments are not available yet",
        linkNotAvailable: "Link insertion is not available yet",
        mathNotAvailable: "Math notation is not available yet",
      },
    },
  },
  vi: {
    app: { name: "ConferenceSpace" },
    common: {
      errors: {
        unexpected: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.",
        failedToLoadConference: "Không thể tải hội nghị",
        failedToLoadSubmissions: "Không thể tải danh sách bài nộp",
        failedToLoadRebuttal: "Không thể tải phản hồi",
        failedToLoadDiscussions: "Không thể tải thảo luận",
        failedToLoadCompletedReviews: "Không thể tải review đã hoàn thành",
        failedToLoadDashboard: "Không thể tải bảng điều khiển",
        failedToLoadSettings: "Không thể tải cài đặt",
        failedToLoadSubmission: "Không thể tải bài nộp",
        failedToLoadDates: "Không thể tải mốc thời gian",
        failedToLoadCfp: "Không thể tải thông báo mời bài",
        failedToLoadCoi: "Không thể tải dữ liệu xung đột lợi ích",
        failedToLoadOverview: "Không thể tải tổng quan",
        failedToLoadSuggestions: "Không thể tải gợi ý phản biện",
        failedToLoadAssignments: "Không thể tải phân công đã xác nhận",
        failedToLoadReview: "Không thể tải bài phản biện",
        invalidDiscussionContext: "Ngữ cảnh thảo luận không hợp lệ",
        unableToSubmit: "Không thể nộp bài do lỗi không xác định.",
        conferenceNotAccepting: "Hội nghị hiện không nhận bài. Vui lòng nộp trong giai đoạn mở.",
        precheckFailed: "Kiểm tra trước thất bại",
        autosaveFailed: "Tự động lưu thất bại",
        unsavedChanges: "Có thay đổi chưa lưu",
        submissionSuccess: "Bài của bạn đã được nộp thành công!",
        finalSubmitBlocked:
          "Không thể nộp chính thức cho đến khi kết quả kiểm tra trước là Chấp nhận phản biện.",
        reviewAuditIncomplete: "Không thể hoàn tất kiểm tra chất lượng phản biện.",
        noDataReturned: "Máy chủ không trả về dữ liệu",
        retry: "Thử lại",
      },
      emptyStates: {
        author: {
          myConferences: {
            title: "Chưa có bài nộp",
            description:
              "Bạn chưa nộp bài nào. Khám phá hội nghị và gửi nghiên cứu của bạn.",
          },
          explore: {
            title: "Không có hội nghị để khám phá",
            description: "Hiện không có hội nghị nào đang mở.",
          },
          archived: {
            title: "Chưa có bài nộp lưu trữ",
            description: "Các bài nộp và hội nghị đã hoàn tất sẽ hiển thị tại đây.",
          },
        },
      },
      dataTable: {
        empty: "Không có dữ liệu",
        loading: "Đang tải...",
      },
      time: {
        justNow: "Vừa xong",
      },
      notifications: {
        newCount: "{count} mới",
      },
      roles: {
        author: "Tác giả",
        chair: "Chủ trì",
        reviewer: "Phản biện",
      },
    },
    dashboard: {
      onboarding: {
        page: {
          eyebrow: "Hướng dẫn sử dụng",
          title: "Hướng dẫn nhanh theo vai trò trong ConferenceSpace",
          description:
            "Chọn vai trò để xem từng bước sử dụng ConferenceSpace, từ màn hình đầu tiên đến thao tác cuối cùng trong quy trình.",
          screenshotPlaceholder: "Ảnh chụp thật sẽ hiển thị tại đây khi thêm tệp:",
          stepsLabel: "bước",
          checkpointsLabel: "kiểm tra",
          youWillLearn: "Bạn sẽ biết",
          screenLabel: "Màn hình {number}",
          prepareTitle: "Chuẩn bị trước khi bắt đầu",
          prepareDescription:
            "Kiểm tra nhanh để tránh đi sai flow hoặc thiếu dữ liệu ở bước sau.",
          prepareChecklist: "Cần chuẩn bị",
          openFirstScreen: "Mở màn hình đầu tiên",
          selectGuide: "Chọn hướng dẫn",
          workflowTitle: "Quy trình hội nghị",
          workflowSubtitle: "Từ mở hội nghị đến quyết định",
          tip: "Gợi ý: bắt đầu với vai trò hiện tại của bạn. Sau đó xem thêm vai trò khác để hiểu toàn bộ quy trình làm việc.",
          brandLabel: "ConferenceSpace",
        },
        quickStart: [
          { label: "Đăng nhập", detail: "Dùng tài khoản đã được cấp quyền." },
          { label: "Chọn vai trò", detail: "Tác giả, Phản biện hoặc Chủ trì." },
          { label: "Mở dashboard", detail: "Bắt đầu từ màn hình chính của vai trò." },
          {
            label: "Làm theo checklist",
            detail: "Hoàn thành từng bước có ảnh minh họa.",
          },
        ],
        runbook: [
          { label: "Mở nhận bài", detail: "Chủ trì mở hội nghị" },
          { label: "Nộp bài", detail: "Tác giả gửi bài nộp" },
          { label: "Phản biện", detail: "Phản biện gửi review" },
          { label: "Quyết định", detail: "Chủ trì công bố kết quả" },
        ],
        roles: {
          chair: {
            label: "Chủ trì",
            eyebrow: "Quản lý hội nghị",
            title: "Điều phối hội nghị từ tạo CFP đến quyết định cuối",
            summary:
              "Dành cho người quản lý hội nghị: tạo hội nghị, cấu hình deadline, mời committee, theo dõi submission, phân công reviewer và ra quyết định.",
            outcome:
              "Sau 4 bước, Chủ trì biết cách mở hội nghị, chuẩn bị reviewer và ra quyết định đúng thời điểm.",
            checkpoints: [
              "Có tài khoản được cấp quyền Chủ trì hoặc PC.",
              "Chuẩn bị thông tin hội nghị, track, topic và deadline.",
              "Có reviewer/committee để mời trước khi chạy assignment.",
            ],
            steps: [
              {
                title: "Mở dashboard Chủ trì",
                actionLabel: "Mở dashboard",
                bullets: [
                  "Kiểm tra số lượng hội nghị, submission, review và deadline đang mở.",
                  "Dùng danh sách hội nghị gần đây để quay lại hội nghị đang xử lý.",
                  "Nếu mới bắt đầu, chuyển sang bước tạo hội nghị mới.",
                ],
              },
              {
                title: "Tạo hội nghị và cấu hình CFP",
                actionLabel: "Tạo hội nghị",
                bullets: [
                  "Nhập tên, acronym, mô tả, loại hội nghị và nền tảng tổ chức.",
                  "Thêm topics/tracks vì dữ liệu này dùng cho phân loại paper và matching reviewer.",
                  "Kiểm tra policy, review type và deadline trước khi publish.",
                ],
              },
              {
                title: "Mời committee và phân công reviewer",
                actionLabel: "Mở danh sách hội nghị",
                bullets: [
                  "Mời reviewer bằng email, đợi trạng thái invitation được accept nếu flow yêu cầu.",
                  "Mở tab submissions/assignments để chạy suggested reviewers hoặc auto-assign.",
                  "Luôn mở Match Details để xem keyword match, workload và COI trước khi confirm.",
                ],
              },
              {
                title: "Theo dõi review và ra quyết định",
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
            label: "Tác giả",
            eyebrow: "Nộp bài",
            title: "Nộp bài và theo dõi toàn bộ vòng đời submission",
            summary:
              "Dành cho tác giả: tìm hội nghị đang mở, nộp paper, chỉnh sửa/rút bài, đọc review, gửi rebuttal và nộp camera-ready.",
            outcome:
              "Sau 4 bước, Tác giả biết cách chọn hội nghị, nộp paper và theo dõi kết quả đến camera-ready.",
            checkpoints: [
              "Có tài khoản Tác giả với domain chuyên môn phù hợp.",
              "Chuẩn bị title, abstract, keywords, co-author và file PDF hợp lệ.",
              "Chọn hội nghị còn hạn nhận bài hoặc còn mở vòng camera-ready.",
            ],
            steps: [
              {
                title: "Tìm hội nghị đang mở",
                actionLabel: "Mở hội nghị",
                bullets: [
                  "Xem danh sách hội nghị và kiểm tra trạng thái nhận bài.",
                  "Mở chi tiết hội nghị để đọc track, topics, deadline và policy.",
                  "Chỉ bắt đầu submission khi conference còn mở full paper deadline.",
                ],
              },
              {
                title: "Tạo submission mới",
                actionLabel: "Nộp bài mới",
                bullets: [
                  "Nhập title, abstract, keywords và chọn track phù hợp.",
                  "Thêm co-author và khai báo conflict of interest nếu có.",
                  "Upload PDF hợp lệ rồi chạy precheck/autofill nếu tính năng AI đang hoạt động.",
                ],
              },
              {
                title: "Quản lý submission",
                actionLabel: "Bài nộp của tôi",
                bullets: [
                  "Theo dõi trạng thái draft, submitted, under review, rebuttal hoặc decision.",
                  "Sửa hoặc rút bài khi hệ thống còn cho phép theo deadline.",
                  "Mở chi tiết submission để xem thông báo, discussion và review khi được công bố.",
                ],
              },
              {
                title: "Gửi rebuttal hoặc camera-ready",
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
            label: "Phản biện",
            eyebrow: "Phản biện",
            title: "Nhận lời mời, đọc bài và gửi review có chất lượng",
            summary:
              "Dành cho reviewer: nhận/decline invitation, xem assignment, dùng briefing hỗ trợ đọc bài, chấm điểm và cập nhật sau rebuttal.",
            outcome:
              "Sau 4 bước, Phản biện biết cách nhận lời mời, đọc assignment và gửi review đủ chất lượng.",
            checkpoints: [
              "Email tài khoản phải trùng email được Chủ trì mời.",
              "Domain chuyên môn nên được cập nhật để matching chính xác hơn.",
              "Chỉ accept khi đủ chuyên môn, còn thời gian và không có COI.",
            ],
            steps: [
              {
                title: "Mở dashboard Phản biện",
                actionLabel: "Mở dashboard",
                bullets: [
                  "Kiểm tra invitation mới, assignment đang chờ review và deadline gần nhất.",
                  "Ưu tiên xử lý lời mời trước để Chủ trì biết reviewer có tham gia hay không.",
                  "Dùng dashboard để quay lại các review chưa hoàn tất.",
                ],
              },
              {
                title: "Accept hoặc decline invitation",
                actionLabel: "Xem lời mời",
                bullets: [
                  "Đọc conference, paper summary, deadline và cảnh báo COI nếu có.",
                  "Accept khi phù hợp chuyên môn và không có conflict.",
                  "Decline với lý do rõ ràng nếu bận, lệch chuyên môn hoặc có xung đột lợi ích.",
                ],
              },
              {
                title: "Đọc assignment và briefing",
                actionLabel: "Xem assignment",
                bullets: [
                  "Mở paper được phân công để xem metadata, file và review criteria.",
                  "Dùng briefing/AI hỗ trợ đọc nhanh nếu màn hình này được bật.",
                  "Ghi chú điểm mạnh, điểm yếu, câu hỏi và rủi ro kỹ thuật trước khi chấm.",
                ],
              },
              {
                title: "Gửi review và cập nhật sau rebuttal",
                actionLabel: "Review đã hoàn thành",
                bullets: [
                  "Chấm điểm từng tiêu chí, recommendation và confidence nhất quán với nhận xét.",
                  "Viết strengths/weaknesses cụ thể, tránh nhận xét quá ngắn như “good paper”.",
                  "Sau rebuttal, đọc phản hồi của Tác giả và cập nhật score nếu cần.",
                ],
              },
            ],
          },
        },
      },
      wizard: {
        topicsDeadlines: {
          description:
            "Xác định phạm vi chủ đề và các mốc nộp bài quan trọng cho hội nghị.",
          topicsTooltip:
            "Chủ đề gắn thẻ bài nộp và hỗ trợ ghép phản biện. Chúng giúp tác giả phân loại bài và hỗ trợ phân công phản biện phù hợp.",
          tracksTooltip:
            "Track là các luồng chủ đề trong hội nghị. Tác giả chọn track khi nộp bài và bài được phản biện trong track đó.",
          datesTooltip:
            "Đặt các mốc quan trọng cho quy trình phản biện. Mặc định tất cả thời gian là 23:59 AoE (Anywhere on Earth).",
        },
        policyGuidelines: {
          formattingTooltip: "Xác định yêu cầu định dạng và độ dài cho bài nộp.",
          screeningTooltip:
            "Xác định quy tắc sàng lọc bài nộp và prompt AI tư vấn tùy chọn.",
          blindReviewTooltip:
            "Cấu hình phản biện kín danh và chính sách xung đột lợi ích.",
          supplementaryTooltip:
            "Cấu hình tài liệu bổ sung tác giả có thể nộp kèm bài.",
        },
      },
      profile: {
        saving: "Đang lưu...",
        saveChanges: "Lưu thay đổi",
      },
      copilot: {
        generate: "Tạo",
        regenerate: "Tạo lại",
        generating: "Đang tạo...",
      },
      author: {
        submit: {
          uploading: "Đang tải lên...",
          replaceFile: "Thay tệp",
          uploadPdf: "Tải PDF lên",
        },
      },
      reviewer: {
        rebuttal: {
          openingDiscussion: "Đang mở thảo luận...",
          discussionOpen: "Thảo luận đã mở cho hội nghị này.",
          unacknowledged: "{count} điểm chưa xác nhận",
          hide: "Ẩn",
          update: "Cập nhật",
        },
        completedReviews: {
          loadError: "Không thể tải review đã hoàn thành. Vui lòng thử lại.",
          missingReviewer: "Không có thông tin phản biện.",
        },
        dashboard: {
          loadError: "Không thể tải bảng điều khiển. Vui lòng thử lại.",
        },
      },
      discussion: {
        attachFile: "Đính kèm tệp",
        uploading: "Đang tải lên…",
        close: "Đóng",
        attachNotAvailable: "Chưa hỗ trợ đính kèm tệp",
        linkNotAvailable: "Chưa hỗ trợ chèn liên kết",
        mathNotAvailable: "Chưa hỗ trợ ký hiệu toán học",
      },
    },
  },
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value)
    } else {
      target[key] = value
    }
  }
  return target
}

function patchLocale(filePath, patch) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"))
  deepMerge(data, patch)

  // Brand consistency in runtime keys
  const brandKeys = [
    "runtime.app.login.page.text_conferencespace",
    "runtime.app.register.page.text_conferencespace",
    "runtime.app.forgot-password.page.text_conferencespace",
    "runtime.app.reset-password.page.text_conferencespace",
    "runtime.app.verify-email.page.text_conferencespace",
  ]
  for (const keyPath of brandKeys) {
    const segments = keyPath.split(".")
    let current = data
    for (let i = 0; i < segments.length - 1; i++) {
      current = current?.[segments[i]]
    }
    if (current && typeof current[segments.at(-1)] === "string") {
      current[segments.at(-1)] = "ConferenceSpace"
    }
  }

  if (data.runtime?.app?.page?.public_guide?.roles) {
    data.runtime.app.page.public_guide.roles.author.label = patch.common.roles.author
    data.runtime.app.page.public_guide.roles.chair.label = patch.common.roles.chair
    data.runtime.app.page.public_guide.roles.reviewer.label = patch.common.roles.reviewer
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

patchLocale(EN_PATH, patches.en)
patchLocale(VI_PATH, patches.vi)
console.log("Patched en.json and vi.json")
