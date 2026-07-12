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

| Dấu hiệu                                | Ví dụ cứng                                          | Hướng sửa                                                                                                               |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Dịch adjective EN word-by-word          | _có tính hành động_ (actionable)                    | Nói **hậu quả / cách dùng**: _dễ chuyển thành chỉnh sửa hơn_                                                            |
| Dịch abstract noun                      | _tính nhất quán_ (consistency) khi nói xu hướng     | _tăng đều_, _ổn định_                                                                                                   |
| Dịch availability                       | _không khả dụng_ (unavailable) khi nghe calque cứng | NFR/vận hành: **giữ không khả dụng** (N6); metric AI: _mức độ sử dụng được_; câu calque: _không dùng được_, _gián đoạn_ |
| Dịch foundational + platform chồng nhau | _nghiệp vụ nền tảng_ cạnh _nền tảng phần mềm_       | _nghiệp vụ truyền thống / cơ bản_                                                                                       |
| Cụm đúng nghĩa nhưng dài kiểu textbook  | _không đồng nghĩa với việc_                         | **Rút gọn**: _không có nghĩa là_                                                                                        |

### 2.8. Rút gọn khi có thể (không chỉ “chỉnh wording”)

- Nếu hai cách diễn đạt cùng ý: chọn **ngắn hơn, vẫn đủ nghĩa**.
- Ưu tiên cắt mệnh đề khung (_với việc…_, _trong bối cảnh của…_, _không đồng nghĩa với việc…_) trước khi mày mò synonym.
- Rút gọn **không** được làm mất chủ thể, phạm vi đo, hoặc điều kiện.

### 2.9. Chủ ngữ / chủ thể phải rõ

Lỗi hay gặp: _nội dung sinh ra_, _kết quả thu được_, _quyết định được đưa ra_ — thiếu **ai / cái gì** làm ra.

| Tránh                                        | Dùng                                                     |
| -------------------------------------------- | -------------------------------------------------------- |
| độ tin cậy của **nội dung sinh ra**          | độ tin cậy của **nội dung do AI tạo ra**                 |
| kết quả được tạo ra trên dữ liệu             | kết quả **hệ thống tạo ra** trên dữ liệu…                |
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
- matching → **đối sánh phản biện (reviewer matching)** lần đầu / khi cần ngữ cảnh kỹ thuật; sau đó có thể rút **đối sánh phản biện**. Không để trần _matching_ / _ghép phản biện_ nếu ngữ cảnh là reviewer matching.
- ranking → **xếp hạng**.
- ground truth (khi không cần EN) → **dữ liệu tham chiếu** / **bản tham chiếu** / **nhãn tham chiếu** (chọn một và giữ nhất quán trong mục).
- proxy → **chỉ số gián tiếp** / **cách đo thay thế** (tránh _bằng chứng thay thế_ nếu nghe gượng).
- _thuật toán xác định_ / deterministic (lớp hệ thống):
  - **Lần đầu trong đoạn/mục:** **thuật toán cố định, có thể kiểm chứng**
  - **Các lần sau (tránh lặp):** xen kẽ **thuật toán có thể kiểm chứng** và **thuật toán xác định**
  - Tính chất kết quả deterministic: ưu tiên **ổn định, có thể tái tạo** (không _lặp lại được_ nếu nghe gượng)
- _bảo đảm_ vs _đảm bảo_: ưu tiên **đảm bảo** (đã chốt); thống nhất cả báo cáo.
- _giảm tải_ (khi nói công việc người dùng) → ưu tiên **giảm khối lượng công việc** / **giảm gánh nặng theo dõi** (khi nói trạng thái/hạn chót).
- Tránh _giảm tải nhận thức_ / _gánh nặng nhận thức_ cho pain point UX theo dõi trạng thái — _nhận thức_ nặng hơn scope thực tế; dùng **giảm gánh nặng theo dõi**, **giảm khối lượng thao tác**.
- _quan điểm phân hóa_ → **quan điểm không thống nhất**.
- _tính năng_ product: dùng **tính năng** (không _khả năng_ trừu tượng) khi nói chức năng phần mềm; tên product EN giữ nguyên (vd. **Submission Autofill**).
- **nghiệp vụ nền tảng**: **được giữ** khi nghĩa là foundational conference ops (không cạnh từ _nền tảng phần mềm_ trong cùng câu). Chỉ đổi thành **nghiệp vụ truyền thống / cơ bản** khi **chồng** với _nền tảng_ = platform trong cùng đoạn (M11).
- **không khả dụng**: cụm **hợp lệ** trong NFR / vận hành (dịch vụ AI không khả dụng). Không bắt buộc đổi thành _không dùng được_ trừ khi câu nghe calque cứng hoặc user chốt khác.
- **Phản biện viên** / **Chủ tọa**: trong danh sách vai trò không cần gloss EN _(Reviewer)_ / _(Chair)_ nếu thuật ngữ đã chốt xuyên báo cáo; **Chủ tọa** đủ, không bắt buộc _Chủ tọa hoặc ban tổ chức_.
- **notification** (prose, UC, hậu điều kiện, cơ chế vận hành) → **thông báo**; lần đầu cơ chế kỹ thuật: **định tuyến thông báo** (có thể gloss *notification routing* nếu cần). **Không** để trần *Notification* / *notification* trong câu tiếng Việt.
- **thread** (Discussion) → **chuỗi thảo luận** (rút **chuỗi** khi đã rõ ngữ cảnh).
- **message** (Discussion / chatbot) → **tin nhắn**.
- **submission** (thực thể nghiệp vụ) → **bài nộp**; **draft** → **bản nháp**. Giữ EN trong tên product (*Submission Autofill*, *Submission Gating*), token code (`submission_id`, `\CodeBreak{…}`), status kỹ thuật trong listing.
- **assignment** (thực thể nghiệp vụ) → **phân công** / **bài được phân công**; giữ EN trong code/id/domain kỹ thuật khi cần.
- **committee** (prose) → **ban chương trình**.
- **participant** (Discussion) → **người tham gia**.
- Giữ token kỹ thuật trong `\texttt{}` / `\CodeBreak{}` / listing / nhãn diagram thuần kỹ thuật khi Việt hóa làm mờ nghĩa.

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

| Tránh                                        | Ưu tiên                                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| hậu kiểm _(lần đầu với độc giả ngoài ngành)_ | **kiểm tra sau khi có kết quả**; sau đó có thể giữ _hậu kiểm_ nếu đã giới thiệu                                              |
| trong tiến trình _(quá kỹ thuật)_            | **trong bộ nhớ chương trình** / diễn giải _không bao gồm chi phí của HTTP, cơ sở dữ liệu và mạng_ (P2 — không viết tắt CSDL) |
| bằng chứng thay thế                          | **chỉ số gián tiếp** / **cách đo thay thế**                                                                                  |

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

