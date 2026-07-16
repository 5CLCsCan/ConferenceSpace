# Kế hoạch tái định vị AI-first và đồng bộ lập luận Chương 1–5

> **Dành cho session thực hiện:** REQUIRED SUB-SKILL: sử dụng `superpowers:executing-plans`, `conferencespace-report-reviewer` và `vietnamese-academic-writing`; đọc toàn bộ phần 1–6 trước khi sửa bất kỳ chương nào.

**Mục tiêu:** Tái định vị ConferenceSpace trước xu hướng nền tảng AI-first, thay luận điểm “thị trường thiếu tích hợp AI” bằng câu hỏi “AI nên được dùng ở đâu, chịu ràng buộc nào và được đánh giá bằng bằng chứng gì”, rồi đồng bộ chuỗi lập luận từ Chương 1 đến Chương 5.

**Cách tiếp cận:** Khóa bằng chứng và phương pháp khảo sát ở Chương 2 trước, sau đó tóm lược vấn đề vào Chương 1, đối chiếu thiết kế ở Chương 3, kiểm toán bằng chứng ở Chương 4 và chỉ cuối cùng mới sửa kết luận Chương 5. Không dùng bảng tính năng để kết luận chất lượng hoặc thành công; Chương 2 xác lập xu hướng và lựa chọn thiết kế, Chương 4 mới đánh giá mức độ đáp ứng.

**Tài liệu chính:** LaTeX, BibLaTeX/Biber, báo cáo tiếng Việt, tài liệu sản phẩm và pháp lý công khai, benchmark hiện có của ConferenceSpace.

---

## 1. Trạng thái và lý do tạo handoff mới

Tài liệu này thay thế hoàn toàn `docs/report/raw/chapter_2_5_revision_handoff.md`. Bản cũ đã bị xóa vì tiền đề trung tâm không còn phù hợp sau khi khảo sát PeerSubmit:

- bản cũ chủ yếu đối chiếu EasyChair, HotCRP, OpenReview và Microsoft CMT;
- bản cũ dùng khoảng trống “chưa ghi nhận AI tích hợp xuyên vai trò”;
- PeerSubmit công khai một nền tảng AI-first có matching, screening, summaries và decision support trong cùng quy trình;
- bản cũ còn ánh xạ mục tiêu sang `thử nghiệm cô lập lỗi AI`, trong khi Chương 4 hiện chưa có fault-injection test đầu cuối tương ứng;
- giữ hai handoff sẽ tạo hai source of truth cạnh tranh và khiến session sau có thể tiếp tục một luận điểm đã bị phản chứng.

Những phần còn đúng từ handoff cũ được kế thừa có điều chỉnh:

- mô hình ba lớp trách nhiệm logic;
- phân biệt ranh giới trách nhiệm với topology triển khai;
- giới hạn claim về dữ liệu, bảo mật, matching, COI và AI;
- chuỗi truy vết Chương 1 → 2 → 3 → 4 → 5;
- yêu cầu biên dịch và kiểm tra citation sau chỉnh sửa.

---

## 2. Bối cảnh chiến lược cần giữ xuyên suốt

### 2.1. Điều đã thay đổi sau khảo sát PeerSubmit

Trước đây báo cáo gần với câu chuyện:

> Các nền tảng truyền thống đã có nghiệp vụ nhưng các hỗ trợ AI còn rời rạc; ConferenceSpace lấp khoảng trống bằng tích hợp AI xuyên vai trò.

Câu chuyện này không còn bảo vệ được. Tài liệu công khai của PeerSubmit cho thấy nền tảng AI-first đã đưa AI vào nhiều điểm của quy trình quản lý bài nộp và bình duyệt. Tùy trang nguồn, PeerSubmit công bố các năng lực như semantic reviewer matching, summaries, quality screening, decision briefs, review assistance và những đầu ra nằm gần scoring/verdict.

Vì vậy, luận văn phải thừa nhận:

1. Nền tảng quản lý hội nghị truyền thống đã giải quyết phần lớn nghiệp vụ nền.
2. Nền tảng AI-first cho thấy tích hợp AI vào nhiều bước là xu hướng sản phẩm có thật.
3. Khoảng trống không còn là “chưa có AI” hoặc “chưa có tích hợp xuyên vai trò”.
4. Câu hỏi nghiên cứu có giá trị hơn là: tác vụ nào nên dùng AI, tác vụ nào cần kết quả xác định, ai chịu trách nhiệm, đầu ra cần được kiểm tra thế nào và bằng chứng nào đủ để kết luận giá trị.

### 2.2. Định vị mới của ConferenceSpace

Không định vị ConferenceSpace là:

- nền tảng đầu tiên tích hợp AI xuyên vai trò;
- sản phẩm có nhiều AI hơn PeerSubmit;
- sản phẩm hoàn thiện hơn EasyChair, CMT, OpenReview hoặc PeerSubmit;
- giải pháp đã chứng minh bảo mật hoặc quản trị toàn vòng đời dữ liệu AI;
- kiến trúc tối ưu hoặc duy nhất cho AI có trách nhiệm.

Định vị ConferenceSpace là:

> Một nền tảng thực nghiệm bao phủ vòng đời bình duyệt cốt lõi trong phạm vi đề tài, dùng để hiện thực hóa và đánh giá cách phân tách tác vụ thành nghiệp vụ cốt lõi, thuật toán xác định và có thể kiểm chứng, cùng AI hỗ trợ có kiểm soát.

Giá trị cần “sell” gồm ba phần:

1. **Nền tảng thực nghiệm theo quy trình:** các luồng hỗ trợ nằm trong trạng thái, quyền hạn và điểm chuyển tiếp của quy trình bình duyệt, không phải demo độc lập.
2. **Phân tách trách nhiệm theo mức hậu quả:** matching và COI không giao cho AI tạo sinh; AI không viết phản biện hoặc sinh phán quyết chấp nhận/từ chối trong contract của ConferenceSpace.
3. **Chuỗi bằng chứng theo lớp:** backend, thuật toán, luồng AI và UAT được đánh giá bằng loại chỉ số khác nhau; failure modes và giới hạn được công bố.

### 2.3. Câu định vị chuẩn

