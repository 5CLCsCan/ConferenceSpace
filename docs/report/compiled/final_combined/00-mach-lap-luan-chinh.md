# Mạch lập luận chính — ConferenceSpace

> **Mục đích file:** chốt ý tưởng và mạch nội dung để đối chiếu mọi chương.  
> **Nguồn chuẩn:** định hướng đã thống nhất với nhóm (feedback gần đây), **không** sao chép nguyên trạng prose hiện có.  
> **Cách dùng:** mỗi đoạn báo cáo phải hỗ trợ ít nhất một mắt xích dưới đây; nếu không → cắt, chuyển Ch2/Ch5, hoặc đánh dấu “ngoài mạch”.

---

## 0. Một câu định vị (thesis)

**ConferenceSpace không nhằm cạnh tranh hay thay thế các nền tảng quản lý hội nghị đã làm tốt nghiệp vụ truyền thống.**  
Đề tài **tham chiếu quy trình hiện có**, rồi **nghiên cứu và hiện thực cách tích hợp AI cùng các kỹ thuật hỗ trợ mới vào quy trình xét duyệt** — sao cho **cải thiện hiệu suất thao tác / hỗ trợ quyết định** trong khi **không vi phạm (và chủ động giảm rủi ro vi phạm) nguyên tắc liêm chính khoa học**.  
Hệ thống là **cơ sở thực nghiệm** cho ranh giới: *nghiệp vụ lõi · thuật toán có thể kiểm chứng · AI hỗ trợ có kiểm soát của con người*.

---

## 1. Chuỗi lập luận lõi (đọc theo thứ tự)

```
[1] Áp lực quy mô peer review hội nghị
        ↓
[2] Nhu cầu hỗ trợ trên các công đoạn nặng thông tin / điều phối
        ↓
[3] AI/LLM đủ mạnh để hỗ trợ một số công đoạn — NHƯNG
        ↓
[4] Học thuật thận trọng: liêm chính, bảo mật bản thảo, trách nhiệm người
        ↓
[5] Hai thực tế song song về “AI trong peer review”
        (5a) Shadow AI: người tự dùng ChatGPT… ngoài CMS → khó kiểm soát liêm chính
        (5b) Controlled AI: thử nghiệm/chính sách hội nghị (opt-in, có ràng buộc)
        ↓
[6] CMS khảo sát (EasyChair, HotCRP, CMT, OpenReview):
        mạnh nghiệp vụ truyền thống; khoảng trống = lớp AI hỗ trợ
        gắn quy trình, có kiểm soát, thống nhất — không phải “thiếu nộp bài/phản biện”
        ↓
[7] Khoảng trống nghiên cứu / sản phẩm của đề tài
        = tích hợp AI (và kỹ thuật hỗ trợ) vào quy trình khép kín có kiểm soát
        ≠ làm lại / đánh bại CMS về tổ chức hội nghị
        ↓
[8] Giải pháp: ConferenceSpace + ba lớp trách nhiệm
        ↓
[9] Đánh giá: chứng minh khả thi / giá trị / giới hạn trong điều kiện thử nghiệm
        ↓
[10] Kết luận: đóng góp = hướng tích hợp AI có kiểm soát trên nền quy trình chuẩn
```

Mọi câu “vì sao làm đề tài này” phải truy về **[7]**.  
Mọi câu “hệ thống làm gì” phải truy về **[8]**.  
Mọi câu “đạt được gì” phải truy về **[9]–[10]**.

---

## 2. Các mệnh đề chốt (claim cards)

Dùng bảng này khi review wording: **chỉ giữ claim ở mức đã chốt**.

