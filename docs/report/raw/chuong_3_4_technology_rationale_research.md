# Research rationale công nghệ cho Chương 3/4

Tài liệu này bổ sung mô tả ngắn, lý do chọn và citation cho các công nghệ chính dùng trong ConferenceSpace. Chỉ đưa vào các công nghệ có vai trò kiến trúc hoặc vận hành rõ ràng; không liệt kê toàn bộ dependency để tránh biến Chương 4 thành danh sách thư viện.

## 1. Nguyên tắc dùng trong báo cáo

- Chỉ dùng citation chính thức hoặc authoritative cho claim công nghệ.
- Không dùng citation để “trang trí”. Mỗi nguồn phải chống đỡ một nhận định cụ thể trong Chương 3/4.
- Với công nghệ đã thể hiện trong repo, claim cần có cả **evidence nội bộ** và **source bên ngoài**.
- Với model LLM, báo cáo phải dùng `gemini-3.1-flash-lite` cho toàn bộ thao tác LLM; model cũ chỉ được nhắc như drift cấu hình cần đồng bộ.

## 2. Technology rationale matrix

| Công nghệ | Vai trò trong ConferenceSpace | Lý do chọn nên viết trong báo cáo | Evidence repo | Citation chính |
|---|---|---|---|---|
| Next.js App Router | Frontend web app cho author, reviewer, chair/admin | Phù hợp hệ thống nhiều luồng nghiệp vụ vì App Router dùng routing theo file-system, hỗ trợ layout/page rõ ràng và React Server Components | `frontend/package.json`, `frontend/app/` | https://nextjs.org/docs/app |
| React | Nền UI tương tác cho dashboard, form, review workflow | Phù hợp các màn hình nhiều trạng thái và form phức tạp; không cần trình bày dài nếu Chương 4 đã tập trung vào Next.js | `frontend/package.json`, `frontend/components/` | https://react.dev/ |
| Radix UI | Primitive UI cho dialog, select, tabs, tooltip | Dùng để xây UI có accessibility tốt hơn mà vẫn giữ quyền kiểm soát style; chỉ nhắc khi giải thích UI component architecture | `frontend/package.json` | https://www.radix-ui.com/primitives/docs/overview/introduction |
| Tailwind CSS | Styling utility cho frontend | Hỗ trợ style nhất quán và tốc độ phát triển giao diện; chỉ nên mô tả ngắn, không biến thành luận điểm chính | `frontend/package.json`, frontend styles | https://tailwindcss.com/docs |
| Go | Backend API và nghiệp vụ chính | Phù hợp service backend cần xử lý request đồng thời, code rõ, build/deploy gọn; Go docs nhấn mạnh concurrency primitives cho network services | `backend/go.mod`, `backend/internal/` | https://go.dev/doc/ |
| Gin | HTTP framework cho Go backend | Phù hợp REST API/middleware/routing; Gin docs nêu routing hiệu năng, middleware, JSON validation và route grouping | `backend/go.mod`, backend routes | https://gin-gonic.com/en/ |
| PostgreSQL | CSDL nghiệp vụ bền vững | Phù hợp dữ liệu quan hệ của hội nghị; nếu dùng artifact JSON/JSONB, PostgreSQL docs hỗ trợ luận điểm xử lý dữ liệu bán cấu trúc hiệu quả | `deployment/docker-compose.prod.yml`, `backend/migrations/` | https://www.postgresql.org/docs/current/datatype-json.html |
| Redis | Cache/session/tool result ngắn hạn cho AI service | Phù hợp dữ liệu tạm thời cần đọc nhanh; Redis docs mô tả cache, session/state và data structures | `deployment/docker-compose.prod.yml`, `ai-service/app/core/config.py` | https://redis.io/docs/latest/ |
| Neo4j | Graph database cho quan hệ học thuật và COI | Phù hợp truy vấn quan hệ nhiều bước giữa tác giả/reviewer/tổ chức; Neo4j Cypher hỗ trợ variable-length paths | `deployment/docker-compose.prod.yml`, `backend/internal/assignment/coi/` | https://neo4j.com/docs/cypher-manual/current/patterns/variable-length-paths/ |
| FastAPI | AI service API và workflow endpoints | Phù hợp service AI cần schema rõ, OpenAPI docs, async endpoints và dependency injection; FastAPI dựa trên Python typing/Pydantic | `ai-service/pyproject.toml`, `ai-service/app/main.py` | https://fastapi.tiangolo.com/features/ |
| Pydantic | Request/response/workflow schema validation | Phù hợp workflow AI cần output có cấu trúc và validate được; Pydantic đảm bảo object sau validation tuân thủ type/constraint đã định nghĩa | `ai-service/pyproject.toml`, workflow `schemas.py` | https://pydantic.dev/docs/validation/latest/concepts/models/ |
| Gemini 3.1 Flash-Lite | Model LLM cho toàn bộ workflow AI | Phù hợp tác vụ trích xuất, tóm tắt, phân loại và workflow AI tần suất cao vì Google mô tả model này là low-latency, cost-effective, multimodal, hỗ trợ structured outputs | User decision, `LLMClient`, config drift cần sửa | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite |
| Gemini OpenAI compatibility | Đường gọi model qua OpenAI-compatible client | Phù hợp codebase đã có model router/OpenAI-style client; Google docs xác nhận Gemini có thể truy cập qua OpenAI libraries/API settings | `ai-service/app/services/llm_client.py` | https://ai.google.dev/gemini-api/docs/openai |
| OpenRouter | Provider gateway cho LLM fallback/routing | Phù hợp khi nhóm cần một API thống nhất qua nhiều provider; OpenRouter docs mô tả schema gần OpenAI Chat API và normalize schema giữa providers | `OPENROUTER_API_KEY`, `AGENT_MODEL`, `LLMClient` | https://openrouter.ai/docs/api/reference/overview |
| LiteLLM | Lớp gọi LLM/provider abstraction | Phù hợp vì repo dùng `litellm` để gọi OpenRouter/model string, hỗ trợ routing/fallback pattern | `ai-service/pyproject.toml`, `LLMClient` | https://docs.litellm.ai/docs/routing |
| Docker Compose | Production topology nhiều service | Phù hợp triển khai hệ thống gồm frontend, backend, AI service và data stores; Compose gom services, networks, volumes trong YAML | `deployment/docker-compose.prod.yml` | https://docs.docker.com/compose/ |
| Caddy | Reverse proxy/gateway HTTPS | Phù hợp triển khai domain public vì Caddy tự động phục vụ HTTPS cho domain public và cấu hình reverse proxy ngắn | `deployment/Caddyfile` | https://caddyserver.com/docs/automatic-https |
| GitHub Actions | CI/CD build và deploy image | Phù hợp vì workflow nằm cùng repo, tự động build/push/deploy theo event; GitHub docs định nghĩa workflow là process tự động bằng YAML | `.github/workflows/deploy.yml` | https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows |
| GitHub Container Registry | Registry image production | Phù hợp quy trình build-push-deploy image; GitHub docs xác nhận Container registry lưu và quản lý Docker/OCI images | `.github/workflows/deploy.yml`, `deployment/.env.production.example` | https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry |

## 3. Đoạn mô tả mẫu có thể dùng trong Chương 4

### 3.1. Frontend

ConferenceSpace sử dụng Next.js App Router cho frontend vì hệ thống có nhiều nhóm người dùng và nhiều luồng nghiệp vụ tách biệt. Cấu trúc route theo file-system giúp tổ chức các màn hình theo miền nghiệp vụ, trong khi React Server Components và Client Components cho phép phân tách phần render trên server và phần tương tác phía client. Phần này nên dẫn Next.js docs và đối chiếu với `frontend/app/`.

Radix UI và Tailwind CSS chỉ nên trình bày như lựa chọn hỗ trợ UI: Radix cung cấp primitive component có accessibility tốt, còn Tailwind giúp chuẩn hóa styling và tăng tốc độ xây dựng giao diện. Không cần biến hai công nghệ này thành luận điểm lớn nếu báo cáo không đi sâu vào design system.

### 3.2. Backend

Backend dùng Go và Gin để hiện thực API nghiệp vụ. Go phù hợp với service backend cần xử lý nhiều request đồng thời, còn Gin cung cấp routing, middleware, JSON validation và route grouping. Khi viết, cần nối lý do chọn với đặc thù ConferenceSpace: nhiều actor, nhiều API nghiệp vụ, cần phân quyền, cần tích hợp AI service và data stores.

Phần này nên dùng repo evidence từ `backend/go.mod`, `backend/internal/`, các migration và module assignment/COI. Không nên mô tả Go/Gin chung chung quá dài; trọng tâm vẫn là cách backend kiểm soát nghiệp vụ và làm ranh giới an toàn cho AI service.

### 3.3. AI service

AI service dùng FastAPI và Pydantic vì các workflow AI cần endpoint rõ, schema rõ và validation chặt. FastAPI dựa trên Python type hints, tự sinh OpenAPI docs và tích hợp Pydantic validation; Pydantic giúp kiểm soát request/response cũng như output có cấu trúc của workflow.

