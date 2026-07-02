# 2.4 Khảo Sát Công Cụ Hỗ Trợ Thu Thập Dữ Liệu

## 2.4.1 Bối cảnh và nhu cầu thu thập dữ liệu

ConferenceSpace cần dữ liệu về hồ sơ học thuật của người dùng (tác giả và người phản biện) để phục vụ hai tính năng cốt lõi:

1. **Gợi ý reviewer**: Tính điểm phù hợp giữa lĩnh vực chuyên môn của reviewer và chủ đề bài báo
2. **Phát hiện COI**: Xây dựng đồ thị đồng tác giả để phát hiện xung đột lợi ích

Dữ liệu cần thu thập bao gồm: danh sách bài báo đã xuất bản, lĩnh vực nghiên cứu (fields of study), mạng lưới đồng tác giả — từ cơ sở dữ liệu học thuật như **Semantic Scholar**, **Google Scholar**, **DBLP**.

Để thu thập dữ liệu này, nhóm khảo sát ba phương pháp chính:
- **Web scraping** bằng các công cụ tự động hoá trình duyệt: Selenium, Puppeteer, Playwright
- **Gọi API trực tiếp**: Semantic Scholar Open API

---

## 2.4.2 Selenium

**Selenium** (selenium.dev) là framework kiểm thử và tự động hoá trình duyệt lâu đời nhất, ra đời từ năm 2004.

### Kiến trúc

```
Test Script (Python/Java/JS)
        │
        ▼
  WebDriver Protocol
        │
        ▼
  Browser Driver (ChromeDriver, GeckoDriver...)
        │
        ▼
      Browser
```

### Tính năng chính

- Hỗ trợ nhiều ngôn ngữ: Python, Java, C#, JavaScript, Ruby
- Hỗ trợ nhiều trình duyệt: Chrome, Firefox, Edge, Safari
- Selenium Grid cho phép chạy song song trên nhiều máy
- Tương tác đầy đủ với trang web: click, fill form, scroll, v.v.

### Đánh giá cho bài toán thu thập dữ liệu học thuật

| Tiêu chí | Đánh giá |
|----------|----------|
| **Hỗ trợ JavaScript** | ✅ Đầy đủ (chạy browser thực) |
| **Xử lý SPA/React** | ✅ Hoạt động tốt |
| **Tốc độ** | ❌ Chậm — khởi động browser nặng |
| **Độ ổn định** | ⚠️ Dễ bị flaky do timing issues |
| **Cài đặt** | ❌ Phức tạp — cần ChromeDriver khớp version Chrome |
| **Resource tiêu thụ** | ❌ Nặng — mỗi browser instance tốn ~100–200 MB RAM |
| **Anti-bot bypass** | ⚠️ Có thể bị detect |
| **Headless mode** | ✅ Hỗ trợ |

### Hạn chế chính

- Tốc độ chậm do khởi động browser đầy đủ cho mỗi request
- Dễ bị phát hiện là bot bởi Google Scholar (CAPTCHA, block IP)
- Không phù hợp cho thu thập dữ liệu quy mô lớn liên tục

---

## 2.4.3 Puppeteer

**Puppeteer** (pptr.dev) là thư viện Node.js của Google, cung cấp API điều khiển Chromium/Chrome qua DevTools Protocol.

### Kiến trúc

```
Node.js Script
      │
      ▼
  Puppeteer API
      │
      ▼
Chrome DevTools Protocol (CDP)
      │
      ▼
  Chromium (headless)
```

### Tính năng chính

- API cấp cao, dễ sử dụng hơn Selenium
- Kiểm soát trực tiếp Chromium — ổn định hơn WebDriver
- Hỗ trợ screenshot, PDF generation
- Intercept network requests
- Chỉ hỗ trợ Chromium/Chrome (không đa trình duyệt)

### Đánh giá cho bài toán thu thập dữ liệu

| Tiêu chí | Đánh giá |
|----------|----------|
| **Hỗ trợ JavaScript** | ✅ Native (Node.js + Chromium) |
| **Tốc độ** | ⚠️ Trung bình — vẫn chạy browser |
| **API dễ dùng** | ✅ API rõ ràng, Promise-based |
| **Ngôn ngữ hỗ trợ** | ❌ Chỉ JavaScript/TypeScript |
| **Đa trình duyệt** | ❌ Chỉ Chromium |
| **Cài đặt** | ✅ Đơn giản hơn Selenium (`npm install puppeteer`) |
| **Intercept network** | ✅ Có thể bắt API response |
| **Resource tiêu thụ** | ❌ Vẫn nặng như Selenium |

### Ưu điểm so với Selenium

- Ổn định hơn — sử dụng DevTools Protocol trực tiếp thay vì WebDriver
- Có thể intercept network response → bắt dữ liệu JSON từ API call của trang web
- API hiện đại hơn, code ngắn gọn hơn

---

## 2.4.4 Playwright

**Playwright** (playwright.dev) là công cụ tự động hoá trình duyệt thế hệ mới từ Microsoft, phát hành năm 2020.

### Kiến trúc

```
Script (Python/JS/Java/C#/.NET)
        │
        ▼
  Playwright API
        │
        ▼
  Browser Driver (Chromium/Firefox/WebKit)
        │
        ▼
      Browser
```