| ID | Mệnh đề chốt | Được phép nói | Không được nói | Neo bằng chứng (loại) |
|----|--------------|---------------|----------------|------------------------|
| C1 | Số bài / quy mô peer review hội nghị (đặc biệt AI/ML) tăng mạnh | Số liệu venue cụ thể + gánh nặng reviewer / gán bài / chất lượng bị đe dọa | “Mọi lĩnh vực đều sụp đổ peer review” | Paper, fact sheet, Science/PC |
| C2 | Áp lực lan sang nhiều công đoạn vận hành | Gán reviewer, tải review, chất lượng nhận xét, tổng hợp ở tầng Chair/AC | Gán COI là “đã được literature chứng minh khó hơn vì scale” nếu chưa có nguồn | Cùng C1 + mô tả pipeline |
| C3 | AI/LLM **có thể** hỗ trợ công đoạn khối lượng lớn | Hiệu quả trong **thiết kế kiểm soát**, bối cảnh cụ thể (vd. feedback trên review người) | “AI thay được đánh giá học thuật / quyết định accept-reject” | RCT / experiment hội nghị |
| C4 | Cộng đồng và chính sách **thận trọng** về AI trong viết & phản biện | Chia rẽ thái độ; confidentiality; human responsibility; cấm/hạn chế generative review | “Học thuật cấm hoàn toàn AI” | Survey Nature/Wiley; policy ICLR/ICML; COPE/publisher |
| C5 | Rủi ro khi AI chi phối quyết định / thiếu kiểm tra | Tăng rủi ro liêm chính & tin cậy so với chỉ giảm workload | “AI luôn làm tệ hơn mọi metric” | Policy + failure mode; không cần % bịa |
| C6 | **CMS khảo sát đã làm tốt** vòng đời truyền thống | Nộp, COI, gán, thu review, quyết định — hạ tầng trưởng thành | “CMS yếu / thiếu nghiệp vụ lõi” (phá định vị) | Product docs + usage stats |
| C7 | **Khoảng trống** (phạm vi khảo sát đề tài) | Chưa có lớp AI hỗ trợ gắn quy trình **thống nhất + có kiểm soát liêm chính** như năng lực lõi công khai | “Không nền tảng nào trên thế giới có AI”; “CMT không có AI gì” (nhầm TPMS/matching) | Bảng đối chiếu CMS; negative evidence có scope |
| C8 | **Shadow AI** | Người dùng có thể tự dùng công cụ AI bên ngoài → CMS không enforce confidentiality / ranh giới review | “Mọi reviewer đều dán paper vào ChatGPT” (thiếu nguồn) | Policy cấm paste; optional empirical/news |
| C9 | **Controlled AI** ≠ ChatGPT tự do | Thử nghiệm ICLR/NeurIPS: opt-in, ràng buộc dữ liệu/vai trò, không thay reviewer viết review | Gộp “hội nghị cho phép AI” = “cho dùng ChatGPT tùy ý” | Blog/policy/experiment chính thức |
| C10 | Định vị đề tài | Tham chiếu quy trình CMS + nghiên cứu **hướng tích hợp AI có kiểm soát**; **không cạnh tranh** thay thế CMS | “Chúng tôi tốt hơn EasyChair về tổ chức hội nghị” | Positioning (self) + C6–C9 |
| C11 | Ba lớp | Lõi vận hành khi AI down; matching/COI = deterministic/explainable; AI = hỗ trợ + người xác nhận | “Ba lớp đã được literature chứng minh là kiến trúc tối ưu” | Design principle + policy human-final |
| C12 | Đóng góp | Hệ thống tích hợp + đánh giá ranh giới AI trong peer review workflow | Tự động hóa quyết định học thuật; phát hiện đủ mọi COI; hiệu quả dài hạn mọi hội nghị | Ch4 evidence + scope Ch1 |

---

## 3. Ba tầng “AI trong peer review” (bắt buộc tách trong prose)

Khi viết về AI + nền tảng, **luôn** giữ đủ hoặc trỏ rõ tầng:

| Tầng | Tên ngắn | Nội dung | Hàm ý thiết kế |
|------|----------|----------|----------------|
| T1 | **CMS mature** | EasyChair, HotCRP, CMT, OpenReview: giỏi **tổ chức hội nghị truyền thống** | Không phải bài toán “làm lại CMS ops” |
| T2 | **Shadow AI** | User tự dùng ChatGPT/Claude… **ngoài** nền tảng | Không đảm bảo liêm chính / confidentiality chỉ bằng “cho phép thử AI” |
| T3 | **Controlled in-process AI** | AI **trong** quy trình: vai trò rõ, xác nhận người, không accept/reject, không viết review thay người; có thể cấu hình theo policy | **Đây là khoảng trống + điểm mới** đề tài nhắm tới |

