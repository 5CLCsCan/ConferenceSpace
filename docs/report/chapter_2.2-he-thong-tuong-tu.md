# 2.2 Khảo Sát Các Hệ Thống Tương Tự

## 2.2.1 Tổng quan

Trước khi thiết kế ConferenceSpace, nhóm tiến hành nghiên cứu và phân tích các hệ thống quản lý hội nghị học thuật hiện có trên thế giới. Mục tiêu là xác định những tính năng cốt lõi, điểm mạnh, điểm yếu và khoảng trống (gap) mà ConferenceSpace có thể lấp đầy — đặc biệt là về tích hợp AI và trải nghiệm người dùng.

Các hệ thống được khảo sát bao gồm:

| Hệ thống | Loại | Vai trò chính hỗ trợ |
|----------|------|---------------------|
| **EasyChair** | Quản lý hội nghị toàn diện | Author, Reviewer, Chair |
| **HotCRP** | Quản lý phản biện | Reviewer, Chair |
| **Microsoft CMT** | Quản lý hội nghị toàn diện | Author, Reviewer, Chair |
| **WikiCFP** | Cổng thông tin CFP | Author (tìm hội nghị) |
| **ICORE** | Xếp hạng hội nghị | Author (tra cứu chất lượng) |
| **ConfHub** | Theo dõi hội nghị | Author |
| **OpenReview** | Phản biện công khai | Author, Reviewer |

---

## 2.2.2 EasyChair

**EasyChair** là hệ thống quản lý hội nghị học thuật phổ biến nhất thế giới, được sử dụng bởi hàng nghìn hội nghị mỗi năm.

### Tính năng chính

- Quản lý toàn bộ vòng đời hội nghị: CFP → Submission → Review → Decision → Camera-ready
- Hỗ trợ nhiều track và vai trò phức tạp
- Phân công phản biện thủ công và bán tự động
- Giao tiếp email giữa chair và reviewer/author
- Export dữ liệu dạng CSV/Excel

### Điểm mạnh

- Hoàn thiện về mặt nghiệp vụ — hỗ trợ đầy đủ các quy trình hội nghị
- Được cộng đồng học thuật tin tưởng từ lâu
- Miễn phí cho hầu hết hội nghị

### Điểm yếu

| Vấn đề | Mô tả |
|--------|-------|
| Giao diện cũ | UI thiết kế theo phong cách thập niên 2000, khó sử dụng với người mới |
| Không có AI | Hoàn toàn không có tính năng AI hỗ trợ phân công hay gợi ý |
| Phát hiện COI thủ công | Chair phải tự kiểm tra xung đột lợi ích |
| Trải nghiệm tác giả kém | Quy trình nộp bài không trực quan |
| Không realtime | Không có thông báo realtime |

---

## 2.2.3 HotCRP

**HotCRP** là hệ thống chuyên biệt cho việc quản lý phản biện, được sử dụng nhiều trong các hội nghị hệ thống máy tính (OSDI, SOSP, USENIX, v.v.).

### Tính năng chính

- Phân công phản biện với cơ chế bidding (reviewer tự đặt ưu tiên)
- Hỗ trợ phản biện nhiều vòng
- Discussion thread giữa reviewer và chair
- Quy trình quyết định linh hoạt
- Tích hợp với các tool đọc PDF

### Điểm mạnh

- Tối ưu cho quy trình phản biện nghiêm ngặt
- Cơ chế bidding giúp reviewer chủ động
- Giao diện reviewer khá tốt

### Điểm yếu

| Vấn đề | Mô tả |
|--------|-------|
| Khó cài đặt | Yêu cầu self-hosted, cấu hình phức tạp |
| Không có tính năng AI | Hoàn toàn thủ công |
| Hướng đến người dùng kỹ thuật | Không thân thiện với sinh viên hoặc người mới |
| Không hỗ trợ tác giả tốt | Tập trung vào reviewer/chair |

---

## 2.2.4 Microsoft CMT

**Microsoft CMT (Conference Management Toolkit)** là hệ thống miễn phí của Microsoft, được sử dụng rộng rãi trong các hội nghị AI/ML (NeurIPS, ICML, CVPR, v.v.).

### Tính năng chính

- Quản lý hội nghị toàn diện
- Phân công tự động và thủ công
- Hỗ trợ multi-track và multi-phase review
- Tích hợp với Microsoft ecosystem

### Điểm mạnh

- Hỗ trợ quy mô lớn (hàng nghìn bài nộp)
- Phân công reviewer có hỗ trợ thuật toán cơ bản
- Tích hợp TPMS (Toronto Paper Matching System) để gợi ý reviewer

### Điểm yếu

| Vấn đề | Mô tả |
|--------|-------|
| Giao diện phức tạp | Đường cong học tập cao |
| Phụ thuộc Microsoft | Không linh hoạt, khó tuỳ chỉnh |
| TPMS tách biệt | Phải dùng hệ thống ngoài để matching, không tích hợp liền mạch |
| Không có AI hiện đại | TPMS dùng thuật toán cũ, không dùng LLM |

---

## 2.2.5 WikiCFP

**WikiCFP** (wikicfp.com) là cổng thông tin cộng đồng về Call for Papers — nơi tác giả tìm kiếm hội nghị và workshop phù hợp để nộp bài.

### Tính năng chính

