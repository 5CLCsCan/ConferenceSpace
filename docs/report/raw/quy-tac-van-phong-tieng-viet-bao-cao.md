# Quy tắc câu từ, văn phong và wording (báo cáo ConferenceSpace)

> **Skill điều phối:** `.cursor/skills/report-vietnamese-academic-style/SKILL.md`  
> File này là **nguồn sự thật** về wording; skill chỉ điều phối review/apply và **bắt buộc** cập nhật file này khi có feedback đáng ghi nhận (mục 7.0).

## Chỉ dẫn tuân thủ và sử dụng khi review

**Ai phải dùng file này**

- Người viết hoặc chỉnh sửa nội dung báo cáo (Markdown / LaTeX).
- Agent AI khi soạn, viết lại, hoặc review câu tiếng Việt trong `docs/report/`.
- Người review bản thảo trước hội đồng: dùng checklist ở cuối làm pass bắt buộc.

**Khi nào bắt buộc áp dụng**

1. Viết mới hoặc viết lại đoạn văn học thuật tiếng Việt trong báo cáo.
2. User trích một câu / đoạn và yêu cầu sửa ngữ nghĩa / văn phong (mặc định: viết lại cho tự nhiên, chuẩn tiếng Việt học thuật — trừ khi user nói rõ yêu cầu khác).
3. Rà soát trước khi chốt PDF / nộp hội đồng.
4. Thay thế calque kỹ thuật cứng (_hợp đồng_, _tất định_, _chi phí tính toán thuần túy_…) bằng cụm đã chốt trong file này.

**Cách dùng khi review (quy trình ngắn)**

1. Đọc đoạn trong ngữ cảnh (không sửa từng từ rời).
2. Chạy **Checklist review** (mục cuối file): mỗi mục FAIL thì sửa trước khi qua mục sau.
3. Ưu tiên bảng **Cụm chốt / Tránh → Dùng** trong file; không invent synonym mới nếu đã có cụm đã thống nhất.
4. Giữ tên riêng kỹ thuật tiếng Anh (Exact Match, ROUGE, k6, Go micro-benchmark, TCA, tên workflow) — chỉ Việt hóa phần _mô tả cách dùng_.
5. Không viết giọng “trả lời reviewer” hay “vá nhận xét hội đồng”; viết như đang trình bày phương pháp và kết quả.
6. **Luôn** soi calque / dịch máy (mục 2.7): nếu cụm nghe như dịch word-by-word từ EN → viết lại nghĩa, không chỉ thay synonym.
7. Ưu tiên **rút gọn** khi cùng ý (mục 2.8): không chỉ “chỉnh wording”, hãy cắt mệnh đề thừa.
8. Kiểm tra **chủ ngữ / chủ thể** (mục 2.9): ai làm, ai tạo ra, ai chịu trách nhiệm — nêu rõ khi dễ mơ.
9. Sau khi sửa: đọc to một lần — nếu nghe dịch máy hoặc cứng, viết lại theo mẫu “trước → sau” trong mục 7.
10. Khi user chấp nhận / chỉnh tay thêm trên bản hệ thống vừa sửa: làm theo **mục 7.0** để ghi ví dụ tiêu biểu vào file này (học từ review, tránh lặp lỗi).

**Không làm**

- Không nhồi ngoặc giải thích kép (Việt + English + định nghĩa dài) nếu không thêm thông tin.
- Không calque máy: dịch từng từ EN rồi nhét lại EN trong ngoặc cùng nghĩa.
- Không mở rộng scope (refactor cấu trúc chương, thêm section “để hội đồng thấy…”) khi task chỉ là wording.
- Không giữ nhãn mờ (_thuần túy_, _hợp đồng_) khi có thể nói chỉ số và hành động cụ thể.
- Không để câu thiếu chủ thể hành động khi nghĩa phụ thuộc vào “ai / cái gì” tạo ra kết quả.

**Nguồn quy tắc**

Rút từ chỉnh sửa thủ công của tác giả trên Chương 4, review wording Chương 1 (Đặt vấn đề), các đề xuất AI bị từ chối (“chắp vá”, calque, nhãn trừu tượng), và các cụm đã được tác giả chốt là tự nhiên.

---

## 1. Mục tiêu văn phong

| Đạt                                                  | Không đạt                                               |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Tự nhiên khi đọc to, vẫn đủ trang trọng học thuật    | Dịch máy, calque, khẩu hiệu                             |
| Câu có chủ – việc làm – mục đích / phạm vi đo        | Liệt kê phẳng metric không nối “để kiểm tra…”           |
| Chỉ số đo được hình dung (thời gian, bộ nhớ, tỉ lệ…) | Nhãn mờ (_chi phí thuần túy_, _hợp đồng_)               |
| Tên chuẩn EN + mô tả VN                              | _kiểm thử hiệu năng vi mô bằng Go (Go micro-benchmark)_ |
| Phương pháp đánh giá                                 | Đoạn biện hộ reviewer                                   |

---

## 2. Cấu trúc câu

### 2.1. Cắt từ dư và giọng biện hộ

- Bỏ nhấn mạnh thừa khi ý đã đủ: _một cách máy móc_, _một cách rập khuôn_.
- Không viết: _để đối chứng với nhận xét thiếu kịch bản_, _nhằm đáp ứng góp ý hội đồng_.
- Viết: mô tả **làm gì – đo gì – vì sao cách đó phù hợp lớp hệ thống**.

| Trước                                                          | Sau                                               |
| -------------------------------------------------------------- | ------------------------------------------------- |
| …thay vì áp dụng một khung đánh giá chung **một cách máy móc** | …thay vì áp dụng một khung đánh giá chung         |
| Chương này đánh giá… _(khẩu hiệu)_                             | Chương này **sẽ** đánh giá… _(định hướng chương)_ |

### 2.2. Động từ đo lường

- Ưu tiên **đo**, **giám sát mức sử dụng…** hơn **đo lường** khi không cần sắc thái thống kê.
- Cụm quá ngắn thì bổ sung danh từ trung tâm: _giám sát tài nguyên_ → _giám sát **mức sử dụng** tài nguyên_.