Toàn bộ thao tác LLM phải mô tả là dùng `gemini-3.1-flash-lite`. Google mô tả model này là low-latency, cost-effective, multimodal, phù hợp high-volume agentic workflows, data extraction, document processing và structured JSON output. Điều này khớp với các workflow của hệ thống: Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent.

OpenRouter, LiteLLM và OpenAI-compatible client nên được mô tả là lớp vận hành/model routing, không phải một tầng “AI” mới. Chức năng của lớp này là giữ hợp đồng gọi model thống nhất, hỗ trợ fallback/provider abstraction và giảm coupling giữa workflow với vendor cụ thể.

### 3.4. Data layer

PostgreSQL là nguồn dữ liệu nghiệp vụ bền vững cho hội nghị, submission, review, assignment và artifact. Nếu chương 4 nói về JSON/JSONB, cần viết chính xác: `jsonb` có chi phí chuyển đổi khi ghi nhưng xử lý nhanh hơn vì không cần parse lại mỗi lần đọc.

Redis nên được mô tả là tầng cache/session/tool result ngắn hạn, không phải nguồn dữ liệu nghiệp vụ chính. Neo4j nên được mô tả là graph database phục vụ COI vì truy vấn quan hệ học thuật thường cần duyệt quan hệ nhiều bước, phù hợp với variable-length path trong Cypher.

### 3.5. Deployment

Docker Compose phù hợp với production topology hiện tại vì toàn bộ stack gồm Caddy, Next.js web, Go backend, FastAPI AI service, PostgreSQL, Redis và Neo4j được khai báo trong một file YAML với service, network và volume rõ ràng. Caddy phù hợp vai trò public gateway vì cấu hình reverse proxy ngắn và hỗ trợ HTTPS mặc định cho public DNS names.

GitHub Actions và GitHub Container Registry nên được mô tả như CI/CD path: workflow tự động build image, push registry và deploy server. Đây là bằng chứng tốt cho tính vận hành của đồ án, nhưng chỉ nên trình bày ở mức pipeline, không cần chép toàn bộ workflow vào thân bài nếu làm vỡ mạch đọc.

## 4. Các claim không nên viết

- Không viết “dùng Gemini vì chính xác nhất” nếu không có benchmark so sánh model.
- Không viết “OpenRouter bảo đảm hệ thống không lỗi” vì fallback chỉ giảm rủi ro vận hành, không bảo đảm chất lượng output.
- Không viết “Redis lưu dữ liệu chính” vì repo dùng PostgreSQL cho dữ liệu bền vững.
- Không viết “Neo4j thay thế PostgreSQL” vì Neo4j chỉ phục vụ bài toán graph/COI.
- Không viết “Next.js làm backend chính” vì backend nghiệp vụ nằm ở Go API.
- Không viết “AI tự động quyết định accept/reject” vì Chair/reviewer vẫn là người chịu trách nhiệm.

## 5. Reference list ngắn cho báo cáo

- Next.js App Router: https://nextjs.org/docs/app
- React: https://react.dev/
- Radix UI primitives: https://www.radix-ui.com/primitives/docs/overview/introduction
- Tailwind CSS docs: https://tailwindcss.com/docs
- Go documentation: https://go.dev/doc/
- Gin Web Framework: https://gin-gonic.com/en/
- PostgreSQL JSON types: https://www.postgresql.org/docs/current/datatype-json.html
- Redis docs: https://redis.io/docs/latest/
- Neo4j Cypher variable-length paths: https://neo4j.com/docs/cypher-manual/current/patterns/variable-length-paths/
- FastAPI features: https://fastapi.tiangolo.com/features/
- Pydantic models/validation: https://pydantic.dev/docs/validation/latest/concepts/models/
- Gemini 3.1 Flash-Lite: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite
- Gemini OpenAI compatibility: https://ai.google.dev/gemini-api/docs/openai
- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- OpenRouter API overview: https://openrouter.ai/docs/api/reference/overview
- LiteLLM routing: https://docs.litellm.ai/docs/routing
- LiteLLM fallbacks: https://docs.litellm.ai/docs/proxy/reliability
- Docker Compose: https://docs.docker.com/compose/
- Docker Compose services: https://docs.docker.com/reference/compose-file/services/
- Caddy Automatic HTTPS: https://caddyserver.com/docs/automatic-https
- GitHub Actions workflows: https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows
- GitHub Container Registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry

