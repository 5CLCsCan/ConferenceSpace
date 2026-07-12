# Tổng hợp bằng chứng cộng đồng củng cố Chương 2

**Ngày tổng hợp:** 2026-07-13  
**Mục đích:** Tam giác hóa (triangulate) luận điểm Chương 2 bằng diễn đàn, blog thực hành, tài liệu hội nghị, GitHub issues, chính sách nhà xuất bản — bổ sung cho khảo sát nội bộ n=71.  
**Phạm vi phương pháp:** Tổng hợp định tính thứ cấp (qualitative secondary synthesis). **Không** suy ra tỷ lệ phần trăm cộng đồng toàn cầu từ forum.  
**Trạng thái:** Bản nháp bằng chứng để đưa vào báo cáo; mỗi nguồn chính có URL có thể kiểm chứng.

---

## 0. Tóm tắt điều hành (dùng làm mở mục mới trong Ch2)

Khảo sát nội bộ của nhóm (71 phản hồi) cho **tín hiệu ưu tiên thiết kế**, nhưng không đủ để khẳng định xu hướng chung. Tổng hợp tiếng nói cộng đồng bên ngoài cho thấy **sáu luận điểm cốt lõi của ConferenceSpace hội tụ** với thực tiễn hội nghị lớn, chính sách liêm chính và phàn nàn vận hành lâu năm:

| # | Luận điểm báo cáo | Mức củng cố | Nguồn chính |
|---|-------------------|-------------|-------------|
| A | CMS hiện có đủ nghiệp vụ lõi; khó khăn nằm ở UX/hướng dẫn/trạng thái/email | **Mạnh** | Blog PC/organizer, FAQ EasyChair/CMT, GitHub HotCRP/OpenReview |
| B | Tác giả cần giảm nhập liệu + kiểm tra sớm + xác nhận người; track/format gây desk-reject | **Mạnh** (form/format); **Trung bình** (AI autofill như “mong muốn survey”) | Checklist hội nghị, ORCID/vendor autofill, NeurIPS/MICCAI/CVPR |
| C | Chair cần COI đa nguồn, matching có điểm/lý do + override, theo dõi trạng thái | **Mạnh** | ICML/NeurIPS PC blogs, TPMS, OpenReview docs, CACM/CLOSET |
| D | Reviewer: AI hỗ trợ đọc/chất lượng OK; AI viết review / thay phán đoán = không | **Mạnh** | ICLR/ICML/NeurIPS/ACL/ACM/Nature; Review Feedback Agent |
| E | Khoảng trống ConferenceSpace = lớp hỗ trợ có kiểm soát + UX, không phải “thiếu CMS” | **Mạnh** (định vị); **Trung bình** (unique product) | Docs 4 CMS + pilot ICLR 2025 |
| F | Human final control là chuẩn cộng đồng, không chỉ lựa chọn đề tài | **Mạnh** | COPE, ICMJE, Elsevier, Springer Nature, ACM, IEEE, NIH, Wiley 2025 |

**Câu đóng đinh (thesis-ready):**

> Survey nội bộ (n=71) định hướng ưu tiên; tổng hợp diễn đàn/blog/chính sách cho thấy các ưu tiên đó **lặp lại ngoài mẫu**; tài liệu CMS và policy hội nghị xác định **ranh giới kỹ thuật và liêm chính**. Ba nguồn hội tụ vào: giảm thao tác thủ công, minh bạch matching/COI, AI hỗ trợ có kiểm soát, con người quyết định cuối.

---

## 1. Phương pháp (viết vào Ch2 như mục 2.1.x)

### 1.1. Mục tiêu

Bổ sung bằng chứng ngoài khảo sát thuận tiện, nhằm:

1. Kiểm tra tính **lặp lại** của pain points UX/CMS.  
2. Củng cố nhu cầu Chair/Reviewer khi n theo vai trò trong survey nhỏ.  
3. Neo các nguyên tắc AI vào **chuẩn cộng đồng** (policy + survey quốc tế).  
4. Làm rõ khoảng trống sản phẩm so với EasyChair / HotCRP / OpenReview / CMT.

### 1.2. Khung tìm kiếm

Sáu chủ đề (A–F) cố định trước khi thu thập; mỗi chủ đề ghi **bằng chứng ủng hộ** và **phản chứng**.

| Chủ đề | Từ khóa gợi ý | Nguồn ưu tiên |
|--------|---------------|---------------|
| A UX CMS | EasyChair unintuitive, HotCRP issue, CMT submission form, OpenReview email | Blog organizer, FAQ, GitHub |
| B Author intake | desk reject format, track selection, metadata autofill ORCID | CFP handbook, vendor docs |
| C Chair/COI/match | TPMS, affinity score, conflict of interest audit, AC instructions | NeurIPS/ICML blogs, OpenReview docs |
| D AI reviewing | LLM policy reviewer, confidentiality manuscript, Review Feedback Agent | Policy pages, arXiv, Reddit (phụ) |
| E Product gap | CMS features comparison, AI assist peer review pilot | Official docs + ICLR blog |
| F Human control | COPE AI authorship, Wiley ExplanAItions, human in the loop peer review | COPE, publishers, surveys |

### 1.3. Giới hạn (bắt buộc ghi trong báo cáo)

- Forum/blog: **selection bias** (người khó chịu hay viết).  
- Không suy ra “x% cộng đồng”.  
- Chính sách hội nghị **đổi theo năm**.  
- Một số blog EasyChair cũ (2014–2017) nhưng FAQ vendor và GitHub 2023–2025 vẫn lặp pattern tương tự.  
- Reddit chỉ dùng làm tín hiệu phụ, không làm bằng chứng chính.

### 1.4. Cách trích dẫn trong LaTeX

Đề xuất: nhóm `ch2comm` hoặc gộp vào bibliography Chương 2 với khóa `ch2ref20+`. Mỗi claim trong Ch2 khi cập nhật nên có dạng: *khảo sát nội bộ + [COMM-x]*.

---

## 2. Bối cảnh quy mô (neo số liệu — đã có trong Ch2, giữ và cập nhật URL)

| Sự kiện | Số liệu | Nguồn |
|---------|---------|--------|
| NeurIPS 2025 | 21.575 bài hợp lệ; tăng từ 9.467 (2020); ~20.518 reviewer, 1.663 AC, 199 SAC | [NeurIPS PC reflections 2025-09-30](https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/) |
| ICLR 2026 | 19.525 bài hợp lệ; hàng chục nghìn bản phản biện (PC retrospective) | [ICLR retrospective 2026-03-31](https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/) |
| ICLR 2025 Review Feedback Agent | RCT quy mô lớn; ~27% reviewer nhận feedback đã cập nhật review; >12.000 gợi ý được đưa vào | [ICLR blog](https://blog.iclr.cc/2025/04/15/leveraging-llm-feedback-to-enhance-review-quality/) · [arXiv:2504.09737](https://arxiv.org/abs/2504.09737) |
| LLM-modified reviews (ước lượng) | ~6,5%–16,9% văn bản review có dấu hiệu chỉnh sửa LLM đáng kể (NeurIPS/ICLR… ) | Liang et al. [arXiv:2403.07183](https://arxiv.org/abs/2403.07183) |
| Wiley ExplanAItions 2025 | n=2.430 researcher; gần như mọi use case peer review nằm vùng “humans preferred”; ~72% muốn reviewer/editor disclose AI | [Wiley PDF 2025](https://www.wiley.com/content/dam/wiley-com/en/pdfs/about/wiley-explanaitions-2025-the-evolution-of-ai-in-research.pdf) |
| CLOSET / CACM COI | Audit: trung bình ≥25% submission có COI chưa khai báo (theo báo cáo hệ thống); cần tự động hóa COI | [CACM CLOSET](https://cacm.acm.org/research/closet-data-driven-coi-detection-and-management-in-peer-review-venues/) · [CACM opinion automate COI](https://cacm.acm.org/opinion/we-need-to-automate-the-declaration-of-conflicts-of-interest/) |

**Diễn giải an toàn:** Áp lực quy mô và chất lượng/COI **không cục bộ** trong survey nhóm; là bối cảnh vận hành hội nghị lớn.

---

## 3. Luận điểm A — UX CMS, không phải thiếu nghiệp vụ lõi

### 3.1. Map với survey nội bộ

| Survey n=71 | Tỷ lệ | Chủ đề cộng đồng |
|-------------|-------|------------------|
| Không biết bước tiếp theo | 49,3% | role/mode confusion, FAQ “change role”, stage ẩn |
| Biểu mẫu dài/lặp | 47,9% | form multi-section, metadata, concurrent overwrite |
| Phải đọc hướng dẫn dài | 46,5% | “volumes of text”, external reviewer guides |
| Không kiểm tra lỗi sớm | 42,3% | validation yếu, mất review sau lỗi form |
| Thông báo/hạn chót rời rạc | 39,4% | email identity mismatch, duplicate mails, bad email links |

### 3.2. Bằng chứng ủng hộ (chọn lọc có thể đưa bảng Ch2)

| ID | Nguồn | Ý chính | URL |
|----|-------|---------|-----|
| COMM-A-01 | AgileTribe, 2014 | EasyChair “powerful and reliable” nhưng UI kém, nhiều text, feature ẩn | https://agiletribe.wordpress.com/2014/01/25/not-so-easychair-hints/ |
| COMM-A-02 | Muelaner blog | Unintuitive + docs kém; **thiếu data validation** tốt; bù bằng email hướng dẫn | https://www.muelaner.com/management/easychair/ |
| COMM-A-03 | MyBiasedCoin, 2015 | Review dài mất sau lỗi validation form | http://mybiasedcoin.blogspot.com/2015/03/hate-easychair.html |
| COMM-A-04 | MyCQstate PC guide, 2017 | EasyChair “fairly smoothly” nhưng phân tích điểm khó; learning curve | https://mycqstate.wordpress.com/2017/08/07/a-beginners-guide-to-pc-chairing/ |
| COMM-A-05 | Rebelsky musings, 2023 | PC: EasyChair “not the most intuitive”, UI clunky | https://rebelsky.cs.grinnell.edu/~rebelsky/musings/high-level-low-level-2023-08-14 |
| COMM-A-06 | EasyChair FAQ | Troubleshooting role, “New Submission”, email mismatch, “ask chair for accept status” | https://easychair.org/docs/faq |
| COMM-A-08 | Kohler HotCRP WOWCS 2008 | Mode-heavy CMS; user switch role / edit URL | https://www.usenix.org/event/wowcs08/tech/full_papers/kohler/kohler_html/ |
| COMM-A-09 | HotCRP #247 | “Act as” nguy hiểm, gửi mail sai identity | https://github.com/kohler/hotcrp/issues/247 |
| COMM-A-10 | HotCRP #302 | Concurrent edit submission ghi đè | https://github.com/kohler/hotcrp/issues/302 |
| COMM-A-11 | OpenReview #129 | Docs stage review revision lỗi thời; reviewer không biết cần cập nhật | https://github.com/openreview/openreview/issues/129 |
| COMM-A-12 | OpenReview-py #2744 (2025) | Accept invite gửi **2 email** trùng | https://github.com/openreview/openreview-py/issues/2744 |
| COMM-A-13 | CMT author docs | Phải bấm Submit mới lưu file; link email gây lỗi access; phase chưa bật | https://cmt3.research.microsoft.com/docs/help/author/author-submission-form.html |
| COMM-A-15 | HN MiniConf, 2020 | OpenReview/CMT/HotCRP/EasyChair “mature and complex” | https://news.ycombinator.com/item?id=23282113 |

### 3.3. Phản chứng (phải ghi)

- Cùng COMM-A-01: EasyChair có “right features”, dùng hàng nghìn hội nghị thành công.  
- HotCRP README: linh hoạt, search/tag mạnh cho reviewer.  
- CMT marketing: hàng triệu user, hàng nghìn hội nghị.  
- Một số organizer khen CMT UI hơn EasyChair (Fournier-Viger blog).

### 3.4. Kết luận an toàn cho Ch2

**Viết được:** Các hệ thống CMS phổ biến được coi là **trưởng thành** về vòng đời submit–review–decide; tiếng nói thực hành và FAQ vendor **tập trung vào ma sát UX/vận hành** (vai trò, form, validation, email, tài liệu), không phải kêu thiếu module nộp bài/phản biện.

**Không viết:** “Mọi người ghét EasyChair”; “x% user gặp vấn đề Y”; “CMS thiếu chức năng cốt lõi”.

**Map feature:** Dashboard theo trạng thái, wizard từng bước, chatbot theo quyền, thông báo in-app (F-COMMON-01/02, F-AUTHOR-02).

---

## 4. Luận điểm B — Tác giả: autofill + kiểm tra sớm + human confirm

### 4.1. Map survey

- Submission Autofill: lựa chọn phổ biến “tự điền và cho sửa” (21 ý kiến).  
- Kiểm tra format hữu ích; không auto-reject mù.

### 4.2. Bằng chứng

| ID | Nội dung | URL |
|----|----------|-----|
| COMM-B-01 | Editorial Manager: extract title/abstract/authors → author **chỉ review độ chính xác** | https://www.ariessys.com/wp-content/uploads/FAQ-Editorial-Manager-Author-Submission-Interface.pdf |
| COMM-B-02 | ChronosHub: AI extract metadata; **unverified data flagged for manual correct** | https://chronoshub.io/products/for-publishers/submissions/ |
| COMM-B-03 | ORCID: prefill form từ profile để giảm lỗi/re-entry | https://info.orcid.org/documentation/workflows/integrating-orcid-into-your-journal-workflow/ |
| COMM-B-05 | MICCAI 2026: template/margin hacks → **desk reject** | https://conferences.miccai.org/2026/files/downloads/MICCAI2026-Submitting-to-MICCAI-Avoiding-Desk-Reject.pdf |
| COMM-B-06 | PACIS 2026 checklist: screening format trước review | https://pacis2026.aisconferences.org/submissions/submission-formatting-checklist/ |
| COMM-B-07 | NeurIPS 2026 handbook: vi phạm style/page limit có thể desk reject | https://neurips.cc/Conferences/2026/MainTrackHandbook |
| COMM-B-08 | NeurIPS Eval track FAQ: **không đổi track**; wrong track/duplicate risk desk reject | https://nips.cc/Conferences/2026/EvaluationsDatasetsFAQ |
| COMM-B-09 | ICIS 2026: reject vì **lack of fit to category/track** | https://icis2026.aisconferences.org/submissions/guide-to-a-successful-submission/ |
| COMM-B-10 | Academia SE: wrong topic boxes → higher rejection risk | https://academia.stackexchange.com/questions/66605/what-is-the-effect-of-choosing-the-wrong-topics-during-conference-paper-submis |
| COMM-B-11 | CVPR 2026: incomplete OpenReview profile → **desk rejection** | https://cvpr.thecvf.com/Conferences/2026/CompleteYourORProfile |
| COMM-B-12 | AAAI-25: AI polish OK; LLM-generated text hạn chế; **human responsibility** | https://aaai.org/conference/aaai/aaai-25/policies-for-aaai-25-authors/ |
| COMM-B-14 | CHI 2024: metadata complete by deadline; no post-deadline metadata change | https://chi2024.acm.org/for-authors/papers/ |

### 4.3. Phản chứng

- Metadata generative AI không tin cậy nếu không có human oversight (CILIP catalogue article 2025).  
- Một số journal “format-free” — **hội nghị** vẫn thường siết format.  
- ICIS/AAMAS: “perfect track fit not necessary” — giảm overclaim “track luôn thảm họa”.  
- **Không** tìm thấy survey lớn “authors want AI autofill” dạng Likert; pattern suy ra từ product design + policy.

### 4.4. Kết luận an toàn

**Viết được:** Nộp bài hội nghị tạo gánh metadata/format/track thực tế; desk-reject vì format/profile/track được chính sách hóa; ngành xuất bản đã chuẩn hóa **extract → human verify → submit**.

**Không viết:** “Tác giả khảo sát toàn cầu đòi AI autofill”; “mọi venue muốn format check sớm”.

**Map feature:** F-AUTHOR-03/04/05 (Autofill, track suggest, Gating).

---

## 5. Luận điểm C — Chair: COI, matching minh bạch, dashboard, override

### 5.1. Map survey (n Chair nhỏ — đây là chỗ cần cộng đồng nhất)

- COI cảnh báo: 5/7  
- Dashboard: 4/7  
- Gợi ý matching: 2/7 (thận trọng automation)

### 5.2. Bằng chứng then chốt

| ID | Nội dung | URL |
|----|----------|-----|
| COMM-C-01 | ICML 2024 PC: 3 reviewer auto + 1 AC chọn; **full manual không scale**; **full auto cũng sub-optimal** | https://medium.com/@icml2024pc/reviewing-at-icml-2024-a7aa81169d8c |
| COMM-C-02 | ICML 2012 AC: TPMS rank + bid; “**many conflicts go undetected**” | https://icml.cc/2012/ac-instructions/index.html |
| COMM-C-04 | TPMS: maximize suitability **under load constraints** — không gán max score từng paper | http://torontopapermatching.org/ |
| COMM-C-05 | OpenReview: affinity + conflicts; browse/edit/deploy; manual assign | https://docs.openreview.net/how-to-guides/paper-matching-and-assignment |
| COMM-C-07 | NeurIPS 2024 matching experiment: LP/perturbed max; PC chọn; **manual adjustments**; 95,2% positive bidders nhận paper High/Very High | https://blog.neurips.cc/2024/12/12/neurips-2024-experiment-on-improving-the-paper-reviewer-assignment/ |
| COMM-C-08 | NeurIPS AC guidelines: check COI ngay; AC edit mis-assignment | https://neurips.cc/Conferences/2025/AC-Guidelines |
| COMM-C-09 | NeurIPS 2025: scale tăng; giảm tin bidding; matching noise → tăng calibration workload | https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/ |
| COMM-C-10 | HotCRP chair: “**does not automatically confirm all conflicts**” — phải audit | https://help.hotcrp.com/help/chair |
| COMM-C-11 | CACM: audit >100 undeclared co-author conflicts; >100 assignment recent co-author | https://cacm.acm.org/opinion/we-need-to-automate-the-declaration-of-conflicts-of-interest/ |
| COMM-C-12 | CLOSET: ≥25% submissions unreported COI (avg); NL explanations for chairs | https://cacm.acm.org/research/closet-data-driven-coi-detection-and-management-in-peer-review-venues/ |
| COMM-C-13 | Leyton-Brown et al. AIJ 2024: large conf → **no alternative to automated matching**; multi-constraint optimization | https://doi.org/10.1016/j.artint.2024.104119 |
| COMM-C-14 | ARR COI: multi-source (DBLP/S2, domain, relations); incomplete profile = noise | http://aclrollingreview.org/declaring-a-conflict-of-interest/ |

### 5.3. Phản chứng

- Automation **bắt buộc** ở quy mô lớn (LCM paper).  
- Matching có thể **chất lượng cao** khi bid/profile tốt (NeurIPS 2024 95,2%).  
- OpenReview/CMT **đã** có score + multi-source COI — không được viết “chưa ai làm”.  
- Một số AC muốn **nhiều automation hơn** (giảm lao động tay).

### 5.4. Kết luận an toàn

**Viết được:** Pattern ổn định = **automation-first, human-patched**; matching = tối ưu ràng buộc (expertise, load, COI), **không** LLM gán reviewer; COI không tin tự khai báo đơn lẻ; Chair/AC cần visibility + override + theo dõi trạng thái.

**Không viết:** “Chair không muốn automation”; “matching hiện tại vô dụng”; “chỉ ConferenceSpace có matching/COI”.

**Map feature:** F-CHAIR-02..05; reviewer matching deterministic; COI đa tầng Neo4j/external.

**Câu rewrite defensible:**

> Ở hội nghị ML/CS lớn, Chair/AC dựa vào matching tự động và COI đa nguồn, nhưng vẫn cần điểm số/giải thích, phát hiện COI còn sót, quyền ghi đè phân công, và theo dõi tiến độ — vì full automation không giám sát không đủ tin cậy dưới tải, integrity và nhiễu hồ sơ.

---

## 6. Luận điểm D — Reviewer và AI: hỗ trợ đọc, không thay phán đoán

### 6.1. Map survey

- Tóm tắt trung lập: 6/11  
- Highlight điểm kiểm tra: 3/11 (thận trọng AI định hướng)

### 6.2. Policy matrix (rất mạnh cho Ch2)

| Nguồn | Cho phép (gọn) | Cấm / hạn chế | URL |
|-------|----------------|---------------|-----|
| ICLR 2026 | LLM với disclosure; reviewer chịu trách nhiệm | Vi phạm confidentiality = ethics violation | https://iclr.cc/FAQ/LLM |
| ICML 2026 Policy B | Hiểu paper + polish bằng tool privacy-compliant | **Không** hỏi LLM S/W, outline, full review; Policy B **cấm summarize** paper | https://icml.cc/Conferences/2026/LLM-Policy |
| NeurIPS 2025 | LLM concept/grammar **không** share submission | “Do not… share submissions with… any LLMs” | https://neurips.cc/Conferences/2025/LLM |
| NeurIPS 2026 experiment | Venue AI assist **hiểu** paper | **Không** replace judgment / produce review | https://neurips.cc/Conferences/2026/ai-reviewing-experiment |
| ACL / ARR | Human writes argument; polish OK | No first draft by genAI; no upload to non-private tools | https://www.aclweb.org/adminwiki/index.php/ACL_Policy_on_Publication_Ethics |
| ACM Peer Review | Sole author of review; polish after redaction | No upload submissions to third-party LLM | https://www.acm.org/publications/policies/peer-review |
| Nature Portfolio | Disclose evaluative AI | **No** upload manuscripts to genAI | https://www.nature.com/nature-portfolio/editorial-policies/ai |
| Elsevier | Supportive capacity only | No manuscript upload; AI ≠ critical thinking | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals |

### 6.3. Thực nghiệm & cộng đồng

| ID | Ý | URL |
|----|---|-----|
| COMM-D-11 | Review Feedback Agent: feedback trên **review đã viết**; không viết review thay | https://arxiv.org/abs/2504.09737 |
| COMM-D-12 | Liang et al.: 6,5–16,9% text review có thể modified by LLM | https://arxiv.org/abs/2403.07183 |
| COMM-D-13 | Reddit ML: phản ứng tiêu cực review generic/ChatGPT | r/MachineLearning threads (phụ) |
| AAAI-26 pilot | AI full review **extra**, **không score/decision** | https://aaai.org/aaai-launches-ai-powered-peer-review-assessment-system/ |

### 6.4. Nuance quan trọng cho thiết kế Reviewer Initial Analysis

- ICML Policy B **cấm summarize** paper bằng LLM trong một số cấu hình → trong báo cáo nên định vị tính năng là **hỗ trợ định hướng đọc / checklist / căn cứ**, “không thay thế đọc bài”, và nêu **phụ thuộc chính sách hội nghị** (có thể tắt).  
- Survey nội bộ 3/11 cho “highlight points” khớp với thận trọng community về AI **định hướng** S/W.

### 6.5. Kết luận an toàn

**Viết được:** Hội nghị lớn hội tụ: AI hỗ trợ có kiểm soát + human responsibility + confidentiality; AI-written review là vấn đề integrity; pilot tốt nhất = venue-hosted, optional, không auto-edit, không decision.

**Map feature:** F-REVIEWER-04/05; Review Quality Auditor (coach trên draft người); không auto-score accept/reject.

---

## 7. Luận điểm E — Khoảng trống sản phẩm ConferenceSpace

### 7.1. Snapshot 4 CMS (rút gọn bảng Ch2)

| Năng lực | EasyChair | HotCRP | OpenReview | CMT | ConferenceSpace (định vị) |
|----------|-----------|--------|------------|-----|---------------------------|
| Vòng đời CMS | Mạnh | Mạnh | Mạnh | Mạnh | Parity nghiệp vụ |
| Matching | Preference auto | Pref/topic auto | Affinity + solvers | TPMS + bids + subjects | Thuật toán xác định + lý do + override |
| COI | Flexible access/COI | Potential conflicts + audit | Profile coauthor/institution | Domain + individual + DBLP | Đa tầng + đồ thị |
| Review quality signal | Hạn chế (docs) | **Human** review ratings | Venue; ICLR LLM pilot | Discussion | AI coach + human final |
| Autofill metadata / early gate | Hạn chế (community) | Form-centric | DBLP profile import | Forms mạnh, không LLM intake | Autofill + Gating |
| In-app assistant / evidence synthesis | Không (docs) | Search/tags/formulas | Không chatbot product | Notes/exports | Chatbot + Chair Copilot |

### 7.2. Nguồn docs chính

- EasyChair services: https://vc.easychair.org/docs/services  
- HotCRP: https://hotcrp.com/ · https://help.hotcrp.com/help/chair  
- OpenReview matching: https://docs.openreview.net/how-to-guides/paper-matching-and-assignment  
- CMT features/TPMS: https://cmt3.research.microsoft.com/docs/help/overview/features.html · …/tpms.html  
- ICLR pilot: https://blog.iclr.cc/2024/10/09/iclr2025-assisting-reviewers/

### 7.3. Phản chứng bắt buộc

- **Không** claim unique auto-matching (CMT/TPMS, OpenReview affinity).  
- **Không** claim unique review-quality concept (HotCRP ratings; ICLR agent).  
- Differentiator an toàn: **tích hợp xuyên vai trò** + **UX hiện đại** + **ranh giới AI có kiểm soát trong một sản phẩm**, không “phát minh matching”.

### 7.4. Câu định vị Ch2 (copy-ready tiếng Việt)

> EasyChair, HotCRP, OpenReview và Microsoft CMT đã hỗ trợ đầy đủ vòng đời hội nghị. Khoảng trống mà ConferenceSpace nhắm đến không phải thiếu nghiệp vụ cốt lõi, mà là lớp hỗ trợ có kiểm soát và trải nghiệm hiện đại: giảm nhập liệu metadata, kiểm tra sớm, hỗ trợ đọc cho phản biện viên, tín hiệu chất lượng phản biện, tổng hợp bằng chứng cho Chủ tọa, và trợ lý trong ứng dụng — với con người giữ quyền quyết định cuối. Phân công phản biện và COI được định vị như thuật toán minh bạch, đa lớp, có giám sát, không phải gán bài bằng mô hình ngôn ngữ lớn.

---

## 8. Luận điểm F — Human final control là chuẩn cộng đồng

### 8.1. Nguồn chuẩn mực

| ID | Tổ chức | Điểm then chốt | URL |
|----|---------|----------------|-----|
| COMM-F-01 | COPE | AI không phải author; human fully responsible; disclose | https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools |
| COMM-F-02 | COPE AI decision making | Human oversight cho quyết định | https://publicationethics.org/guidance/discussion-document/artificial-intelligence-ai-decision-making |
| COMM-F-06 | Elsevier | AI cannot replace critical thinking; no manuscript upload | https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals |
| COMM-F-07 | Springer Nature | “AI supports, not replaces”; “human in the loop” | https://group.springernature.com/gp/group/ai/ai-guidance-for-our-researchers-and-communities |
| COMM-F-08 | IEEE | Disclose AI; public AI upload = confidentiality breach; EiC accountable | https://journals.ieeeauthorcenter.ieee.org/become-an-ieee-journal-author/publishing-ethics/guidelines-and-policies/submission-and-peer-review-policies/ |
| COMM-F-09 | ACM | Authors accountable; reviewers no upload confidential submissions | https://www.acm.org/publications/policies/new-acm-policy-on-authorship |
| COMM-F-10 | NIH NOT-OD-23-149 | Cấm genAI phân tích/viết peer review critique (grant); confidentiality | https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html |
| COMM-F-11 | Wiley 2025 n=2430 | Peer review ≈ “humans preferred”; interest AI chỉ khi support + reviewer control; ~72% muốn disclose AI trong review | Wiley ExplanAItions 2025 PDF |
| COMM-F-13 | AAAI-26 | AI review pilot: **no scores/recommendations**; humans solely decide | AAAI FAQ pilot PDF |
| COMM-F-14 | Nature 2023 survey | Excitement + lo ngại bias/opacity | https://doi.org/10.1038/d41586-023-02980-0 |

### 8.2. Bốn nguyên tắc thiết kế (khớp Ch2 hiện tại)

1. **Hỗ trợ, không quyết định** — không auto accept/reject; matching = đề xuất.  
2. **Trách nhiệm gắn người có tên** — author/reviewer/chair.  
3. **Bảo mật bản thảo** — không đẩy submission sang public chatbot.  
4. **Minh bạch + chỉnh sửa/ghi đè + có căn cứ** — disclosure, HITL, explainability.

### 8.3. Phản chứng

- Wei et al. “AI Imperative” vẫn: collaborator not replacement.  
- Screening bots nhà xuất bản: flag cho human.  
- Covert LLM reviews + enforcement (ICML watermark) = **vi phạm chuẩn**, không phải chuẩn mới.

---

## 9. Đối chiếu survey nội bộ ↔ cộng đồng (bảng “khớp”)

| Nhu cầu / khoảng trống Ch2 | Survey | Cộng đồng | Mức khớp |
|----------------------------|--------|-----------|----------|
| Biểu mẫu dài / nhập liệu | 47,9% | Autofill industry + profile burden CVPR | **Khớp** |
| Kiểm tra lỗi sớm | 42,3% | Desk-reject format handbooks; EasyChair validation gaps | **Khớp** |
| Không biết bước tiếp | 49,3% | Role FAQ EasyChair/CMT; OpenReview docs stage | **Khớp** |
| Hướng dẫn dài | 46,5% | “volumes of text”; external guides | **Khớp** |
| Email/deadline rời rạc | 39,4% | Duplicate emails OR; email link CMT | **Khớp** |
| COI Chair | 5/7 | CACM/CLOSET/HotCRP/ARR multi-source | **Khớp + mạnh hơn survey** |
| Dashboard Chair | 4/7 | AC workload blogs; NeurIPS calibration | **Khớp** |
| Matching thận trọng | 2/7 | ICML hybrid; scores+override | **Khớp** (hybrid, không zero-auto) |
| AI tóm tắt reviewer | 6/11 | NeurIPS experiment OK; **ICML cấm summarize** | **Khớp một phần** — cần policy switch |
| AI highlight S/W | 3/11 | Policies cấm AI viết S/W | **Khớp thận trọng** |
| Human final control | nguyên tắc nhóm | COPE/Wiley/publishers | **Khớp mạnh** |
| Unique CMS lifecycle | — | 4 CMS đã đủ | **Khớp định vị gap** |

**Lệch đáng ghi:**  
1. Matching: survey Chair thấp; cộng đồng **cần** automation nhưng **có** override.  
2. Summarization: survey ủng hộ hơn một số policy (ICML B).  
3. Autofill AI: product/policy mạnh hơn “survey authors demand AI”.

---

## 10. Mạch lập luận Chương 2 sau khi bổ sung

```
[Ch1] Vấn đề: scale peer review + AI cần kiểm soát
        │
        ▼
[2.1] Ba nguồn nhu cầu
   (1) Survey nội bộ n=71 — ưu tiên UX/AI acceptance (có giới hạn mẫu)
   (2) Tổng hợp cộng đồng (mục mới) — tính lặp lại pain points + chuẩn AI
   (3) … (sang 2.2)
        │
        ▼
[2.2] Hiện trạng CMS + bối cảnh scale (NeurIPS/ICLR)
        │
        ▼
[2.3] Khoảng trống = UX + assistive layer + matching/COI explainable
      + 4 nguyên tắc (neo COMM-F)
        │
        ▼
[2.4] Yêu cầu F-* với cột Cơ sở = Survey + Community + Policy/Docs
        │
        ▼
[Ch3] Thiết kế hiện thực yêu cầu
[Ch4] Benchmark/UAT kiểm chứng — không dùng forum làm “kết quả đạt %”
[Ch5] Hạn chế: secondary synthesis; future: pilot hội nghị thật
```

### 10.1. Cấu trúc mục mới đề xuất (LaTeX outline)

```latex
\subsection{Tổng hợp tiếng nói cộng đồng và chính sách học thuật}
% sau 2.1 survey, trước hoặc sau "Diễn giải kết quả và giới hạn"

\subsubsection{Mục tiêu và phương pháp}
% convenience survey limits → triangulation
% sources: venue blogs, CMS docs/issues, publisher policies, surveys (Wiley)
% coding themes A--F; include counter-evidence
% not statistical generalization

\subsubsection{Kết quả theo chủ đề}
% 1 bảng: Chủ đề | Phát hiện chính | Nguồn tiêu biểu | Khớp survey?
% 1 hộp phản chứng ngắn

\subsubsection{Hàm ý cho định hướng ConferenceSpace}
% 4 bullets map to principles + feature groups
```

Độ dài gợi ý: **1,5–2,5 trang** + 1 bảng; chi tiết nguồn để **Phụ lục** (bảng COMM-*).

### 10.2. Chỉnh wording hiện có (không đổi số survey)

| Chỗ | Hướng sửa |
|-----|-----------|
| Mở Ch2 | “khảo sát + tổng hợp cộng đồng + đối chiếu hệ thống” |
| 2.1.6 giới hạn | Thêm: đã bổ sung triangulation; vẫn không phải sample frame toàn cục |
| 2.3 khoảng trống | Mỗi gap + 1 câu “cộng đồng/policy” |
| 2.4 cột Cơ sở | Thêm cite COMM / policy |
| 2.4 AI principles | Cite COPE + Wiley + NeurIPS/ICML |
| Ma trận truy vết | Cột nhu cầu: “Survey + community synthesis” |

---

## 11. Ảnh hưởng chương khác

| Chương | Việc cần làm | Không làm |
|--------|--------------|-----------|
| **1** | 1–2 câu: nhu cầu được neo bằng survey + community + policy | Không nhét bảng forum |
| **2** | Mục mới + siết claim + bibliography | Không biến forum thành “thống kê” |
| **3** | Giữ kiến trúc; có thể thêm ghi chú “policy-configurable summarization” | Không feature mới chỉ vì 1 thread |
| **4** | UAT questions map pain A–F đã tam giác hóa | Không cite Reddit như “kết quả đạt” |
| **5** | Limitation: secondary synthesis; contribution = integrated controlled-AI CMS | Không claim “đã chứng minh cộng đồng ưa ConferenceSpace” |

---

## 12. Danh mục nguồn ưu tiên đưa bibliography (top ~25)

1. NeurIPS 2025 PC reflections — https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/  
2. ICLR 2026 retrospective — https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/  
3. NeurIPS 2024 matching experiment — https://blog.neurips.cc/2024/12/12/neurips-2024-experiment-on-improving-the-paper-reviewer-assignment/  
4. ICML 2024 reviewing post — https://medium.com/@icml2024pc/reviewing-at-icml-2024-a7aa81169d8c  
5. ICML 2026 LLM Policy — https://icml.cc/Conferences/2026/LLM-Policy  
6. ICLR 2026 LLM FAQ — https://iclr.cc/FAQ/LLM  
7. NeurIPS 2025 LLM — https://neurips.cc/Conferences/2025/LLM  
8. NeurIPS 2026 AI reviewing experiment — https://neurips.cc/Conferences/2026/ai-reviewing-experiment  
9. Review Feedback Agent arXiv:2504.09737  
10. Liang et al. arXiv:2403.07183  
11. COPE Authorship and AI tools  
12. Nature Portfolio AI policy  
13. ACM Peer Review Policy  
14. ACL Publication Ethics (generative assistance)  
15. Wiley ExplanAItions 2025 PDF  
16. CACM automate COI opinion  
17. CLOSET CACM research  
18. TPMS site  
19. OpenReview paper matching docs  
20. CMT TPMS + conflicts docs  
21. HotCRP chair help  
22. EasyChair FAQ  
23. AgileTribe Not-So-EasyChair  
24. Muelaner EasyChair  
25. Leyton-Brown et al. Matching papers and reviewers, AIJ 2024  
26. AAAI-26 AI review pilot materials  
27. Nature Van Noorden & Perkel 2023 survey (d41586-023-02980-0)  
28. NIH NOT-OD-23-149  

---

## 13. Checklist trước khi dán vào LaTeX

- [ ] Mọi số % chỉ từ survey nội bộ hoặc survey có n (Wiley), không từ đếm thread.  
- [ ] Mỗi khoảng trống 2.3 có ≥1 nguồn ngoài survey.  
- [ ] Matching **không** gọi là generative AI.  
- [ ] Có đoạn phản chứng (CMS đủ dùng; automation cần thiết; ICLR đã pilot AI feedback).  
- [ ] ICML summarize ban được nhắc khi mô tả Reviewer Initial Analysis.  
- [ ] Phụ lục hoặc spreadsheet COMM-ID ↔ URL ↔ theme ↔ khớp survey.  
- [ ] Ngày truy cập nguồn web trong bibliography.

---

## 14. Đoạn văn mẫu (có thể chỉnh phong cách học thuật tiếng Việt)

### 14.1. Mở mục tổng hợp cộng đồng

> Do khảo sát nhu cầu của nhóm sử dụng mẫu thuận tiện (71 phản hồi) và kích thước nhỏ ở một số vai trò, kết quả chỉ mang tính định hướng. Để củng cố luận điểm, nhóm thực hiện tổng hợp thứ cấp các thảo luận công khai, blog thực hành của ban chương trình, tài liệu và issue của các hệ thống quản lý hội nghị, cùng chính sách AI của hội nghị và nhà xuất bản. Mục tiêu không phải ước lượng tỷ lệ trong toàn cộng đồng học thuật, mà kiểm tra xem các khó khăn và nguyên tắc thiết kế rút ra từ khảo sát nội bộ có **lặp lại** và **tương thích** với thực tiễn vận hành bên ngoài hay không.

### 14.2. Kết nối gap

> Đối chiếu cho thấy các nền tảng EasyChair, HotCRP, OpenReview và Microsoft CMT đã bao phủ vòng đời nộp bài–phản biện–ra quyết định. Tiếng nói cộng đồng và FAQ vận hành tập trung vào ma sát trải nghiệm, phân mảnh thông báo, thiếu kiểm tra sớm, gánh nặng metadata, cũng như nhu cầu COI đa nguồn và phân công phản biện có điểm số kèm quyền ghi đè. Đồng thời, chính sách hội nghị lớn và khảo sát quốc tế (ví dụ Wiley 2025) khẳng định AI chỉ được chấp nhận ở vai trò hỗ trợ dưới sự kiểm soát và trách nhiệm của con người. Các quan sát này hội tụ với bốn nhu cầu nền tảng từ khảo sát nội bộ và làm cơ sở cho khoảng trống thiết kế của ConferenceSpace ở mục 2.3.

### 14.3. Câu phòng vệ khi bị hỏi “n=71 có đủ không?”

> Không đủ để suy luận thống kê đại diện. Đề tài không khẳng định đại diện. Thay vào đó, survey nội bộ được **tam giác hóa** bằng tổng hợp cộng đồng/policy và đối chiếu hệ thống; yêu cầu chức năng được giữ khi các nguồn **hội tụ**. Hiệu lực của giải pháp được kiểm chứng ở Chương 4 bằng benchmark và khảo sát sau sử dụng, không bằng đếm bài đăng diễn đàn.

---

## 15. Việc tiếp theo (implementation vào báo cáo)

1. Thêm mục 2.1.x + 1 bảng khớp survey–cộng đồng (~2 trang).  
2. Bổ sung ~15–25 mục bibliography từ danh mục mục 12.  
3. Rải cite vào 2.3 và cột “Cơ sở” 2.4.  
4. Thêm 1 đoạn limitation Ch5.  
5. (Tuỳ chọn) Phụ lục bảng COMM đầy đủ.

---

*Tài liệu này tổng hợp kết quả 6 hướng khảo sát song song (UX CMS, author intake, chair COI/matching, reviewer AI, product gap, human control) + đối chiếu số liệu/policy chính. Không invent citation; phản chứng được giữ để tránh confirmation bias.*