### 2.3. Câu hỏi nhúng

- Yes/no học thuật: dùng **liệu … hay không**.

| Trước                                               | Sau                                                          |
| --------------------------------------------------- | ------------------------------------------------------------ |
| nhằm trả lời câu hỏi hệ thống có đáp ứng… hay không | nhằm trả lời câu hỏi **liệu** hệ thống có đáp ứng… hay không |

### 2.4. Mục đích sau hành động

- Không liệt kê phẳng: _thử nghiệm thủ công, tỷ lệ…, quyền…, trải nghiệm…_
- Dùng: _thử nghiệm … **để kiểm tra** A, B và C_.

### 2.5. Mức khái quát đúng tầng đoạn

- Phần mục tiêu chương: _dữ liệu đầu vào_ (rộng).
- Kịch bản cụ thể: _bài nộp / bản phản biện / …_ (hẹp).
- Trong cùng đoạn: thống nhất **luồng** (pipeline) vs **quy trình** — không nhảy synonym vô cớ.

### 2.6. Trợ từ làm nghĩa thời điểm / mức rõ

- _đã định_ → ưu tiên **đã định sẵn** (đã có từ trước, không phải vừa định lúc viết).
- Họ gần khi cần: _đã cho sẵn_, _đã thống nhất sẵn_.
- Chỉ thêm _sẵn / rõ / trực tiếp_ khi làm nghĩa rõ hơn; không nhồi đủ ba từ một câu.

### 2.7. Soi dịch máy / calque nghĩa (bắt buộc mỗi lần review)

User chốt: **luôn nghĩ đến trường hợp dịch máy móc và tránh nó** — không chỉ thay từ đồng nghĩa.

Dấu hiệu thường gặp:

| Dấu hiệu | Ví dụ cứng | Hướng sửa |
| -------- | ---------- | --------- |
| Dịch adjective EN word-by-word | _có tính hành động_ (actionable) | Nói **hậu quả / cách dùng**: _dễ chuyển thành chỉnh sửa hơn_ |
| Dịch abstract noun | _tính nhất quán_ (consistency) khi nói xu hướng | _tăng đều_, _ổn định_ |
| Dịch availability | _không khả dụng_ (unavailable) | _không dùng được_, _gián đoạn_ |
| Dịch foundational + platform chồng nhau | _nghiệp vụ nền tảng_ cạnh _nền tảng phần mềm_ | _nghiệp vụ truyền thống / cơ bản_ |
| Cụm đúng nghĩa nhưng dài kiểu textbook | _không đồng nghĩa với việc_ | **Rút gọn**: _không có nghĩa là_ |

### 2.8. Rút gọn khi có thể (không chỉ “chỉnh wording”)

- Nếu hai cách diễn đạt cùng ý: chọn **ngắn hơn, vẫn đủ nghĩa**.
- Ưu tiên cắt mệnh đề khung (_với việc…_, _trong bối cảnh của…_, _không đồng nghĩa với việc…_) trước khi mày mò synonym.
- Rút gọn **không** được làm mất chủ thể, phạm vi đo, hoặc điều kiện.

### 2.9. Chủ ngữ / chủ thể phải rõ

Lỗi hay gặp: _nội dung sinh ra_, _kết quả thu được_, _quyết định được đưa ra_ — thiếu **ai / cái gì** làm ra.

| Tránh | Dùng |
| ----- | ---- |
| độ tin cậy của **nội dung sinh ra** | độ tin cậy của **nội dung do AI tạo ra** |
| kết quả được tạo ra trên dữ liệu | kết quả **hệ thống tạo ra** trên dữ liệu… |
| quyết định thuộc về người dùng hoặc vai trò… | quyết định thuộc về **người hoặc vai trò có thẩm quyền** |

---

## 3. Thuật ngữ tiếng Anh và tiếng Việt

### 3.1. Giữ tiếng Anh

- Tên công cụ / kỹ thuật chuẩn: **k6**, **Go micro-benchmark**, **TCA (Textual Claim-based Assessment)**.
- Tên chỉ số chuẩn: **Exact Match**, **ROUGE**, **F1**, **Truthfulness**, **Coverage**, **Additionality** (có thể kèm tiền tố VN: _độ / tỉ lệ / khả năng_).
- Tên workflow / product: **Submission Autofill**, **Chatbot Agent**, v.v.
- Tên vai trò hội nghị — **lần đầu** dịch VN + EN trong ngoặc; lần sau được rút gọn:
  - **Area Chair** → **Chủ tọa khu vực (Area Chair)**
  - **Chair** (vai trò quyết định) → **Chủ tọa (Chair)** khi cần nối thuật ngữ EN; trong ConferenceSpace thường dùng **Chủ tọa**
  - **rebuttal** → **giai đoạn phản hồi của tác giả (rebuttal)** (lần đầu); sau đó có thể chỉ một trong hai

### 3.2. Việt hóa phần khái niệm vận hành

- **reviewer → phản biện viên** (quy tắc cố định; không dùng _phản biện kỹ thuật_ cho vai trò; không để trần _người phản biện_ nếu ngữ cảnh cần danh xưng nghề).
- Bản / nội dung do phản biện viên viết → **nhận xét phản biện** / **bản phản biện** (tách khỏi vai trò).
- matching → **đối sánh phản biện** (khi nói reviewer matching).
- ranking → **xếp hạng**.
- ground truth (khi không cần EN) → **dữ liệu tham chiếu** / **bản tham chiếu** / **nhãn tham chiếu** (chọn một và giữ nhất quán trong mục).
- proxy → **chỉ số gián tiếp** / **cách đo thay thế** (tránh _bằng chứng thay thế_ nếu nghe gượng).
- _thuật toán xác định_ / deterministic (lớp hệ thống):
  - **Lần đầu trong đoạn/mục:** **thuật toán cố định, có thể kiểm chứng**
  - **Các lần sau (tránh lặp):** xen kẽ **thuật toán có thể kiểm chứng** và **thuật toán xác định**
