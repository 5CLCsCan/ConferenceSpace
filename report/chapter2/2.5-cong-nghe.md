# 2.5 Công Nghệ Sử Dụng

## 2.5.1 Tổng quan Stack Kỹ Thuật

ConferenceSpace được xây dựng trên nền tảng công nghệ hiện đại, lựa chọn theo tiêu chí: hiệu năng cao, hệ sinh thái phong phú, miễn phí/mã nguồn mở, và phù hợp với quy mô đồ án tốt nghiệp.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                  │
│  Next.js 15 · TypeScript · React 18 · Tailwind CSS v4 · shadcn/ui│
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                  │
│           Go 1.24 · Gin Framework · JWT · WebSocket              │
└─────────────────────────────────────────────────────────────────┘
         │                                      │
┌────────────────┐                    ┌─────────────────────┐
│  PostgreSQL 15 │                    │      Neo4j 5.15      │
│  (Relational)  │                    │   (Graph Database)   │
└────────────────┘                    └─────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        AI SERVICES                                │
│   Gemini API · OpenRouter · Semantic Scholar API                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.5.2 Frontend

### Next.js 15

**Next.js** (nextjs.org) là framework React full-stack của Vercel, sử dụng **App Router** (ra mắt từ Next.js 13).

**Lý do chọn:**
- **App Router** cho phép Server Components — render trang ở server, giảm JavaScript phía client
- **API Routes** dùng làm proxy layer giữa browser và backend Go — ẩn URL backend, xử lý CORS
- **File-based routing** — cấu trúc thư mục `app/` ánh xạ trực tiếp thành URL
- Tích hợp tốt với TypeScript và hệ sinh thái React

**Phiên bản**: 15 (App Router)

### TypeScript

TypeScript bổ sung kiểu tĩnh (static typing) cho JavaScript, phát hiện lỗi tại compile-time thay vì runtime.

**Lợi ích trong dự án:**
- Type-safe API response — đảm bảo dữ liệu từ backend đúng cấu trúc mong đợi
- IDE autocomplete giúp phát triển nhanh hơn
- Refactoring an toàn hơn khi codebase lớn

### React 18

React là thư viện UI phổ biến nhất hiện nay. React 18 giới thiệu **Concurrent Features**:
- `Suspense` cho data fetching
- Automatic batching (gom nhiều state update thành một render)

### Tailwind CSS v4

**Tailwind CSS** là framework CSS utility-first — viết style trực tiếp trong HTML/JSX thay vì file CSS riêng.

**Lý do chọn:**
- Không cần đặt tên class tùy ý — giảm bikeshedding
- Purge CSS tự động — bundle size nhỏ khi production
- Design system nhất quán nhờ spacing/color scale định sẵn

### shadcn/ui

**shadcn/ui** là bộ component UI được build trên Radix UI (headless components) + Tailwind CSS.

**Đặc điểm nổi bật:**
- Copy component vào project (không phải npm package) — toàn quyền tuỳ chỉnh
- Accessibility tốt (Radix UI đảm bảo keyboard nav, ARIA)
- Đẹp và nhất quán theo design system

---

## 2.5.3 Backend

### Go 1.24

**Go** (golang.org) là ngôn ngữ lập trình biên dịch, statically typed của Google, nổi tiếng với hiệu năng cao và mô hình concurrency đơn giản (goroutines).

**Lý do chọn so với alternatives (Node.js, Python/FastAPI):**

| Tiêu chí | Go | Node.js | Python/FastAPI |
|----------|----|---------|----|
| **Hiệu năng** | ✅✅ Cao | ✅ Tốt | ⚠️ Trung bình |
| **Concurrency** | ✅✅ Goroutines | ✅ Event loop | ⚠️ GIL (asyncio) |
| **Type safety** | ✅ Static | ❌ Dynamic | ⚠️ Type hints |
| **Compile** | ✅ Binary | ❌ Runtime | ❌ Runtime |
| **Memory** | ✅ Thấp | ⚠️ Trung bình | ⚠️ Trung bình |
| **Cold start** | ✅ Nhanh | ⚠️ | ⚠️ |

