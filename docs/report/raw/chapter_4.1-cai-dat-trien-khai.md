# Chương 4: Cài đặt và triển khai hệ thống

## 4.1 Cài đặt hệ thống

Hệ thống **ConferenceSpace** được thiết kế theo kiến trúc dịch vụ container hóa (containerized architecture) nhằm đảm bảo tính cô lập, khả năng mở rộng linh hoạt và tính nhất quán giữa môi trường phát triển (development) và sản phẩm (production). Thay vì cài đặt trực tiếp các dịch vụ trên máy chủ và quản lý bằng systemd hay cấu hình reverse proxy thủ công bằng Nginx và Certbot, ConferenceSpace tận dụng sức mạnh của **Docker Engine**, **Docker Compose** và **Caddy Engine** để tự động hóa toàn bộ quy trình vận hành và bảo mật HTTPS.

---

### 4.1.1 Chuẩn bị Môi trường Server

#### Yêu cầu hệ thống

Máy chủ ảo (VPS) được khuyến nghị chạy trên hệ điều hành **Ubuntu Server 22.04 LTS (hoặc mới hơn)**. Do hệ thống bao gồm nhiều dịch vụ chạy đồng thời (PostgreSQL, Neo4j, Redis, Go Backend, FastAPI AI Service, Next.js Frontend), cấu hình tài nguyên tối thiểu và khuyến nghị được đề xuất như sau:

- **Cấu hình tối thiểu:** 2 vCPU, 4 GB RAM.
- **Cấu hình khuyến nghị:** 4 vCPU, 8 GB RAM trở lên để đảm bảo khả năng chịu tải tốt và không bị nghẽn tài nguyên khi Neo4j hoặc mô hình AI thực thi các tác vụ tính toán đồ thị và trích xuất tài liệu.

#### Thiết lập môi trường tự động (Bootstrap)

Quy trình cài đặt ban đầu được tự động hóa thông qua mã nguồn kịch bản bootstrap. chạy bằng quyền quản trị `root` trên server. Kịch bản này thực hiện các tác vụ sau:

1.  Cập nhật danh sách gói và cài đặt các thư viện nền tảng cơ bản (`ca-certificates`, `curl`, `gnupg`, `ufw`).
2.  Tải khóa GPG chính thức của Docker và thiết lập kho lưu trữ (Docker Repository).
3.  Cài đặt Docker Engine, Docker CLI, containerd.io, và Docker Compose Plugin.
4.  Cấu hình người dùng không thuộc root (mặc định là `ubuntu`) vào nhóm `docker` để thực thi các lệnh mà không cần quyền `sudo`.
5.  Khởi tạo thư mục triển khai ứng dụng tại `/opt/conferencespace` và gán quyền sở hữu cho người dùng triển khai.
6.  Cấu hình tường lửa UFW (Uncomplicated Firewall) bảo mật hệ thống.

Dưới đây là nội dung chi tiết của tệp cấu hình bootstrap.sh:

```bash
#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/conferencespace}"
if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg ufw

install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "User '${DEPLOY_USER}' does not exist. Set DEPLOY_USER to an existing SSH user." >&2
  exit 1
fi

usermod -aG docker "${DEPLOY_USER}"
mkdir -p "${DEPLOY_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_DIR}"

# Cấu hình tường lửa UFW
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

docker --version
docker compose version
ufw status verbose
```

#### Quy tắc cấu hình Tường lửa (Firewall Rules)

Hệ thống áp dụng chính sách bảo mật nghiêm ngặt (Zero Trust Network inside Server). Chỉ các cổng phục vụ truy cập công khai và quản trị mới được mở trên tường lửa máy chủ:

- **Cổng 22/TCP (SSH):** Phục vụ quản trị hệ thống và CI/CD deploy.
- **Cổng 80/TCP (HTTP):** Phục vụ xác thực tên miền của Let's Encrypt / ZeroSSL và chuyển hướng HTTPS.
- **Cổng 443/TCP (HTTPS):** Cổng chính nhận toàn bộ lưu lượng của người dùng truy cập.
- **Cổng 3000/TCP:** Mở nội bộ phục vụ kết nối trực tiếp đến Frontend Gateway nếu cần thiết.