- _bảo đảm_ vs _đảm bảo_: ưu tiên **đảm bảo** (đã chốt); thống nhất cả báo cáo.
- _giảm tải_ (khi nói công việc người dùng) → ưu tiên **giảm khối lượng công việc**.
- _quan điểm phân hóa_ → **quan điểm không thống nhất**.
- _tính năng_ product: dùng **tính năng** (không _khả năng_ trừu tượng) khi nói chức năng phần mềm.
- Tránh chồng từ **nền tảng** (platform) + **nghiệp vụ nền tảng** (foundational): đổi vế sau thành **nghiệp vụ truyền thống / cơ bản**.

### 3.3. Cấm pattern “dịch rồi nhét lại”

| Tránh                                                             | Dùng                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| kiểm thử hiệu năng vi mô bằng Go (Go micro-benchmark)             | **Go micro-benchmark** + giải thích đo gì                            |
| TCA (… - Đánh giá dựa trên mệnh đề văn bản) + (unstructured text) | **TCA (Textual Claim-based Assessment)**; bỏ gloss kép nếu không cần |

---

## 4. Chỉ số và phạm vi đo: cấm nhãn mờ

### 4.1. Nói được nhìn thấy

| Tránh                             | Dùng                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| chi phí tính toán thuần túy       | **thời gian xử lý và mức sử dụng bộ nhớ**, **không bao gồm** chi phí HTTP, cơ sở dữ liệu và mạng |
| đáp án tham chiếu rõ              | **dữ liệu tham chiếu trực tiếp** / đầu ra **có thể tham chiếu trực tiếp**                        |
| quyền truy cập _(như một metric)_ | **khả năng tuân thủ** quyền truy cập                                                             |

### 4.2. Tiền tố metric

| Tránh                             | Dùng                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| khớp chính xác (Exact Match)      | **tỉ lệ** khớp chính xác (Exact Match)                                                            |
| tính bổ sung _(khi muốn mềm hơn)_ | **khả năng** bổ sung (Additionality) — hoặc giữ _tính bổ sung_ nếu đã định nghĩa formal trong mục |

### 4.3. Micro-benchmark (cụm chuẩn)

- Đo: thời gian xử lý, mức sử dụng / phân bổ bộ nhớ.
- Phạm vi: trong tiến trình / trong bộ nhớ chương trình; **không** gồm mạng, tuần tự hóa HTTP, truy vấn CSDL (nêu khi dễ hiểu nhầm).

---

## 5. Calque cứng → cụm đã chốt (thân thiện)

### 5.1. “Hợp đồng (đầu ra)” / output contract

Nghĩa: đầu ra phải thỏa điều kiện hoặc mẫu đã có sẵn.

| Tránh           | Dùng (đã chốt)                                                        |
| --------------- | --------------------------------------------------------------------- |
| hợp đồng đầu ra | **đối chiếu đầu ra với chuẩn đã định sẵn**                            |
|                 | **kiểm tra đầu ra theo quy tắc rõ ràng**                              |
|                 | **chuẩn đầu ra** / **quy tắc kiểm tra đầu ra** (khi cần danh từ ngắn) |

Ưu tiên **động từ + đối tượng** hơn danh từ mượn.

**Câu mẫu đã chốt**

> Một số luồng AI có thể đánh giá chặt hơn bằng cách **đối chiếu đầu ra với chuẩn đã định sẵn**, vì chúng có dữ liệu tham chiếu trực tiếp hoặc quy tắc kiểm tra cố định.

Biến thể ngắn (khi chỉ cần mệnh đề “vì”):

> …**vì có thể kiểm tra đầu ra theo quy tắc rõ ràng**.

### 5.2. “Tất định” / deterministic

| Ngữ cảnh               | Tránh                  | Dùng (đã chốt)                                                                |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| Metric EM / ROUGE / F1 | chỉ số tất định        | **các chỉ số so khớp trực tiếp** như Exact Match, ROUGE và F1                 |
| Luật kiểm              | luật kiểm tra tất định | **quy tắc kiểm tra cố định** / **quy tắc kiểm tra rõ ràng**                   |
| Thuật toán vs AI       | cơ chế tất định        | **cơ chế cố định, lặp lại được** / **không phụ thuộc ngẫu nhiên của mô hình** |
| Chạy lại               | tất định               | **ổn định, tái lập được**                                                     |

**Câu mẫu đã chốt**

> …dùng **các chỉ số so khớp trực tiếp** như Exact Match, ROUGE và F1.

### 5.3. Họ từ cứng khác

| Tránh                                        | Ưu tiên                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| hậu kiểm _(lần đầu với độc giả ngoài ngành)_ | **kiểm tra sau khi có kết quả**; sau đó có thể giữ _hậu kiểm_ nếu đã giới thiệu |
| trong tiến trình _(quá kỹ thuật)_            | **trong bộ nhớ chương trình** / diễn giải _bỏ qua mạng và cơ sở dữ liệu_        |
| bằng chứng thay thế                          | **chỉ số gián tiếp** / **cách đo thay thế**                                     |

### 5.4. Không chồng calque

- Tránh: _hợp đồng tất định_, _chi phí thuần túy tất định_.
- Một ý, một lớp từ tự nhiên.

---

## 6. Cấu trúc nội dung đánh giá (tránh “chắp vá”)

Khi bổ sung kịch bản / input–output:

1. **Bảng** = tổng quan (đối tượng, câu hỏi, chỉ số, chỗ dẫn chi tiết).
2. **Subsection theo từng nhóm benchmark** = đầu vào, cách tiến hành, đầu ra kỳ vọng, kết quả/chỉ số thực tế, giới hạn — viết liền mạch học thuật.
3. Không tạo mục kiểu “bổ sung để hội đồng thấy có test case”.
4. Không nhét bảng khổng lồ input/output thay cho lời văn liên kết logic.

---

## 7. Mẫu trước → sau (để agent/người viết đối chiếu)

### 7.0. Ghi ví dụ tiêu biểu khi user review bản hệ thống tự sửa

Áp dụng mỗi khi agent/hệ thống **đã đề xuất hoặc đã sửa câu**, và user **chấp nhận, chỉnh tay, hoặc từ chối**. Mục tiêu: file này tích lũy “vàng” từ review thật, không chỉ lý thuyết.