| Điều kiện                                                    | Ví dụ                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| User sửa tay khác hẳn bản hệ thống (cùng ý, wording khác)    | Hệ thống: _chuẩn đã định_ → User: _chuẩn đã định sẵn_              |
| User từ chối cả đoạn vì giọng “vá / chắp vá / dịch máy”      | Đề xuất section vá reviewer bị reject                              |
| Cụm mới được user khen là tự nhiên và sẽ dùng lại            | _chỉ số so khớp trực tiếp_, _kiểm tra đầu ra theo quy tắc rõ ràng_ |
| Cùng một lỗi lặp ≥ 2 lần trong session hoặc giữa các session | _tất định_, _hợp đồng đầu ra_, _chi phí thuần túy_                 |
| User chỉ trích một cụm/câu và ngầm yêu cầu sửa văn phong     | Theo convention: reference = “viết lại cho chuẩn”                  |

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
| ID  | Lỗi / nhãn   | Trước (bản hệ thống hoặc bản cứng) | Sau (bản user chốt hoặc bản đúng) | Ghi chú 1 dòng                |
| --- | ------------ | ---------------------------------- | --------------------------------- | ----------------------------- |
| E12 | trợ từ “sẵn” | …chuẩn đã định…                    | …chuẩn đã định sẵn…               | User: thêm “sẵn” tự nhiên hơn |
```

- **Trước**: nguyên văn bị sửa / bị từ chối (không paraphrase).
- **Sau**: nguyên văn user chốt hoặc bản agent sửa lại **đã được user accept**.
- **Ghi chú**: lý do ngắn (_calque_, _nhãn mờ_, _vá reviewer_, _thiếu liệu_, _thiếu để kiểm tra_, _trợ từ_, …).
- **ID**: `E` + số tăng dần trong nhóm hoặc toàn mục 7 (tránh trùng).

#### Quy trình agent sau mỗi lượt user review wording

1. So **diff** bản đề xuất ↔ bản user (hoặc message “đổi X thành Y”).
2. Phân loại lỗi theo checklist mục 8 / nhóm A–K.
3. Nếu đủ điều kiện “phải thêm” ở trên:
   - Thêm 1 hàng vào nhóm tương ứng (hoặc nhóm mới).
   - Nếu cụm sau là **cụm chốt mới**: cập nhật mục 5 + 9 trong **cùng lần sửa file**.
4. Không ghi 10 biến thể gần giống nhau: gộp nếu chỉ khác 1–2 từ phụ.
5. Không xóa ví dụ cũ khi có ví dụ mới; chỉ đánh dấu _superseded bởi Exx_ nếu cụm sau đã thay thế hẳn cụm trước.

#### User review nhanh (30 giây / câu)

1. Đọc câu hệ thống vừa sửa — có nghe cứng / dịch máy không?
2. Nếu chỉnh: **sửa trực tiếp trên câu**, ưu tiên giữ cấu trúc đúng, chỉ đổi wording.
3. Nếu cả hướng sai: viết **một câu mẫu đúng** (không chỉ “nghe không ổn”).
4. Agent có nhiệm vụ đưa cặp trước/sau vào mục 7; user không cần tự mở file trừ khi muốn chốt offline.

#### Phân nhóm ví dụ (để chọn đúng chỗ dán)

| Nhóm | Khi dùng                                                                            |
| ---- | ----------------------------------------------------------------------------------- |
| A    | Micro-benchmark, chi phí, phạm vi đo                                                |
| B    | Metric AI, Exact Match / ROUGE / F1, TCA                                            |
| C    | Chuẩn đầu ra, quy tắc kiểm tra (ex-hợp đồng / tất định)                             |
| D    | Cắt từ dư, bỏ “máy móc”, giọng biện hộ reviewer                                     |
| E    | _liệu … hay không_, câu hỏi đánh giá                                                |
| F    | _để kiểm tra / nhằm_, nối mục đích sau hành động                                    |
| G    | Calque “dịch + nhét EN”, gloss ngoặc kép                                            |
| H    | Tiền tố metric (_độ / tỉ lệ / khả năng_), quyền truy cập                            |
| I    | Ground truth / tham chiếu / proxy                                                   |
| J    | Thống nhất _luồng_ vs _quy trình_, mức khái quát đoạn                               |
| K    | Cấu trúc mục (chắp vá vs overview + subsection)                                     |
| M    | Chương 1 / đặt vấn đề: vai trò, calque actionable, rút gọn, chủ thể                 |
| N    | Chương 2: khảo sát, đối sánh hệ thống, thuật ngữ vai trò, matching, NFR             |
| O    | Chương 3: xây dựng hệ thống, plugin, data contract, đặc tả API                      |
| P    | Chương 4: đánh giá thực nghiệm, micro-benchmark, hợp đồng/tất định, proxy, snapshot |
| Q    | Chương 5: kết luận, human-in-the-loop, ReAct, cơ sở thông tin                       |

---

### A. Micro-benchmark và phạm vi đo

| ID  | Mức                    | Câu                                                                                                                                                                                      |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Sai (calque + nhãn mờ) | …kiểm thử hiệu năng vi mô bằng Go (Go micro-benchmark) để đo chi phí tính toán thuần túy…                                                                                                |
| A2  | Sai (vá reviewer)      | …đo bằng micro-benchmark để có input/output đối chứng với nhận xét thiếu kịch bản…                                                                                                       |
| A3  | Đúng                   | …đánh giá bằng **Go micro-benchmark** để đo trực tiếp **thời gian xử lý và mức sử dụng bộ nhớ**, **không bao gồm** chi phí của HTTP, cơ sở dữ liệu và mạng…                              |
| A4  | Trước → sau            | Go micro-benchmark … tốn bao nhiêu **chi phí tính toán thuần túy**? → …**thời gian xử lý và mức sử dụng bộ nhớ** của thuật toán (không gồm HTTP, cơ sở dữ liệu và mạng) là bao nhiêu?    |
| A5  | Trước → sau            | Kết quả chỉ phản ánh **chi phí tính toán thuần túy**. → Kết quả chỉ phản ánh **thời gian xử lý và phân bổ bộ nhớ trong chương trình**, sau khi đã loại chi phí mạng và truy vấn dữ liệu. |
| A6  | Trước → sau            | …đo **trong tiến trình** sau khi loại bỏ overhead. → …đo **trong bộ nhớ chương trình**, **không gồm** mạng và truy vấn cơ sở dữ liệu.                                                    |

### B. Lớp AI / metric / TCA

| ID  | Trước                                                                                                                                                            | Sau                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | …dùng các chỉ số **tất định** như khớp chính xác (Exact Match)…                                                                                                  | …dùng **các chỉ số so khớp trực tiếp** như Exact Match, ROUGE và F1…                                                                                                               |
| B2  | …dùng thử nghiệm thủ công theo kịch bản hội thoại, tỷ lệ…, quyền truy cập và trải nghiệm…                                                                        | …**thử nghiệm thủ công theo các kịch bản hội thoại để kiểm tra** tỷ lệ gọi công cụ thành công, **khả năng tuân thủ** quyền truy cập và trải nghiệm luồng phản hồi…                 |
| B3  | …bộ kiểm thử TCA (Textual Claim-based Assessment - Đánh giá dựa trên mệnh đề văn bản) để hậu kiểm các kết quả **văn bản phi cấu trúc (unstructured text)** theo… | …bộ kiểm thử **TCA (Textual Claim-based Assessment)** để **kiểm tra sau khi có kết quả** theo độ trung thực (Truthfulness), độ phủ (Coverage) và khả năng bổ sung (Additionality)… |
| B4  | …chạy các **quy trình** sử dụng AI để tạo kết quả thực tế trên **dữ liệu bài nộp**, sau đó…                                                                      | …chạy các **luồng** sử dụng AI để tạo kết quả thực tế trên **dữ liệu đầu vào**, sau đó… _(tầng mục tiêu chương: rộng hơn “bài nộp”)_                                               |
| B5  | Với đầu ra có **đáp án tham chiếu rõ** như Submission Autofill…                                                                                                  | Với đầu ra **có thể tham chiếu trực tiếp** như Submission Autofill…                                                                                                                |
| B6  | …đánh giá bằng một **chuỗi** thử nghiệm hai bước…                                                                                                                | …đánh giá bằng một **luồng** thử nghiệm hai bước…                                                                                                                                  |

### C. Chuẩn đầu ra và quy tắc kiểm tra (ex-hợp đồng / tất định)

| ID  | Trước                                                                                                              | Sau                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | …đánh giá mạnh hơn bằng **hợp đồng đầu ra**, vì chúng có **đáp án tham chiếu rõ** hoặc **luật kiểm tra tất định**. | …đánh giá chặt hơn bằng cách **đối chiếu đầu ra với chuẩn đã định sẵn**, vì chúng có **dữ liệu tham chiếu trực tiếp** hoặc **quy tắc kiểm tra cố định**. |
| C2  | …vì thỏa **output contract**.                                                                                      | …**vì có thể kiểm tra đầu ra theo quy tắc rõ ràng**.                                                                                                     |
| C3  | …theo **chuẩn đã định**.                                                                                           | …theo **chuẩn đã định sẵn**. _(user: thêm trợ từ “sẵn”)_                                                                                                 |
| C4  | Thuật toán dùng **cơ chế tất định**, tránh ngẫu nhiên của LLM.                                                     | Thuật toán dùng **cơ chế cố định, lặp lại được**, **không phụ thuộc ngẫu nhiên của mô hình**.                                                            |
| C5  | Kết quả chạy lại là **tất định**.                                                                                  | Kết quả chạy lại **ổn định, tái lập được**.                                                                                                              |

### D. Cắt từ dư và giọng biện hộ

| ID  | Trước                                                                             | Sau                                                                                        |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| D1  | …thay vì áp dụng một khung đánh giá chung **một cách máy móc**.                   | …thay vì áp dụng một khung đánh giá chung.                                                 |
| D2  | Phần này được bổ sung **nhằm đáp ứng góp ý hội đồng về thiếu kịch bản kiểm thử**. | Phần này trình bày **các kịch bản đánh giá, đầu vào, cách tiến hành và chỉ số tương ứng**. |
| D3  | **Để đối chứng với nhận xét “không có input/output”**, bảng sau…                  | Bảng sau tóm tắt **đối tượng, câu hỏi đánh giá, chỉ số và mục chi tiết**.                  |
| D4  | Chương này đánh giá thực nghiệm cả ba lớp…                                        | Chương này **sẽ** đánh giá thực nghiệm cả ba lớp…                                          |

### E. Câu hỏi nhúng (_liệu_)

| ID  | Trước                                                                      | Sau                                                                                                          |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| E1  | …nhằm trả lời câu hỏi hệ thống có đáp ứng được về mặt hiệu năng hay không. | …nhằm trả lời câu hỏi **liệu** hệ thống có đáp ứng được về mặt hiệu năng và khả năng chịu tải **hay không**. |
| E2  | Câu hỏi là AI có tạo giá trị hỗ trợ không.                                 | Câu hỏi là **liệu** AI có tạo được giá trị hỗ trợ tại từng điểm nghẽn **hay không**.                         |

### F. Nối mục đích (_để kiểm tra / nhằm_)

| ID  | Trước                                                            | Sau                                                                                                                                                |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Thử nghiệm gồm độ trễ, thông lượng, tỷ lệ lỗi.                   | Thử nghiệm **nhằm đo** độ trễ, thông lượng và tỷ lệ lỗi.                                                                                           |
| F2  | Chatbot được chạy trên nhiều vai trò, tool call, permission, UX. | Chatbot được chạy trên nhiều vai trò **để kiểm tra** tỷ lệ gọi công cụ thành công, khả năng tuân thủ quyền truy cập và trải nghiệm luồng phản hồi. |
| F3  | Giám sát CPU, RAM, disk.                                         | **Giám sát mức sử dụng** CPU, RAM và đĩa **nhằm phát hiện** nghẽn tài nguyên khi tải tăng.                                                         |

### G. Calque “dịch + nhét EN” và gloss thừa

| ID  | Trước                                                              | Sau                                                                                                              |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| G1  | …kiểm thử hiệu năng vi mô bằng Go (**Go micro-benchmark**)…        | …**Go micro-benchmark**…                                                                                         |
| G2  | …khớp chính xác (**Exact Match**) và điểm ROUGE (**ROUGE score**)… | …**tỉ lệ khớp chính xác (Exact Match)** và ROUGE…                                                                |
| G3  | …văn bản phi cấu trúc (**unstructured text**)…                     | _(xóa nếu đoạn không cần định nghĩa; hoặc)_ …các **đoạn văn do hệ thống tạo ra**…                                |
| G4  | …workflow runner (**bộ chạy luồng xử lý**) thực thi pipeline…      | …**bộ chạy luồng xử lý** thực thi các luồng… _(chọn một: EN **hoặc** VN, không nhét đôi trừ lần định nghĩa đầu)_ |

### H. Tiền tố metric và “quyền” như chỉ số

| ID  | Trước                                     | Sau                                                                                |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| H1  | …**khớp chính xác** (Exact Match)…        | …**tỉ lệ khớp chính xác** (Exact Match)…                                           |
| H2  | …đo **phủ** và **bổ sung**.               | …đo **độ phủ** (Coverage) và **khả năng bổ sung** (Additionality).                 |
| H3  | …đánh giá **quyền truy cập** của chatbot. | …đánh giá **khả năng tuân thủ quyền truy cập** của chatbot.                        |
| H4  | …**đo lường** mức sử dụng tài nguyên…     | …**đo** / **giám sát mức sử dụng** tài nguyên… _(khi không cần sắc thái thống kê)_ |

### I. Tham chiếu / ground truth / proxy

| ID  | Trước                                             | Sau                                                                                                  |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| I1  | …so với **ground truth** do người gán.            | …so với **dữ liệu tham chiếu** do người gán. _(hoặc giữ ground truth nếu cả mục dùng EN thống nhất)_ |
| I2  | …dùng **proxy** vì không có nhãn đủ.              | …dùng **chỉ số gián tiếp** / **cách đo thay thế** vì không có nhãn đủ.                               |
| I3  | …**bằng chứng thay thế** cho chất lượng xếp hạng. | …**cách đo thay thế** cho chất lượng xếp hạng.                                                       |
| I4  | …có **đáp án** để chấm.                           | …có **bản tham chiếu để đối chiếu**.                                                                 |

### J. Luồng / quy trình và mức khái quát

| ID  | Trước                                                                         | Sau                                                                                 |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| J1  | Trong cùng đoạn: chạy **quy trình** AI → **workflow** → **chuỗi** thử nghiệm… | Chọn **một** từ chủ đạo (thường **luồng**) và giữ xuyên đoạn.                       |
| J2  | Ở mục tiêu chương: chỉ nói trên **dữ liệu bài nộp**.                          | Ở mục tiêu chương: **dữ liệu đầu vào**; siết “bài nộp” khi vào kịch bản Submission. |
| J3  | …**matching** reviewer và **ranking** đề xuất…                                | …**đối sánh phản biện** và **xếp hạng** đề xuất…                                    |

### K. Cấu trúc trình bày (tránh chắp vá)

| ID  | Trước (hướng bị từ chối)                                                                     | Sau (hướng đúng)                                                                                                   |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| K1  | Thêm mục 4.2.3.1 “Bảng test case chi tiết để hội đồng đối chứng” ngay sau bảng cũ, giọng vá. | Giữ **một bảng tổng quan**; mỗi nhóm benchmark một **subsection** đầu vào – cách làm – đầu ra – chỉ số – giới hạn. |
| K2  | Một bảng dài nhồi đủ input/output/expected/actual cho mọi case, không lời nối.               | Bảng ngắn + **lời văn** nối logic giữa các nhóm đánh giá.                                                          |
| K3  | Lặp lại cùng ý ở intro, bảng, và subsection “minh họa reviewer”.                             | Mỗi ý **một lần** ở tầng phù hợp; chỗ khác chỉ **tham chiếu chéo**.                                                |

### L. Đoạn mở / kết nối luận điểm (thêm mẫu dài)

| ID  | Trước                                                                                                                                                                        | Sau                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1  | Lớp thuật toán được đánh giá bằng Go micro-benchmark để đo **chi phí tính toán thuần túy**, đồng thời đánh giá chất lượng đề xuất trên tập dữ liệu thực từ Semantic Scholar. | Lớp thuật toán (đối sánh phản biện và phát hiện xung đột lợi ích) được đánh giá bằng **Go micro-benchmark** để đo trực tiếp **thời gian xử lý và mức sử dụng bộ nhớ**, **không bao gồm** chi phí của HTTP, cơ sở dữ liệu và mạng, đồng thời đánh giá chất lượng đề xuất trên tập dữ liệu thực từ Semantic Scholar. |
| L2  | Lớp AI hỗ trợ được đánh giá bằng chuỗi hai bước… dùng chỉ số tất định… Chatbot: thử nghiệm thủ công, tool, quyền, UX.                                                        | Lớp AI hỗ trợ được đánh giá bằng **một luồng thử nghiệm hai bước**… dùng **các chỉ số so khớp trực tiếp**… Với Chatbot Agent, chương này **thử nghiệm thủ công theo các kịch bản hội thoại để kiểm tra** tỷ lệ gọi công cụ thành công, **khả năng tuân thủ** quyền truy cập và trải nghiệm luồng phản hồi.         |
| L3  | Một số luồng AI có thể đánh giá mạnh hơn bằng hợp đồng đầu ra…                                                                                                               | Một số luồng AI có thể đánh giá chặt hơn bằng cách **đối chiếu đầu ra với chuẩn đã định sẵn**, vì chúng có **dữ liệu tham chiếu trực tiếp** hoặc **quy tắc kiểm tra cố định**.                                                                                                                                     |

### M. Chương 1 — Đặt vấn đề (user review 2026-07-13)

| ID    | Trước                                                                                            | Sau                                                                                                           | Ghi chú                                                                 |
| ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| M1    | **phản biện kỹ thuật** / **người phản biện** (vai trò)                                           | **phản biện viên**                                                                                            | Quy tắc cố định: reviewer → phản biện viên                              |
| M2    | lựa chọn **phản biện** phù hợp                                                                   | lựa chọn **phản biện viên** phù hợp                                                                           | Vai trò, không phải bản review                                          |
| M3    | chất lượng **phản biện** (sản phẩm)                                                              | chất lượng **nhận xét phản biện**                                                                             | Tách vai trò vs nội dung                                                |
| M4    | nhận xét … **có tính hành động hơn**                                                             | …**dễ chuyển thành chỉnh sửa hơn**                                                                            | Calque _actionable_ — ưu tiên cao                                       |
| M5    | giai đoạn **rebuttal**                                                                           | **giai đoạn phản hồi của tác giả (rebuttal)**                                                                 | Gloss lần đầu                                                           |
| M6    | **không đồng nghĩa với việc** AI…                                                                | **không có nghĩa là** AI…                                                                                     | Rút gọn, không chỉ synonym                                              |
| M7    | nội dung **sinh ra**                                                                             | nội dung **do AI tạo ra**                                                                                     | Bổ sung chủ thể                                                         |
| M8    | quan điểm **phân hóa**                                                                           | quan điểm **không thống nhất**                                                                                | Tự nhiên hơn                                                            |
| M9    | **giảm tải** cho người dùng                                                                      | **giảm khối lượng công việc**                                                                                 | Tự nhiên, cụ thể                                                        |
| M10   | nghiệp vụ **ổn định**                                                                            | nghiệp vụ **cốt lõi, vận hành ổn định**                                                                       | Rõ lớp hệ thống                                                         |
| M11   | nghiệp vụ **nền tảng** truyền thống _(cạnh “nền tảng” = platform)_                               | nghiệp vụ **truyền thống**                                                                                    | Tránh chồng “nền tảng”                                                  |
| M12   | các **khả năng** hỗ trợ nhập liệu…                                                               | các **tính năng** hỗ trợ…                                                                                     | Product language                                                        |
| M13   | chưa được **tổ chức thành** một quy trình thống nhất                                             | chưa được **tích hợp trong** một quy trình thống nhất                                                         | User chốt: cụm hay, giữ                                                 |
| M14   | **môi trường** để đánh giá…                                                                      | **cơ sở thực nghiệm** để đánh giá…                                                                            | Rõ vai trò đề tài                                                       |
| M15   | **thuật toán xác định** _(lần đầu)_                                                              | **thuật toán cố định, có thể kiểm chứng**                                                                     | Lần sau: xen kẽ _có thể kiểm chứng_ / _xác định_                        |
| M16   | AI **không khả dụng**                                                                            | AI **không dùng được**                                                                                        | Tránh calque unavailable                                                |
| M17   | **bảo đảm** …                                                                                    | **đảm bảo** …                                                                                                 | Ưu tiên _đảm bảo_                                                       |
| M18   | thuộc về **người dùng hoặc vai trò** có thẩm quyền                                               | thuộc về **người hoặc vai trò** có thẩm quyền                                                                 | Thẩm quyền, không mọi user                                              |
| M19   | xu hướng tăng **nhất quán**                                                                      | xu hướng tăng **đều**                                                                                         | Calque consistent                                                       |
| M20   | đã hỗ trợ **hiệu quả** những…                                                                    | đã **đáp ứng tốt** những…                                                                                     | Bớt khẩu hiệu                                                           |
| M21   | **Area Chair** (trần EN)                                                                         | **Chủ tọa khu vực (Area Chair)**                                                                              | User: dịch … (Area Chair)                                               |
| M22   | **Chair** (vai trò, trần EN)                                                                     | **Chủ tọa (Chair)** / **Chủ tọa**                                                                             | Đồng bộ với Area Chair                                                  |
| M23   | **Người phản biện** (vai trò sản phẩm)                                                           | **Phản biện viên**                                                                                            | Thống nhất reviewer                                                     |
| M24   | **độ khả dụng** của kết quả AI                                                                   | **mức độ sử dụng được** của kết quả                                                                           | Tránh calque availability                                               |
| M25   | sáu **quy trình (workflow)** / từng **workflow** AI                                              | sáu **luồng xử lý** / từng **luồng** AI; tên product EN giữ nguyên                                            | Ưu tiên _luồng_; tên workflow EN khi là proper name                     |
| M26   | ba lớp: …, **thuật toán cố định, có thể kiểm chứng** và … _(dấu phẩy trong lớp giữa trùng list)_ | ba lớp: …; **thuật toán cố định và có thể kiểm chứng**; …                                                     | Phân lớp bằng `;` hoặc `và` trong lớp giữa — tránh đọc thành 4 hạng mục |
| M27   | **Đầu ra AI** … **không được tự quyết định**…                                                    | **Người dùng phải được** xem lại…; **hệ thống không được tự quyết định**…                                     | Chủ thể: đầu ra không quyết định; quyền xem lại thuộc người dùng        |
| M28   | phân công … phản biện viên **với** bài báo                                                       | phân công … phản biện viên **cho** bài báo                                                                    | Giới từ đúng                                                            |
| M29   | AI trực tiếp **tạo nhận định**                                                                   | AI trực tiếp **đưa ra nhận định**                                                                             | Tự nhiên hơn _tạo nhận định_                                            |
| M30   | hỗ trợ nhập liệu…, **đọc hiểu** và tổng hợp…                                                     | …**hỗ trợ đọc hiểu** và tổng hợp…                                                                             | User chốt cụm; tránh “đọc hiểu” đứng một mình                           |
| M16\* | AI **không khả dụng** → bắt buộc **không dùng được**                                             | _superseded một phần bởi N6_: **không khả dụng** hợp lệ ở NFR/vận hành; _không dùng được_ khi câu calque cứng | Ch2 user 2026-07-13                                                     |

### N. Chương 2 — Khảo sát / đối sánh hệ thống (user review 2026-07-13)

| ID  | Trước                                                      | Sau                                                                                | Ghi chú                                        |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| N1  | **Người phản biện (Reviewer):**                            | **Phản biện viên:**                                                                | Không kèm gloss EN khi danh xưng đã chốt       |
| N2  | **Chủ tọa hoặc ban tổ chức (Chair):**                      | **Chủ tọa:**                                                                       | Đủ; không bắt buộc ban tổ chức / (Chair)       |
| N3  | **ghép phản biện** / trần _matching_                       | **đối sánh phản biện (reviewer matching)**                                         | Gloss EN khi cần ngữ cảnh kỹ thuật             |
| N4  | **Giảm tải nhận thức**                                     | **Giảm gánh nặng theo dõi**                                                        | Tránh _nhận thức_ — nặng hơn scope UX theo dõi |
| N5  | đổi _nghiệp vụ nền tảng_ → _truyền thống_ _(mọi ngữ cảnh)_ | **giữ nghiệp vụ nền tảng** khi không chồng _nền tảng_ = platform                   | User: cụm hợp lệ, phù hợp Ch2                  |
| N6  | bắt buộc _không khả dụng_ → _không dùng được_              | **giữ không khả dụng** (NFR/vận hành)                                              | User: cụm hoàn toàn hợp lệ                     |
| N7  | kết quả **ổn định, lặp lại được**                          | kết quả **ổn định, có thể tái tạo**                                                | User: _có thể tái tạo_ tự nhiên hơn            |
| N8  | tính năng **Autofill**                                     | tính năng **Submission Autofill**                                                  | Tên product EN                                 |
| N9  | trần **Chair** / **Reviewer** trong câu VN                 | **Chủ tọa** / **phản biện viên**                                                   | Đồng bộ xuyên chương                           |
| N10 | _bảo đảm_ quyền quyết định                                 | **đảm bảo** quyền quyết định                                                       | M17                                            |
| N11 | lớp **thuật toán xác định** _(lần đầu Ch2)_                | lớp **thuật toán cố định, có thể kiểm chứng**                                      | M15                                            |
| N12 | Tách lớp A**,** thuật toán… **và** AI                      | Tách lớp A**;** thuật toán cố định **và** có thể kiểm chứng**;** AI                | M26                                            |
| N13 | area chairs / senior area chairs (trần EN)                 | **Chủ tọa khu vực (Area Chair)** / **Chủ tọa khu vực cấp cao (Senior Area Chair)** | M21                                            |
| N14 | xem **review**, gửi **rebuttal**                           | xem **nhận xét phản biện**, gửi **phản hồi của tác giả (rebuttal)**                | M3 + M5                                        |
| N15 | **Tính giải thích** (NFR label)                            | **Khả năng giải thích**                                                            | Tự nhiên hơn calque explainability             |

### R. Chương 2 — Chủ ngữ–vị ngữ / chủ thể hành động (user accept full 2026-07-13)

| ID | Trước | Sau | Ghi chú |
| -- | ----- | --- | ------- |
| R1 | **Khảo sát … được thực hiện** nhằm… | **Nhóm thực hiện khảo sát** nhằm… | Bị động vô chủ thể → chủ thể *nhóm* |
| R2 | …**được sử dụng như** nguồn… **để xác định**… | …**đóng vai trò** nguồn… **để nhóm xác định**… | Ai dùng / ai xác định |
| R3 | Thông tin này **là cần thiết** | Thông tin này **cần thiết** | Rút copula thừa |
| R4 | **Cần lưu ý rằng**… | **Nhóm lưu ý rằng**… | Chủ ngữ tường minh |
| R5 | Do **khảo sát được triển khai**… **kết quả được dùng**… **không dùng**… | Do **nhóm triển khai khảo sát**… **kết quả … chỉ được dùng**… **không được dùng**… | Chủ thể + nhất quán bị động |
| R6 | **Cần** thông báo trong hệ thống… | **Hệ thống cần cung cấp** thông báo nội bộ… | Ô bảng thiếu chủ ngữ |
| R7 | **Được đánh giá** hữu ích | **Tính năng này được đánh giá** hữu ích | Ô bảng thiếu chủ ngữ |
| R8 | **đầu ra nên là** gợi ý… | **đầu ra của hệ thống nên là** gợi ý… | Chủ thể của đầu ra |
| R9 | AI phù hợp hơn **ở vai trò**… **, để** phản biện viên… | …**khi đóng vai trò**… **, nhờ đó** phản biện viên… | Vị ngữ + hệ quả (không mục đích mơ) |
| R10 | **Tổng hợp các phản hồi cho thấy**… | **Tổng hợp các phản hồi, nhóm nhận thấy**… | Chủ thể *nhóm* |
| R11 | …71 phản hồi, **nên không đủ**… | …71 phản hồi, **nên kết quả không đủ**… | Chủ ngữ mệnh đề kết quả |
| R12 | **khảo sát này được thực hiện** trước…, **khác với**… | **nhóm thực hiện khảo sát này** trước…; **cách làm đó khác với**… | Chủ thể + so sánh |
| R13 | Bullet tiêu chí: **Hỗ trợ… / Đại diện… / Có…** | **Hệ thống được chọn hỗ trợ… / đại diện… / có…** | List thiếu chủ ngữ |
| R14 | matching **vẫn cần được hiểu như**… | matching **cần được hiểu như**… | Bớt “vẫn” thừa |
| R15 | **Thứ hai, đối sánh phản biện cần**… | **Thứ hai, quy trình đối sánh phản biện cần**… | Danh từ trung tâm cho chủ ngữ trừu tượng |
| R16 | AI **được dùng** ở đâu… **được kiểm soát** ra sao… | **hệ thống dùng AI** ở đâu… **ai kiểm soát AI** ra sao… | Chủ thể chủ động song song |
| R17 | Ô nguyên tắc: **Cảnh báo…; Không sinh…; Trả lời phải…; Trạng thái tập trung…** | **Hệ thống cảnh báo…; Hệ thống không sinh…; Câu trả lời phải…; Hệ thống giữ trạng thái…** | Ô bảng thiếu chủ ngữ |
| R18 | **Gợi ý … cần** điểm…; **cảnh báo COI cần** nêu… | **Gợi ý … cần có** điểm…; **cảnh báo COI cần nêu rõ**… | Vị ngữ đầy đủ |
| R19 | **Không dùng** một chỉ số… | **Nhóm không dùng** một chỉ số… | Mệnh lệnh → chủ thể *nhóm* |
| R20 | Cột cơ sở: **Vấn đề về… / Nghiệp vụ… / Cần giảm…** | **Yêu cầu xuất phát từ… / Đây là nghiệp vụ… / Hệ thống cần giảm…** | Cụm danh từ → câu có chủ–vị |
| R21 | **AI không được sử dụng** để viết… | **Hệ thống không được dùng AI** để viết… | Cấm thuộc hệ thống/chính sách |
| R22 | **Không biến AI** thành… | **Hệ thống không được biến AI** thành… | Chủ ngữ yêu cầu |
| R23 | Các luồng … **cần lưu được**… | **Hệ thống cần lưu** … của các luồng… | Chủ thể lưu trữ |
| R24 | đánh giá **mức độ ConferenceSpace giải quyết**… | …**mức độ ConferenceSpace giải quyết được**… | Vị ngữ hoàn chỉnh |

### O. Chương 3 — Xây dựng hệ thống (user review 2026-07-13)

| ID  | Trước                                                                   | Sau                                                                                                | Ghi chú                                                                                |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| O1  | trần **Reviewer** / **Chair** / **Chair/Co-chair** trong prose Ch3      | **phản biện viên** / **Chủ tọa** / **Chủ tọa/Đồng chủ tọa**                                        | Đồng bộ N9; product EN (_Reviewer Initial Analysis_, _Chair Decision Copilot_) **giữ** |
| O2  | **Người phản biện** (Ch3 §AI)                                           | **phản biện viên**                                                                                 | Không dùng lại _Người phản biện_                                                       |
| O3  | _plugin độc lập_ → bắt Việt hóa                                         | **giữ plugin**                                                                                     | User Ch3: #16 giữ plugin                                                               |
| O4  | Việt hóa hàng loạt _submission_ / _assignment_ / _workspace_ / _policy_ | **chọn lọc**: chỉ khi câu VN gượng; giữ token trạng thái/code, nhãn diagram, tên thực thể kỹ thuật | User Ch3: #17 cẩn thận                                                                 |
| O5  | _ràng buộc dữ liệu (data contract)_ → bỏ gloss                          | **giữ gloss (data contract)**                                                                      | User Ch3: #20                                                                          |
| O6  | _hợp đồng API_ / _hợp đồng OpenAPI_ (tích hợp kỹ thuật)                 | **đặc tả API** / **đặc tả OpenAPI**                                                                | Khác _hợp đồng đầu ra_ (mục 5.1); API contract ≠ output contract                       |
| O7  | _khả năng sử dụng (usability)_ của bản nhận xét                         | **mức độ sử dụng được** của bản nhận xét                                                           | G + metric AI; bỏ nhét EN                                                              |
| O8  | _gánh nặng nhận thức (cognitive load)_                                  | **gánh nặng theo dõi** / **theo dõi và tổng hợp thông tin**                                        | N4                                                                                     |
| O9  | _một khả năng_ / _là khả năng_ (product)                                | **một tính năng** / **là tính năng**                                                               | M12                                                                                    |
| O10 | _ghép cặp_ / trần _matching_ (prose)                                    | **đối sánh phản biện (reviewer matching)**                                                         | N3; nhãn diagram _Matching_ có thể giữ EN                                              |
| O11 | _mối lo chính_                                                          | **mối quan ngại chính**                                                                            | Bớt khẩu ngữ                                                                           |
| O12 | _kết quả lặp lại được_ / _lặp lại ổn định_                              | **ổn định, có thể tái tạo**                                                                        | N7                                                                                     |
| O13 | _bảo đảm_                                                               | **đảm bảo**                                                                                        | M17                                                                                    |
| O14 | ba lớp lần đầu: _A, thuật toán xác định và AI_                          | _A; thuật toán cố định và có thể kiểm chứng; AI_                                                   | M15/M26                                                                                |
| O15 | _giảm tải_ (công việc người dùng)                                       | **giảm khối lượng công việc**                                                                      | M9                                                                                     |
| O16 | caption _phản hồi ý kiến phản biện_                                     | **phản hồi của tác giả (rebuttal)**                                                                | M5/N14                                                                                 |
| O17 | *Notification* / *notification* (prose, UC, sequence label)              | **thông báo** / **Định tuyến thông báo**                                                           | User 2026-07-13: dịch xuyên chương; giữ `\CodeBreak{notifications}`                    |
| O18 | *thread* / *message* (Discussion, UC-08, ma trận quyền)                  | **chuỗi thảo luận** / **tin nhắn**                                                                 | User 2026-07-13                                                                        |
| O19 | *Submission* / *draft* / *Proposal* / *autosave* (prose UC)              | **bài nộp** / **bản nháp** / **đề xuất phân công** / **tự lưu**                                    | Product EN *Submission Autofill/Gating* **giữ**                                        |
| O20 | *committee* / *Author/* / *participant* (prose)                          | **ban chương trình** / **tác giả và…** / **người tham gia**                                        | Không code-switch vai trò                                                              |
| O21 | *Notification được phát sinh* / *được lưu* / *được chọn* (thiếu chủ thể) | **Hệ thống phát thông báo…** / **Hệ thống lưu…** / **Nhóm chọn…** / **Báo cáo tách…**              | 2.9 + chủ–vị; apply full Ch3                                                           |
| O22 | *Đầu ra làm rõ…* / *có khả năng theo dõi* (đầu ra AI)                    | **Bản tổng hợp làm rõ…** / **theo dõi được (có dấu vết)**                                          | Chủ ngữ trừu tượng + calque *traceability*                                             |
| O23 | *WebSocket notification*                                                 | **Thông báo WebSocket**                                                                            | Prose VN + EN kỹ thuật kênh                                                            |

### P. Chương 4 — Đánh giá thực nghiệm (user review 2026-07-13)

| ID  | Trước                                                         | Sau                                                                                                  | Ghi chú                                         |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| P1  | _kiểm thử ràng buộc giao ước (contract testing)_              | **kiểm thử theo chuẩn đầu ra (contract testing)**                                                    | User Ch4 #6                                     |
| P2  | _không bao gồm HTTP / CSDL / mạng_ (viết tắt CSDL)            | **không bao gồm chi phí của HTTP, cơ sở dữ liệu và mạng**                                            | User Ch4 #7 — liệt kê đủ 3, không viết tắt CSDL |
| P3  | _ảnh chụp dữ liệu_ (snapshot)                                 | **bản sao lưu dữ liệu (snapshot)**                                                                   | User Ch4 #23 — thuật ngữ đúng; giữ thống nhất   |
| P4  | _gần thời gian thực_ / _tương tác gần thời gian thực_         | **phản hồi tức thời**                                                                                | User Ch4 #26                                    |
| P5  | _chỉ số thay thế (proxy)_ / _bằng chứng thay thế_             | **chỉ số gián tiếp (proxy)** / **cách đo thay thế**                                                  | User Ch4 #27 + I2/I3                            |
| P6  | _tác tử (agent)_                                              | **tác nhân (agent)**                                                                                 | User Ch4 #31                                    |
| P7  | _chỉ số tất định_ / _luật tất định_                           | **chỉ số so khớp trực tiếp** / **quy tắc kiểm tra cố định**                                          | B1/C — apply full Ch4                           |
| P8  | _hợp đồng đầu ra_ / _đối chứng hợp đồng_ / _vi phạm hợp đồng_ | **đối chiếu đầu ra với chuẩn đã định sẵn** / **vi phạm quy tắc kiểm tra đầu ra**                     | Mục 5.1                                         |
| P9  | _chi phí tính toán thuần túy_ / _trong tiến trình_            | **thời gian xử lý và mức sử dụng bộ nhớ** / **trong bộ nhớ chương trình** + phạm vi HTTP, CSDL, mạng | A3–A6                                           |
| P10 | _Người phản biện_                                             | **Phản biện viên** / **phản biện viên**                                                              | M1/N1                                           |
| P11 | _giảm tải nhận thức_                                          | **giảm gánh nặng theo dõi**                                                                          | N4                                              |
| P12 | _an toàn quyền truy cập_ (metric)                             | **khả năng tuân thủ quyền truy cập**                                                                 | H3                                              |
| P13 | _tỷ lệ … vừa đảm bảo tính bám nguồn vừa hợp lệ_               | **tỷ lệ vừa bám nguồn vừa hợp lệ**                                                                   | Rút gọn                                         |
| P14 | _workflow runner_ (trần)                                      | **bộ chạy luồng xử lý (workflow runner)** lần đầu; sau **bộ chạy**                                   | G4                                              |
| P15 | _Jaccard/Greedy (sản xuất)_                                   | **… (đang dùng)** / **… (triển khai)**                                                               | Calque _production_; ưu tiên _đang dùng_ khi nói code hiện tại |
| P16 | _tính khả thi hành động_                                      | **mức độ dễ chuyển thành chỉnh sửa**                                                                 | M4 _actionable_                                 |
| P17 | _kiểm tra sau khi có kết quả_ lặp cứng (mọi chỗ)              | **đánh giá** / **đánh giá sau khi đã có kết quả** khi ngữ cảnh đã rõ TCA                             | Không dán cùng một cụm mọi câu                  |
| P18 | _trong bộ nhớ chương trình_ (lặp sau micro-benchmark)         | **trong chương trình** + vẫn nêu _không bao gồm HTTP, cơ sở dữ liệu và mạng_                         | Tránh tautology _bộ nhớ … trong bộ nhớ_         |
| P19 | _có khả năng giải thích_ (câu hỏi/tiêu chí)                   | **có thể giải thích** (khi nói gợi ý/cơ chế); giữ _khả năng giải thích_ khi là NFR danh từ           | Đồng bộ với _có thể tái tạo_                    |
| P20 | _vs_ / _đáng kể_ trong nhận xét số liệu                       | **so với** / **rõ rệt**                                                                              | Bớt EN lẻ và khẩu ngữ                           |
| P21 | _Submission Gating quy trình kiểm soát nội dung_ / _điều hướng nội dung_ | **tuyến cảnh báo nội dung của Submission Gating** / **cảnh báo nội dung** (superseded: không _điều hướng nội dung_ — calque content steering) | Content steering = cảnh báo mềm, không “điều hướng” |
| P22 | _Hai tập… được phân tích độc lập hoặc hai chỉ số…_            | **Hai nhóm chỉ số được đo trên các tập mẫu riêng biệt**                                              | Câu gãy do replace; viết lại theo nghĩa         |
| P23 | _Kết luận bảo vệ được_ / _sản phẩm hoàn chỉnh_                | **Kết luận trong phạm vi bằng chứng hiện tại** / **ổn định ở mức có thể triển khai rộng**           | Bớt biện hộ + calque product                    |
| P24 | _đường ống xử lý_ (khi đã dùng _luồng_)                       | **luồng** / **luồng riêng**                                                                          | Thống nhất pipeline trong cùng chương           |
| P25 | Vai trò trong câu thường                                      | **phản biện viên** (thường); **Phản biện viên** chỉ ở đầu mục/caption/nhãn bảng khi cần              | Không viết hoa mọi chỗ                          |
| P26 | _gán nhãn thủ công cho mức độ bám chứng cứ…_ / _chưa có người đánh giá thủ công từng phát hiện_ | **chưa có người đọc lại từng cảnh báo nội dung do hệ thống đưa ra: liệu cảnh báo có bám chứng cứ, có dễ dùng để chỉnh sửa bài, và mức nghiêm trọng đến đâu** | Finding ≠ “phát hiện” trần; nêu rõ cảnh báo nội dung + chủ thể hệ thống |
| P27 | _khớp nhãn quyết định_ / _đo khớp nhãn quyết định_            | **đối chiếu với quyết định chấp nhận/từ chối do Chủ tọa đưa ra**                                    | Không calque _label matching_                   |
| P28 | _để kết luận X_ / _không kết luận X_ (động từ trần)           | **để đưa ra kết luận về X** / **không đưa ra kết luận về X**                                         | Động từ đầy đủ khi nói phạm vi kết luận         |
| P29 | _Kết luận cần tập trung…_ (thiếu chủ thể)                     | **Kết luận của chương này cần tập trung…**                                                           | Chủ ngữ trừu tượng phải neo chương/đề tài       |
| P30 | _đầu ra vận hành được_                                        | **đầu ra dùng được trong vận hành**                                                                  | Calque operational output                       |
| P31 | _sinh phát hiện… và bị kiểm tra_ / _được kiểm bằng số phát hiện_ | **sinh cảnh báo nội dung; hệ thống kiểm tra…** / **được kiểm tra bằng số cảnh báo nội dung**       | Ai kiểm tra? Cái gì bị kiểm? — chủ–vị tường minh |
| P32 | _Không ghi nhận vi phạm…_ / _Cùng thử nghiệm đã chạy…_        | **Thử nghiệm không ghi nhận…** / **Nhóm đã chạy cùng thử nghiệm…**                                   | Thiếu chủ ngữ hành động                         |
| P33 | _kết quả này cần giao diện…_ / _Đây đều là các điểm cần phản ánh vào giao diện_ | **hệ thống cần giao diện…** / **Hệ thống cần phản ánh các điểm này vào giao diện…**  | Kết quả/điểm không “cần giao diện”              |
| P34 | _chạy độc lập, điểm kiểm tra… và truy ngược…_ (song song hỏng) | **chạy độc lập, có điểm kiểm tra… và truy ngược được đầu ra…**                                      | Danh từ giữa hai động từ                        |
| P35 | _dùng không kiểm tra_                                         | **dùng mà không kiểm tra lại**                                                                       | Calque _use without checking_                   |
| P36 | _con người trong vòng kiểm soát (human-in-the-loop)_          | **sự can thiệp của con người (human-in-the-loop)** / **với sự can thiệp…**                           | Q17; không _vòng kiểm soát_                     |
| P37 | _mức độ… được đo thông qua_ / _; cần mở rộng…_ / _cho thấy cần cải thiện_ | **chương này đo mức độ…** / **nhóm cần mở rộng…** / **nhóm/hệ thống cần cải thiện…**         | Chủ ngữ tường minh cho _cần_ / bị động đo       |
| P38 | _không được đẩy thành phán quyết_                             | **không được dùng để đẩy thành phán quyết tự động**                                                  | Bị động có mục đích rõ                          |
| P39 | _API, cơ sở dữ liệu và cơ sở dữ liệu đồ thị_                  | **API, cơ sở dữ liệu quan hệ và cơ sở dữ liệu đồ thị**                                               | Tránh lặp “cơ sở dữ liệu” không phân loại       |
| P40 | _tỷ lệ thoái lui_ / _fallback rate_                           | **tỷ lệ chuyển sang phân công ngẫu nhiên** (user chốt 2026-07-13)                                    | Không calque _fallback/thoái lui_               |
| P41 | _báo cáo Markdown/CSV ngoại tuyến_ / _chạy ngoại tuyến_       | **báo cáo Markdown/CSV**; **chạy trên bản sao lưu dữ liệu (snapshot) cục bộ, không gọi API lúc đánh giá** | Offline ≠ “ngoại tuyến” trong prose đánh giá |
| P42 | _leave-one-out theo quyền tác giả_                            | **leave-one-out theo tác giả**                                                                       | Không _quyền_ (author-holdout ≠ author right)   |
| P43 | _độ hồi tưởng luật_ / _recall luật_                           | **tỷ lệ nhận đúng mã luật**                                                                          | Recall metric → nhận đúng mã, không “hồi tưởng” |
| P44 | _chặn nhầm_ / _false block_                                   | **chặn sai**                                                                                         | Ngắn, rõ hơn “nhầm”                             |
| P45 | _điều hướng nội dung_ / _content steering_                    | **cảnh báo nội dung** (cùng họ P21/P26)                                                              | Soft warning, không “điều hướng”                |
| P46 | _khả năng thu hồi rộng hơn_ (recall rộng)                     | **khả năng phủ rộng hơn**                                                                            | Không “thu hồi” cho retrieval recall            |
| P47 | _ràng buộc đạo đức_ (khi nói COI)                             | **ràng buộc xung đột lợi ích**                                                                       | COI ≠ ethics generic                            |
| P48 | _throughput_ (prose)                                          | **thông lượng**                                                                                      | Giữ EN chỉ trong log/code nếu cần               |
| P49 | _đầu-cuối_ / _end-to-end_ (prose đo)                          | **xuyên suốt từ đầu đến cuối**                                                                       | Tránh gạch nối calque                           |
| P50 | _Load StdDev_ / _Load Gini_ (prose/bảng)                      | **độ lệch chuẩn tải** / **hệ số Gini tải**                                                           | Việt hóa chỉ số trong bảng                      |
| P51 | _MRR (hạng nghịch đảo…)_ / _nDCG (độ lợi tích lũy…)_          | **MRR (Mean Reciprocal Rank)** / **nDCG (normalized Discounted Cumulative Gain)** + giải thích VN ngắn | Giữ tên metric EN chuẩn, gloss đầy đủ        |
| P52 | _gán lần lượt_ / _chỉ số nội tại_ (assignment)                | **gán tuần tự** / **chỉ số nội tại của phân công**                                                   | Round-robin + intrinsic metrics                 |
| P53 | _chủ đề hạt giống_ / _láng giềng gần_ / _bất bình đẳng_ (Gini) | **chủ đề khởi tạo (seed)** / **lân cận xấp xỉ (ANN)** / **mức chênh lệch tải**                      | Bớt calque seed/neighbor/inequality             |
| P54 | _dispatcher-worker_ / _Worker GPU_ / _JSON summary_           | **điều phối--xử lý (dispatcher-worker)** / **máy worker GPU** / **bản tóm tắt JSON**                 | Gloss EN khi cần kỹ thuật                       |
| P55 | _track_ (prose gợi ý chuyên đề)                               | **chuyên đề** (giữ EN trong tên track hội nghị, vd. Short Paper Track)                               | Cùng họ O19/product track                       |
| P56 | _metareview_ (prose)                                          | **metareview (nhận xét tổng hợp)** lần đầu/cột mốc; sau đó _metareview_ được                        | Giữ thuật ngữ lĩnh vực + gloss                  |

### S. Phụ lục danh mục thuật ngữ (2026-07-13)

| ID  | Trước / lỗi glossary                                              | Sau / quy tắc chốt                                                                 | Ghi chú |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| S1  | Mục không xuất hiện Ch1–5 (AI-native, DTO, Guardrail, …)          | **Xóa** khỏi `danh-muc-thuat-ngu.tex`                                              | Chỉ giữ thuật ngữ load-bearing |
| S2  | Reviewer = _Người phản biện_                                      | **phản biện viên** + tách sản phẩm **nhận xét / bản phản biện**                    | Đồng bộ Ch1–5 |
| S3  | Chair = _Chủ tọa / người điều phối_                               | **Chủ tọa (Chair)** / **Chủ tọa/Đồng chủ tọa**                                     | Bỏ “người điều phối” loãng |
| S4  | Contract = _Hợp đồng dữ liệu_                                       | **ràng buộc dữ liệu (data contract)** / **chuẩn đầu ra**                           | Cấm calque hợp đồng |
| S5  | TCA = Truthfulness-Coverage-Additionality                         | **TCA (Textual Claim-based Assessment)** + giải thích 3 trục                       | Không ghép sai tên |
| S6  | Proxy = _Chỉ báo thay thế_; Load StdDev/Gini EN                   | **chỉ số gián tiếp (proxy)**; **độ lệch chuẩn tải** / **hệ số Gini tải**           | P5, P50 |
| S7  | Permission safety / Stream duration / Fallback rate (nhãn EN ảo)  | **khả năng tuân thủ quyền truy cập** / **thời lượng luồng phản hồi** / **tỷ lệ chuyển sang phân công ngẫu nhiên** | Đặt tên theo prose báo cáo |
| S8  | Product workflows rời rạc nhiều hàng                              | **Một mục “Sáu luồng AI chính”** giữ tên EN + gloss VN ngắn                        | Tránh phình glossary |
| S9  | Thiếu HITL, agent, Area Chair, snapshot, deterministic            | **Thêm** theo cụm đã chốt cheat sheet                                              | Load-bearing Ch1/3/5 |

### T. Chương 2 — Tổng hợp ý kiến cộng đồng (user chốt 2026-07-13)

| ID  | Trước                                                          | Sau                                                                 | Ghi chú |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ------- |
| T1  | _tiếng nói cộng đồng_ / _tổng hợp tiếng nói cộng đồng_         | **tổng hợp ý kiến cộng đồng**                                       | User chốt; tránh ẩn dụ “tiếng nói” |
| T2  | _tổng hợp cộng đồng_ (rút gọn mơ)                              | **tổng hợp ý kiến cộng đồng**                                       | Giữ danh từ trung tâm “ý kiến” |
| T3  | _nghiên cứu ý kiến cộng đồng_ (khi chỉ secondary synthesis)   | **tổng hợp ý kiến cộng đồng** (hoặc _tổng hợp thứ cấp ý kiến…_)     | Tránh overclaim nghiên cứu sơ cấp |
| T4  | _FAQ vendor_                                                   | **câu hỏi thường gặp của nhà cung cấp hệ thống** / **FAQ của hệ thống** | Bớt jargon EN trong prose |
| T5  | _hướng dẫn Chair của HotCRP_                                   | **hướng dẫn dành cho Chủ tọa của HotCRP**                           | Chair → Chủ tọa (đã chốt) |
| T6  | _vòng kiểm soát_ (HITL trong bảng Ch2)                         | **sự can thiệp của con người (human-in-the-loop)** / **quyền kiểm soát của con người** | Q17; không “vòng kiểm soát” |
| T7  | _CMS hiện có_ / _matching/COI_ (prose)                         | **hệ thống quản lý hội nghị hiện có** / **đối sánh phản biện và COI** | Việt hóa khi không cần acronym |
| T8  | _desk-reject_ / _autofill metadata_ / _điểm số matching_ (prose) | **loại bài sớm** / **tự động điền metadata** / **điểm phù hợp khi đối sánh** | Product EN Submission Autofill giữ ở tên luồng |
| T9  | _track/chuyên đề_ (lặp kép)                                    | **chuyên đề (track)** lần đầu; sau **chuyên đề**                    | P55 |
| T10 | _Tổng hợp … cho phép nhóm củng cố_                             | **Từ tổng hợp …, nhóm củng cố…**                                    | R10 — chủ thể nhóm làm hành động |

### Q. Chương 5 — Kết luận (user review 2026-07-13)

| ID  | Trước                                                          | Sau                                                                               | Ghi chú                                            |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| Q1  | _Người phản biện_                                              | **phản biện viên**                                                                | M23/O2 — đồng bộ xuyên Ch5                         |
| Q2  | _reviewer matching_ / _Reviewer matching_ (trần)               | **đối sánh phản biện (reviewer matching)** lần đầu; sau **đối sánh phản biện**    | N3                                                 |
| Q3  | _giảm tải nhận thức_                                           | **giảm gánh nặng theo dõi**                                                       | N4                                                 |
| Q4  | _giảm tải_ (thao tác / điểm nghẽn)                             | **giảm khối lượng thao tác** / **giảm gánh nặng tại**                             | M9                                                 |
| Q5  | _thuật toán xác định_ _(lần đầu Ch5)_ / _cơ chế xác định_      | **thuật toán cố định, có thể kiểm chứng** / **cơ chế cố định, có thể kiểm chứng** | M15                                                |
| Q6  | _bán xác định_                                                 | **bán cố định**                                                                   | Calque _semi-deterministic_                        |
| Q7  | _tính nhất quán_ (tính chất thuật toán)                        | **ổn định, có thể tái tạo**                                                       | N7                                                 |
| Q8  | _cơ sở dữ liệu toàn diện hơn_ (quyết định học thuật)           | **cơ sở thông tin đầy đủ hơn**                                                    | Tránh nhầm _database_                              |
| Q9  | _kết luận bảo vệ được_                                         | **kết luận có cơ sở**                                                             | Bớt giọng biện hộ                                  |
| Q10 | _không sử dụng cho AI tạo sinh_                                | **không dùng AI tạo sinh**                                                        | Rút gọn, chủ thể rõ                                |
| Q11 | _tốt hơn thực hiện thủ công_                                   | **tốt hơn so với cách làm thủ công**                                              | Thiếu giới từ so sánh                              |
| Q12 | bản nháp / gửi _review_                                        | **bản nháp nhận xét phản biện** / **bản phản biện** chính thức                    | M3                                                 |
| Q13 | _trạng thái trạng thái_ ngăn chặn                              | **trạng thái** ngăn chặn (block)                                                  | Lỗi lặp                                            |
| Q14 | _bảo đảm_                                                      | **đảm bảo**                                                                       | M17                                                |
| Q15 | _proxy_ tự động / _tính bổ sung_                               | **cách đo thay thế** / **khả năng bổ sung (Additionality)**                       | I2 + H2                                            |
| Q16 | chuỗi gloss observability + monitoring + logging + tracing + … | **Giữ 1–2 EN chuẩn** (observability, AgentOps); phần còn lại chỉ VN               | G — không nhét EN hàng loạt                        |
| Q17 | _vòng kiểm soát của con người (human-in-the-loop)_             | **sự can thiệp của con người (human-in-the-loop)**                                | User Ch5 #20 chốt                                  |
| Q18 | _ReAct (Reasoning and Acting - Suy luận và Hành động)_         | **ReAct (Reasoning and Acting)**                                                  | User Ch5 #21 — một lớp gloss EN, không nhét VN kép |
| Q19 | _hậu kiểm_ (lần đầu mục)                                       | **kiểm tra sau khi có kết quả (hậu kiểm)**; sau giữ _hậu kiểm_                    | 5.3                                                |
| Q20 | _chọn bài phản biện (bidding)_                                 | **đăng ký/chọn bài phản biện (bidding)**                                          | Đồng bộ bidding                                    |
| Q21 | _đồng Tác giả_                                                 | **đồng tác giả**                                                                  | Viết hoa                                           |
| Q22 | _context_ được truyền…                                         | **ngữ cảnh** được truyền…                                                         | Việt hóa khi không proper name                     |
| Q23 | _các đề xuất không ghi nhận vi phạm_                           | **các đề xuất không chứa vi phạm** / **thử nghiệm không ghi nhận vi phạm trong các đề xuất** | Chủ ngữ lệch — đề xuất không “ghi nhận”            |
| Q24 | _chỉ số… cho thấy…, nhưng chưa đo_                             | _chỉ số… cho thấy…; **tuy nhiên, thử nghiệm chưa đo**_                            | Chủ ngữ lệch — chỉ số không “đo”                   |
| Q25 | sau “:” chuỗi động từ không chủ ngữ (_giảm…, gom…_)            | **vì giúp** giảm… / **cần** giảm…                                                | Neo vị ngữ vào chủ ngữ trước dấu hai chấm          |
| Q26 | _không dùng AI tạo sinh_ (mệnh đề tĩnh từ)                     | **và không dựa trên AI tạo sinh**                                                 | Chủ ngữ/động từ rõ trong liệt kê                   |
| Q27 | _có thể kết luận ConferenceSpace đáp ứng_                      | **có thể kết luận rằng** ConferenceSpace đáp ứng                                  | Bổ ngữ mệnh đề cần *rằng*                           |
| Q28 | _cần có giải thích… hoặc xác nhận bởi X_                       | **cần được giải thích, cho phép ghi đè, hoặc được X xác nhận**                    | Song song bị động–chủ động                         |
| Q29 | _kết luận hệ thống đang… và không làm ảnh hưởng_               | **kết luận liệu hệ thống có… hay không**                                          | Yes/no học thuật + chủ–vị rõ                       |
| Q30 | _Nếu phát triển tiếp…, hệ thống cần_                           | **Nếu hệ thống được phát triển tiếp…, nó cần**                                    | Mệnh đề *Nếu* thiếu chủ ngữ                        |
| Q31 | _Ở lớp…, cần bổ sung_                                          | **Ở lớp…, nhóm cần bổ sung**                                                      | Câu mệnh lệnh ẩn — bổ chủ ngữ                      |
| Q32 | _doanh thu nếu có nên dựa_                                     | **nếu có doanh thu thì doanh thu đó nên dựa**                                     | Điều kiện lồng trong vị ngữ                        |
| Q33 | _Chatbot Agent còn tỷ lệ lỗi_                                  | **Chatbot Agent vẫn còn tỷ lệ lỗi**                                               | Thiếu động từ/trợ động từ                          |
| Q34 | _tham khảo từ lỗi vận hành_                                    | **rút kinh nghiệm từ sự cố vận hành**                                             | Calque + song song danh từ                         |
| Q35 | _không phải là trao quyền…, mà là để agent_                    | **không phải là việc trao quyền…, mà là việc agent**                              | Cân bằng *không phải A mà là B*                    |

---

## 8. Checklist review (pass/fail)

Dùng cho mọi đoạn được chạm. **FAIL bất kỳ mục nào → sửa trước khi merge/chốt.**

| #   | Câu hỏi                                                                                                           | Pass khi                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Giọng đoạn là phương pháp/kết quả hay biện hộ reviewer?                                                           | Phương pháp / kết quả                                                                |
| 2   | Có calque “dịch + nhét EN trùng nghĩa” không?                                                                     | Không; tên chuẩn EN đứng một mình + giải thích VN                                    |
| 3   | Chỉ số đã có tiền tố (_độ / tỉ lệ / khả năng_) và nghĩa hình dung được chưa?                                      | Có                                                                                   |
| 4   | Phạm vi đo (gồm / không gồm) đã nêu khi dễ nhầm chưa?                                                             | Có, nếu liên quan micro-benchmark / HTTP                                             |
| 5   | Câu hỏi nhúng yes/no đã có _liệu_ chưa?                                                                           | Có, nếu là câu hỏi đánh giá                                                          |
| 6   | Hành động đã nối _để kiểm tra / nhằm…_ chưa?                                                                      | Có, khi liệt kê tiêu chí                                                             |
| 7   | Còn _hợp đồng_, _tất định_, _chi phí tính toán thuần túy_, _đáp án tham chiếu_?                                   | Không — đã thay bằng cụm mục 5–4                                                     |
| 8   | _chuẩn đã định_ đã thành _chuẩn đã định sẵn_ khi nói output standard?                                             | Có                                                                                   |
| 9   | Gloss trong ngoặc có thêm thông tin không?                                                                        | Có hoặc đã xóa                                                                       |
| 10  | Đọc to có nghe dịch máy / cứng không?                                                                             | Không — đã soi mục 2.7                                                               |
| 11  | (Nếu sửa kịch bản) Bảng overview + subsection chi tiết, không “vá”?                                               | Đúng cấu trúc mục 6                                                                  |
| 12  | User vừa chốt / sửa wording khác bản hệ thống — đã ghi ví dụ vào mục 7 (và 5/9 nếu cần) chưa?                     | Có, theo mục 7.0 — hoặc N/A nếu không đủ điều kiện ghi                               |
| 13  | Vai trò reviewer đã thành **phản biện viên**; sản phẩm review là **nhận xét / bản phản biện**?                    | Có, không trộn vai trò với nội dung                                                  |
| 14  | Câu có **chủ thể** rõ (ai tạo / ai quyết / hệ thống hay AI)?                                                      | Có                                                                                   |
| 24  | Bị động *được thực hiện / được dùng / được triển khai* có **chủ thể** tường minh không?                            | Có — ưu tiên *nhóm/hệ thống + động từ chủ động* khi ngữ cảnh cho phép (R1–R5)        |
| 25  | Ô bảng / bullet / cột “Cơ sở” có chủ–vị đủ, không chỉ cụm danh từ hoặc mệnh lệnh?                                 | Có — *Hệ thống cần… / Yêu cầu xuất phát từ… / Nhóm không dùng…* (R6–R7, R13, R17, R19–R22) |
| 15  | Đã **rút gọn** mệnh đề thừa khi cùng ý chưa (không chỉ đổi synonym)?                                              | Có hoặc N/A                                                                          |
| 16  | Lần đầu nói deterministic layer: **thuật toán cố định, có thể kiểm chứng**?                                       | Có; lần sau được xen kẽ cụm ngắn hơn                                                 |
| 17  | Dùng **đảm bảo** (không _bảo đảm_) khi khẳng định trách nhiệm / kết quả?                                          | Có, thống nhất báo cáo                                                               |
| 18  | Có chồng từ _nền tảng_ (platform + foundational) trong **cùng đoạn** không?                                       | Không chồng; _nghiệp vụ nền tảng_ được giữ nếu không cạnh _nền tảng_ = platform (N5) |
| 21  | Pain point UX theo dõi trạng thái: tránh _nhận thức_ / _giảm tải nhận thức_?                                      | Có — dùng _gánh nặng theo dõi_ / _khối lượng thao tác_ (N4)                          |
| 22  | Reviewer matching: **đối sánh phản biện (reviewer matching)** khi cần ngữ cảnh?                                   | Có (N3)                                                                              |
| 23  | Deterministic property: **ổn định, có thể tái tạo** (không _lặp lại được_)?                                       | Có khi mô tả tính chất kết quả (N7)                                                  |
| 19  | Liệt kê **ba lớp** (cốt lõi / deterministic / AI): dấu phẩy trong lớp giữa có làm thành 4 hạng mục không?         | Không — dùng `;` giữa lớp hoặc `và` trong lớp giữa (M26)                             |
| 20  | Câu “không tự quyết định / xem lại đầu ra AI” đã có **chủ thể** đúng (người dùng / hệ thống) chưa?                | Có — không để _đầu ra AI_ làm chủ ngữ quyết định (M27)                               |
| 24  | Token EN prose: *notification* → **thông báo**; *thread* → **chuỗi thảo luận**; *message* → **tin nhắn**; *submission* → **bài nộp** (trừ product/code)? | Có (O17–O19); giữ product EN, `\texttt{}`, listing, nhãn diagram kỹ thuật            |
| 25  | _plugin_ (tích hợp): không bắt Việt hóa nếu user/chương giữ EN kỹ thuật?                                          | Có — Ch3 giữ _plugin_ (O3)                                                           |
| 43  | *notification* trần trong prose bất kỳ chương nào?                                                                | Không — đã Việt hóa (O17)                                                            |
| 26  | _data contract_ / gloss kỹ thuật có giá trị: không xóa chỉ vì “dịch + nhét”?                                      | Giữ khi bổ sung nghĩa (O5); xóa khi trùng nghĩa thuần                                |
| 27  | Micro-benchmark: phạm vi **HTTP, cơ sở dữ liệu và mạng** đã liệt kê đủ, không viết tắt CSDL?                      | Có (P2)                                                                              |
| 28  | Snapshot Semantic Scholar: **bản sao lưu dữ liệu (snapshot)** (không _ảnh chụp_)?                                 | Có (P3)                                                                              |
| 29  | Proxy: **chỉ số gián tiếp (proxy)** (không _chỉ số thay thế_ / _bằng chứng thay thế_)?                            | Có (P5)                                                                              |
| 30  | Agent: **tác nhân (agent)** (không _tác tử_)?                                                                     | Có (P6)                                                                              |
| 31  | human-in-the-loop: **sự can thiệp của con người (human-in-the-loop)** (không _vòng kiểm soát_)?                   | Có (Q17)                                                                             |
| 32  | ReAct: **ReAct (Reasoning and Acting)** — một lớp gloss EN, không nhét VN kép?                                    | Có (Q18)                                                                             |
| 33  | Quyết định học thuật: **cơ sở thông tin** (không _cơ sở dữ liệu_ khi không nói database)?                         | Có (Q8)                                                                              |
| 34  | Cụm TCA/hậu kiểm: đã **viết lại theo ngữ cảnh** (không dán cùng một cụm mọi câu)?                                 | Có (P17)                                                                             |
| 35  | Câu gãy do bulk-replace: đã **đọc lại và viết lại** thay vì chỉ đổi token?                                        | Có (P22)                                                                             |
| 36  | Chủ ngữ–vị ngữ: chủ ngữ có **làm được** hành động vị ngữ không (không *đề xuất ghi nhận*, *chỉ số đo*)?            | Có (Q23–Q24)                                                                         |
| 37  | Sau dấu hai chấm liệt kê hành động: đã neo bằng *vì giúp* / *cần* / *gồm*?                                        | Có (Q25)                                                                             |
| 38  | Mệnh đề *Nếu…*: đã có chủ ngữ rõ?                                                                                 | Có (Q30)                                                                             |
| 39  | Câu *cần + động từ* không chủ ngữ: đã bổ *nhóm* / *hệ thống*?                                                     | Có (Q31)                                                                             |
| 40  | Submission Gating “finding”: đã dùng **cảnh báo nội dung** (không _từng phát hiện_ trần)?                         | Có (P26, P31)                                                                        |
| 41  | _đầu ra vận hành được_ / _dùng không kiểm tra_ / _vòng kiểm soát HITL_: đã thay cụm chốt?                         | Có (P30, P35, P36)                                                                   |
| 42  | Câu nhận xét số liệu thiếu chủ ngữ (_Không ghi nhận…_, _Cùng thử nghiệm đã chạy…_): đã neo *thử nghiệm/nhóm*?     | Có (P32)                                                                             |
| 43  | Fallback/offline/recall/content steering: đã dùng cụm chốt P40–P46 (không _thoái lui_ / _ngoại tuyến_ / _hồi tưởng_ / _điều hướng_)? | Có (P40–P46)                                                              |
| 44  | Chỉ số ranking/assignment: MRR/nDCG giữ EN + gloss; Load StdDev/Gini Việt hóa; leave-one-out **theo tác giả**?   | Có (P42, P50–P51)                                                                    |
| 45  | _track_ prose → **chuyên đề**; _metareview_ → gloss **nhận xét tổng hợp** khi lần đầu/cột mốc?                   | Có (P55–P56)                                                                         |

---

## 9. Cụm ưu tiên nhanh (cheat sheet)

```
Go micro-benchmark
thời gian xử lý và mức sử dụng bộ nhớ, không bao gồm chi phí của HTTP, cơ sở dữ liệu và mạng
  (không viết tắt CSDL; list đủ 3 — P2)