Tất cả các dịch vụ cơ sở dữ liệu (PostgreSQL - 5432, Neo4j - 7474/7687), cache (Redis - 6379), và REST API nội bộ (Go Backend - 8080, FastAPI AI Service - 8090) đều **không được mở** trên tường lửa UFW và chỉ giao tiếp với nhau trong mạng ảo cô lập của Docker Network.

---

### 4.1.2 Triển khai Mã nguồn và Cấu hình

#### Cấu hình biến môi trường trên Server

Các cấu hình runtime nhạy cảm hoặc mang tính chất bí mật được lưu trữ trực tiếp trên VPS tại `/opt/conferencespace/.env.production` để tránh lộ lọt mã nguồn. File này được tạo dựa trên tệp ví dụ `deployment/.env.production.example` và chứa các thông tin kết nối và tích hợp:

```ini
#-------------------------------------------
# Images updated by GitHub Actions on each deploy
# -----------------------------------------------------------------------------
FRONTEND_IMAGE=ghcr.io/caohuukhuongduy/conferencespace-frontend:latest
BACKEND_IMAGE=ghcr.io/caohuukhuongduy/conferencespace-backend:latest
AI_SERVICE_IMAGE=ghcr.io/caohuukhuongduy/conferencespace-ai-service:latest

# -----------------------------------------------------------------------------
# Public frontend gateway / Next.js server runtime
# -----------------------------------------------------------------------------
FRONTEND_PORT=80
APP_BASE_URL=https://conference-space.com
CORS_ALLOWED_ORIGINS=https://conference-space.com,https://www.conference-space.com
PUBLIC_API_BASE_URL=/api/backend
AI_SERVICE_BASE_URL=http://ai-service:8090
AI_SERVICE_ENABLED=true
JWT_EXPIRY_SECONDS=86400

# -----------------------------------------------------------------------------
# Shared service-to-service authentication
# -----------------------------------------------------------------------------
AGENT_SERVICE_TOKEN=your_agent_service_token

# -----------------------------------------------------------------------------
# PostgreSQL
# -----------------------------------------------------------------------------
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=conferencespace
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=conferencespace
DB_SSLMODE=disable
POSTGRES_DSN=postgresql+asyncpg://postgres:your_postgres_password@postgres:5432/conferencespace
POSTGRES_SCHEMA=ai

# -----------------------------------------------------------------------------
# Redis
# -----------------------------------------------------------------------------
REDIS_URL=redis://redis:6379/0

# -----------------------------------------------------------------------------
# Neo4j
# -----------------------------------------------------------------------------
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_ENABLED=true
NEO4J_HEAP_INITIAL=256m
NEO4J_HEAP_MAX=512m
NEO4J_PAGECACHE=256m

# -----------------------------------------------------------------------------
# Backend API
# -----------------------------------------------------------------------------
SERVER_PORT=8080
SERVER_ENV=production
JWT_SECRET=your_jwt_signing_secret_key
JWT_EXPIRY_HOURS=24
ADMIN_TOKEN=your_admin_access_token
REQUIRE_EMAIL_VERIFICATION=false
AI_SERVICE_TIMEOUT_SECONDS=180

# Backend file storage
FILE_STORAGE_PROVIDER=local
FILE_STORAGE_LOCAL_BASE_PATH=/data/uploads/submissions
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

# Backend external integrations
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_ENABLED=true
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key
SEMANTIC_SCHOLAR_ENABLED=true
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=no-reply@conference-space.com
BREVO_FROM_NAME=ConferenceSpace

# -----------------------------------------------------------------------------
# AI service
# -----------------------------------------------------------------------------
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8090
AI_SERVICE_ENV=production
LOG_LEVEL=INFO

OPENROUTER_API_KEY=your_openrouter_api_key
AGENT_MODEL=openrouter/google/gemini-3.1-flash-lite-preview:nitro
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=your_openai_base_url
OPENAI_MODEL=your_openai_model
LLM_REQUEST_TIMEOUT_SECONDS=60

IDENTITY_REQUEST_TIMEOUT_SECONDS=3
AUTH_CACHE_TTL_SECONDS=60
BACKEND_QUERY_TIMEOUT_SECONDS=10

SESSION_TTL_MINUTES=30
TOOL_RESULT_TIMEOUT_SECONDS=90
MAX_ITERATIONS=20
MAX_TURN_DURATION_SECONDS=120
CONTEXT_COMPACTION_THRESHOLD=0.70
KEEP_RECENT_EXCHANGES=12

MAX_MESSAGES_PER_REQUEST=200
MAX_MESSAGE_TEXT_CHARS=20000
MAX_CHAT_REQUESTS_PER_MINUTE=60
MAX_TOOL_RESULT_REQUESTS_PER_MINUTE=120
ENABLE_REASONING_STREAM=true
```