Các chương có thể diễn đạt lại nhưng phải giữ nguyên nghĩa sau:

> Các nền tảng AI-first cho thấy AI đã được đưa vào nhiều công đoạn của quy trình bình duyệt. ConferenceSpace không cạnh tranh bằng số lượng tác vụ được tự động hóa, mà hiện thực hóa và đánh giá một cách phân công trách nhiệm: giữ trạng thái cùng quyết định học thuật cho người có thẩm quyền, xử lý các tác vụ cần tính ổn định bằng thuật toán có thể kiểm chứng, và giới hạn AI ở các đầu ra hỗ trợ được đánh giá theo từng nhiệm vụ.

Câu ngắn dùng để tự kiểm tra mạch:

> PeerSubmit cho thấy AI có thể tự động hóa nhiều bước; ConferenceSpace kiểm tra bước nào nên được hỗ trợ, bước nào phải kiểm chứng và bước nào bắt buộc dừng trước quyền quyết định của con người.

Không dùng câu ngắn này như kết luận so sánh tuyệt đối nếu chưa dẫn nguồn cho cả hai vế.

---

## 3. Source of truth và tệp cần chỉnh

### 3.1. Tệp báo cáo

- Chương 1: `docs/report/compiled/latex/Chapter1/chapter1.tex`
- Chương 2: `docs/report/compiled/latex/Chapter2/chapter2.tex`
- Chương 3: `docs/report/compiled/latex/Chapter3/chapter3.tex`
- Chương 4: `docs/report/compiled/latex/Chapter4/chapter4.tex`
- Chương 5: `docs/report/compiled/latex/Chapter5/chapter5.tex`
- Tài liệu tham khảo: `docs/report/compiled/latex/References/references.bib`
- Tệp biên dịch: `docs/report/compiled/latex/main.tex`
- PDF kiểm tra: `docs/report/compiled/latex/main.pdf`

Nếu tồn tại tệp nguồn tương ứng trong `docs/report/raw`, phải xác định quy trình sinh LaTeX trước khi chỉnh. Không để bản raw và LaTeX duy trì hai luận điểm khác nhau.

### 3.2. Bằng chứng hiện có của ConferenceSpace cần đối chiếu

- Chương 3 mô tả use case, ranh giới vai trò, matching/COI và sáu luồng AI.
- Chương 4 có k6, micro-benchmark, dữ liệu Semantic Scholar, workflow runner 1.127 bài, TCA 1.097 kết quả, Chatbot Agent 40 hội thoại và UAT.
- Chương 5 đã ghi nhận hạn chế về nhãn chuyên gia, chất lượng AI, observability, provider bên ngoài và độ hoàn thiện sản phẩm.
- Repository có API tests về quyền truy cập, COI và quyền Chair; chỉ đưa vào báo cáo nếu đã đọc test/artifact và mô tả đúng phạm vi.

### 3.3. Research PeerSubmit đã có trong cuộc thảo luận nhưng chưa được xem là citation hoàn tất

Research hiện cho biết các nhóm thông tin sau có thể tồn tại trong tài liệu công khai:

- định vị AI-first;
- semantic/vector reviewer matching;
- embeddings, HNSW, cosine similarity và top-K;
- summaries, quality screening và decision briefs;
- review drafting, scoring hoặc verdict generation trên product/pricing pages;
- human approve/override hoặc recommendation-only trong Terms/Legal;
- Privacy Policy về pháp nhân, data controller/processor và vùng lưu dữ liệu;
- vendor metrics và testimonials chưa được xác nhận độc lập.

Session thực hiện **không được sao chép các nhận định trên vào luận văn chỉ dựa vào handoff**. Phải mở đúng nguồn, kiểm tra nội dung hiện tại, thêm citation riêng và lưu ngày truy cập.

---

## 4. Hợp đồng về bằng chứng và mức khẳng định

### 4.1. Ba loại bằng chứng không được trộn

1. **Vendor claim:** tính năng, số liệu, kiến trúc hoặc testimonial do nhà cung cấp công bố.
2. **Nguồn độc lập:** registry, bài báo, technical report, review hoặc audit không do vendor tự công bố.
3. **Kết quả ConferenceSpace:** số liệu được nhóm trực tiếp đo, có dataset/script/output hoặc mô tả phương pháp.

Mọi bảng so sánh phải khiến người đọc phân biệt được ba loại trên bằng câu chú thích, cột `Nguồn bằng chứng`, ký hiệu hoặc lời dẫn ngay trước/sau bảng.

### 4.2. Tuyên bố được phép về PeerSubmit

Chỉ khi citation trực tiếp hỗ trợ:

- PeerSubmit tự định vị là nền tảng AI-first.
- PeerSubmit công bố các tính năng cụ thể trên trang sản phẩm/pricing/blog.
- PeerSubmit mô tả human approval/override hoặc recommendation-only trong tài liệu pháp lý.
- Trong phạm vi khảo sát, nhóm chưa tìm thấy benchmark hoặc đánh giá độc lập đủ rõ cho một vendor metric cụ thể.
- Tài liệu marketing và pháp lý nhấn mạnh các ranh giới khác nhau, nếu trích dẫn chính xác từng nguồn.

### 4.3. Tuyên bố không được phép về PeerSubmit

- “PeerSubmit không có vòng đời bình duyệt đầy đủ.”
- “PeerSubmit để AI tự quyết định hoàn toàn.”
- “PeerSubmit kém an toàn” hoặc “người dùng không tin tưởng” chỉ vì công ty mới.
- “PeerSubmit bị cộng đồng đánh giá kém” khi thực tế là chưa tìm thấy corpus review độc lập.
- “ConferenceSpace tốt hơn PeerSubmit” nếu không có head-to-head benchmark.
- Dùng vốn đăng ký, tuổi công ty hoặc pricing làm bằng chứng về chất lượng kỹ thuật.

Cách diễn đạt an toàn khi thiếu nguồn độc lập:

> Trong phạm vi tài liệu được khảo sát đến ngày truy cập, nhóm chưa tìm thấy bằng chứng độc lập đủ rõ để xác nhận số liệu do nhà cung cấp công bố.

### 4.4. Tuyên bố được phép về ConferenceSpace