**Hệ quả wording:**

- “Các bên cho phép AI thử nghiệm” → chỉ T3 (và policy T3), **không** mô tả như T2.  
- “Tích hợp AI khép kín” → **giảm rủi ro / hỗ trợ tuân thủ** liêm chính, **không** “đảm bảo tuyệt đối không ai vi phạm”.

---

## 4. Câu trả lời chuẩn cho hội đồng (elevator)

| Câu hỏi | Trả lời theo mạch |
|---------|-------------------|
| Vì sao không chỉ dùng EasyChair? | EasyChair (và peers) **đã đủ** nghiệp vụ truyền thống. Đề tài không sửa “thiếu phân hệ nộp bài”, mà khảo sát **lớp hỗ trợ AI có kiểm soát** trên nền quy trình chuẩn. |
| Điểm mới là gì? | **Hướng và hiện thực** tích hợp AI/kỹ thuật hỗ trợ vào workflow peer review **có ranh giới liêm chính** (ba lớp + human final authority + đánh giá). |
| Có cạnh tranh CMS không? | **Không.** Tham chiếu quy trình; prototype để nghiên cứu khoảng trống AI. |
| AI có thay Chair/reviewer không? | **Không.** AI hỗ trợ; quyết định và trách nhiệm thuộc người/vai trò có thẩm quyền. |
| Sao không để user tự dùng ChatGPT? | Shadow AI **không** enforce confidentiality và ranh giới review; đề tài đề xuất **in-process, có kiểm soát**. |
| Đánh giá chứng minh gì? | Khả thi vận hành + giá trị hỗ trợ + giới hạn **trong thử nghiệm** — không claim hiệu quả dài hạn mọi venue. |

---

## 5. Phân công mạch theo chương (đối chiếu nhanh)

### Chương 1 — Mở đầu

#### 5.1. Vai trò chương

Chương 1 **neo bài toán và ranh giới**, không chứng minh gap chi tiết (Ch2) và không đánh giá (Ch4).  
Mọi đoạn “Đặt vấn đề” phải đi hết chuỗi **[1]→[7]** rồi mới giới thiệu ConferenceSpace **[8]**.  
Câu trả lời “vì sao làm đề tài” ở Ch1 phải dừng ở: **tích hợp AI khép kín / có kiểm soát trên quy trình hội nghị** — không dừng ở “phân ba lớp kỹ thuật” hay “giảm thao tác” nếu chưa neo từ shadow AI + liêm chính.

#### 5.2. Mạch từng khối prose (khớp `chapter1.tex` hiện tại)