Goroutines của Go đặc biệt phù hợp cho các tác vụ I/O-bound như gọi AI API đồng thời, xử lý WebSocket connection pool.

### Gin Framework

**Gin** (gin-gonic.com) là HTTP web framework cho Go, nổi tiếng với hiệu năng cao nhờ router dựa trên radix tree.

**Tính năng sử dụng:**
- Route grouping theo prefix (`/api/v1/conferences/...`)
- Middleware pipeline: JWT auth, CORS, logging, rate limiting
- Request validation và binding tự động
- ShouldBindJSON/ShouldBindQuery cho parse request

### JWT (JSON Web Token)

Hệ thống xác thực sử dụng **JWT** — token tự mô tả (self-contained), không cần lưu session trên server.

**Cấu trúc JWT sử dụng:**
```json
{
  "sub": "user@email.com",
  "exp": 1234567890,
  "conference_roles": {
    "1": "chair",
    "2": "reviewer"
  }
}
```

### golang-migrate

**golang-migrate** quản lý database schema thông qua migration files có phiên bản (versioned migrations) — mỗi thay đổi schema là một file SQL có thể áp dụng (up) hoặc hoàn tác (down).

### Swagger/OpenAPI

API được tài liệu hoá tự động bằng annotations trong Go code, generate ra file `swagger.json` và giao diện Swagger UI tại `/swagger/index.html`.

---

## 2.5.4 Cơ Sở Dữ Liệu

### PostgreSQL 15

**PostgreSQL** là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ nhất hiện nay.

**Tính năng PostgreSQL được tận dụng:**

| Tính năng | Ứng dụng trong ConferenceSpace |
|-----------|-------------------------------|
| **JSONB** | Lưu `configurations` của hội nghị (linh hoạt, không cần schema cứng) |
| **TEXT[]** | Lưu mảng domain/keyword — tìm kiếm với `= ANY(domain)` |
| **Partial indexes** | Tối ưu query theo `status` (chỉ index row đang active) |
| **TIMESTAMP WITH TIME ZONE** | Xử lý deadline chính xác theo timezone |
| **Full-text search** | Tìm kiếm hội nghị theo tên/mô tả |

**Phiên bản**: 15 (LTS)

### Neo4j 5.15

**Neo4j** là cơ sở dữ liệu đồ thị (graph database) — lưu trữ dữ liệu dưới dạng node và relationship thay vì bảng.

**Lý do cần Neo4j cho COI Detection:**

Phát hiện COI yêu cầu duyệt đồ thị đồng tác giả với độ sâu 2–3 bậc. Với SQL thuần:
```sql
-- Cần JOIN nhiều lần, hiệu năng giảm mạnh với đồ thị dày
SELECT DISTINCT a2.email 
FROM authorship a1
JOIN authorship a2 ON a1.paper_id = a2.paper_id
WHERE a1.author_email = $reviewer
  AND a2.author_email = $paper_author
```

Với Neo4j Cypher, truy vấn tự nhiên và tối ưu hơn:
```cypher
MATCH (r:Author {email: $reviewer})-[:CO_AUTHORED*1..2]-(a:Author {email: $author})
RETURN r, a
```

Neo4j sử dụng index trên node properties và tối ưu hoá graph traversal, cho kết quả nhanh hơn nhiều khi đồ thị có hàng triệu quan hệ.

---

## 2.5.5 AI Services

### Google Gemini API

**Gemini** (ai.google.dev) là Large Language Model (LLM) của Google, hỗ trợ multimodal (text + image + PDF).

**Model sử dụng**: `gemini-2.0-flash` — cân bằng tốt giữa tốc độ và chất lượng