- Bao phủ vòng đời bình duyệt cốt lõi **trong phạm vi đề tài**.
- Matching và COI được xử lý ngoài AI tạo sinh bằng cơ chế có thể kiểm chứng.
- Sáu luồng AI được đặt tại các điểm chạm theo vai trò và có contract đầu ra riêng.
- Chương 4 cung cấp bằng chứng thực nghiệm ở quy mô và cấu hình đã mô tả.
- Một số luồng có bằng chứng mạnh hơn các luồng khác.
- Người có thẩm quyền giữ các điểm xác nhận và quyết định chính theo thiết kế/triển khai được mô tả.

### 4.5. Tuyên bố không được phép về ConferenceSpace

- “Đầy đủ cho một hội nghị tiêu chuẩn” nếu không định nghĩa chuẩn và phạm vi.
- “Đã tích hợp AI thành công” chỉ dựa vào bảng tính năng Chương 2.
- “AI có trách nhiệm” như thuộc tính tuyệt đối.
- “Kiểm soát toàn bộ dữ liệu AI” khi dùng nhà cung cấp bên ngoài và chưa có lifecycle governance audit.
- “Nghiệp vụ vẫn hoạt động khi AI lỗi” như kết quả đã chứng minh nếu chưa có fault-injection test đầu cuối.
- “Không có AI bias” hoặc “không ảnh hưởng quyết định” khi chưa đo automation bias.
- “Matching tốt hơn semantic/vector matching” khi chưa có head-to-head benchmark.

### 4.6. Phân biệt ba tầng kết luận

- **Chương 2:** xu hướng, chức năng công bố, nhu cầu, rủi ro và lựa chọn chiến lược.
- **Chương 3:** thiết kế/triển khai và contract trách nhiệm.
- **Chương 4:** chất lượng, hiệu năng, failure modes và mức đáp ứng trong thử nghiệm.

Không để Chương 2 kết luận “thành công”, không để Chương 3 dùng mô tả kiến trúc như bằng chứng chất lượng, không để Chương 4 suy rộng ra toàn thị trường.

---

## 5. Thuật ngữ chuẩn

Dùng nhất quán:

- `bình duyệt bài báo` cho peer review;
- `Tác giả`, `Phản biện viên`, `Chủ tọa/Đồng chủ tọa`;
- `nền tảng quản lý hội nghị trưởng thành` hoặc `nền tảng nghiệp vụ truyền thống` tùy ngữ cảnh;
- `nền tảng AI-first` ở lần đầu cần giải thích là nền tảng định vị AI như năng lực lõi;
- `nghiệp vụ cốt lõi`;
- `thuật toán xác định và có thể kiểm chứng`;
- `AI hỗ trợ có kiểm soát`;
- `ba lớp trách nhiệm logic`;
- `đối sánh phản biện (reviewer matching)` ở lần đầu;
- `xung đột lợi ích (COI)` ở lần đầu;
- `đầu ra hỗ trợ`, `bản nháp`, `cảnh báo`, `tổng hợp bằng chứng` theo đúng chức năng;
- `vendor claim` nên diễn đạt bằng tiếng Việt là `tuyên bố do nhà cung cấp công bố` trong thân báo cáo.

Không dùng lẫn:

- `thuật toán cố định`, `cơ chế cố định` nếu đang chỉ lớp chuẩn;
- `AI workflow` như từ thay thế cho toàn bộ nghiệp vụ;
- `tự động hóa` khi thực tế chỉ tạo gợi ý;
- `verdict` như đồng nghĩa với decision brief;
- `kiểm soát dữ liệu` nếu thực tế chỉ kiểm tra quyền truy cập ở cấp ứng dụng.

---

# 6. Thứ tự thực thi bắt buộc

Thực hiện theo thứ tự:

1. Audit và bổ sung nguồn PeerSubmit/AI-first.
2. Tái cấu trúc Chương 2, Mục 2.2.
3. Viết lại Chương 2, Mục 2.3.
4. Đồng bộ Chương 2, Mục 2.4 và ma trận truy vết.
5. Quay lại sửa Chương 1.
6. Đồng bộ các điểm neo ở Chương 3.
7. Kiểm toán claim–evidence ở Chương 4; chỉ bổ sung thực nghiệm nếu được yêu cầu và có artifact.
8. Sửa Chương 5 sau cùng.
9. Kiểm tra liên chương, citation và biên dịch.

Lý do: Chương 2 phải trở thành source of truth về thị trường và vấn đề thiết kế trước khi Chương 1 tóm lược; Chương 5 chỉ được viết sau khi mục tiêu Chương 1 và bằng chứng Chương 4 đã khớp.

---

# 7. Gói công việc A — Audit nguồn AI-first

## Task A1 — Lập claim–source ledger cho PeerSubmit

**Tệp:**

- Modify: `docs/report/compiled/latex/References/references.bib`
- Create only if needed by existing report workflow: một artifact nghiên cứu trong `docs/report/raw`; không tạo thêm tài liệu nếu ledger có thể nằm trong handoff hoặc commit notes.

**Thực hiện:**

1. Mở từng URL chính thức được dùng cho định vị, feature, pricing, technical blog, Terms và Privacy.
2. Ghi URL, tiêu đề, tổ chức/tác giả, năm hoặc `n.d.`, ngày truy cập.
3. Với mỗi nguồn, ghi nhận định cụ thể được hỗ trợ.
4. Tách citation theo trang; không dùng homepage cho mọi claim.
5. Nếu trang thay đổi hoặc không còn nội dung research mô tả, hạ/bỏ claim.
6. Không thêm registry, pricing hoặc privacy fact nếu không phục vụ trực tiếp lập luận học thuật.

**Ledger tối thiểu:**

- AI-first positioning;
- reviewer matching method;
- summaries/screening;
- review drafting/scoring/verdict nếu xác nhận;
- decision briefs;
- human approval/override hoặc recommendation-only;
- data handling fact chỉ khi cần phân tích giới hạn.

**Definition of Done:** Mỗi nhận định PeerSubmit dự định đưa vào Chương 2 có một citation trực tiếp; mọi số liệu marketing được gắn nguồn vendor và không trình bày như benchmark độc lập.

## Task A2 — Chọn nền tảng AI-first tham khảo

**Thực hiện:**