| # | Khối trong §Đặt vấn đề | Ý phải truyền | Claim / mắt xích | Cite / neo (loại) | Cấm lệch |
|---|------------------------|---------------|------------------|-------------------|----------|
| P1 | Đoạn số liệu tăng submissions (NeurIPS 2025, ICML/NeurIPS/ICLR %, AAAI/NeurIPS ×4) | Quy mô peer review hội nghị (AI/ML) tăng mạnh; reviewer pool không theo kịp | C1 · [1] | ch1ref1,2,9,10 | “Mọi ngành sụp đổ” |
| P2 | Đoạn vận hành (NeurIPS 2020 gán bài; >10k; vicious cycle; AC/Chair tổng hợp) | Áp lực lan công đoạn: gán, chất lượng nhận xét, tổng hợp quyết định | C2 · [2] | ch1ref11–13,12 | COI “đã chứng minh khó hơn vì scale” nếu không nguồn; “một tuần gán bài” như **chuẩn mọi hội nghị** (chỉ ví dụ NeurIPS) |
| P3 | Đoạn AI hỗ trợ (ICLR 2025 Feedback Agent) | AI **có thể** hỗ trợ khi **có kiểm soát** trên nhận xét do người viết | C3 · [3] | ch1ref3 | “AI thay đánh giá / quyết định học thuật” |
| P4 | Đoạn liêm chính + policy + survey + shadow empirical | Học thuật **thận trọng**; confidentiality; human responsibility; thái độ chia rẽ **có số**; shadow AI **đã xuất hiện** | C4, C5, C8 · [4][5a] | ch2ref41,45,44,15,16; ch1ref4; ch2ref46; ch1ref14 | “Học thuật cấm hết AI”; “chia rẽ” không nói rõ tỉ lệ/ranh giới |
| P5 | **Chốt bài toán trọng tâm** (cuối P4) | Không phải “thiếu AI” hay “cấp ChatGPT tự do”; mà **tích hợp AI vào quy trình hội nghị, khép kín + có kiểm soát**; theo vai trò/bước; người xem lại; không AI soạn full review / accept-reject; nhờ đó **đánh giá được** hiệu quả vs liêm chính | C5, C9, C10 · [5]→[7] | nối ch1ref3 vs ch1ref14+policy | **Không** chốt bằng “giảm khối lượng thao tác” (chưa neo ở đoạn này); **không** nhảy ba lớp kiến trúc trước khi chốt nhu cầu khép kín |
| P6 | Đoạn CMS mature + định hướng + ba hình thức AI + gap | CMS **đã tốt** ops truyền thống; đề tài **không** sửa ops; gap = lớp AI gen gắn quy trình (scope khảo sát); tách T1 matching / T3 experiment / T2 shadow | C6, C7, C8, C9 · [6][7] | ch1ref5–8, ch2ref1,8,11; ch1ref3,14; ch2ref16,18,41 | “CMS yếu”; “không nền tảng nào có AI”; nhầm TPMS = generative AI |
| P7 | Đoạn ConferenceSpace | Cơ sở thực nghiệm; **không cạnh tranh** CMS; ba lớp; AI down vẫn chạy; giảm phụ thuộc đưa MS ra ngoài; human final authority | C10, C11, C12 · [8] | ch2ref15,16,44,45 | “Tốt hơn EasyChair về tổ chức hội nghị”; “đảm bảo tuyệt đối liêm chính” |

| Phần sau Đặt vấn đề | Phải chốt | Claim |
|---------------------|-----------|--------|
| Mục tiêu tổng quát + 5 mục tiêu cụ thể | Map build lõi · 3 lớp · matching/COI deterministic · AI có confirm · đánh giá đa nhóm | C10–C12 |
| Đóng góp 1 câu | Tích hợp + đánh giá ranh giới — **không** thay CMS / auto decision | C12 |
| Phạm vi in | 3 vai trò; quy trình xét duyệt; 6 luồng AI; đánh giá thử nghiệm | C11–C12 |
| Phạm vi out | Event mgmt; auto accept/reject; đủ mọi COI; chất lượng AI cố định khi model đổi; tác động văn hóa dài hạn | C12 |
| Cấu trúc luận văn | 1 problem/bound → 2 gap/req → 3 build → 4 evidence → 5 close | — |

#### 5.3. Logic chốt P5 (bắt buộc khi sửa wording)

Đoạn policy/survey/shadow **không** được kết bằng chỉ “phân công đoạn nào cho AI hỗ trợ”.  
Chuỗi suy ra đúng:

```
AI hữu ích khi có giới hạn (P3 / ICLR agent)
    +
Policy & thái độ: confidentiality, human responsibility, đa số phản đối AI soạn review (P4)
    +
Thực tế shadow AI ngoài quy trình (ICLR 2024 ~15,8%)
    ↓
Rủi ro = AI ngoài kiểm soát nền tảng / ngoài liêm chính
    ↓
Nhu cầu = công cụ AI **gắn bước nghiệp vụ theo vai trò**, trong nền tảng,
           có xác nhận người, có thể đánh giá — không phải prompt ngẫu nhiên trên ChatGPT
    ↓
→ Khoảng trống & định vị đề tài (P6–P7), chi tiết Ch2
```

**Ba lớp** (lõi / deterministic / AI) xuất hiện ở **P7 + Mục tiêu**, như *cách tổ chức giải pháp*, sau khi đã chốt nhu cầu khép kín — không thay thế chốt P5.

#### 5.4. Số liệu / claim attitude đã chốt cho P4 (Nature)

| Nội dung | Mức được phép nói | Nguồn |
|----------|-------------------|--------|
| Mẫu ~5.000+ nhà nghiên cứu | Có | ch1ref4 |
| ~65% chấp nhận AI viết toàn bộ/một phần paper (đạo đức); ~1/3 phản đối | Có | ch1ref4 |
| >60% cho không phù hợp để AI soạn bản phản biện | Có — **ưu tiên nêu** vì khớp mạch peer review | ch1ref4 |
| Wiley: peer review ưu tiên phán đoán / kiểm soát bởi người | Có | ch2ref46 |
| “Chia rẽ” **không** kèm số / **không** nối sang phản biện | **Không** | — |

#### 5.5. Checklist riêng Ch1

- [ ] P1–P2 chỉ nói áp lực quy mô + vận hành, chưa nhảy giải pháp AI.  
- [ ] P3 có **điều kiện kiểm soát** ngay sau bằng chứng ICLR.  
- [ ] P4: chủ thể rõ (ai khai báo, ai bị cấm); Việt hóa (bình duyệt, mô hình ngôn ngữ lớn, bản phản biện); policy + survey có số + shadow empirical.  
- [ ] P5: chốt **khép kín / theo vai trò / đánh giá được** — không “giảm thao tác” đơn độc; không “ba lớp” thay chốt.  
- [ ] P6: C6 trước C7; forward Ch2; ba tầng matching / controlled experiment / shadow.  
- [ ] P7: không cạnh tranh CMS; human final; giảm shadow (không “đảm bảo tuyệt đối”).  
- [ ] Mục tiêu/phạm vi không mâu thuẫn P5–P7.  
- [ ] Không bảng CMS / full policy matrix / benchmark (để Ch2/Ch4).

**Ch1 không làm:** bảng feature CMS chi tiết; full policy matrix; benchmark; market share CMS.

---

### Chương 2 — Khảo sát, hiện trạng, khoảng trống

| Phần | Phải chốt | Claim ID |
|------|-----------|----------|
| Nhu cầu 3 vai trò | Ma sát thao tác + nhu cầu hỗ trợ; **không** “CMS thiếu nộp bài” | C2, C7 |
| Ý kiến cộng đồng / policy | C4, C5, C8, C9; human final | C4, C5, C8, C9 |
| Đối chiếu 4 CMS | **C6 mạnh**; AI row = negative/partial evidence **có scope** | C6, C7 |
| Phân biệt TPMS/matching vs generative AI | Tránh đập C7 bằng nhầm CMT “đã có AI” | C7 |
| Khoảng trống | Bốn gap → **gap AI có kiểm soát** là trọng tâm nghiên cứu | C7, C10 |
| Yêu cầu F/N | Mọi F-AI: human confirm; no auto decision; confidentiality | C5, C11 |
| Định vị sản phẩm | Không thay EasyChair; bổ sung lớp hỗ trợ trên nền lõi | C10 |

**Ch2 là nơi “chứng minh gap”.** Ch1 chỉ neo.

---

### Chương 3 — Xây dựng hệ thống

| Phần | Phải chốt | Claim ID |
|------|-----------|----------|
| Use case / vai trò | Author, Reviewer, Chair trên quy trình chuẩn | C6 (tham chiếu) |
| Ba lớp kiến trúc | C11; graceful degradation khi AI down | C11 |
| Matching + COI | Deterministic / bằng chứng / Chair override — **không** LLM gán bài | C11 |
| 6 luồng AI | Mỗi luồng = hỗ trợ một công đoạn; **confirm / edit / skip**; map T3 | C3, C5, C9, C11 |
| Không có use case | Auto accept/reject; AI viết full review thay người | C5, C12 |
| Triển khai / bảo mật | Manuscript nhạy cảm; giả định dịch vụ ngoài | C4, C8 |

**Mọi thiết kế phải trả lời:** “Cái này thuộc lớp nào? Ai xác nhận? Fail thì quy trình còn chạy không?”

---

### Chương 4 — Đánh giá thực nghiệm

