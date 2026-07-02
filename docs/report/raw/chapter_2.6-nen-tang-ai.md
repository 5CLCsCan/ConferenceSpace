# 2.6 So Sánh Tổng Quan Các Nền Tảng AI

## 2.6.1 Bối cảnh lựa chọn nền tảng AI

ConferenceSpace tích hợp AI ở nhiều tính năng quan trọng: autofill bài báo, gợi ý track, kiểm tra chất lượng (precheck), gợi ý reviewer, kiểm tra bài phản biện, và hỗ trợ quyết định. Mỗi tính năng đặt ra các yêu cầu khác nhau về:

- **Đầu vào multimodal**: Một số tính năng cần xử lý tệp PDF (autofill)
- **Tốc độ**: Người dùng không muốn chờ hơn 10 giây
- **Chi phí**: Đồ án sinh viên — ưu tiên miễn phí hoặc chi phí thấp
- **Chất lượng**: Đầu ra phải đủ chính xác để người dùng tin tưởng

Ba nền tảng AI được khảo sát và so sánh:

1. **Google Gemini** — nền tảng AI của Google DeepMind
2. **OpenAI (GPT series)** — nền tảng AI tiên phong, phổ biến nhất
3. **DeepSeek** — nền tảng AI mã nguồn mở từ Trung Quốc

---

## 2.6.2 Google Gemini

**Gemini** (ai.google.dev) là họ mô hình AI đa phương thức (multimodal) của Google, được phát triển bởi Google DeepMind. Họ mô hình bao gồm nhiều phiên bản: Gemini Ultra, Pro, Flash, Nano.

### Các mô hình chính

| Model | Năng lực | Tốc độ | Phù hợp |
|-------|----------|--------|---------|
| **Gemini 2.0 Flash** | Tốt | ✅ Rất nhanh | Production, low latency |
| **Gemini 2.5 Pro** | ✅ Rất cao | ⚠️ Chậm hơn | Nhiệm vụ phức tạp |
| **Gemini 1.5 Flash** | Tốt | ✅ Nhanh | Tổng quát |
| **Gemini Nano** | Cơ bản | ✅✅ | On-device |

### Điểm nổi bật

- **Context window lớn**: Gemini 1.5 Pro hỗ trợ 1 triệu token — có thể xử lý tài liệu dài
- **Multimodal thực sự**: Xử lý text, image, audio, video, và **PDF trực tiếp**
- **Google Search grounding**: Có thể kết nối với kết quả tìm kiếm thực tế
- **Free tier**: Gemini 2.0 Flash miễn phí với rate limit đủ dùng cho đồ án
- **Google AI Studio**: IDE online để test prompt miễn phí

### API

```python
# Ví dụ gọi Gemini với PDF (tính năng autofill)
import google.generativeai as genai

model = genai.GenerativeModel('gemini-2.0-flash')
response = model.generate_content([
    "Trích xuất tiêu đề, tóm tắt, từ khóa từ PDF này:",
    pdf_part  # bytes của tệp PDF
])
```

### Ưu điểm

- ✅ Miễn phí (rate limited) — lý tưởng cho đồ án
- ✅ Xử lý PDF trực tiếp không cần convert
- ✅ Context window rất lớn
- ✅ Tích hợp tốt với Google Cloud ecosystem
- ✅ Tốc độ Flash rất tốt

### Hạn chế

- ⚠️ Đôi khi kết quả không nhất quán giữa các lần gọi
- ⚠️ Free tier có rate limit khá thấp (15 req/phút với Flash)
- ⚠️ Cần account Google để lấy API key

---

## 2.6.3 OpenAI (GPT Series)

**OpenAI** (openai.com) là công ty tiên phong trong AI tạo sinh, nổi tiếng với các mô hình GPT (Generative Pre-trained Transformer).

### Các mô hình chính