1. Giữ PeerSubmit là đối tượng chính.
2. Chọn tối đa 2–3 đối tượng tham khảo nếu chúng đại diện cho chiến lược khác: integrity screening, event matchmaking hoặc workflow automation.
3. Ưu tiên Morressier nếu nguồn xác nhận integrity/reviewer matching.
4. Chỉ giữ Dryfta nếu cần minh họa AI cho trải nghiệm sự kiện, đồng thời nói rõ nó không phải đối sánh trực tiếp về peer-review depth.
5. Loại nền tảng không có nguồn đủ rõ hoặc không thêm chiều so sánh mới.

**Definition of Done:** Nhóm AI-first không phải danh sách marketing dài; mỗi đối tượng có một lý do phương pháp để được chọn.

## Task A3 — Ghi giới hạn phương pháp khảo sát

Chuẩn bị đoạn sẽ đặt ở 2.2.1:

- khảo sát dựa trên tài liệu công khai tại ngày truy cập;
- không thực hiện hands-on benchmark PeerSubmit nếu thực tế chưa làm;
- thiếu mô tả công khai không chứng minh tính năng không tồn tại;
- vendor metrics không được xem là kết quả độc lập;
- so sánh tập trung vào định vị, contract chức năng và bằng chứng công khai.

---

# 8. Gói công việc B — Tái cấu trúc Chương 2

**Tệp chính:** `docs/report/compiled/latex/Chapter2/chapter2.tex`

## Task B1 — Sửa mở đầu Chương 2

**Mục tiêu:** Chương 2 phải khảo sát cả nhu cầu người dùng, nền tảng nghiệp vụ trưởng thành và xu hướng AI-first.

**Nội dung cần đạt:**

- Chương 1 đặt câu hỏi dùng AI thế nào dưới ràng buộc liêm chính;
- Chương 2 dùng hai nhóm đối sánh;
- chương chuyển kết quả thành yêu cầu và contract kiểm soát;
- không tuyên bố ba lớp là kiến trúc tối ưu đã được tài liệu chứng minh.

## Task B2 — Viết lại Mục 2.2.1: đối tượng và tiêu chí khảo sát

Mục hiện tại: `Tiêu chí lựa chọn hệ thống đối sánh`.

**Đổi chức năng:** định nghĩa hai nhóm:

1. EasyChair, HotCRP, OpenReview, Microsoft CMT — chuẩn nghiệp vụ và mô hình vận hành.
2. PeerSubmit là đối tượng AI-first chính; Morressier và đối tượng chọn lọc khác là tham khảo.

**Tiêu chí so sánh:**

- bao phủ vòng đời bình duyệt;
- vai trò được hỗ trợ;
- điểm đặt AI;
- loại đầu ra;
- mức gần quyết định học thuật;
- cơ chế xác nhận/ghi đè;
- khả năng giải thích/truy vết;
- loại bằng chứng công khai;
- phạm vi ngoài peer review như registration/payment chỉ dùng để định vị, không quyết định chất lượng học thuật.

**Bắt buộc:** thêm giới hạn phương pháp từ Task A3.

## Task B3 — Viết lại Mục 2.2.2: tổng quan nền tảng

### B3.1. Giữ và tinh gọn bốn nền tảng trưởng thành

Với mỗi nền tảng:

- năng lực nghiệp vụ;
- điểm mạnh liên quan trực tiếp đề tài;
- bài học thiết kế;
- không ép thành đối thủ AI nếu AI không phải định vị công khai.

### B3.2. Tạo tiểu mục riêng cho PeerSubmit

Cấu trúc đề xuất:

1. Định vị và phạm vi sản phẩm.
2. Vòng đời submission/review/decision được công bố.
3. Catalogue AI được công bố.
4. Matching technique nếu technical source xác nhận.
5. Human approval/override và ranh giới pháp lý.
6. Mức bằng chứng: vendor claims, chưa có head-to-head/independent benchmark trong phạm vi khảo sát.
7. Hàm ý: automation-first là xu hướng thật; ConferenceSpace cần định vị bằng responsibility allocation và evidence.

Không đưa pricing, vốn, partners hoặc testimonials nếu chúng không hỗ trợ trực tiếp câu hỏi nghiên cứu.

### B3.3. Tạo tiểu mục nền tảng AI-first tham khảo

Mỗi đối tượng tối đa một đoạn ngắn, trả lời:

- AI dùng ở đâu;
- phục vụ vai trò nào;
- bổ sung chiều gì cho so sánh;
- loại nguồn nào hỗ trợ.

## Task B4 — Viết lại Mục 2.2.3: so sánh nghiệp vụ

Mục hiện tại: `So sánh nghiệp vụ với các nền tảng truyền thống`.

**Câu hỏi duy nhất:** ConferenceSpace có nền tảng nghiệp vụ đủ để đặt các thử nghiệm AI trong một vòng đời bình duyệt chung hay chỉ là tập workflow rời rạc?

**Tiêu chí tối thiểu:**

- cấu hình hội nghị/track;
- submission;
- roles/RBAC;
- assignment;
- COI;
- review form/draft;
- rebuttal;
- discussion;
- decision;
- notification;
- camera-ready;
- registration/payment/event website để chỉ rõ ngoài phạm vi.

**Kết luận được phép:**

> ConferenceSpace bao phủ vòng đời bình duyệt cốt lõi trong phạm vi đề tài, do đó các luồng AI được đặt trong trạng thái và quyền hạn của một quy trình chung.

**Không dùng:** `đầy đủ cho hội nghị tiêu chuẩn`, `hoàn thiện`, `production-ready`.

## Task B5 — Viết lại Mục 2.2.4: so sánh chiến lược AI-first

Mục hiện tại: `So sánh tính năng tích hợp AI với các công cụ mới`.

Thay bảng có/không đơn giản bằng so sánh các chiều:

- tác vụ;
- điểm trong vòng đời;
- loại đầu ra;
- cơ chế xử lý;
- người xác nhận;
- hành động tự động;
- khả năng kiểm chứng;
- loại bằng chứng công khai.

Các hàng có thể gồm:

- metadata/autofill;
- pre-screening;
- reviewer matching;
- COI;
- paper summary;
- review drafting;
- review scoring;
- review quality checking;
- decision synthesis;
- verdict generation;
- cross-role agent.