**Tính năng Gemini được dùng trong dự án:**

| Tính năng | Prompt đầu vào | Output |
|-----------|---------------|--------|
| **Autofill** | PDF bài báo (base64) | JSON: title, abstract, keywords |
| **Track suggestion** | Title + abstract + danh sách tracks | Track được gợi ý + lý do |
| **AI Precheck** | Metadata bài nộp | Danh sách vấn đề, cảnh báo |
| **Review Checker** | Nội dung phản biện + tiêu chí | Gợi ý cải thiện |
| **Decision Copilot** | Tổng hợp tất cả phản biện | Đề xuất accept/reject + lý do |

### OpenRouter API

**OpenRouter** (openrouter.ai) là gateway API cho phép gọi nhiều LLM khác nhau (GPT-4, Claude, Gemini, Llama, v.v.) qua một endpoint duy nhất.

**Ứng dụng**: Chatbot hỗ trợ người dùng — cho phép chọn model linh hoạt mà không cần thay đổi code.

### Semantic Scholar API

**Semantic Scholar** (api.semanticscholar.org) cung cấp dữ liệu học thuật miễn phí:
- `GET /author/{id}` — hồ sơ tác giả
- `GET /author/{id}/papers` — danh sách bài báo
- `POST /author/batch` — lấy nhiều author một lần

**Rate limit**: 100 req/5 min (không cần API key); 1 req/s với API key miễn phí.

---

## 2.5.6 DevOps và Công cụ Phát triển

### Docker và Docker Compose

**Docker** containerize các service (PostgreSQL, Neo4j, backend) để đảm bảo môi trường nhất quán giữa development và production.

```yaml
# docker-compose.yml (tóm tắt)
services:
  postgres:   # PostgreSQL 15
  neo4j:      # Neo4j 5.15 Community
  api:        # Go backend binary
  migrate:    # golang-migrate (one-shot)
```

### GitHub Actions (CI/CD)

Pipeline tự động khi push code:
1. `go test ./...` — chạy unit test
2. `golangci-lint` — kiểm tra code quality
3. Build Docker image
4. Deploy lên server

### Makefile

Tất cả lệnh phát triển phổ biến được gói trong `Makefile`:
```bash
make dev        # Khởi động toàn bộ môi trường
make test       # Chạy test
make migrate-up # Apply migrations
make swagger    # Generate API docs
```

---

## 2.5.7 Bảng tổng hợp Stack Kỹ Thuật

| Thành phần | Công nghệ | Phiên bản | Lý do chọn |
|-----------|-----------|-----------|-----------|
| **Frontend Framework** | Next.js | 15 | App Router, SSR, API proxy |
| **Ngôn ngữ Frontend** | TypeScript | 5.x | Type safety |
| **UI Components** | shadcn/ui | — | Accessible, tuỳ chỉnh được |
| **CSS** | Tailwind CSS | v4 | Utility-first, nhất quán |
| **Ngôn ngữ Backend** | Go | 1.24 | Hiệu năng, concurrency |
| **Web Framework** | Gin | latest | Nhanh, middleware phong phú |
| **Auth** | JWT | — | Stateless, scalable |
| **Relational DB** | PostgreSQL | 15 | JSONB, Arrays, reliable |
| **Graph DB** | Neo4j | 5.15 | COI graph traversal |
| **DB Migration** | golang-migrate | — | Versioned schema |
| **AI LLM** | Gemini | 2.0-flash | Multimodal, nhanh |
| **AI Gateway** | OpenRouter | — | Multi-model chatbot |
| **Scholar Data** | Semantic Scholar | — | Free academic API |
| **Realtime** | WebSocket (Gorilla) | — | Thông báo instant |
| **Containerization** | Docker | — | Environment consistency |
| **CI/CD** | GitHub Actions | — | Tự động hoá |
| **API Docs** | Swagger/OpenAPI | 3.0 | Auto-generate |