#### Thiết lập GitHub Secrets và Variables

Quy trình triển khai liên tục (CD) tự động hóa thông qua GitHub Actions được định nghĩa tại thư mục `.github/workflows/deploy.yml`. Để workflow có thể hoạt động, quản trị viên cần thiết lập môi trường `production` trên kho chứa mã nguồn GitHub và khai báo các thông tin sau:

**Bảng 4.1: Các Secrets bảo mật trên GitHub Actions**

| Tên Secret (GitHub Environment Secret) | Ý nghĩa / Giá trị                                                         |
| :------------------------------------- | :------------------------------------------------------------------------ |
| `DEPLOY_HOST`                          | Địa chỉ IP Public của máy chủ VPS (ví dụ: `52.221.225.75`).               |
| `DEPLOY_USER`                          | Tên người dùng SSH có quyền chạy Docker (mặc định: `ubuntu`).             |
| `DEPLOY_SSH_KEY`                       | Nội dung khóa riêng tư SSH (Private Key) để SSH vào VPS.                  |
| `GHCR_TOKEN`                           | GitHub Personal Access Token (PAT) dùng để xác thực và tải image từ GHCR. |

**Bảng 4.2: Các Variables cấu hình trên GitHub Actions**

| Tên Variable (GitHub Environment Variable) | Ý nghĩa / Giá trị mặc định                                                              |
| :----------------------------------------- | :-------------------------------------------------------------------------------------- |
| `FRONTEND_PORT`                            | Cổng hoạt động của dịch vụ web frontend (Mặc định: `3000`).                             |
| `PUBLIC_API_BASE_URL`                      | Đường dẫn gốc API phía Client sử dụng (Mặc định: `/api/backend`).                       |
| `GEMINI_MODEL`                             | Mô hình Gemini mặc định cho các tác vụ AI (Mặc định: `gemini-1.5-pro`).                 |
| `GEMINI_ENABLED`                           | Trạng thái kích hoạt Gemini (Mặc định: `true`).                                         |
| `AGENT_MODEL`                              | Mô hình ngôn ngữ cho tác nhân AI (Mặc định: `openrouter/google/gemini-2.5-flash-lite`). |
| `BREVO_FROM_EMAIL`                         | Email người gửi dùng trong các thông báo hệ thống (`noreply@conferencespace.io`).       |
| `BREVO_FROM_NAME`                          | Tên hiển thị của email gửi đi (Mặc định: `ConferenceSpace`).                            |

#### Luồng Triển khai Tự động (Deployment Flow)

Khi có sự kiện đẩy mã nguồn (push) vào nhánh `main` hoặc được kích hoạt thủ công từ tab Actions trên GitHub, quy trình CD sẽ thực thi qua các bước sau:

```mermaid
graph TD
    A[Push code to main] --> B[GitHub Actions Runner]
    B --> C[Validate & Test Services]
    C --> D[Build & Push Images to GHCR in Parallel]
    D --> E[SSH to VPS Server]
    E --> F[Copy configuration files to /opt/conferencespace]
    F --> G[Run database migration backend-migrate]
    G --> H[Recreate & Start containers docker compose up]
    H --> I[Health Check]
```