### Tính năng chính

- Hỗ trợ đa trình duyệt: **Chromium, Firefox, WebKit (Safari)** — một API cho tất cả
- Hỗ trợ nhiều ngôn ngữ: Python, JavaScript/TypeScript, Java, C#
- **Auto-waiting** — tự động chờ element xuất hiện trước khi tương tác
- **Tracing** — ghi lại toàn bộ session để debug
- **API testing** — có thể test REST API trực tiếp
- **Stealth mode** — ít bị detect là bot hơn
- Parallel execution tốt hơn Selenium

### Đánh giá cho bài toán thu thập dữ liệu

| Tiêu chí | Đánh giá |
|----------|----------|
| **Tốc độ** | ✅ Nhanh hơn Selenium nhờ auto-waiting hiệu quả |
| **Độ ổn định** | ✅ Cao — auto-waiting giảm flakiness |
| **Đa ngôn ngữ** | ✅ Python, JS, Java, C# |
| **Đa trình duyệt** | ✅ Chromium + Firefox + WebKit |
| **Cài đặt** | ✅ Đơn giản (`pip install playwright`) |
| **Stealth** | ✅ Ít bị detect hơn Selenium |
| **Network intercept** | ✅ Request/response interception |
| **Resource tiêu thụ** | ⚠️ Vẫn cần browser process |

---

## 2.4.5 Semantic Scholar Open API

**Semantic Scholar API** (api.semanticscholar.org) là REST API miễn phí cung cấp dữ liệu học thuật có cấu trúc:

- Hồ sơ tác giả (tên, affiliation, lĩnh vực nghiên cứu)
- Danh sách bài báo đã xuất bản
- Mạng lưới đồng tác giả
- Trích dẫn và tham khảo

### Ưu điểm so với web scraping

| Tiêu chí | Web Scraping | Semantic Scholar API |
|----------|-------------|---------------------|
| Tốc độ | Chậm (1–5 req/s) | Nhanh (100+ req/s với API key) |
| Độ ổn định | Dễ hỏng khi UI thay đổi | Ổn định — API versioned |
| Dữ liệu có cấu trúc | Cần parse HTML | JSON trực tiếp |
| Anti-bot | Bị CAPTCHA, IP block | Hợp pháp, có rate limit rõ ràng |
| Chi phí | Nặng CPU/RAM | Nhẹ — HTTP request đơn giản |
| Hợp pháp | Có thể vi phạm ToS | ✅ Hợp pháp, miễn phí |

---

## 2.4.6 So sánh tổng quan

| Tiêu chí | Selenium | Puppeteer | Playwright | Semantic Scholar API |
|----------|----------|-----------|------------|---------------------|
| **Ngôn ngữ** | Nhiều | JS only | Nhiều | Bất kỳ (HTTP) |
| **Trình duyệt** | Nhiều | Chrome | Nhiều | N/A |
| **Tốc độ** | ❌ Chậm | ⚠️ Trung bình | ✅ Nhanh | ✅✅ Rất nhanh |
| **Ổn định** | ❌ Flaky | ⚠️ Trung bình | ✅ Cao | ✅✅ Rất cao |
| **Dữ liệu có cấu trúc** | ❌ Cần parse | ❌ Cần parse | ❌ Cần parse | ✅ JSON sẵn |
| **Xử lý JS/SPA** | ✅ | ✅ | ✅ | N/A |
| **Anti-bot** | ❌ Bị block | ⚠️ | ✅ Tốt hơn | ✅ Hợp pháp |
| **Resource** | ❌ Nặng | ❌ Nặng | ⚠️ | ✅ Nhẹ |
| **Hợp pháp** | ⚠️ | ⚠️ | ⚠️ | ✅ |
| **Phức tạp tích hợp** | Cao | Trung bình | Trung bình | ✅ Thấp |

---

## 2.4.7 Quyết định lựa chọn

Sau khi phân tích, nhóm quyết định sử dụng **Semantic Scholar Open API** làm nguồn dữ liệu chính vì:

1. **Hợp pháp và đáng tin cậy**: API được thiết kế để sử dụng công khai, không vi phạm Terms of Service như web scraping.

2. **Dữ liệu có cấu trúc sẵn**: Trả về JSON với đầy đủ thông tin author profile, publications, co-authors — không cần parse HTML.

3. **Nhanh và nhẹ**: HTTP request đơn giản, không cần khởi động browser — phù hợp để chạy background job.

4. **Dễ tích hợp vào Go**: Gọi HTTP từ Go backend đơn giản hơn nhiều so với tích hợp Selenium/Playwright.

5. **Cache được**: Kết quả được cache 7 ngày trong bảng `semantic_scholar_cache` (PostgreSQL) để tránh gọi API trùng lặp.

### Playwright vẫn được sử dụng cho mục đích khác

Tuy không dùng cho thu thập dữ liệu production, **Playwright** được sử dụng trong dự án cho:
- **End-to-end testing** (frontend automation test)
- Kiểm tra giao diện trên nhiều trình duyệt
- Test script UAT (User Acceptance Testing)

Điều này phù hợp với thế mạnh của Playwright: ổn định, đa trình duyệt, tích hợp tốt với Next.js/TypeScript.