| Model | Năng lực | Tốc độ | Chi phí (input/output per 1M tokens) |
|-------|----------|--------|---------------------------------------|
| **GPT-4o** | ✅✅ Rất cao | ✅ Nhanh | ~$5 / ~$15 |
| **GPT-4o mini** | Tốt | ✅✅ Rất nhanh | ~$0.15 / ~$0.60 |
| **GPT-4 Turbo** | ✅✅ Rất cao | ⚠️ | ~$10 / ~$30 |
| **o1/o3** | ✅✅✅ SOTA | ❌ Rất chậm | Rất đắt |

### Điểm nổi bật

- **Hệ sinh thái lớn nhất**: Nhiều thư viện, tool, plugin hỗ trợ
- **Function Calling / Tool Use**: Gọi hàm ngoài từ model — tích hợp AI với code
- **Assistants API**: Quản lý conversation state, file upload
- **Vision**: GPT-4o có thể phân tích hình ảnh
- **Cộng đồng lớn**: Nhiều tài liệu, ví dụ, hỗ trợ

### API

```python
# Ví dụ gọi GPT-4o với Function Calling
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Extract paper metadata..."}],
    tools=[extract_paper_tool]  # Function calling
)
```

### Ưu điểm

- ✅ Chất lượng output rất cao, nhất quán
- ✅ Hệ sinh thái và tài liệu phong phú nhất
- ✅ Function Calling mạnh mẽ
- ✅ GPT-4o mini rẻ và nhanh

### Hạn chế

- ❌ **Có phí** — không có tier miễn phí đủ dùng cho production
- ❌ Dữ liệu gửi đến server nước ngoài — lo ngại về bảo mật/privacy
- ⚠️ Context window nhỏ hơn Gemini 1.5 (128K tokens với GPT-4o)
- ❌ Xử lý PDF cần convert thành text trước (không native như Gemini)

---

## 2.6.4 DeepSeek

