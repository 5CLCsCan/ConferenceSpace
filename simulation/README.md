# ConferenceSpace AI Simulation System

Hệ thống mô phỏng 15 AI Agents tự động tương tác trên nền tảng ConferenceSpace.

## Cấu trúc thư mục

```
simulation/
├── personas.json                  # Dữ liệu 15 agents (Chair x3, Reviewer x6, Author x6)
├── README.md                      # File này
└── templates/
    ├── _system_rules.md           # Rules chung — inject vào ĐẦU mọi prompt
    ├── chair_template.md          # Playbook cho Chair agents
    ├── reviewer_template.md       # Playbook cho Reviewer agents
    └── author_template.md         # Playbook cho Author agents
```

---

## Cách sử dụng (Prompt Assembly)

### Bước 1: Đọc personas.json

Tìm agent cần tạo prompt, ví dụ `reviewer-001` (Dr. Marcus Stern).

### Bước 2: Ghép template theo thứ tự

```
Final System Prompt = _system_rules.md + reviewer_template.md
```

### Bước 3: Điền biến `{{...}}`

Thay thế tất cả biến `{{agent.*}}` bằng dữ liệu từ personas.json của agent đó.
Thay thế `{{context.*}}` bằng context runtime (conference_id, phase, jwt_token...).

**Ví dụ điền biến cho reviewer-001:**

| Biến | Giá trị |
|---|---|
| `{{agent.identity.display_name}}` | `Dr. Marcus Stern` |
| `{{agent.personality.archetype}}` | `harsh_critic` |
| `{{agent.personality.description}}` | `Cực kỳ khắt khe về lý thuyết...` |
| `{{agent.behavioral_rules.review_writing.typical_review_score_range}}` | `[3.0, 7.5]` |
| `{{agent.behavioral_rules.rebuttal_response.likelihood_to_change_score}}` | `0.12` |
| `{{context.conference_id}}` | `1` (runtime) |
| `{{agent.system_credentials.jwt_token}}` | `eyJ...` (runtime sau login) |

### Bước 4: Gọi LLM

Gửi Final System Prompt + User Message (mô tả tình huống hiện tại) đến LLM.

**User Message mẫu:**
```
Current situation:
- Phase: reviewing
- You have been assigned paper #42: "A Novel Approach to..."
- Assignment ID: 87
- Your task: Write and submit a review for this paper.
- Paper abstract: [abstract text here]

Please provide your next action as a JSON object.
```

### Bước 5: Parse Structured Output

Parse JSON response từ LLM theo format trong `_system_rules.md`, sau đó:
1. Extract `action.method`, `action.endpoint`, `action.body`
2. Gọi API thực tế
3. Ghi log vào `simulation_log`
4. Cập nhật context cho turn tiếp theo

---

## 15 Agents

### Chairs (3)

| ID | Tên | Archetype | Đặc điểm |
|---|---|---|---|
| chair-001 | Prof. Eleanor Voss | `fair_mediator` | Công tâm, strict COI, data-driven |
| chair-002 | Dr. Kenji Tanaka | `efficiency_focused` | Nhanh, ít kiểm tra COI nhỏ |
| chair-003 | Prof. Miriam Okafor | `consensus_seeker` | Tránh xung đột, chờ đồng thuận |

### Reviewers (6)

| ID | Tên | Archetype | Đặc điểm |
|---|---|---|---|
| reviewer-001 | Dr. Marcus Stern | `harsh_critic` | Gắt lý thuyết, reject nhiều |
| reviewer-002 | Dr. Priya Nair | `enthusiastic_supporter` | Tích cực, accept nhiều |
| reviewer-003 | Prof. Ivan Petrov | `methodology_purist` | Obsessed ablation/baselines |
| reviewer-004 | Dr. Sofia Reyes | `balanced_pragmatist` | Cân bằng, dễ thương lượng |
| reviewer-005 | Dr. Yuki Tanabe | `reproducibility_hawk` | Chỉ quan tâm reproducibility |
| reviewer-006 | Dr. Liam O'Brien | `trendy_chaser` | Thích hot topics, LLM bias |

### Authors (6)

| ID | Tên | Archetype | Đặc điểm |
|---|---|---|---|
| author-001 | Prof. Zhang Wei | `defensive_veteran` | Bảo thủ, counter-attack |
| author-002 | Amara Osei | `eager_learner` | Khiêm tốn, dễ sửa, biết ơn |
| author-003 | Dr. Isabella Romano | `strategic_player` | Tính toán chiến lược rebuttal |
| author-004 | Prof. Raj Patel | `serial_submitter` | Nhanh, không quá sâu |
| author-005 | Kim Min-jun | `perfectionist` | Tỉ mỉ, detail oriented |
| author-006 | Dr. Fatima Al-Rashid | `collaborative_networker` | Nhiều co-authors, impact framing |

---

## ⚠️ Lỗi Đã Được Sửa (So với Version Cũ)

| Lỗi | Version cũ | Version mới |
|---|---|---|
| Chair chuyển phase | Không có endpoint | `PUT /conferences/:id/status` body `{"new_status": "..."}` |
| Reviewer accept assignment | `PUT /reviewers/:rid/status` (sai) | `PUT /reviewer/:email/assignments/:aid/respond` body `{"action": "accept"}` |
| Author publish bài | `PUT /submissions/:id` với `status: published` (sai) | `POST /submissions/:id/publish` (endpoint riêng) |
| Discussion thread tạo | Thiếu `content` field | `CreateThreadRequest` bắt buộc cả `title` + `content` |
| Chair mở rebuttal | Không có | `POST /conferences/:id/rebuttal/open` |
| Chair finalize rebuttal | Không có | `POST /conferences/:id/rebuttal/finalize` |

---

## API Endpoints theo Role (Đầy đủ)

### Auth (tất cả roles)
| Action | Endpoint |
|---|---|
| Đăng ký | `POST /api/v1/auth/register` |
| Đăng nhập | `POST /api/v1/auth/login` |
| Đổi mật khẩu | `POST /api/v1/auth/change-password` |
| Quên mật khẩu | `POST /api/v1/auth/forgot-password` |
| Reset mật khẩu | `POST /api/v1/auth/reset-password` |
| Xem profile | `GET /api/v1/users/me` |
| Cập nhật profile | `PUT /api/v1/users/{email}` |
| Tìm user | `GET /api/v1/users/search?q=...` |

### Chair
| Action | Endpoint |
|---|---|
| Tạo conference | `POST /api/v1/conferences` |
| Xem conference | `GET /api/v1/conferences/:id` |
| Cập nhật conference | `PUT /api/v1/conferences/:id` |
| **Chuyển phase** | `PUT /api/v1/conferences/:id/status` — body: `{"new_status": "open"}` |
| Thống kê | `GET /api/v1/conferences/:id/stats` |
| Tìm user để mời | `GET /api/v1/users/search?q=...&conference_id=X` |
| Mời reviewer (batch) | `POST /api/v1/conferences/:id/reviewers` — body: `{"reviewers": [{"user_id": N, "domain": [...]}]}` |
| Xem reviewers | `GET /api/v1/conferences/:id/reviewers` |
| Reviewer suggestions (AI) | `GET /api/v1/conferences/:id/reviewer-suggestions` |
| Xóa reviewer | `DELETE /api/v1/conferences/:id/reviewers/:rid` |
| External invitations | `POST/GET/DELETE /conferences/:id/external-invitations` |
| Kiểm tra COI user | `GET /api/v1/users/:email/coi-check?conference_id=X` |
| Auto-assign (dry_run first!) | `POST /api/v1/conferences/:id/submissions/auto-assign` |
| Xem suggestions | `GET /api/v1/conferences/:id/assignments/suggestions` |
| Thêm suggestion thủ công | `POST /api/v1/conferences/:id/assignments/suggestions` |
| Xóa suggestion (COI) | `DELETE /api/v1/conferences/:id/assignments/suggestions/:aid` |
| **Confirm suggestions** | `POST /api/v1/conferences/:id/assignments/suggestions/confirm` — body: `{"assignment_ids": []}` |
| Confirmed assignments | `GET /api/v1/conferences/:id/assignments/confirmed` |
| Xem reviews của paper | `GET /api/v1/conferences/:id/submissions/:sid/reviews` |
| Review analytics | `GET /api/v1/conferences/:id/submissions/:sid/reviews/analytics` |
| Decision copilot | `GET/POST /conferences/:id/submissions/:sid/decision-copilot/generate` |
| **Accept/Reject submission** | `PUT /api/v1/conferences/:id/submissions/:sid/status` — body: `{"status": "accepted"}` |
| COI dashboard | `GET /api/v1/coi/dashboard/stats/:id` |
| COI relationships | `GET /api/v1/coi/relationships?conference_id=X&severity=high` |
| COI per reviewer-author | `GET /api/v1/coi/check/reviewer/:rid/author/:email` |
| COI theo paper | `GET /api/v1/coi/papers?conference_id=X` |
| Rebuild COI | `POST /api/v1/coi/conferences/:id/rebuild` |
| Rebuttal settings | `GET/PATCH /conferences/:id/rebuttal/settings` |
| **Mở rebuttal** | `POST /api/v1/conferences/:id/rebuttal/open` |
| Mở discussion phase | `POST /api/v1/conferences/:id/rebuttal/open-discussion` |
| **Finalize rebuttal** | `POST /api/v1/conferences/:id/rebuttal/finalize` |
| Tạo discussion thread | `POST /api/v1/conferences/:cid/submissions/:sid/threads` — body: `{"title": "...", "content": "...", "visibility": "reviewers_only"}` |
| Gửi message | `POST /api/v1/threads/:tid/messages` — body: `{"content": "..."}` |