| Nhóm bằng chứng | Hỗ trợ claim | Không overclaim |
|------------------|--------------|-----------------|
| Nghiệp vụ lõi (perf, luồng) | Hệ thống **đủ** làm nền quy trình (để gắn AI) | “Tốt hơn EasyChair” |
| Matching / COI | C11 deterministic: chất lượng / scale / explain trong setup | “Phát hiện đủ mọi COI” |
| Từng luồng AI | C3 trong bound: accuracy / usability / failure | “Sẵn sàng production mọi model” |
| Vận hành AI down / cost | C11 graceful degradation | — |
| UAT / survey | Người chấp nhận ranh giới hỗ trợ; giá trị cảm nhận | Văn hóa peer review dài hạn |

**Câu hỏi đánh giá phải map mục tiêu Ch1.** Kết quả “đạt / một phần / hạn chế” feed Ch5.

---

### Chương 5 — Kết luận

| Phần | Phải chốt |
|------|-----------|
| Đối chiếu mục tiêu | Lại C10–C12 bằng ngôn ngữ kết quả Ch4 |
| Đóng góp | Hướng tích hợp AI có kiểm soát + artifact đánh giá — **không** “CMS mới thống trị” |
| Hạn chế | Scope thử nghiệm; model drift; COI data; không đo shadow AI thực địa dài hạn |
| Hướng phát triển | Siết T3 (policy config, audit, no-train); không hứa auto-decision |

---

## 6. Checklist “mọi câu từ hướng về mạch”

Khi sửa bất kỳ đoạn nào, hỏi:

1. **Mắt xích nào (1–10) đoạn này phục vụ?** Nếu không rõ → cắt hoặc chuyển appendix.  
2. **Có phá C6 không?** (bôi nhọ CMS ops)  
3. **Có gộp T2 và T3 không?** (shadow vs controlled)  
4. **Có hứa “đảm bảo liêm chính tuyệt đối” không?** → đổi thành hỗ trợ tuân thủ / giảm rủi ro.  
5. **Có biến AI thành decision-maker không?**  
6. **Có claim global ngoài “phạm vi khảo sát” không?**  
7. **Ch1 có đang làm việc của Ch2/Ch4 không?** (quá chi tiết evidence)  
8. **Ch3/Ch4 có còn nói “cạnh tranh CMS” không?**

---

## 7. Skeleton prose Ch1 (đối chiếu `chapter1.tex`)

Wording chính thức nằm ở LaTeX; đây là **mạch ý** để rà lệch.

1. **P1 — Quy mô ↑** (C1): số liệu 11 venue / NeurIPS 2025 / tăng % ICML·NeurIPS·ICLR / AAAI·NeurIPS ×4 + reviewer chậm hơn.  
2. **P2 — Áp lực vận hành** (C2): ví dụ NeurIPS 2020 gán bài; crisis >10k + chất lượng; vicious cycle; AC/Chair tổng hợp review.  
3. **P3 — AI hỗ trợ có điều kiện** (C3): ICLR 2025 agent trên review người → hữu ích **khi** có ranh giới; **không** thay phán đoán/quyết định.  
4. **P4 — Liêm chính & thái độ** (C4–C5, C8):  
   - Bản thảo chưa công bố → giữ kín; Nature/Elsevier: không đưa MS vào AI tạo sinh.  
   - COPE: AI không phải tác giả; trách nhiệm người.  
   - ICLR: tác giả/phản biện viên khai báo LLM + chịu trách nhiệm; ICML: cấm soạn review bằng genAI / paste bài nộp.  
   - Nature: 65% / ~1/3 về AI viết paper; **>60% không phù hợp AI soạn review**; Wiley: bình duyệt ưu tiên người.  
   - Latona ICLR 2024: ≥~15,8% review có dấu hiệu LLM → shadow AI có thật + hệ quả score/accept.  
5. **P5 — Chốt bài toán** (→[7]):  
   - Rủi ro = AI **ngoài** kiểm soát nền tảng / ngoài liêm chính (không chỉ “thiếu AI”).  
   - Agent có kiểm soát vs ChatGPT tự do.  
   - **Nhu cầu:** tích hợp AI **khép kín, theo vai trò/bước**, người xác nhận; không AI soạn full review / accept-reject; nhờ đó **đánh giá được** vs liêm chính — **không** cấp kênh AI tự do / prompt ngẫu nhiên.  