- Cơ sở dữ liệu hội nghị khổng lồ (hàng chục nghìn hội nghị)
- Tìm kiếm và lọc theo lĩnh vực, deadline, địa điểm
- Theo dõi hội nghị yêu thích (bookmarking)
- Không yêu cầu đăng ký

### Điểm mạnh

- Phủ rộng, cộng đồng đóng góp lớn
- Miễn phí và không cần tài khoản để xem

### Điểm yếu

| Vấn đề | Mô tả |
|--------|-------|
| Chỉ là danh bạ | Không hỗ trợ nộp bài — phải chuyển sang hệ thống khác |
| Giao diện lỗi thời | UI không được cập nhật nhiều năm |
| Thông tin không nhất quán | Phụ thuộc vào cộng đồng, hay bị outdated |
| Không cá nhân hoá | Không gợi ý hội nghị dựa trên chuyên môn của tác giả |

---

## 2.2.6 ICORE (CORE Conference Rankings)

**ICORE** (core.edu.au) là cơ sở dữ liệu xếp hạng hội nghị khoa học máy tính, được sử dụng để đánh giá uy tín của hội nghị.

### Tính năng chính

- Tra cứu xếp hạng hội nghị: A*, A, B, C
- Tìm kiếm theo tên, acronym, lĩnh vực

### Vai trò trong nghiên cứu

ICORE không phải hệ thống quản lý hội nghị mà là **công cụ tra cứu chất lượng**. Tuy nhiên, việc tích hợp dữ liệu ICORE vào hệ thống quản lý hội nghị có thể giúp tác giả biết được uy tín của hội nghị họ muốn nộp.

### Điểm yếu

- Chỉ là công cụ tra cứu, không có tính năng nộp bài hay quản lý
- Dữ liệu không cập nhật liên tục

---

## 2.2.7 ConfHub

**ConfHub** (confhub.io) là công cụ theo dõi hội nghị và deadline dành cho nhà nghiên cứu, với giao diện hiện đại hơn WikiCFP.

### Tính năng chính

- Danh sách hội nghị với deadline rõ ràng
- Lọc theo lĩnh vực, loại (conference/workshop/journal)
- UI modern, responsive

### Điểm yếu

- Chỉ là công cụ theo dõi, không phải hệ thống nộp bài/phản biện
- Phạm vi hội nghị hạn chế hơn WikiCFP

---

## 2.2.8 OpenReview

**OpenReview** (openreview.net) là nền tảng phản biện công khai (open peer review), được sử dụng bởi ICLR, NeurIPS (workshop), v.v.

### Tính năng chính

- Phản biện công khai — mọi người đều xem được
- Hỗ trợ multi-round review
- API mở cho nhà nghiên cứu phân tích dữ liệu
- Cộng đồng lớn

### Điểm mạnh

- Minh bạch trong quy trình phản biện
- Dữ liệu mở cho nghiên cứu về peer review

### Điểm yếu

- Mô hình phản biện công khai không phù hợp với hội nghị truyền thống (double-blind review)
- Không có tính năng AI hỗ trợ

---

## 2.2.9 Bảng so sánh tổng quan

| Tiêu chí | EasyChair | HotCRP | CMT | OpenReview | **ConferenceSpace** |
|----------|-----------|--------|-----|------------|---------------------|
| **Nộp bài (Author)** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Phản biện (Reviewer)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Quản lý hội nghị (Chair)** | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Giao diện hiện đại** | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| **AI Autofill** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **AI Gợi ý track** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **AI Gợi ý reviewer** | ❌ | ❌ | ⚠️ TPMS | ❌ | ✅ |
| **Phát hiện COI (Auto)** | ❌ | ❌ | ⚠️ | ❌ | ✅ Neo4j |
| **AI Review Checker** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **AI Decision Copilot** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Thông báo Realtime** | ❌ | ❌ | ❌ | ❌ | ✅ WebSocket |
| **Tạo hội nghị từ template** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Rebuttal** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Miễn phí** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Open-source** | ❌ | ✅ | ❌ | ❌ | ✅ |

**Ghi chú**: ✅ = có đầy đủ, ⚠️ = có nhưng hạn chế, ❌ = không có

---

## 2.2.10 Kết luận và khoảng trống

Qua khảo sát, nhóm nhận thấy:

1. **Tất cả hệ thống hiện tại đều thiếu AI thực sự**: EasyChair, HotCRP và CMT không có tính năng AI hỗ trợ trong quy trình. Microsoft CMT tích hợp TPMS nhưng đây là thuật toán cổ điển (TF-IDF based), không phải AI/LLM hiện đại.

2. **Trải nghiệm người dùng bị bỏ ngỏ**: Hầu hết hệ thống có giao diện cũ, đường cong học tập cao, không thân thiện với người mới (sinh viên, nhà nghiên cứu trẻ).

3. **Phát hiện COI thủ công và không đáng tin cậy**: Không có hệ thống nào tự động phát hiện COI qua đồ thị đồng tác giả.

4. **Không có thông báo realtime**: Các hệ thống chủ yếu dùng email để thông báo — chậm và không tiện lợi.

**ConferenceSpace được xây dựng để lấp đầy khoảng trống này**: tích hợp AI ở mọi giai đoạn, giao diện hiện đại theo vai trò, phát hiện COI tự động bằng Neo4j, và thông báo realtime qua WebSocket.