các chỉ số so khớp trực tiếp như Exact Match, ROUGE và F1
đối chiếu đầu ra với chuẩn đã định sẵn
kiểm tra đầu ra theo quy tắc rõ ràng / kiểm thử theo chuẩn đầu ra (contract testing)
dữ liệu tham chiếu trực tiếp / có thể tham chiếu trực tiếp
quy tắc kiểm tra cố định
khả năng tuân thủ quyền truy cập
chỉ số gián tiếp (proxy)  (tránh: chỉ số thay thế / bằng chứng thay thế)
bản sao lưu dữ liệu (snapshot)  (không: ảnh chụp dữ liệu)
phản hồi tức thời  (không: gần thời gian thực)
tác nhân (agent)  (không: tác tử)
bộ chạy luồng xử lý (workflow runner)
Jaccard/Greedy (đang dùng)  (không: sản xuất; triển khai cũng được)
đánh giá / đánh giá sau khi đã có kết quả  (không dán “kiểm tra sau khi có kết quả” mọi chỗ)
có thể giải thích  (câu hỏi/tiêu chí; NFR danh từ: khả năng giải thích)
so với / rõ rệt  (không: vs / đáng kể trong nhận xét số)
luồng / luồng riêng  (không: đường ống khi chương đã dùng luồng)
phản biện viên  (thường); Phản biện viên  (đầu mục/caption)
gán nhãn thủ công cho mức độ A, B, C
chưa có người đọc lại từng cảnh báo nội dung do hệ thống đưa ra: liệu …, có …, và …
(tránh: từng phát hiện trần; gán nhãn thủ công cho mức độ A, B, C)
khớp nhãn quyết định → đối chiếu với quyết định chấp nhận/từ chối do Chủ tọa đưa ra
để đưa ra kết luận về X / không đưa ra kết luận về X  (không: để kết luận X)
đầu ra dùng được trong vận hành  (không: đầu ra vận hành được)
hệ thống cần giao diện… / nhóm cần mở rộng…  (không: kết quả cần giao diện; ; cần mở rộng)
dùng mà không kiểm tra lại  (không: dùng không kiểm tra)
sự can thiệp của con người (human-in-the-loop)  (không: vòng kiểm soát)
Thử nghiệm không ghi nhận… / Nhóm đã chạy…  (không: Không ghi nhận…; Cùng thử nghiệm đã chạy…)
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
không khả dụng — hợp lệ NFR/vận hành (N6); không dùng được — khi câu calque cứng
nghiệp vụ nền tảng — giữ nếu không chồng platform (N5); nghiệp vụ truyền thống khi chồng nền tảng=platform
tính năng (product; tránh: khả năng mơ); tên product EN: Submission Autofill
cơ sở thực nghiệm để đánh giá
giai đoạn phản hồi của tác giả (rebuttal) / phản hồi của tác giả (rebuttal)
Chủ tọa khu vực (Area Chair) / Chủ tọa khu vực cấp cao (Senior Area Chair)
Chủ tọa (không bắt buộc gloss Chair nếu đã chốt)
Phản biện viên (không bắt buộc gloss Reviewer nếu đã chốt)
đối sánh phản biện (reviewer matching)
ổn định, có thể tái tạo  (tránh: lặp lại được — N7)
giảm gánh nặng theo dõi / giảm khối lượng thao tác  (tránh: giảm tải nhận thức — N4)
Nhóm thực hiện khảo sát…  (tránh: Khảo sát được thực hiện… — R1)
Hệ thống cần… / Hệ thống không được…  (ô bảng, yêu cầu — R6, R17, R21)
Yêu cầu xuất phát từ… / Đây là nghiệp vụ…  (cột Cơ sở — R20)
Nhóm không dùng một chỉ số…  (tránh: Không dùng… mệnh lệnh — R19)
Tổng hợp …, nhóm nhận thấy…  (tránh: Tổng hợp … cho thấy… — R10)
luồng AI / luồng xử lý (tránh lặp workflow trừ tên riêng)
mức độ sử dụng được (tránh: độ khả dụng — metric AI, khác NFR “không khả dụng”)
ba lớp: A; B và C; D  (tránh: A, B, C và D khi B đã có dấu phẩy nội bộ)
Người dùng được xem lại đầu ra AI; hệ thống không tự quyết định…
phân công phản biện viên cho bài báo (không: với bài báo)
đưa ra nhận định (không: tạo nhận định)
hỗ trợ đọc hiểu (không: đọc hiểu đứng một mình trong chuỗi tính năng)
khả năng giải thích (NFR; tránh: tính giải thích)
mức độ sử dụng được (bản nhận xét; tránh: khả năng sử dụng (usability))
đặc tả API / đặc tả OpenAPI (tránh: hợp đồng API — khác hợp đồng đầu ra mục 5.1)
Chủ tọa/Đồng chủ tọa (Chair/Co-chair)
giữ plugin khi prose kỹ thuật Ch3 (O3)
thông báo  (không: notification / Notification trong prose — O17)
chuỗi thảo luận / tin nhắn  (không: thread / message trong prose Discussion — O18)
bài nộp / bản nháp / phân công  (không: submission / draft / assignment trần trong prose — O19)
ban chương trình  (không: committee trong prose — O20)
Hệ thống lưu… / Nhóm chọn… / Báo cáo tách…  (không: X được lưu/chọn/tách khi thiếu chủ thể — O21)
token EN product/code/status/diagram: giữ; prose còn lại Việt hóa có chủ–vị
giữ gloss (data contract) khi bổ nghĩa (O5)
mối quan ngại chính (tránh: mối lo chính)
sự can thiệp của con người (human-in-the-loop)  (không: vòng kiểm soát của con người — Q17)
ReAct (Reasoning and Acting)  (không nhét "- Suy luận và Hành động" — Q18)
cơ sở thông tin đầy đủ hơn  (tránh: cơ sở dữ liệu toàn diện hơn khi nói quyết định — Q8)
kết luận có cơ sở  (tránh: kết luận bảo vệ được — Q9)
đăng ký/chọn bài phản biện (bidding)
các đề xuất không chứa vi phạm  (không: đề xuất không ghi nhận — Q23)
thử nghiệm chưa đo…  (không: chỉ số… nhưng chưa đo — Q24)
vì giúp / cần  sau dấu hai chấm khi liệt kê hành động (Q25)
kết luận rằng… / liệu… hay không
Nếu hệ thống được…, nó cần…  (mệnh đề Nếu có chủ ngữ — Q30)
nhóm cần bổ sung…  (không: Ở lớp…, cần bổ sung — Q31)
nếu có doanh thu thì doanh thu đó nên…  (Q32)
không phải là việc A, mà là việc B  (Q35)