**Kết luận bắt buộc:**

- ConferenceSpace đồng nhịp với xu hướng AI-first về điểm đặt hỗ trợ;
- ConferenceSpace chọn ranh giới khác ở matching/COI, review authorship và verdict;
- đây là so sánh chiến lược/contract, không phải bằng chứng chất lượng;
- mức thành công được đánh giá ở Chương 4.

## Task B6 — Giữ hoặc tái định vị Mục 2.2.5 về bằng chứng cộng đồng

Mục hiện tại tổng hợp Silverchair, RoRI và SSP.

**Thực hiện:**

- giữ nếu nguồn bổ sung nhu cầu người dùng chuyên nghiệp;
- không dùng các nguồn này để xác nhận PeerSubmit;
- nối chúng với câu hỏi người dùng muốn AI hỗ trợ ở đâu và giữ quyền thế nào;
- giữ giới hạn về journal vs conference, blog vs peer-reviewed source và mẫu khảo sát.

## Task B7 — Viết lại Mục 2.3: từ khoảng trống thị trường sang vấn đề thiết kế

Đổi trọng tâm `Hạn chế của các hệ thống hiện tại` nếu tiêu đề này ép so sánh đối thủ. Có thể dùng:

- `Vấn đề thực tiễn và nguyên tắc giải pháp`, hoặc
- giữ tiêu đề section nhưng đổi subsection thành `Các vấn đề thiết kế rút ra từ khảo sát`.

**Luận điểm trung tâm:**

> Thị trường đã tích hợp AI vào nhiều công đoạn, nhưng các tác vụ có mức hậu quả, yêu cầu độ ổn định và chủ thể chịu trách nhiệm khác nhau.

**Các vấn đề con:**

1. Giảm nhập liệu nhưng dữ liệu nháp phải được người dùng sửa/xác nhận.
2. Matching và COI ảnh hưởng công bằng nên cần kết quả kiểm chứng được.
3. Hỗ trợ đọc/tổng hợp cần bám bằng chứng và công bố failure modes.
4. Luồng gần quyết định phải dừng trước review authorship, scoring hoặc verdict tự động theo phạm vi ConferenceSpace.
5. Agent xuyên vai trò phải giữ quyền truy cập tài nguyên.

**Dẫn xuất ba lớp:** mô hình ba lớp là lựa chọn thiết kế của đề tài để xử lý các nhóm tác vụ, không phải market novelty hoặc kiến trúc tối ưu đã được chứng minh.

## Task B8 — Đồng bộ Mục 2.4: yêu cầu và contract kiểm soát

Mỗi yêu cầu quan trọng phải truy được theo cấu trúc:

- nhu cầu/rủi ro nguồn;
- vai trò;
- chức năng;
- lớp trách nhiệm;
- người/quy tắc quyết định cuối;
- đầu ra và hành động người dùng;
- bằng chứng Chương 4;
- giới hạn chưa được đo.

**Contract tối thiểu:**

- Autofill: bản nháp, Tác giả sửa/xác nhận, không tự submit.
- Gating: tách rule checks khỏi AI warnings; block chỉ theo contract/rule đã cấu hình.
- Matching: thuật toán xác định, điểm/lý do/ràng buộc, Chair xác nhận/ghi đè.
- COI: bằng chứng và độ phủ có giới hạn; không claim phát hiện đầy đủ.
- Initial Analysis: không viết review/chấm điểm.
- Quality Auditor: đánh giá bản nháp; phát hiện cần xác nhận, đặc biệt khi evidence yếu.
- Chair Copilot: tổng hợp evidence/disagreement, không sinh accept/reject trong ConferenceSpace.
- Chatbot: tool access theo quyền, từ chối ngoài phạm vi.

**Sửa yêu cầu phi chức năng:**

- không ghi `thử nghiệm cô lập lỗi đã có`;
- có thể ghi `thiết kế giảm phụ thuộc vào AI` như requirement;
- bằng chứng outage phải đánh dấu `chưa đủ bằng chứng trực tiếp` nếu Chương 4 chưa test;
- `bảo mật dữ liệu` phải tách authorization cấp ứng dụng khỏi provider retention/compliance.

## Task B9 — Sửa ma trận truy vết cuối Chương 2

Cột đề xuất:

- nhu cầu/vấn đề;
- yêu cầu;
- contract trách nhiệm;
- thiết kế Chương 3;
- bằng chứng Chương 4;
- trạng thái bằng chứng dự kiến (`có`, `một phần`, `chưa có`).

Không để ma trận hứa một thử nghiệm không tồn tại.

## Definition of Done Chương 2

- Hai nhóm đối sánh được định nghĩa và có lý do chọn.
- PeerSubmit có phần riêng, đủ sâu và source-bounded.
- 2.2.3 chứng minh phạm vi nghiệp vụ, không chất lượng AI.
- 2.2.4 so sánh chiến lược AI, không kết luận thành công.
- 2.3 không còn dùng “thiếu AI tích hợp” làm khoảng trống.
- 2.4 ánh xạ requirement → responsibility contract → evidence.
- Vendor claims được phân biệt với kết quả độc lập và số liệu ConferenceSpace.
- Chương kết thúc bằng cầu nối rõ sang Chương 3 và 4.

---

# 9. Gói công việc C — Cập nhật Chương 1 sau khi Chương 2 ổn định

**Tệp:** `docs/report/compiled/latex/Chapter1/chapter1.tex`

## Task C1 — Viết lại phần cuối `Đặt vấn đề`

Thay logic hiện tại ở các đoạn đang nói:

- cơ chế hỗ trợ thông minh tập trung vào từng chức năng;
- thiếu cách tích hợp thống nhất;
- “để giải quyết bài toán” theo nghĩa đã hoàn tất.

**Mạch mới gồm bốn bước:**

1. Nền tảng trưởng thành đã giải quyết nghiệp vụ nền.
2. Nền tảng AI-first cho thấy AI automation là xu hướng mới.
3. Khi AI đến gần review/scoring/decision, câu hỏi là phân loại tác vụ, trách nhiệm, dữ liệu và bằng chứng.
4. ConferenceSpace là nền tảng thực nghiệm để hiện thực hóa và đánh giá một cách phân tách trách nhiệm.