#### Khi nào **phải** thêm ví dụ vào mục 7

Thêm khi thỏa **ít nhất một** điều kiện:

| Điều kiện | Ví dụ |
| --------- | ----- |
| User sửa tay khác hẳn bản hệ thống (cùng ý, wording khác) | Hệ thống: *chuẩn đã định* → User: *chuẩn đã định sẵn* |
| User từ chối cả đoạn vì giọng “vá / chắp vá / dịch máy” | Đề xuất section vá reviewer bị reject |
| Cụm mới được user khen là tự nhiên và sẽ dùng lại | *chỉ số so khớp trực tiếp*, *kiểm tra đầu ra theo quy tắc rõ ràng* |
| Cùng một lỗi lặp ≥ 2 lần trong session hoặc giữa các session | *tất định*, *hợp đồng đầu ra*, *chi phí thuần túy* |
| User chỉ trích một cụm/câu và ngầm yêu cầu sửa văn phong | Theo convention: reference = “viết lại cho chuẩn” |

**Không** thêm khi: sửa chính tả thuần; đổi tên biến/file; user chỉ bảo “ok” mà không chỉnh gì và câu đã trùng mẫu sẵn có.

#### Ai ghi, ghi ở đâu

1. **Agent** (sau khi user chốt wording): tự cập nhật file này trong cùng lượt hoặc lượt ngay sau — không đợi user nhắc “hãy học”.
2. **Người viết** (khi review offline): copy cặp trước/sau vào đúng nhóm A–K bên dưới.
3. Vị trí:
   - Cặp câu đầy đủ → **mục 7** (nhóm phù hợp; tạo nhóm mới L, M… nếu không khớp).
   - Cụm 2–8 từ sẽ tái sử dụng → thêm **mục 5** (nếu là calque) + **mục 9** (cheat sheet).
   - Lỗi lặp có thể bắt bằng checklist → thêm một dòng **mục 8**.

#### Mẫu ghi một ví dụ (bắt buộc đủ 4 trường)

Dùng bảng 1 hàng hoặc block như sau:

```markdown
| ID | Lỗi / nhãn | Trước (bản hệ thống hoặc bản cứng) | Sau (bản user chốt hoặc bản đúng) | Ghi chú 1 dòng |
| -- | ---------- | ---------------------------------- | --------------------------------- | -------------- |
| E12 | trợ từ “sẵn” | …chuẩn đã định… | …chuẩn đã định sẵn… | User: thêm “sẵn” tự nhiên hơn |
```

- **Trước**: nguyên văn bị sửa / bị từ chối (không paraphrase).
- **Sau**: nguyên văn user chốt hoặc bản agent sửa lại **đã được user accept**.
- **Ghi chú**: lý do ngắn (*calque*, *nhãn mờ*, *vá reviewer*, *thiếu liệu*, *thiếu để kiểm tra*, *trợ từ*, …).
- **ID**: `E` + số tăng dần trong nhóm hoặc toàn mục 7 (tránh trùng).

#### Quy trình agent sau mỗi lượt user review wording

1. So **diff** bản đề xuất ↔ bản user (hoặc message “đổi X thành Y”).
2. Phân loại lỗi theo checklist mục 8 / nhóm A–K.
3. Nếu đủ điều kiện “phải thêm” ở trên:
   - Thêm 1 hàng vào nhóm tương ứng (hoặc nhóm mới).
   - Nếu cụm sau là **cụm chốt mới**: cập nhật mục 5 + 9 trong **cùng lần sửa file**.
4. Không ghi 10 biến thể gần giống nhau: gộp nếu chỉ khác 1–2 từ phụ.
5. Không xóa ví dụ cũ khi có ví dụ mới; chỉ đánh dấu *superseded bởi Exx* nếu cụm sau đã thay thế hẳn cụm trước.

#### User review nhanh (30 giây / câu)

1. Đọc câu hệ thống vừa sửa — có nghe cứng / dịch máy không?
2. Nếu chỉnh: **sửa trực tiếp trên câu**, ưu tiên giữ cấu trúc đúng, chỉ đổi wording.
3. Nếu cả hướng sai: viết **một câu mẫu đúng** (không chỉ “nghe không ổn”).
4. Agent có nhiệm vụ đưa cặp trước/sau vào mục 7; user không cần tự mở file trừ khi muốn chốt offline.

#### Phân nhóm ví dụ (để chọn đúng chỗ dán)

| Nhóm | Khi dùng |
| ---- | -------- |
| A | Micro-benchmark, chi phí, phạm vi đo |
| B | Metric AI, Exact Match / ROUGE / F1, TCA |
| C | Chuẩn đầu ra, quy tắc kiểm tra (ex-hợp đồng / tất định) |
| D | Cắt từ dư, bỏ “máy móc”, giọng biện hộ reviewer |
| E | *liệu … hay không*, câu hỏi đánh giá |
| F | *để kiểm tra / nhằm*, nối mục đích sau hành động |
| G | Calque “dịch + nhét EN”, gloss ngoặc kép |
| H | Tiền tố metric (*độ / tỉ lệ / khả năng*), quyền truy cập |
| I | Ground truth / tham chiếu / proxy |
| J | Thống nhất *luồng* vs *quy trình*, mức khái quát đoạn |
| K | Cấu trúc mục (chắp vá vs overview + subsection) |
| M | Chương 1 / đặt vấn đề: vai trò, calque actionable, rút gọn, chủ thể |

---

### A. Micro-benchmark và phạm vi đo