### Reviewer
| Action | Endpoint |
|---|---|
| Dashboard | `GET /api/v1/reviewer/:email/dashboard` |
| Papers trong conference | `GET /api/v1/reviewer/:email/conferences/:cid/papers` |
| Completed papers (lịch sử) | `GET /api/v1/reviewer/:email/completed-papers` |
| **Xem invitation info** | `GET /api/v1/reviewer/:email/assignments/:aid/invitation` |
| **Accept/Decline assignment** | `PUT /api/v1/reviewer/:email/assignments/:aid/respond` — body: `{"action": "accept"}` |
| Đọc submission | `GET /api/v1/conferences/:cid/submissions/:sid` |
| Download paper | `GET /api/v1/conferences/:cid/submissions/:sid/file` |
| AI Briefing | `GET/POST /conferences/:cid/assignments/:aid/briefing/generate` |
| Paper Annotation | `GET/POST /conferences/:cid/assignments/:aid/paper-annotation/generate` |
| Xem review (draft) | `GET /api/v1/conferences/:cid/assignments/:aid/review` |
| **Lưu draft review** | `PUT /api/v1/conferences/:cid/assignments/:aid/review` — body: `{"status": "draft", ...}` |
| Run Review Audit | `POST /api/v1/conferences/:cid/assignments/:aid/review-audit` — body: `{"mode": "submit_preflight", ...}` |
| Dismiss audit warning | `PUT /api/v1/conferences/:cid/assignments/:aid/review-audit/dismissals` |
| **Submit review** | `PUT /api/v1/conferences/:cid/assignments/:aid/review` — body: `{"status": "submitted", "review_score": X, ...}` |
| Đọc rebuttal | `GET /api/v1/conferences/:cid/submissions/:sid/rebuttal` |
| **Acknowledge rebuttal** | `PUT /api/v1/conferences/:cid/assignments/:aid/rebuttal/acknowledge` |
| **Acknowledge point** | `PUT /api/v1/conferences/:cid/assignments/:aid/rebuttal/points/:pid/acknowledge` — body: `{"status": "addressed", "note": "..."}` |
| **Post-rebuttal score** | `PUT /api/v1/conferences/:cid/assignments/:aid/post-rebuttal-score` — body: `{"score": 7, "recommendation": "accept", "comment": "..."}` |
| Tạo discussion thread | `POST /api/v1/conferences/:cid/submissions/:sid/threads` — body: `{"title": "...", "content": "...", "visibility": "reviewers_only"}` |
| Xem threads | `GET /api/v1/conferences/:cid/submissions/:sid/threads` |
| Gửi message | `POST /api/v1/threads/:tid/messages` |
| Xem messages | `GET /api/v1/threads/:tid/messages` |
| Upload attachment | `POST /api/v1/threads/:tid/attachments` |

### Author
| Action | Endpoint |
|---|---|
| Precheck | `POST /api/v1/conferences/:cid/submissions/precheck` |
| Autofill (AI) | `POST /api/v1/conferences/:cid/submissions/autofill` |
| Track recommendation | `POST /api/v1/conferences/:cid/submissions/track-recommendation` |
| Tạo draft submission | `POST /api/v1/conferences/:cid/submissions` — body JSON |
| Cập nhật draft | `PUT /api/v1/conferences/:cid/submissions/:sid` |
| **Publish submission** | `POST /api/v1/conferences/:cid/submissions/:sid/publish` — multipart/form-data |
| Xem submission | `GET /api/v1/conferences/:cid/submissions/:sid` |
| Download paper | `GET /api/v1/conferences/:cid/submissions/:sid/file` |
| Download cover letter | `GET /api/v1/conferences/:cid/submissions/:sid/cover_letter` |
| **Đọc reviews** | `GET /api/v1/conferences/:cid/submissions/:sid/rebuttal` — (Author đọc reviews qua endpoint này) |
| **Nộp rebuttal** | `PUT /api/v1/conferences/:cid/submissions/:sid/rebuttal` — body: `{"general_response": "...", "points": [...]}` |
| Rút bài | `PUT /api/v1/conferences/:cid/submissions/:sid/status` — body: `{"status": "withdrawn"}` |
| Xóa submission (draft only) | `DELETE /api/v1/conferences/:cid/submissions/:sid` |
| Camera-ready upload | `POST /api/v1/conferences/:cid/submissions/:sid/camera-ready` |
| Camera-ready download | `GET /api/v1/conferences/:cid/submissions/:sid/camera-ready` |

---

## Key Schema Notes (từ DTO thực tế)

### Review criteria scores
- **Scale:** integer từ **1 đến 10**
- **Fields:** `originality`, `technical_quality`, `clarity`, `significance`, `methodology`

### Review overall score
- **Scale:** float từ **0.0 đến 10.0**

### Review recommendation
- Valid values: `strong_accept | accept | weak_accept | borderline | weak_reject | reject | strong_reject`

### Review confidence
- Valid values: `high | medium | low`

### Post-rebuttal score
- **Scale:** integer từ **1 đến 10**
- **Recommendation:** `accept | reject | borderline`

### Rebuttal point acknowledge status
- Valid values: `addressed | partially_addressed | not_addressed | pending_review`

### Assignment status flow
`suggested → pending → accepted → declined → completed`

### Conference status flow
`draft → open → reviewing → completed → archived`

### Submission rebuttal_phase flow
`awaiting → submitted → discussion → finalized`