**Bắt buộc:**

- không nói PeerSubmit thiếu quy trình;
- không nói AI-first đã được chứng minh hiệu quả;
- không gọi data control toàn diện;
- không nói ConferenceSpace đã giải quyết hoàn toàn;
- dùng `hiện thực hóa và đánh giá một cách tiếp cận`.

## Task C2 — Sửa mục tiêu tổng quát

Mục tiêu phải là:

- xây dựng nền tảng thực nghiệm;
- hiện thực mô hình ba lớp;
- đánh giá mỗi lớp theo đúng bản chất;
- chỉ ra giá trị và giới hạn trong điều kiện thử nghiệm.

Tránh cấu trúc causal `mô hình có giúp... hay không` nếu không có thiết kế đối chứng kiến trúc.

## Task C3 — Sửa mục tiêu cụ thể và bảng truy vết

**Sửa overclaim hiện có:**

- bỏ hoặc hạ `khả năng vận hành khi thành phần AI gặp lỗi` nếu không có fault-injection;
- không nói mọi luồng AI đã được test biên quyền hạn;
- không nói khả năng bỏ qua/xác nhận đã được đo cho mọi luồng nếu chỉ có contract/UI;
- tách chất lượng AI theo từng luồng.

**Bảng cần phản ánh bằng chứng thật:**

- backend/load;
- matching/COI;
- task-specific AI metrics/TCA;
- chatbot permission scenarios;
- UAT;
- failure isolation ở trạng thái `chưa đủ bằng chứng` hoặc không phải mục tiêu được tuyên bố hoàn thành.

## Task C4 — Làm sắc ba đóng góp

1. Nền tảng thực nghiệm theo vòng đời bình duyệt.
2. Mô hình ba lớp được định nghĩa và hiện thực trong ConferenceSpace.
3. Chuỗi bằng chứng theo lớp/tác vụ, công bố cả failure modes và giới hạn.

Không claim novelty tuyệt đối hoặc superiority.

## Task C5 — Cập nhật phạm vi

Bổ sung nếu chưa rõ:

- không benchmark trực tiếp với PeerSubmit;
- không đánh giá toàn diện provider data lifecycle;
- không đo automation bias hoặc tác động dài hạn lên phán đoán;
- không đánh giá ConferenceSpace như gói SaaS/event-management đầy đủ;
- kết quả chỉ có hiệu lực trong cấu hình thử nghiệm.

## Task C6 — Cập nhật mô tả cấu trúc luận văn

Chương 2 phải được mô tả là:

- khảo sát nhu cầu;
- đối chiếu nền tảng nghiệp vụ và AI-first;
- dẫn xuất vấn đề thiết kế và requirement.

Chương 4 phải là nơi đánh giá mức độ thành công, không phải Chương 2.

## Definition of Done Chương 1

- Câu hỏi trung tâm chuyển thành `dùng AI như thế nào`.
- PeerSubmit/AI-first chỉ làm bằng chứng xu hướng, không chiếm phần mở đầu.
- ConferenceSpace được sell bằng responsibility architecture + evidence chain.
- Mục tiêu và bảng truy vết không hứa bằng chứng chưa có.
- Phạm vi khóa rõ dữ liệu, outage, bias và so sánh đối thủ.

---

# 10. Gói công việc D — Đồng bộ Chương 3

**Tệp:** `docs/report/compiled/latex/Chapter3/chapter3.tex`

Không tái cấu trúc lớn nếu nội dung hiện tại đã bao phủ use case và ba lớp.

## Task D1 — Sửa điểm neo mở đầu

Mở đầu phải nối đúng:

- Chương 2 xác định nhu cầu và vấn đề phân công trách nhiệm;
- Chương 3 hiện thực cách phân công đó;
- không nói Chương 2 chứng minh ConferenceSpace ưu việt hơn AI-first platform.

## Task D2 — Khóa ba lớp là logic, không vật lý

- nghiệp vụ: state/permission/lifecycle;
- thuật toán: matching/COI/rule results cần tái tạo;
- AI: probabilistic draft/analysis/synthesis.

Topology frontend/backend/AI service/databases chỉ là cách hiện thực.

## Task D3 — Chứng minh AI nằm trong quy trình, không là workflow rời rạc

Với sáu luồng, chỉ rõ:

- use case và vai trò;
- trạng thái trước/sau;
- dữ liệu đầu vào theo quyền;
- đầu ra;
- hành động người dùng;
- thao tác AI không tự thực hiện;
- artifact/bằng chứng Chương 4.

Đây là nơi chứng minh `integration into lifecycle` về mặt thiết kế và triển khai.

## Task D4 — Thu hẹp claim dữ liệu và failure isolation

- `kiểm soát dữ liệu` chỉ dùng khi mô tả authentication/authorization/resource scoping thực tế;
- nói rõ dữ liệu có thể được gửi sang OpenRouter/provider bên ngoài nếu đúng;
- provider retention/training/residency chưa rõ phải ghi giới hạn;
- manual fallback là đặc tính thiết kế;
- không gọi outage resilience đã được chứng minh nếu Chương 4 chưa có test.

## Task D5 — Đồng bộ bảng thiết kế–bằng chứng cuối chương

Mỗi claim thiết kế phải trỏ đến evidence thật hoặc trạng thái thiếu bằng chứng:

- core workflow;
- deterministic matching/COI;
- AI task quality;
- permission boundary;
- operational behavior;
- outage isolation nếu chưa có phải ghi `chưa kiểm chứng đầu cuối`.

## Definition of Done Chương 3

- Trả lời được AI được tích hợp ở đâu trong lifecycle.
- Mỗi luồng có responsibility contract cụ thể.
- Không lẫn logical layers với services.
- Không overclaim data governance hoặc fault tolerance.
- Bảng cuối chương khớp Chương 4.

---

# 11. Gói công việc E — Kiểm toán Chương 4

**Tệp:** `docs/report/compiled/latex/Chapter4/chapter4.tex`

## Task E1 — Đổi câu hỏi tổng quát

Dùng câu hỏi:

> Mỗi lớp thực hiện đúng trách nhiệm được giao đến mức nào trong điều kiện thử nghiệm?