tỷ lệ chuyển sang phân công ngẫu nhiên  (không: tỷ lệ thoái lui — P40)
chạy trên bản sao lưu dữ liệu (snapshot) cục bộ, không gọi API lúc đánh giá  (không: chạy ngoại tuyến — P41)
báo cáo Markdown/CSV  (không: …ngoại tuyến — P41)
leave-one-out theo tác giả  (không: theo quyền tác giả — P42)
tỷ lệ nhận đúng mã luật  (không: độ hồi tưởng luật — P43)
chặn sai  (không: chặn nhầm — P44)
cảnh báo nội dung  (không: điều hướng nội dung / content steering — P45)
khả năng phủ rộng hơn  (không: khả năng thu hồi rộng hơn — P46)
ràng buộc xung đột lợi ích  (không: ràng buộc đạo đức khi nói COI — P47)
thông lượng  (không: throughput trong prose — P48)
xuyên suốt từ đầu đến cuối  (không: đầu-cuối — P49)
độ lệch chuẩn tải / hệ số Gini tải  (không: Load StdDev / Load Gini — P50)
MRR (Mean Reciprocal Rank) / nDCG (normalized Discounted Cumulative Gain)  (P51)
gán tuần tự / chỉ số nội tại của phân công  (P52)
chủ đề khởi tạo (seed) / lân cận xấp xỉ (ANN) / mức chênh lệch tải  (P53)
điều phối--xử lý (dispatcher-worker) / máy worker GPU / bản tóm tắt JSON  (P54)
chuyên đề  (không: track trong prose gợi ý — P55)
metareview (nhận xét tổng hợp)  (P56)
tổng hợp ý kiến cộng đồng  (không: tiếng nói cộng đồng / tổng hợp cộng đồng / nghiên cứu ý kiến cộng đồng khi chỉ secondary — T1–T3)
hướng dẫn dành cho Chủ tọa  (không: hướng dẫn Chair — T5)
hệ thống quản lý hội nghị hiện có  (không: CMS hiện có trong prose — T7)
loại bài sớm / tự động điền metadata / điểm phù hợp khi đối sánh  (không: desk-reject / autofill / điểm số matching trần — T8)