| ID | Mức | Câu |
| -- | --- | --- |
| A1 | Sai (calque + nhãn mờ) | …kiểm thử hiệu năng vi mô bằng Go (Go micro-benchmark) để đo chi phí tính toán thuần túy… |
| A2 | Sai (vá reviewer) | …đo bằng micro-benchmark để có input/output đối chứng với nhận xét thiếu kịch bản… |
| A3 | Đúng | …đánh giá bằng **Go micro-benchmark** để đo trực tiếp **thời gian xử lý và mức sử dụng bộ nhớ**, **không bao gồm** chi phí của HTTP, cơ sở dữ liệu và mạng… |
| A4 | Trước → sau | Go micro-benchmark … tốn bao nhiêu **chi phí tính toán thuần túy**? → …**thời gian xử lý và mức sử dụng bộ nhớ** của thuật toán (không gồm HTTP, cơ sở dữ liệu và mạng) là bao nhiêu? |
| A5 | Trước → sau | Kết quả chỉ phản ánh **chi phí tính toán thuần túy**. → Kết quả chỉ phản ánh **thời gian xử lý và phân bổ bộ nhớ trong chương trình**, sau khi đã loại chi phí mạng và truy vấn dữ liệu. |
| A6 | Trước → sau | …đo **trong tiến trình** sau khi loại bỏ overhead. → …đo **trong bộ nhớ chương trình**, **không gồm** mạng và truy vấn cơ sở dữ liệu. |

### B. Lớp AI / metric / TCA

| ID | Trước | Sau |
| -- | ----- | --- |
| B1 | …dùng các chỉ số **tất định** như khớp chính xác (Exact Match)… | …dùng **các chỉ số so khớp trực tiếp** như Exact Match, ROUGE và F1… |
| B2 | …dùng thử nghiệm thủ công theo kịch bản hội thoại, tỷ lệ…, quyền truy cập và trải nghiệm… | …**thử nghiệm thủ công theo các kịch bản hội thoại để kiểm tra** tỷ lệ gọi công cụ thành công, **khả năng tuân thủ** quyền truy cập và trải nghiệm luồng phản hồi… |
| B3 | …bộ kiểm thử TCA (Textual Claim-based Assessment - Đánh giá dựa trên mệnh đề văn bản) để hậu kiểm các kết quả **văn bản phi cấu trúc (unstructured text)** theo… | …bộ kiểm thử **TCA (Textual Claim-based Assessment)** để **kiểm tra sau khi có kết quả** theo độ trung thực (Truthfulness), độ phủ (Coverage) và khả năng bổ sung (Additionality)… |
| B4 | …chạy các **quy trình** sử dụng AI để tạo kết quả thực tế trên **dữ liệu bài nộp**, sau đó… | …chạy các **luồng** sử dụng AI để tạo kết quả thực tế trên **dữ liệu đầu vào**, sau đó… *(tầng mục tiêu chương: rộng hơn “bài nộp”)* |
| B5 | Với đầu ra có **đáp án tham chiếu rõ** như Submission Autofill… | Với đầu ra **có thể tham chiếu trực tiếp** như Submission Autofill… |
| B6 | …đánh giá bằng một **chuỗi** thử nghiệm hai bước… | …đánh giá bằng một **luồng** thử nghiệm hai bước… |

### C. Chuẩn đầu ra và quy tắc kiểm tra (ex-hợp đồng / tất định)

| ID | Trước | Sau |
| -- | ----- | --- |
| C1 | …đánh giá mạnh hơn bằng **hợp đồng đầu ra**, vì chúng có **đáp án tham chiếu rõ** hoặc **luật kiểm tra tất định**. | …đánh giá chặt hơn bằng cách **đối chiếu đầu ra với chuẩn đã định sẵn**, vì chúng có **dữ liệu tham chiếu trực tiếp** hoặc **quy tắc kiểm tra cố định**. |
| C2 | …vì thỏa **output contract**. | …**vì có thể kiểm tra đầu ra theo quy tắc rõ ràng**. |
| C3 | …theo **chuẩn đã định**. | …theo **chuẩn đã định sẵn**. *(user: thêm trợ từ “sẵn”)* |
| C4 | Thuật toán dùng **cơ chế tất định**, tránh ngẫu nhiên của LLM. | Thuật toán dùng **cơ chế cố định, lặp lại được**, **không phụ thuộc ngẫu nhiên của mô hình**. |
| C5 | Kết quả chạy lại là **tất định**. | Kết quả chạy lại **ổn định, tái lập được**. |

### D. Cắt từ dư và giọng biện hộ

| ID | Trước | Sau |
| -- | ----- | --- |
| D1 | …thay vì áp dụng một khung đánh giá chung **một cách máy móc**. | …thay vì áp dụng một khung đánh giá chung. |
| D2 | Phần này được bổ sung **nhằm đáp ứng góp ý hội đồng về thiếu kịch bản kiểm thử**. | Phần này trình bày **các kịch bản đánh giá, đầu vào, cách tiến hành và chỉ số tương ứng**. |
| D3 | **Để đối chứng với nhận xét “không có input/output”**, bảng sau… | Bảng sau tóm tắt **đối tượng, câu hỏi đánh giá, chỉ số và mục chi tiết**. |
| D4 | Chương này đánh giá thực nghiệm cả ba lớp… | Chương này **sẽ** đánh giá thực nghiệm cả ba lớp… |

### E. Câu hỏi nhúng (*liệu*)

| ID | Trước | Sau |
| -- | ----- | --- |
| E1 | …nhằm trả lời câu hỏi hệ thống có đáp ứng được về mặt hiệu năng hay không. | …nhằm trả lời câu hỏi **liệu** hệ thống có đáp ứng được về mặt hiệu năng và khả năng chịu tải **hay không**. |
| E2 | Câu hỏi là AI có tạo giá trị hỗ trợ không. | Câu hỏi là **liệu** AI có tạo được giá trị hỗ trợ tại từng điểm nghẽn **hay không**. |

### F. Nối mục đích (*để kiểm tra / nhằm*)

| ID | Trước | Sau |
| -- | ----- | --- |
| F1 | Thử nghiệm gồm độ trễ, thông lượng, tỷ lệ lỗi. | Thử nghiệm **nhằm đo** độ trễ, thông lượng và tỷ lệ lỗi. |
| F2 | Chatbot được chạy trên nhiều vai trò, tool call, permission, UX. | Chatbot được chạy trên nhiều vai trò **để kiểm tra** tỷ lệ gọi công cụ thành công, khả năng tuân thủ quyền truy cập và trải nghiệm luồng phản hồi. |
| F3 | Giám sát CPU, RAM, disk. | **Giám sát mức sử dụng** CPU, RAM và đĩa **nhằm phát hiện** nghẽn tài nguyên khi tải tăng. |