Không dùng một câu chung ngụ ý toàn bộ AI “đáng tin cậy”.

## Task E2 — Đối chiếu mục tiêu mới từ Chương 1

Kiểm tra từng hàng:

- nghiệp vụ: functional evidence và k6 không được trộn;
- thuật toán: quality + runtime + explainability proxy;
- AI: metric riêng từng luồng;
- permission: chỉ các scenario/test thực sự có;
- UAT: cỡ mẫu và phạm vi;
- outage: evidence có hay không.

## Task E3 — Giữ ranh giới giữa so sánh thị trường và đánh giá hệ thống

Không dùng vendor metrics PeerSubmit làm baseline cho ConferenceSpace nếu không cùng dữ liệu/phương pháp.

Không thêm head-to-head claims.

Có thể nhắc Chương 2 chỉ để giải thích vì sao chọn responsibility boundary, không dùng Chương 2 để xác nhận kết quả.

## Task E4 — Kiểm toán kết luận từng luồng AI

Giữ cấu trúc:

1. nhiệm vụ;
2. dữ liệu;
3. metric;
4. kết quả;
5. failure cases;
6. kết luận đúng phạm vi;
7. giới hạn.

Đặc biệt:

- Autofill mạnh ở metadata có reference rõ;
- Gating tách rule verdict khỏi soft AI warning;
- Initial Analysis chỉ định hướng đọc;
- Quality Auditor còn noise;
- Chair Copilot không phải accept/reject classifier;
- Chatbot permission test có phạm vi 40 hội thoại và tool failures.

## Task E5 — Xử lý fault-isolation claim

Chọn một trong hai nhánh:

### Nhánh A — Không bổ sung thử nghiệm

- ghi rõ kiến trúc/manual paths tồn tại;
- ghi `chưa có fault-injection end-to-end`;
- bỏ claim Chương 1 rằng đã đánh giá outage;
- đưa vào hạn chế/hướng phát triển.

### Nhánh B — Bổ sung thử nghiệm nếu user yêu cầu riêng

- phải có kịch bản, script, raw output và kết quả;
- tắt/timeout AI service;
- kiểm tra submission/manual entry, assignment, review, decision;
- xác nhận AI errors không làm đổi state ngoài ý muốn;
- không thêm test chỉ bằng mô tả.

Mặc định kế hoạch này chọn **Nhánh A** để tránh mở rộng scope.

## Task E6 — Tạo/đồng bộ bảng mức kết luận

Mỗi nhóm có:

- claim/mục tiêu;
- evidence;
- kết quả nổi bật;
- mức `đạt`, `đạt một phần`, `chưa đủ bằng chứng`;
- giới hạn.

Không gộp toàn bộ AI thành một mức.

## Definition of Done Chương 4

- Trả lời đúng responsibility hypothesis.
- Không so sánh số liệu không tương thích với vendor.
- Mỗi AI flow có conclusion riêng.
- Outage claim được bỏ hoặc có evidence thật.
- Không dùng TCA/NLI như expert ground truth.
- Mọi số liệu truy được về artifact.

---

# 12. Gói công việc F — Đồng bộ Chương 5

**Tệp:** `docs/report/compiled/latex/Chapter5/chapter5.tex`

## Task F1 — Sửa luận điểm mở đầu

Không viết universal:

> AI có thể tạo giá trị nếu đặt trong kiến trúc đúng.

Nên khóa:

> Trong điều kiện thử nghiệm, ConferenceSpace cho thấy cách phân tách ba lớp cho phép tích hợp AI vào một số điểm hỗ trợ mà không giao các trạng thái và quyết định học thuật chính cho AI tạo sinh.

## Task F2 — Kết luận ba đóng góp bằng evidence

1. Hệ thống: phạm vi lifecycle đã hiện thực và phần ngoài phạm vi.
2. Thiết kế: responsibility allocation đã hiện thực; không claim tối ưu/độc nhất.
3. Thực nghiệm: evidence chain, flow mạnh/yếu và giới hạn.

## Task F3 — Đặt PeerSubmit đúng vai trò

Chương 5 không cần phân tích đối thủ dài.

Nếu nhắc:

- ConferenceSpace không cạnh tranh về SaaS packaging hoặc automation breadth;
- đóng góp là cách tổ chức và đánh giá;
- không kết luận superiority.

## Task F4 — Đồng bộ hạn chế

Bắt buộc có:

- không head-to-head benchmark;
- vendor/product comparison dựa trên public docs;
- data provider lifecycle chưa audit;
- automation bias chưa đo;
- fault isolation chưa test nếu chọn Nhánh A;
- expert labels/UAT/real-conference data còn hạn chế;
- product maturity và event ops ngoài phạm vi.

## Task F5 — Đồng bộ hướng phát triển

Chỉ giữ hướng xuất phát từ evidence gaps:

- observability/audit trail;
- fault isolation, async queue, timeout/retry;
- provider/self-host options và data governance;
- expert evaluation gần decision;
- real chair assignment data;
- hoàn thiện nghiệp vụ còn thiếu.

Không đưa “thêm nhiều AI hơn” như mục tiêu tự thân.

## Definition of Done Chương 5

- Kết luận không vượt Chương 4.
- Định vị mới được nhắc ngắn, không biến thành competitor pitch.
- Ba đóng góp có evidence và giới hạn riêng.
- Hạn chế khóa các claim data/outage/bias/comparison.
- Hướng phát triển nối một-một với hạn chế.

---

# 13. Kiểm tra liên chương

## 13.1. Chuỗi lập luận bắt buộc

Người đọc phải truy được:

- **Chương 1:** AI-first là xu hướng; vấn đề là phân công tác vụ và trách nhiệm dưới ràng buộc liêm chính.
- **Chương 2:** hai nhóm nền tảng xác lập chuẩn nghiệp vụ và xu hướng automation; nhu cầu/chính sách dẫn đến responsibility contracts.
- **Chương 3:** ConferenceSpace hiện thực contracts trong lifecycle theo vai trò.
- **Chương 4:** mỗi lớp/luồng được đánh giá bằng evidence phù hợp và có failure analysis.
- **Chương 5:** kết luận feasibility trong phạm vi thử nghiệm, không superiority hoặc universal safety.