6. **P6 — CMS + gap** (C6–C9): CMS mature ops; không cải thiện lại ops; gap AI gen gắn quy trình (scope); tách (i) matching/TPMS (ii) experiment hội nghị (iii) shadow AI → gap = in-platform controlled. Forward Ch2.  
7. **P7 — ConferenceSpace** (C10–C11): thực nghiệm; không cạnh tranh CMS; ba lớp; AI down vẫn chạy; giảm đưa MS ra ngoài; human final.  
8. **Mục tiêu / phạm vi / cấu trúc** bám C12 và 5 mục tiêu (lõi, 3 lớp, matching/COI, AI confirm, đánh giá).

**Lệch đã sửa trong quá trình chốt (giữ để không tái phạm):**

| Lệch | Hướng đúng |
|------|------------|
| “Chia rẽ” Nature không số, chỉ nói viết paper | Nêu 65% / 1/3 / >60% soạn review; nối peer review |
| Chốt P5 bằng “giảm thao tác” + ba lớp | Chốt **khép kín / chống shadow / đánh giá được** |
| “Khai báo khi dùng LLM” không chủ ngữ | **Tác giả và phản biện viên** khai báo |
| peer review / LLM / venue trần EN | Việt hóa theo quy tắc văn phong |
| “Một tuần gán hàng nghìn bài” như luật chung | **Ví dụ NeurIPS 2020** |
| “Đảm bảo liêm chính” bằng tích hợp | **Giảm rủi ro / phù hợp chuẩn mực / đánh giá được** |

---

## 8. Những thứ **cố ý ngoài mạch** (không nhồi vào mở đầu)

- So sánh giá / market share CMS.  
- “AI sẽ thay thế peer review”.  
- Event management (vé, phòng, chương trình) — đã out-of-scope.  
- Chứng minh kiến trúc 3 lớp bằng một paper duy nhất.  
- Hiệu quả dài hạn mọi hội nghị / mọi ngành.

---

## 9. Trạng thái chốt

| Hạng mục | Trạng thái |
|----------|------------|
| Định vị không cạnh tranh CMS | **Chốt** |
| Điểm mới = AI + hỗ trợ có liêm chính / khép kín | **Chốt** |
| Tách shadow AI / controlled AI / CMS mature (+ matching ≠ genAI) | **Chốt** |
| Ba lớp + human final authority | **Chốt** (vị trí: P7 + mục tiêu, sau chốt P5) |
| Prose LaTeX Ch1 §Đặt vấn đề (P1–P7) | **Đã khớp mạch** `chapter1.tex` (cập nhật theo §5.2–5.5, §7) |
| Cite Ch1 tăng trưởng + crisis | ch1ref1,2,9–13 |
| Cite Ch1 AI / liêm chính / shadow | ch1ref3,4,14 + ch2ref15,16,18,41,44–46 |
| Ch2 đã gần khớp outline? | **Gần** — dùng file này để rà lệch wording; Ch2 vẫn là nơi bảng CMS + policy chi tiết |

---

## 10. Lịch sử ý (để không tuột mạch)

- Feedback: CMS **đã tốt** ops truyền thống → không lấy “cải thiện tổ chức hội nghị” làm mục tiêu chính.  
- Feedback: “Cho phép AI thử” kiểu ChatGPT tự do **không** đảm bảo liêm chính → cần **tích hợp trong quy trình có kiểm soát**.  
- Feedback: Đề tài = **tham chiếu quy trình + hướng ứng dụng AI** → điểm nghiên cứu chính là AI/kỹ thuật hỗ trợ mới, không phải đánh bại EasyChair.  
- Feedback (Ch1 wording): chốt P5 phải bám **shadow vs controlled / khép kín theo vai trò**, không “giảm thao tác” hay “ba lớp” đơn độc; Nature phải nói **chia rẽ thế nào** và **vì sao** (gồm phản đối AI soạn review); chủ ngữ rõ; Việt hóa thuật ngữ.

Khi mâu thuẫn giữa file chương cũ và file này: **ưu tiên file này** cho mạch lập luận; khi mâu thuẫn với `chapter1.tex` đã chốt sau ngày cập nhật này, **ưu tiên LaTeX** rồi đồng bộ lại file này.