1.  **Xác thực mã nguồn:** Chạy các tiến trình kiểm thử và xác thực cú pháp (lint/test) cho Frontend (Next.js), Backend (Go API) và AI Service (FastAPI) song song.
2.  **Đóng gói container:** Xây dựng 3 Docker image ứng dụng tương ứng (`frontend`, `backend`, `ai-service`) và đẩy lên GitHub Container Registry (GHCR) dưới định dạng tag ảnh tương ứng với hash của Git commit.
3.  **Đồng bộ cấu hình sang Server:** Kết nối SSH đến máy chủ, sao chép các tệp cấu hình [docker-compose.prod.yml](file:///e:/HCMUS/Graduate-Project/ConferenceSpace/deployment/docker-compose.prod.yml) và [Caddyfile](file:///e:/HCMUS/Graduate-Project/ConferenceSpace/deployment/Caddyfile).
4.  **Đồng bộ Cơ sở dữ liệu:** Khởi chạy một container độc lập `backend-migrate` để thực thi việc đồng bộ hóa cấu trúc cơ sở dữ liệu (Database migrations) trong PostgreSQL.
5.  **Khởi động lại dịch vụ:** Cập nhật lại các biến môi trường chỉ định tag ảnh mới, kéo ảnh mới nhất từ GHCR về, thực thi lệnh `docker compose up -d --remove-orphans` để cập nhật và khởi chạy lại các container mà không gây gián đoạn dịch vụ quá vài giây.

---

### 4.1.3 Quản lý Ứng dụng bằng Docker Compose

#### Lợi ích của Container hóa so với Systemd truyền thống

Trong các mô hình triển khai truyền thống, ứng dụng Node.js hoặc Go thường được cài trực tiếp lên VPS và quản lý riêng lẻ bằng các dịch vụ Systemd và PM2. Điều này dẫn đến nhiều nhược điểm:

- **Xung đột môi trường:** Các dịch vụ đòi hỏi các phiên bản runtime khác nhau (Next.js cần Node.js v20+, Go Backend cần Go v1.21+, FastAPI cần Python v3.10+). Cài đặt tất cả chung trên máy chủ dễ gây xung đột thư viện dùng chung.
- **Quản lý phức tạp:** Phải viết và duy trì nhiều tệp cấu hình `.service` cho systemd, đồng thời quản lý thủ công các tiến trình nền.
- **Khó sao lưu và phục hồi:** Việc chuyển đổi VPS đòi hỏi cài đặt lại toàn bộ thư viện từ đầu.

Hệ thống **ConferenceSpace** giải quyết triệt để vấn đề này bằng việc đưa Docker Compose làm bộ điều phối dịch vụ cốt lõi. Docker Daemon đóng vai trò là một dịch vụ systemd duy nhất (`docker.service`) khởi chạy cùng hệ điều hành:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Tất cả các dịch vụ riêng lẻ bên trong được định nghĩa nhất quán tại một tệp [docker-compose.prod.yml](file:///e:/HCMUS/Graduate-Project/ConferenceSpace/deployment/docker-compose.prod.yml). Chúng tự động khởi chạy và khởi động lại nếu bị lỗi thông qua chính sách `restart: unless-stopped` của Docker.

#### Cấu hình dịch vụ Docker Compose

Dưới đây là nội dung tệp cấu hình triển khai [docker-compose.prod.yml](file:///e:/HCMUS/Graduate-Project/ConferenceSpace/deployment/docker-compose.prod.yml):

```yaml
name: conferencespace

services:
  # Caddy: Reverse Proxy & SSL Auto-renew
  frontend:
    image: caddy:2-alpine
    container_name: conferencespace-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      web:
        condition: service_started
      backend:
        condition: service_started
    networks:
      - app
    restart: unless-stopped

  # Next.js Web Frontend
  web:
    image: ${FRONTEND_IMAGE}
    container_name: conferencespace-web
    env_file:
      - path: ./.env.production
        required: false
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_BASE_URL: ${PUBLIC_API_BASE_URL:-/api/backend}
      BACKEND_API_BASE_URL: http://backend:8080
      AI_SERVICE_BASE_URL: http://ai-service:8090
    depends_on:
      backend:
        condition: service_started
    networks:
      - app
    restart: unless-stopped

  # Go HTTP REST API Backend
  backend:
    image: ${BACKEND_IMAGE}
    container_name: conferencespace-backend
    env_file:
      - path: ./.env.production
        required: false
    environment:
      SERVER_PORT: 8080
      SERVER_ENV: production
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      DB_SSLMODE: disable
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USERNAME: ${NEO4J_USERNAME}
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      AI_SERVICE_BASE_URL: http://ai-service:8090
      FILE_STORAGE_LOCAL_BASE_PATH: /data/uploads/submissions
    volumes:
      - uploads_data:/data/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - app
      - data
    restart: unless-stopped

  # PostgreSQL Relational Database
  postgres:
    image: postgres:15-alpine
    container_name: conferencespace-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - data
    restart: unless-stopped

  # Neo4j Graph Database
  neo4j:
    image: neo4j:5.15-community
    container_name: conferencespace-neo4j
    environment:
      NEO4J_AUTH: ${NEO4J_USERNAME}/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc"]'
      NEO4J_dbms_security_procedures_unrestricted: apoc.*
      NEO4J_dbms_security_procedures_allowlist: apoc.*
      NEO4J_server_memory_heap_initial__size: ${NEO4J_HEAP_INITIAL:-256m}
      NEO4J_server_memory_heap_max__size: ${NEO4J_HEAP_MAX:-512m}
      NEO4J_server_memory_pagecache_size: ${NEO4J_PAGECACHE:-256m}
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
      - neo4j_plugins:/plugins
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1",
        ]
      interval: 15s
      timeout: 10s
      retries: 8
      start_period: 60s
    networks:
      - app
      - data
    restart: unless-stopped

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: conferencespace-redis
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - data
    restart: unless-stopped

  # FastAPI AI Service
  ai-service:
    image: ${AI_SERVICE_IMAGE}
    container_name: conferencespace-ai-service
    env_file:
      - path: ./.env.production
        required: false
    environment:
      AI_SERVICE_HOST: 0.0.0.0
      AI_SERVICE_PORT: 8090
      AI_SERVICE_ENV: production
      REDIS_URL: redis://redis:6379/0
      POSTGRES_DSN: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      BACKEND_API_BASE_URL: http://backend:8080
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      backend:
        condition: service_started
    networks:
      - app
      - data
    restart: unless-stopped

  # Database Migration Task
  backend-migrate:
    image: ${BACKEND_IMAGE}
    container_name: conferencespace-backend-migrate
    env_file:
      - path: ./.env.production
        required: false
    command:
      [
        "migrate",
        "-path",
        "/root/migrations",
        "-database",
        "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable",
        "up",
      ]
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - data
    restart: "no"

volumes:
  caddy_data:
  caddy_config:
  postgres_data:
  redis_data:
  neo4j_data:
  neo4j_logs:
  neo4j_plugins:
  uploads_data:

networks:
  app:
    driver: bridge
  data:
    driver: bridge
    internal: true
```

#### Quản lý vận hành dịch vụ trên VPS

Quản trị viên có thể kết nối vào server và di chuyển đến thư mục `/opt/conferencespace` để quản trị các dịch vụ bằng lệnh CLI:

- **Kiểm tra trạng thái các dịch vụ:**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
- **Theo dõi log ghi nhận trực tiếp của ứng dụng:**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f frontend web backend ai-service
  ```
- **Khởi chạy cưỡng bức quy trình đồng bộ cơ sở dữ liệu:**
  ```bash
  docker compose -f docker-compose.prod.yml run --rm backend-migrate
  ```

---

### 4.1.4 Cấu hình Caddy làm Reverse Proxy và Bảo mật HTTPS

#### So sánh Caddy và giải pháp Nginx & Certbot truyền thống

Thông thường, các hệ thống web truyền thống sử dụng Nginx làm reverse proxy và cài đặt Certbot thủ công qua Snapd để đăng ký và tự viết kịch bản cron job gia hạn HTTPS. Giải pháp này gây ra một số khó khăn:

- **Cấu hình phức tạp:** Nginx yêu cầu khai báo chi tiết đường dẫn chứng chỉ SSL, cấu hình mã hóa và chuyển hướng HTTP sang HTTPS thủ công.
- **Rủi ro lỗi gia hạn:** Certbot đôi lúc gặp trục trặc trong quá trình tự động gia hạn nếu cổng 80 bị chặn hoặc cấu hình Nginx bị thay đổi, dẫn đến gián đoạn HTTPS trên môi trường thực tế.

ConferenceSpace thay thế hoàn toàn Nginx và Certbot bằng **Caddy Server** (sử dụng image `caddy:2-alpine`).

- **HTTPS Tự động hoàn toàn (Automatic HTTPS):** Caddy tích hợp sẵn ACME client. Khi cấu hình một domain cụ thể, Caddy tự động liên hệ với Let's Encrypt hoặc ZeroSSL để tạo khóa, đăng ký chứng chỉ TLS và thực hiện gia hạn tự động trước khi hết hạn mà không cần bất kỳ script hay cấu hình Cron job nào bên ngoài.

#### Nội dung tệp cấu hình Caddyfile

Cấu hình chi tiết định tuyến của Caddy được lưu trữ trong tệp Caddyfile

```caddy
conference-space.com, www.conference-space.com {
	encode zstd gzip
	reverse_proxy /ws/* backend:8080
	reverse_proxy web:3000
}
```

#### Nguyên lý định tuyến trong Docker Network

Caddy container lắng nghe cổng public `80` và `443` trên VPS. Khi nhận yêu cầu từ người dùng:

1.  **Lưu lượng Websocket (`/ws/*`):** Caddy chuyển hướng (proxy) trực tiếp đến API Go backend (`backend:8080`) để xử lý các thông báo thời gian thực.
2.  **Lưu lượng HTTP thông thường:** Được chuyển hướng đến container chạy ứng dụng Next.js (`web:3000`).
3.  **Tương tác Client-Server API:** Trình duyệt gọi các API dạng `/api/backend/...`. Frontend Next.js nhận yêu cầu này và định tuyến qua mạng nội bộ Docker đến Go Backend (`http://backend:8080`). Go Backend khi cần gọi các dịch vụ AI sẽ kết nối trực tiếp đến FastAPI AI Service (`http://ai-service:8090`).
4.  **Bảo mật dữ liệu:** Do PostgreSQL, Redis và Neo4j chỉ nằm trong mạng nội bộ `data` (được gắn nhãn `internal: true`), việc truy cập trái phép từ bên ngoài vào cơ sở dữ liệu là hoàn toàn bất khả thi.

---

### 4.1.5 Kiểm tra và Gỡ lỗi

#### Kiểm tra trạng thái hoạt động công khai

Sau khi quy trình deploy CI/CD hoàn tất, quản trị viên kiểm tra hệ thống qua các URL công khai:

- **Ứng dụng Client (Tác giả, Phản biện):** `https://conference-space.com` (hoặc truy cập trực tiếp qua cổng dự phòng mở trên VPS: `http://SERVER_IP:3000` để kiểm tra kết nối thô).
- **API Gateway và Websocket connection:** `https://conference-space.com/ws/` để kiểm tra kết nối thời gian thực.

#### Quy trình gỡ lỗi (Debugging workflow)

Khi hệ thống xảy ra sự cố (v.d. lỗi gọi LLM API, lỗi kết nối cơ sở dữ liệu, lỗi phân công phản biện), quản trị viên thực hiện gỡ lỗi qua các bước:

1.  **Kiểm tra logs của API Backend (Go):**
    ```bash
    docker compose logs -f backend
    ```
    Giúp xác định xem hệ thống có gặp lỗi truy vấn PostgreSQL/Neo4j hay lỗi bắt tay REST API với AI service hay không.
2.  **Kiểm tra logs của AI Service (FastAPI):**
    ```bash
    docker compose logs -f ai-service
    ```
    Giúp xác định các lỗi liên quan đến cấu hình khóa API OpenAI/OpenRouter, hoặc lỗi xử lý định dạng file PDF bài nộp của mô hình.
3.  **Kiểm tra trạng thái kết nối Database:**
    ```bash
    docker exec -it conferencespace-postgres pg_isready -U postgres
    ```
4.  **Sao lưu dữ liệu trước khi bảo trì (Backup):**
    Các dữ liệu quan trọng như tài liệu bài nộp PDF được lưu trữ ở Docker Volume `uploads_data`. Dữ liệu cơ sở dữ liệu lưu tại `postgres_data` và `neo4j_data`. Quản trị viên cần chạy lệnh sao lưu nén thư mục volume trước khi tiến hành nâng cấp hệ thống lớn hoặc dọn dẹp hệ điều hành:
    ```bash
    tar -czf backup_postgres.tar.gz /var/lib/docker/volumes/conferencespace_postgres_data/_data
    tar -czf backup_uploads.tar.gz /var/lib/docker/volumes/conferencespace_uploads_data/_data
    ```

Sự kết hợp đồng bộ giữa Docker Compose và Caddy giúp ConferenceSpace vận hành ổn định, tự động phục hồi lỗi, bảo mật HTTPS tối ưu và sẵn sàng cho việc đóng gói di chuyển sang các máy chủ khác một cách nhanh chóng.