## 13.2. Câu hỏi hostile-review cần tự trả lời

1. PeerSubmit đã có end-to-end AI; ConferenceSpace mới ở đâu?
   - Không claim feature novelty; trả lời bằng responsibility architecture + evidence chain.
2. Vì sao matching không dùng semantic/vector method?
   - Vì lựa chọn thiết kế ưu tiên deterministic/explainable path; không claim tốt hơn nếu chưa head-to-head.
3. Human override của PeerSubmit khác ConferenceSpace thế nào?
   - Không claim monopoly on human control; ConferenceSpace biến boundary thành architecture, contract và evaluation scope.
4. ConferenceSpace có bảo mật dữ liệu tốt hơn không?
   - Chỉ có evidence về app-level authorization trong phạm vi test; provider lifecycle chưa được chứng minh.
5. AI service chết thì hệ thống có chạy không?
   - Có manual/design paths được mô tả; nếu chưa fault-injection thì nói chưa đủ evidence end-to-end.
6. AI có ảnh hưởng quyết định con người không?
   - Chưa đo automation bias; hệ thống không sinh verdict trong contract, nhưng không claim loại bỏ cognitive influence.
7. “Tích hợp thành công” dựa vào đâu?
   - Chương 3 chứng minh integration; Chương 4 đánh giá quality/utility/risk; dùng mức kết luận theo từng flow.

## 13.3. Search terms cần kiểm tra toàn báo cáo

- `thiếu một cách tích hợp thống nhất`
- `không nền tảng nào`
- `không có AI`
- `đầy đủ cho hội nghị tiêu chuẩn`
- `tích hợp thành công`
- `đảm bảo bảo mật`
- `kiểm soát dữ liệu`
- `vẫn hoạt động khi AI không khả dụng`
- `thử nghiệm cô lập lỗi`
- `thuật toán cố định`
- `cơ chế cố định`
- `tầng kiến trúc`
- `AI quyết định`
- `verdict`
- `PeerSubmit`
- `vector search`

Mỗi match phải được đọc trong ngữ cảnh; không thay thế máy móc.

---

# 14. Verification và biên dịch

Sau mỗi gói chương:

1. Đọc lại đoạn mở và kết chương.
2. Đọc đoạn kết chương trước và mở chương sau.
3. Kiểm tra citation mới trong `.bib` và `.bbl`.
4. Biên dịch từ `docs/report/compiled/latex`:

```bash
latexmk -pdf -interaction=nonstopmode -file-line-error main.tex
```

5. Kiểm tra `main.log` cuối cùng, không chỉ warning ở vòng LaTeX đầu trước Biber.
6. Không chấp nhận:
   - undefined citation/reference;
   - lỗi LaTeX;
   - bảng tràn nghiêm trọng do cột mới;
   - numbering/cross-reference sai sau đổi subsection;
   - duplicate bibliography key.
7. Kiểm tra PDF tại các trang chứa bảng 2.2.3, 2.2.4, bảng truy vết Chương 1 và bảng kết luận Chương 4.

Nếu thêm nguồn web dễ thay đổi, lưu `urldate` và cân nhắc snapshot theo quy trình hiện có của dự án; không phát minh ngày xuất bản.

---

# 15. Các checkpoint bàn giao

## Checkpoint 1 — Source audit hoàn tất

Bàn giao:

- danh sách citation mới;
- claim–source mapping;
- claim bị loại do không verify;
- giới hạn vendor evidence.

## Checkpoint 2 — Chương 2 hoàn tất

Bàn giao:

- cấu trúc 2.2.1–2.2.4 mới;
- kết luận 2.3;
- requirement/contracts 2.4;
- ma trận truy vết;
- danh sách claim Chương 1 cần sửa.

## Checkpoint 3 — Chương 1 và 3 đồng bộ

Bàn giao:

- luận đề mới;
- mục tiêu/đóng góp/phạm vi mới;
- mapping sang implementation;
- claim data/outage còn giới hạn.

## Checkpoint 4 — Chương 4 và 5 đồng bộ

Bàn giao:

- bảng mức kết luận;
- danh sách evidence gaps;
- kết luận theo từng đóng góp;
- hạn chế/hướng phát triển.

## Checkpoint 5 — Final integration

Bàn giao:

- PDF biên dịch thành công;
- không undefined citation/reference;
- claim–evidence audit;
- danh sách giới hạn còn chủ ý giữ lại.

---

# 16. Definition of Done toàn bộ đợt chỉnh sửa

Đợt chỉnh sửa chỉ hoàn tất khi tất cả điều kiện sau đúng:

- Chương 1 không còn bán novelty bằng “thiếu AI tích hợp”.
- Chương 2 khảo sát rõ hai nhóm nền tảng và phân biệt vendor claim với evidence độc lập.
- PeerSubmit được mô tả đúng là đối tượng AI-first chính, không bị dựng thành đối thủ yếu.
- ConferenceSpace được chứng minh có lifecycle bình duyệt cốt lõi trong phạm vi đề tài, không claim full event management.
- Chương 2 chỉ kết luận strategic alignment/integration design; Chương 4 mới kết luận mức thành công.
- Mục 2.3 dẫn xuất ba lớp từ task consequence, determinism, responsibility và evidence needs.
- Mục 2.4 có responsibility contract cho các chức năng chính.
- Chương 3 chỉ rõ sáu luồng nằm ở đâu trong lifecycle và dừng ở đâu.
- Chương 4 không hứa outage evidence chưa có, không trộn vendor metrics với benchmark và không gộp chất lượng toàn bộ AI.
- Chương 5 kết luận trong phạm vi thử nghiệm và ghi rõ data governance, automation bias, fault isolation cùng head-to-head comparison chưa được chứng minh.
- Thuật ngữ ba lớp nhất quán.
- Mọi claim PeerSubmit có citation trực tiếp và ngày truy cập.
- Báo cáo biên dịch thành công, không có undefined citation/reference mới.

Nếu một session phát hiện nguồn mới phủ định định vị hiện tại, phải dừng tại checkpoint gần nhất, ghi rõ claim bị phủ định và cập nhật source ledger trước khi tiếp tục. Không vá câu chữ ở Chương 1 để che mâu thuẫn với Chương 2.