### G. Calque “dịch + nhét EN” và gloss thừa

| ID | Trước | Sau |
| -- | ----- | --- |
| G1 | …kiểm thử hiệu năng vi mô bằng Go (**Go micro-benchmark**)… | …**Go micro-benchmark**… |
| G2 | …khớp chính xác (**Exact Match**) và điểm ROUGE (**ROUGE score**)… | …**tỉ lệ khớp chính xác (Exact Match)** và ROUGE… |
| G3 | …văn bản phi cấu trúc (**unstructured text**)… | *(xóa nếu đoạn không cần định nghĩa; hoặc)* …các **đoạn văn do hệ thống tạo ra**… |
| G4 | …workflow runner (**bộ chạy luồng xử lý**) thực thi pipeline… | …**bộ chạy luồng xử lý** thực thi các luồng… *(chọn một: EN **hoặc** VN, không nhét đôi trừ lần định nghĩa đầu)* |

### H. Tiền tố metric và “quyền” như chỉ số

| ID | Trước | Sau |
| -- | ----- | --- |
| H1 | …**khớp chính xác** (Exact Match)… | …**tỉ lệ khớp chính xác** (Exact Match)… |
| H2 | …đo **phủ** và **bổ sung**. | …đo **độ phủ** (Coverage) và **khả năng bổ sung** (Additionality). |
| H3 | …đánh giá **quyền truy cập** của chatbot. | …đánh giá **khả năng tuân thủ quyền truy cập** của chatbot. |
| H4 | …**đo lường** mức sử dụng tài nguyên… | …**đo** / **giám sát mức sử dụng** tài nguyên… *(khi không cần sắc thái thống kê)* |

### I. Tham chiếu / ground truth / proxy

| ID | Trước | Sau |
| -- | ----- | --- |
| I1 | …so với **ground truth** do người gán. | …so với **dữ liệu tham chiếu** do người gán. *(hoặc giữ ground truth nếu cả mục dùng EN thống nhất)* |
| I2 | …dùng **proxy** vì không có nhãn đủ. | …dùng **chỉ số gián tiếp** / **cách đo thay thế** vì không có nhãn đủ. |
| I3 | …**bằng chứng thay thế** cho chất lượng xếp hạng. | …**cách đo thay thế** cho chất lượng xếp hạng. |
| I4 | …có **đáp án** để chấm. | …có **bản tham chiếu để đối chiếu**. |

### J. Luồng / quy trình và mức khái quát

| ID | Trước | Sau |
| -- | ----- | --- |
| J1 | Trong cùng đoạn: chạy **quy trình** AI → **workflow** → **chuỗi** thử nghiệm… | Chọn **một** từ chủ đạo (thường **luồng**) và giữ xuyên đoạn. |
| J2 | Ở mục tiêu chương: chỉ nói trên **dữ liệu bài nộp**. | Ở mục tiêu chương: **dữ liệu đầu vào**; siết “bài nộp” khi vào kịch bản Submission. |
| J3 | …**matching** reviewer và **ranking** đề xuất… | …**đối sánh phản biện** và **xếp hạng** đề xuất… |

### K. Cấu trúc trình bày (tránh chắp vá)

| ID | Trước (hướng bị từ chối) | Sau (hướng đúng) |
| -- | ------------------------ | ---------------- |
| K1 | Thêm mục 4.2.3.1 “Bảng test case chi tiết để hội đồng đối chứng” ngay sau bảng cũ, giọng vá. | Giữ **một bảng tổng quan**; mỗi nhóm benchmark một **subsection** đầu vào – cách làm – đầu ra – chỉ số – giới hạn. |
| K2 | Một bảng dài nhồi đủ input/output/expected/actual cho mọi case, không lời nối. | Bảng ngắn + **lời văn** nối logic giữa các nhóm đánh giá. |
| K3 | Lặp lại cùng ý ở intro, bảng, và subsection “minh họa reviewer”. | Mỗi ý **một lần** ở tầng phù hợp; chỗ khác chỉ **tham chiếu chéo**. |

### L. Đoạn mở / kết nối luận điểm (thêm mẫu dài)

| ID | Trước | Sau |
| -- | ----- | --- |
| L1 | Lớp thuật toán được đánh giá bằng Go micro-benchmark để đo **chi phí tính toán thuần túy**, đồng thời đánh giá chất lượng đề xuất trên tập dữ liệu thực từ Semantic Scholar. | Lớp thuật toán (đối sánh phản biện và phát hiện xung đột lợi ích) được đánh giá bằng **Go micro-benchmark** để đo trực tiếp **thời gian xử lý và mức sử dụng bộ nhớ**, **không bao gồm** chi phí của HTTP, cơ sở dữ liệu và mạng, đồng thời đánh giá chất lượng đề xuất trên tập dữ liệu thực từ Semantic Scholar. |
| L2 | Lớp AI hỗ trợ được đánh giá bằng chuỗi hai bước… dùng chỉ số tất định… Chatbot: thử nghiệm thủ công, tool, quyền, UX. | Lớp AI hỗ trợ được đánh giá bằng **một luồng thử nghiệm hai bước**… dùng **các chỉ số so khớp trực tiếp**… Với Chatbot Agent, chương này **thử nghiệm thủ công theo các kịch bản hội thoại để kiểm tra** tỷ lệ gọi công cụ thành công, **khả năng tuân thủ** quyền truy cập và trải nghiệm luồng phản hồi. |
| L3 | Một số luồng AI có thể đánh giá mạnh hơn bằng hợp đồng đầu ra… | Một số luồng AI có thể đánh giá chặt hơn bằng cách **đối chiếu đầu ra với chuẩn đã định sẵn**, vì chúng có **dữ liệu tham chiếu trực tiếp** hoặc **quy tắc kiểm tra cố định**. |

### M. Chương 1 — Đặt vấn đề (user review 2026-07-13)