**DeepSeek** (deepseek.com) là công ty AI Trung Quốc (DeepSeek AI, thuộc Liang Wenfeng's High-Flyer fund), nổi lên mạnh mẽ từ cuối 2024 với các mô hình mã nguồn mở chất lượng cao.

### Các mô hình chính

| Model | Loại | Năng lực | Chi phí |
|-------|------|----------|--------|
| **DeepSeek-V3** | Closed (API) | ✅✅ Rất cao | ✅ Rất rẻ (~$0.07/1M input) |
| **DeepSeek-R1** | Open-weight | ✅✅✅ SOTA reasoning | Miễn phí (self-host) |
| **DeepSeek-Coder** | Open-weight | ✅✅ Code | Miễn phí (self-host) |

### Điểm nổi bật

- **Mã nguồn mở (open-weight)**: DeepSeek-R1 và các mô hình nhỏ có thể tự host
- **Chi phí API thấp nhất**: DeepSeek-V3 API rẻ hơn GPT-4o khoảng 70–100 lần
- **Khả năng suy luận (Reasoning)**: DeepSeek-R1 cạnh tranh với GPT-o1 trong nhiều benchmark
- **Chain-of-Thought**: Thể hiện rõ quá trình suy luận trước khi đưa ra câu trả lời

### Ưu điểm

- ✅✅ Chi phí API cực thấp
- ✅ Mã nguồn mở — có thể tự host để bảo vệ dữ liệu nhạy cảm
- ✅ Reasoning model R1 mạnh cho phân tích phức tạp
- ✅ Benchmark cạnh tranh với GPT-4o

### Hạn chế

- ❌ **Không hỗ trợ multimodal** (không xử lý PDF trực tiếp như Gemini)
- ❌ Lo ngại về bảo mật dữ liệu (công ty Trung Quốc, dữ liệu lưu tại Trung Quốc)
- ⚠️ Hệ sinh thái còn nhỏ hơn OpenAI
- ⚠️ Self-hosting đòi hỏi cơ sở hạ tầng mạnh (70B model cần nhiều VRAM)

---

## 2.6.5 Bảng So Sánh Tổng Hợp

| Tiêu chí | Google Gemini | OpenAI GPT | DeepSeek |
|----------|:------------:|:----------:|:--------:|
| **Chi phí Free Tier** | ✅ Có (Flash) | ❌ Không | ✅ Có (API rẻ) |
| **Chi phí trả phí** | ⚠️ Trung bình | ❌ Đắt | ✅✅ Rất rẻ |
| **Multimodal (PDF)** | ✅✅ Native | ⚠️ Cần convert | ❌ Không |
| **Context Window** | ✅✅ 1M tokens | ✅ 128K tokens | ✅ 128K tokens |
| **Chất lượng text** | ✅ Cao | ✅✅ Rất cao | ✅✅ Cao |
| **Reasoning** | ✅ Tốt | ✅✅ Rất tốt (o1) | ✅✅ Rất tốt (R1) |
| **Tốc độ** | ✅✅ Flash nhanh | ✅ 4o-mini nhanh | ✅ Nhanh |
| **Mã nguồn mở** | ❌ | ❌ | ✅ (open-weight) |
| **Tự host** | ❌ | ❌ | ✅ |
| **Hệ sinh thái** | ✅ Tốt | ✅✅ Rất tốt | ⚠️ Đang phát triển |
| **Bảo mật/Privacy** | ✅ Google | ✅ Mỹ | ⚠️ Trung Quốc |
| **Tích hợp đơn giản** | ✅ | ✅ | ✅ (OpenAI-compatible) |
| **Phù hợp đồ án SV** | ✅✅ | ⚠️ | ✅ |

---

## 2.6.6 Quyết định lựa chọn

### AI chính: Google Gemini (gemini-2.0-flash)

**Lý do:**

1. **Miễn phí**: Free tier của Gemini 2.0 Flash đủ dùng cho quy mô đồ án (15 req/phút, 1500 req/ngày).

2. **Multimodal PDF native**: Tính năng autofill yêu cầu xử lý trực tiếp tệp PDF bài báo — Gemini là lựa chọn duy nhất hỗ trợ native, không cần bước trung gian convert.

3. **Context window lớn**: Phân tích tổng hợp nhiều bài phản biện cùng lúc (Decision Copilot) cần context dài.

4. **Tốc độ Flash**: Các tính năng autofill, track suggestion, precheck cần phản hồi nhanh (< 5 giây) — Gemini Flash đáp ứng tốt.

### Chatbot: OpenRouter

**Lý do**: OpenRouter đóng vai trò **gateway** cho phép routing đến nhiều model (bao gồm cả Gemini, GPT, Claude, Llama). Điều này cho phép chatbot linh hoạt — có thể chuyển model tuỳ theo nhu cầu và chi phí mà không cần thay đổi code backend.

### Tại sao không chọn DeepSeek làm AI chính?

Dù chi phí rất hấp dẫn, DeepSeek không được chọn làm AI chính vì:
- **Không hỗ trợ PDF native** — tính năng autofill là cốt lõi của hệ thống
- **Lo ngại bảo mật**: Dữ liệu bài báo học thuật (chưa xuất bản) gửi đến server Trung Quốc đặt ra rủi ro về sở hữu trí tuệ

DeepSeek vẫn có thể là lựa chọn phù hợp cho các tính năng chỉ xử lý text thuần (review checker, decision copilot) trong tương lai nếu chi phí là yếu tố quyết định.

---

## 2.6.7 Tóm tắt

| Tính năng | Nền tảng AI sử dụng | Lý do |
|-----------|---------------------|-------|
| AI Autofill | **Gemini 2.0 Flash** | PDF native, multimodal |
| Track Suggestion | **Gemini 2.0 Flash** | Nhanh, miễn phí |
| AI Precheck | **Gemini 2.0 Flash** | Nhanh, miễn phí |
| Review Checker | **Gemini 2.0 Flash** | Chất lượng phân tích text tốt |
| Decision Copilot | **Gemini 2.0 Flash** | Context window lớn |
| Chatbot | **OpenRouter** (multi-model) | Linh hoạt, không lock-in vendor |