glossary phụ lục: chỉ mục xuất hiện Ch1–5; cột 2 bám cụm chốt; không invent nhãn EN ảo (S1–S9)
TCA = Textual Claim-based Assessment  (không: Truthfulness-Coverage-Additionality — S5)
ràng buộc dữ liệu (data contract) / chuẩn đầu ra  (không: hợp đồng — S4)
tỷ lệ chuyển sang phân công ngẫu nhiên  (cột chính glossary; tỷ lệ thoái lui chỉ phụ — S7/P40)
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

**Nhắc session sau (Ch1–Ch5 đã chốt):** Ch2 secondary evidence = **tổng hợp ý kiến cộng đồng** (T1–T3; không _tiếng nói_ / không overclaim _nghiên cứu_ khi chỉ forum-policy); reviewer = **phản biện viên** (không _Người phản biện_; không bắt buộc gloss EN; viết hoa chỉ đầu mục/caption); Chair = **Chủ tọa** / **Chủ tọa/Đồng chủ tọa**; Area Chair = **Chủ tọa khu vực (Area Chair)**; matching = **đối sánh phản biện (reviewer matching)**; _đảm bảo_; lần đầu deterministic = **thuật toán cố định, có thể kiểm chứng** (hoặc _cố định và có thể kiểm chứng_ trong list `;`); tính chất = **ổn định, có thể tái tạo**; **không khả dụng** hợp lệ NFR (N6); **nghiệp vụ nền tảng** giữ nếu không chồng platform (N5); tránh _nhận thức_ cho UX theo dõi (N4); product EN **Submission Autofill** / **Reviewer Initial Analysis** / **Chair Decision Copilot** giữ; ba lớp dùng `;` (M26); **hỗ trợ đọc hiểu** (M30); Ch2 chủ–vị (nhóm R): *nhóm thực hiện khảo sát*; *hệ thống cần…*; *yêu cầu xuất phát từ…*; *hệ thống không được dùng AI…*; *nhóm không dùng một chỉ số…*; bullet/ô bảng phải có chủ ngữ tường minh; Ch3: **giữ plugin** (O3); prose **thông báo / chuỗi thảo luận / tin nhắn / bài nộp / bản nháp / phân công / ban chương trình** (O17–O20); chủ–vị: *Hệ thống/Nhóm/Báo cáo + động từ* (O21); **giữ gloss (data contract)** khi bổ nghĩa (O5); _hợp đồng API_ → **đặc tả API** (O6); product EN *Submission Autofill* giữ; Ch4: micro-benchmark = **thời gian xử lý và mức sử dụng bộ nhớ, không bao gồm chi phí của HTTP, cơ sở dữ liệu và mạng** (P2, không viết tắt CSDL); snapshot = **bản sao lưu dữ liệu (snapshot)** (P3); proxy = **chỉ số gián tiếp (proxy)** (P5); **phản hồi tức thời** (P4); **tác nhân (agent)** (P6); _hợp đồng đầu ra_ / _tất định_ → cụm mục 5; contract testing = **kiểm thử theo chuẩn đầu ra (contract testing)** (P1); **đọc câu theo ngữ cảnh** — không bulk-replace cứng (P17/P22); TCA = **đánh giá** khi ngữ cảnh đã rõ; _production_ = **đang dùng**; _vs/đáng kể_ → **so với/rõ rệt**; finding Gating = **cảnh báo nội dung** (P26/P31/P45, không _từng phát hiện_ / _điều hướng nội dung_); _vận hành được_ → **dùng được trong vận hành** (P30); chủ–vị: **Kết luận của chương…**, **Thử nghiệm/Nhóm…**, **hệ thống/nhóm cần…** (P29–P39); fallback = **tỷ lệ chuyển sang phân công ngẫu nhiên** (P40, user chốt); offline = **chạy cục bộ / không gọi API lúc đánh giá**, không _ngoại tuyến_ (P41); leave-one-out **theo tác giả** (P42); recall luật = **tỷ lệ nhận đúng mã luật** (P43); chặn sai (P44); _track_ prose = **chuyên đề** (P55); _metareview_ + gloss **nhận xét tổng hợp** (P56); Ch5: human-in-the-loop = **sự can thiệp của con người (human-in-the-loop)**; ReAct = **ReAct (Reasoning and Acting)** một lớp EN; quyết định = **cơ sở thông tin** không _cơ sở dữ liệu_; _kết luận có cơ sở_ không _bảo vệ được_; bidding = **đăng ký/chọn bài phản biện (bidding)**; phụ lục glossary: chỉ giữ thuật ngữ load-bearing Ch1–5, TCA đúng **Textual Claim-based Assessment**, không calque _hợp đồng_, metric đặt tên theo prose VN đã chốt (S1–S9).