| ID | Trước | Sau | Ghi chú |
| -- | ----- | --- | ------- |
| M1 | **phản biện kỹ thuật** / **người phản biện** (vai trò) | **phản biện viên** | Quy tắc cố định: reviewer → phản biện viên |
| M2 | lựa chọn **phản biện** phù hợp | lựa chọn **phản biện viên** phù hợp | Vai trò, không phải bản review |
| M3 | chất lượng **phản biện** (sản phẩm) | chất lượng **nhận xét phản biện** | Tách vai trò vs nội dung |
| M4 | nhận xét … **có tính hành động hơn** | …**dễ chuyển thành chỉnh sửa hơn** | Calque *actionable* — ưu tiên cao |
| M5 | giai đoạn **rebuttal** | **giai đoạn phản hồi của tác giả (rebuttal)** | Gloss lần đầu |
| M6 | **không đồng nghĩa với việc** AI… | **không có nghĩa là** AI… | Rút gọn, không chỉ synonym |
| M7 | nội dung **sinh ra** | nội dung **do AI tạo ra** | Bổ sung chủ thể |
| M8 | quan điểm **phân hóa** | quan điểm **không thống nhất** | Tự nhiên hơn |
| M9 | **giảm tải** cho người dùng | **giảm khối lượng công việc** | Tự nhiên, cụ thể |
| M10 | nghiệp vụ **ổn định** | nghiệp vụ **cốt lõi, vận hành ổn định** | Rõ lớp hệ thống |
| M11 | nghiệp vụ **nền tảng** truyền thống *(cạnh “nền tảng” = platform)* | nghiệp vụ **truyền thống** | Tránh chồng “nền tảng” |
| M12 | các **khả năng** hỗ trợ nhập liệu… | các **tính năng** hỗ trợ… | Product language |
| M13 | chưa được **tổ chức thành** một quy trình thống nhất | chưa được **tích hợp trong** một quy trình thống nhất | User chốt: cụm hay, giữ |
| M14 | **môi trường** để đánh giá… | **cơ sở thực nghiệm** để đánh giá… | Rõ vai trò đề tài |
| M15 | **thuật toán xác định** *(lần đầu)* | **thuật toán cố định, có thể kiểm chứng** | Lần sau: xen kẽ *có thể kiểm chứng* / *xác định* |
| M16 | AI **không khả dụng** | AI **không dùng được** | Tránh calque unavailable |
| M17 | **bảo đảm** … | **đảm bảo** … | Ưu tiên *đảm bảo* |
| M18 | thuộc về **người dùng hoặc vai trò** có thẩm quyền | thuộc về **người hoặc vai trò** có thẩm quyền | Thẩm quyền, không mọi user |
| M19 | xu hướng tăng **nhất quán** | xu hướng tăng **đều** | Calque consistent |
| M20 | đã hỗ trợ **hiệu quả** những… | đã **đáp ứng tốt** những… | Bớt khẩu hiệu |
| M21 | **Area Chair** (trần EN) | **Chủ tọa khu vực (Area Chair)** | User: dịch … (Area Chair) |
| M22 | **Chair** (vai trò, trần EN) | **Chủ tọa (Chair)** / **Chủ tọa** | Đồng bộ với Area Chair |
| M23 | **Người phản biện** (vai trò sản phẩm) | **Phản biện viên** | Thống nhất reviewer |
| M24 | **độ khả dụng** của kết quả AI | **mức độ sử dụng được** của kết quả | Tránh calque availability |
| M25 | sáu **quy trình (workflow)** / từng **workflow** AI | sáu **luồng xử lý** / từng **luồng** AI; tên product EN giữ nguyên | Ưu tiên *luồng*; tên workflow EN khi là proper name |
| M26 | ba lớp: …, **thuật toán cố định, có thể kiểm chứng** và … *(dấu phẩy trong lớp giữa trùng list)* | ba lớp: …; **thuật toán cố định và có thể kiểm chứng**; … | Phân lớp bằng `;` hoặc `và` trong lớp giữa — tránh đọc thành 4 hạng mục |
| M27 | **Đầu ra AI** … **không được tự quyết định**… | **Người dùng phải được** xem lại…; **hệ thống không được tự quyết định**… | Chủ thể: đầu ra không quyết định; quyền xem lại thuộc người dùng |
| M28 | phân công … phản biện viên **với** bài báo | phân công … phản biện viên **cho** bài báo | Giới từ đúng |
| M29 | AI trực tiếp **tạo nhận định** | AI trực tiếp **đưa ra nhận định** | Tự nhiên hơn *tạo nhận định* |
| M30 | hỗ trợ nhập liệu…, **đọc hiểu** và tổng hợp… | …**hỗ trợ đọc hiểu** và tổng hợp… | User chốt cụm; tránh “đọc hiểu” đứng một mình |

---

## 8. Checklist review (pass/fail)

Dùng cho mọi đoạn được chạm. **FAIL bất kỳ mục nào → sửa trước khi merge/chốt.**

| #   | Câu hỏi                                                                         | Pass khi                                          |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | Giọng đoạn là phương pháp/kết quả hay biện hộ reviewer?                         | Phương pháp / kết quả                             |
| 2   | Có calque “dịch + nhét EN trùng nghĩa” không?                                   | Không; tên chuẩn EN đứng một mình + giải thích VN |
| 3   | Chỉ số đã có tiền tố (_độ / tỉ lệ / khả năng_) và nghĩa hình dung được chưa?    | Có                                                |
| 4   | Phạm vi đo (gồm / không gồm) đã nêu khi dễ nhầm chưa?                           | Có, nếu liên quan micro-benchmark / HTTP          |
| 5   | Câu hỏi nhúng yes/no đã có _liệu_ chưa?                                         | Có, nếu là câu hỏi đánh giá                       |
| 6   | Hành động đã nối _để kiểm tra / nhằm…_ chưa?                                    | Có, khi liệt kê tiêu chí                          |
| 7   | Còn _hợp đồng_, _tất định_, _chi phí tính toán thuần túy_, _đáp án tham chiếu_? | Không — đã thay bằng cụm mục 5–4                  |
| 8   | _chuẩn đã định_ đã thành _chuẩn đã định sẵn_ khi nói output standard?           | Có                                                |
| 9   | Gloss trong ngoặc có thêm thông tin không?                                      | Có hoặc đã xóa                                    |
| 10  | Đọc to có nghe dịch máy / cứng không?                                           | Không — đã soi mục 2.7                            |
| 11  | (Nếu sửa kịch bản) Bảng overview + subsection chi tiết, không “vá”?             | Đúng cấu trúc mục 6                               |
| 12  | User vừa chốt / sửa wording khác bản hệ thống — đã ghi ví dụ vào mục 7 (và 5/9 nếu cần) chưa? | Có, theo mục 7.0 — hoặc N/A nếu không đủ điều kiện ghi |
| 13  | Vai trò reviewer đã thành **phản biện viên**; sản phẩm review là **nhận xét / bản phản biện**? | Có, không trộn vai trò với nội dung |
| 14  | Câu có **chủ thể** rõ (ai tạo / ai quyết / hệ thống hay AI)?                     | Có                                                |
| 15  | Đã **rút gọn** mệnh đề thừa khi cùng ý chưa (không chỉ đổi synonym)?            | Có hoặc N/A                                       |
| 16  | Lần đầu nói deterministic layer: **thuật toán cố định, có thể kiểm chứng**?     | Có; lần sau được xen kẽ cụm ngắn hơn              |
| 17  | Dùng **đảm bảo** (không *bảo đảm*) khi khẳng định trách nhiệm / kết quả?        | Có, thống nhất báo cáo                            |
| 18  | Có chồng từ _nền tảng_ (platform + foundational) không?                         | Không                                             |
| 19  | Liệt kê **ba lớp** (cốt lõi / deterministic / AI): dấu phẩy trong lớp giữa có làm thành 4 hạng mục không? | Không — dùng `;` giữa lớp hoặc `và` trong lớp giữa (M26) |
| 20  | Câu “không tự quyết định / xem lại đầu ra AI” đã có **chủ thể** đúng (người dùng / hệ thống) chưa? | Có — không để *đầu ra AI* làm chủ ngữ quyết định (M27) |

---

## 9. Cụm ưu tiên nhanh (cheat sheet)

```
Go micro-benchmark
thời gian xử lý và mức sử dụng bộ nhớ, không bao gồm HTTP / CSDL / mạng
các chỉ số so khớp trực tiếp như Exact Match, ROUGE và F1
đối chiếu đầu ra với chuẩn đã định sẵn
kiểm tra đầu ra theo quy tắc rõ ràng
dữ liệu tham chiếu trực tiếp / có thể tham chiếu trực tiếp
quy tắc kiểm tra cố định
khả năng tuân thủ quyền truy cập
liệu … hay không
để kiểm tra …

reviewer → phản biện viên
nhận xét phản biện (sản phẩm) ≠ phản biện viên (vai trò)
dễ chuyển thành chỉnh sửa hơn  (tránh: có tính hành động)
không có nghĩa là …            (tránh: không đồng nghĩa với việc)
nội dung do AI tạo ra          (tránh: nội dung sinh ra — thiếu chủ thể)
quan điểm không thống nhất
giảm khối lượng công việc
tích hợp trong một quy trình thống nhất
thuật toán cố định, có thể kiểm chứng  (lần đầu)
thuật toán có thể kiểm chứng / thuật toán xác định  (lần sau, xen kẽ)
đảm bảo (không: bảo đảm)
không dùng được (tránh: không khả dụng)
nghiệp vụ truyền thống (tránh chồng: nghiệp vụ nền tảng + nền tảng)
tính năng (product; tránh: khả năng mơ)
cơ sở thực nghiệm để đánh giá
giai đoạn phản hồi của tác giả (rebuttal)
Chủ tọa khu vực (Area Chair)
Chủ tọa (Chair) / Chủ tọa
luồng AI / luồng xử lý (tránh lặp workflow trừ tên riêng)
mức độ sử dụng được (tránh: độ khả dụng)
ba lớp: A; B và C; D  (tránh: A, B, C và D khi B đã có dấu phẩy nội bộ)
Người dùng được xem lại đầu ra AI; hệ thống không tự quyết định…
phân công phản biện viên cho bài báo (không: với bài báo)
đưa ra nhận định (không: tạo nhận định)
hỗ trợ đọc hiểu (không: đọc hiểu đứng một mình trong chuỗi tính năng)
```

---

## 10. Cập nhật file này

Khi tác giả chốt thêm cụm wording mới (như đã chốt _chuẩn đã định sẵn_, _chỉ số so khớp trực tiếp_):

1. Làm đủ quy trình **mục 7.0** (không chỉ sửa báo cáo rồi quên file quy tắc).
2. Thêm vào mục 5 (calque → chốt) và mục 9 (cheat sheet) nếu là cụm tái sử dụng.
3. Thêm một hàng trước → sau vào **đúng nhóm** mục 7 (A–L hoặc nhóm mới).
4. Bổ sung checklist mục 8 nếu là lỗi lặp lại.

Không xóa quy tắc / ví dụ cũ nếu vẫn còn xuất hiện trong bản thảo; đánh dấu _superseded bởi Exx / đã thay bằng…_ nếu bị thay thế hẳn.

**Thứ tự ưu tiên khi mâu thuẫn:** câu user chốt mới nhất > cụm trong mục 5/9 > ví dụ cũ trong mục 7 > thói quen diễn đạt của model.

**Nhắc session sau (Chương 1 đã chốt):** reviewer = **phản biện viên**; Area Chair = **Chủ tọa khu vực (Area Chair)**; Chair = **Chủ tọa (Chair)**; luôn soi dịch máy; bổ sung chủ thể; rút gọn khi được; *đảm bảo*; lần đầu deterministic = **thuật toán cố định, có thể kiểm chứng**; workflow chung → **luồng**; liệt kê ba lớp dùng `;` nếu lớp giữa có dấu phẩy (M26); chủ thể quyết định/xem lại AI (M27); **hỗ trợ đọc hiểu** (M30).
