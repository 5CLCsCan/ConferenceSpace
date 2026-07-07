# To-do bo sung benchmark AI cho bao cao ConferenceSpace

Tai lieu nay ghi lai cac khoang trong thuc nghiem can bo sung cho bao cao. Muc tieu khong phai viet them nhan xet chung, ma la tao du bang chung dinh luong de Chuong 5 co the ket luan chat che ve chat luong cac tinh nang AI va thuat toan lien quan.

## 1. Ket qua audit nhanh he thong hien co

- Chatbot agent dang di theo luong `frontend/app/api/chat/route.ts` -> `ai-service/app/services/agent_runtime.py` -> server tools trong `ai-service/app/services/tool_registry.py` -> query engine cua backend tai `backend/internal/agentquery`. He thong da co metrics runtime nhu request count, error count, tool timeout, resume success rate, TTFT va stream duration, nhung chua co benchmark chuc nang de do do dung cua cau tra loi.
- Submission Gating nam tai `ai-service/app/workflows/submission_gating`. Runner hien co da chia stage ro rang: intake normalization, binary integrity, format compliance, document extraction, fact derivation, content evaluation, policy evaluation, verdict mapping, guidance rendering va persistence audit. Response da co verdict, score, findings, guidance va stage timings, nhung chua co bo du lieu ground truth de do verdict accuracy hoac rule-level precision/recall.
- Goi y track can danh gia trong pham vi Submission Autofill tai `ai-service/app/workflows/submission_autofill`, cu the la truong `track_rankings` duoc tao dua tren hoi nghi dang hoat dong, danh sach track cua hoi nghi va thong tin bai nop da trich xuat hoac duoc cung cap trong form. Workflow doc lap `ai-service/app/workflows/track_recommendation` ton tai trong codebase nhung khong phai trong tam cua hang muc benchmark nay.

## 2. To-do uu tien

| Uu tien | Hang muc | Muc tieu can dat | Dau ra toi thieu |
| --- | --- | --- | --- |
| P0 | Submission Gating benchmark | Do do dung cua verdict `pass/warn/block` va cac finding theo rule | Bang verdict accuracy, block precision/recall, warning F1, false block rate, stage latency |
| P1 | Submission Autofill chi tiet | Do pipeline metadata extraction va phan goi y track trong cung workflow | Bang field accuracy, keyword extraction/enrichment quality, Top-1/Top-3 track accuracy |
| P1 | Chatbot agent benchmark | Do chatbot tra loi dung du lieu he thong, dung quyen va dung tool | Bang answer accuracy, groundedness, tool success rate, TTFT, stream duration, resume success |

## 3. Benchmark chatbot agent cua platform

### 3.1 Pham vi can danh gia

Benchmark nen danh gia chatbot nhu mot agent co tool use, khong danh gia nhu chatbot hoi-dap thong thuong. Cac thanh phan can duoc dua vao benchmark:

- Next.js API route `frontend/app/api/chat/route.ts`, vi day la gateway chuyen SSE giua frontend va AI Service.
- `AgentRuntime` trong `ai-service/app/services/agent_runtime.py`, vi day la noi quan ly session, message history, pending tool call, timeout, compaction va streaming.
- Server tools `query_engine` va `get_skill`, dac biet `query_engine` vi cau tra loi ve hoi nghi phai lay tu du lieu that cua backend.
- Backend AgentQuery tai `backend/internal/agentquery`, vi day la lop truy van du lieu co cau truc va kiem soat resource ma chatbot duoc phep doc.

### 3.2 Bo du lieu de xuat

Tao tap 40-60 cau hoi, chia theo vai tro:

- Author: hoi deadline, trang thai bai nop, track, submission requirement, thong bao va buoc tiep theo.
- Reviewer: hoi bai duoc phan cong, deadline review, trang thai review, yeu cau rebuttal.
- Chair/co-chair: hoi danh sach submission, tinh trang reviewer assignment, submission thieu reviewer, canh bao COI.
- Admin/van hanh: hoi thong tin tong quan ma khong yeu cau du lieu nhay cam.

Moi mau benchmark can co:

- `role` va user id dung de kiem tra phan quyen.
- Cau hoi tu nhien cua nguoi dung.
- Du lieu ground truth tu database hoac fixture.
- Tool/resource ky vong, vi du submission, conference, assignment, notification.
- Cau tra loi dung toi thieu, gom cac fact bat buoc.
- Thong tin bi cam tiet lo neu cau hoi vuot quyen.

### 3.3 Chi so can do

- Answer accuracy: ty le cau tra loi chua dung cac fact bat buoc.
- Groundedness: ty le fact trong cau tra loi co trong ket qua tool hoac context he thong.
- Unauthorized disclosure rate: ty le cau tra loi de lo du lieu khong thuoc quyen nguoi dung; chi so nay phai bang 0 trong cac test bao mat.
- Tool success rate: ty le tool call thanh cong va dung resource.
- Tool efficiency: so tool call trung binh moi turn, de phat hien agent truy van thua.
- TTFT va stream duration: dung metrics da co trong `MetricsStore`.
- Timeout/error rate: ty le turn that bai do tool timeout, model error hoac session state loi.
- Resume success rate: do kha nang tiep tuc turn sau pending client tool hoac mat ket noi.

### 3.4 Cach trien khai

1. Seed database voi mot bo hoi nghi nho nhung du vai tro, submission, assignment, review va notification.
2. Chay benchmark truc tiep qua AI Service `/api/v1/agent/chat` de loai nhieu cua frontend; sau do chay mot bo smoke test qua `frontend/app/api/chat/route.ts` de xac minh gateway SSE.
3. Ghi lai SSE events, tool calls, tool outputs, final answer va metrics snapshot.
4. Cham diem bang comparator deterministic: so khop fact bat buoc, phat hien fact khong co nguon, phat hien du lieu vuot quyen.
5. Dua vao bao cao 3 bang: chat quality, tool/runtime reliability va failure examples.

### 3.5 Output can viet vao bao cao

Viet ket qua benchmark nay vao `docs/report/compiled/markdown/chapter_5.AI-danh-gia-thuc-nghiem.md`, trong muc `5.5.7 Chatbot Agent cua nen tang` theo outline hien tai.

Noi dung toi thieu can co:

- Bang dataset benchmark chatbot: so cau hoi, so role, so mau can truy van du lieu he thong, so mau kiem tra vuot quyen.
- Bang chat quality: answer accuracy, groundedness, unauthorized disclosure rate, tool success rate va tool efficiency.
- Bang runtime reliability: TTFT, stream duration, timeout/error rate va resume success rate.
- Bang failure examples: it nhat 3 cau hoi that bai, tool da goi, loi quan sat duoc va cach dien giai trong bao cao.
- Doan ket luan ngan: chatbot dang du bang chung cho nhom cau hoi nao, nhom cau hoi nao chua nen ket luan manh.

## 4. Benchmark workflow Submission Gating

### 4.1 Pham vi can danh gia

Workflow can duoc benchmark theo tung stage vi runner da co `stage_timings` va status cho tung buoc. Pham vi toi thieu:

- Rule deterministic: file hop le, page limit, format compliance, required sections, reference count, policy thresholds.
- LLM content evaluation: finding co dua tren text trich xuat va policy hay khong.
- Verdict mapping: mapping tu finding/rule sang `pass`, `warn`, `block` co dung voi ground truth khong.
- Guidance rendering: huong dan cho tac gia co cu the va dung issue khong.

### 4.2 Bo du lieu de xuat

Tao 30-50 mau submission, gom:

- Mau `pass`: paper dung format, du section bat buoc, khong vi pham policy.
- Mau `warn`: thieu nhe section, reference yeu, metadata chua ro, hoac issue can chinh nhung khong nen chan nop.
- Mau `block`: file khong doc duoc, vuot gioi han trang nghiem trong, thieu section bat buoc, sai format bat buoc, hoac vi pham policy desk rejection.
- Mau edge case: PDF scan, PDF co nhieu cong thuc, file rong, file sai MIME, paper co abstract ngan, paper co reference list nhung parser kho nhan dien.

Moi mau can co:

- File PDF hoac fixture bytes.
- `SubmissionGatingRequest` voi `mode`, `source`, `policy`, `desk_rejection_settings`, `format_config`.
- Verdict ground truth.
- Danh sach rule/finding ky vong.
- Ghi chu neu mau chi dung de do latency/extraction, khong cham content quality.

### 4.3 Chi so can do

- Verdict accuracy: ty le verdict trung ground truth.
- Block precision va block recall: dac biet quan trong vi false block gay hai cho tac gia.
- Warning F1 theo rule: do kha nang phat hien issue khong nghiem trong.
- False block rate: ty le paper dang le nop duoc nhung bi chan; nen bao cao rieng va dat nguong chap nhan rat thap.
- Extraction success rate va text coverage: ty le PDF doc duoc va luong text trich xuat du de danh gia.
- Stage latency: p50/p95 cho tung stage, nhat la document extraction va content evaluation.
- Repeatability: chay lai cung input nhieu lan va do ty le verdict/finding on dinh.
- Grounded finding rate: ty le finding cua LLM co excerpt hoac bang chung trong text/policy.

### 4.4 Cach trien khai

1. Viet script benchmark goi truc tiep `SubmissionGatingRunner.run(...)` de kiem soat input va doc duoc `stage_timings`.
2. Luu raw response JSON cho tung mau, kem hash policy va input fingerprint.
3. Xuat CSV tong hop theo verdict, rule id, latency va ket qua pass/fail cua comparator.
4. Dua vao bao cao bang confusion matrix cho verdict va bang top failure cases.

### 4.5 Output can viet vao bao cao

Viet ket qua benchmark nay vao `docs/report/compiled/markdown/chapter_5.AI-danh-gia-thuc-nghiem.md`, trong muc `5.5.3 Submission Gating` theo outline hien tai.

Noi dung toi thieu can co:

- Bang dataset benchmark submission gating: so mau `pass`, `warn`, `block`, so mau edge case va cac policy fixture duoc dung.
- Confusion matrix cho verdict `pass/warn/block`.
- Bang rule-level quality: precision/recall/F1 theo nhom rule deterministic va LLM-assisted finding.
- Bang operational metrics: extraction success rate, text coverage, p50/p95 latency theo stage va repeatability.
- Bang false block analysis: cac truong hop bi block sai, muc do nghiem trong va tac dong toi tac gia.
- Doan ket luan ngan: workflow phu hop voi advisory/precheck den muc nao, va dieu gi chua du de dung nhu hard gate.

## 5. Benchmark chi tiet Submission Autofill

### 5.1 Pham vi can danh gia

Hang muc nay danh gia Submission Autofill nhu mot workflow nhieu buoc, khong chi la tac vu doc PDF. Dau vao can phan anh dung runtime cua he thong:

- Hoi nghi dang hoat dong ma tac gia dang nop bai.
- Danh sach track cua hoi nghi, kem ten track va mo ta neu co.
- File PDF ban thao, thong tin tac gia da nhap neu co va extra_details neu tac gia cung cap sua loi/bo sung.
- Thong tin bai nop duoc trich xuat tu PDF hoac da co trong form, gom title, abstract, authors, keywords va cac metadata lien quan.
- Output `track_rankings` cua Submission Autofill, gom track name, confidence va rationale.

Can tach hai nhom danh gia chinh:

- Pipeline metadata extraction: trich xuat title, abstract, authors, emails, affiliations, countries va keywords goc tu ban thao; dong thoi chuan hoa truong cho form, xu ly metadata bi thieu/nhieu va mo rong keyword khi co du can cu tu abstract, excerpt, conference domain hoac CFP.
- Track suggestion: xep hang official tracks cua hoi nghi dang hoat dong trong `track_rankings`.

Workflow `track_recommendation` doc lap khong phai trong tam cua benchmark nay. Chi nen dua workflow do vao bao cao neu can doi chieu nhu mot baseline phu, va khi do phai ghi ro day la thuc nghiem rieng.

### 5.2 Bo du lieu de xuat

Su dung tap paper co track ground truth, uu tien du lieu cong khai tu cac hoi nghi tren OpenReview hoac tap paper noi bo da co track:

- Toi thieu 8 hoi nghi/track group khac nhau neu co the.
- Toi thieu 200 paper de Top-K co y nghia; neu thoi gian han che, chon 50-80 paper can bang giua cac track.
- Moi mau gom active conference id, title, abstract, authors, emails, affiliations, keywords goc, selected track, danh sach track cua conference va mo ta track/call for papers neu co.
- Can co PDF goc neu muon do end-to-end tu file upload den `track_rankings`. Neu chi do logic suggest tracks trong autofill, co the dung metadata da trich xuat de tach loi doc PDF khoi loi goi y track.
- Nen co nhan rieng cho keyword bo sung hop le, vi keyword enrichment khong the cham nhu exact-copy tu paper goc.

### 5.3 Chi so can do

- Metadata field accuracy: exact/normalized match cho title, author/email/affiliation F1, ROUGE hoac semantic similarity cho abstract.
- Extraction coverage: ty le PDF co du text coverage, page_count hop le va khong roi vao `low_text_coverage`.
- Metadata correction quality: ty le truong bi thieu/sai duoc chuan hoa dung trong pipeline extraction, va ty le viec sua truong lam thay doi sai su that trong manuscript.
- Keyword extraction F1: do keyword goc trich xuat tu paper.
- Keyword enrichment quality: precision cua keyword bo sung, ty le keyword qua chung chung, ty le trung lap va muc do huu ich cho track suggestion.
- Track Top-1 accuracy: track dung co dung hang 1 khong.
- Track Top-3 accuracy: track dung co nam trong 3 goi y dau khong.
- Track MRR va NDCG@K: do chat luong xep hang, khong chi dung/sai.
- Invalid/duplicate track rate: ty le output chua track khong ton tai trong hoi nghi dang hoat dong hoac lap lai.
- Confidence calibration: so sanh confidence voi ty le dung thuc te. `AutofillTrackRanking` dung confidence 1-10, can chuan hoa ve 0-1 neu cong cu cham diem yeu cau.
- Stability: chay lap lai cung input va do bien dong cua fields, keyword bo sung va rank cua track dung.

### 5.4 Cach trien khai

1. Chay workflow `submission_autofill` voi PDF, active conference context va danh sach track dung nhu luong nop bai that.
2. Luu response day du gom `fields`, `track_rankings`, `authors`, `materials`, `warnings` va `error`.
3. Chuan hoa output ve schema chung: paper id, conference id, extracted fields, original keywords, enriched keywords, gold track, ranked tracks, confidence, rationale, latency va model/config.
4. Cham pipeline metadata theo tung truong de khong tron loi doc PDF, loi chuan hoa field va loi lam giau keyword.
5. Cham keyword theo hai nhom: keyword goc phai khop paper, keyword bo sung phai co ly do chuyen mon va khong duoc qua rong.
6. Cham track theo gold track va tach loi thanh ba nhom: loi metadata dau vao, loi mapping track name va loi xep hang track.
7. Bao cao ket qua Submission Autofill nhu mot workflow duy nhat co nhieu nang luc con; khong tron voi workflow `track_recommendation` doc lap neu chua co thiet ke so sanh rieng.

### 5.5 Output can viet vao bao cao

Viet ket qua benchmark nay vao `docs/report/compiled/markdown/chapter_5.AI-danh-gia-thuc-nghiem.md`, trong muc `5.5.2 Submission Autofill` theo outline hien tai.

Noi dung toi thieu can co:

- Bang dataset benchmark autofill: so paper, so conference/track group, so file PDF end-to-end, so mau chi cham metadata da trich xuat va so mau co nhan keyword bo sung.
- Bang metadata pipeline quality: title accuracy, abstract similarity, author/email/affiliation F1, keyword extraction F1, keyword enrichment precision va extraction coverage.
- Bang track suggestion quality: Top-1 accuracy, Top-3 accuracy, MRR, NDCG@K, invalid/duplicate track rate va confidence calibration.
- Bang error breakdown: loi doc PDF, loi chuan hoa field, loi keyword qua rong, loi mapping track name va loi xep hang track.
- Bang example outputs: it nhat 3 mau thanh cong va 3 mau that bai, kem title/abstract rut gon, gold track, predicted track ranking va keyword bo sung.
- Doan ket luan ngan: Submission Autofill giup giam thao tac nao cho tac gia, phan nao van bat buoc can nguoi dung review.

## 6. Vi tri chen vao bao cao

- Muc 5.2 can them mot tieu muc rieng ve bo du lieu doi chung va quy trinh cham diem cho AI/algorithm benchmark.
- Muc 5.5 can lam ro Submission Autofill bang hai tieu muc con: pipeline metadata extraction, trong do co chuan hoa field va keyword enrichment, va goi y track trong autofill; dong thoi them cac muc rieng cho Submission Gating va Chatbot Agent. Khong nen dua goi y track thanh workflow ngang hang voi Submission Autofill vi no la mot dau ra con cua workflow nay.
- Muc 5.8 can tong hop ro: ket qua nao da du bang chung, ket qua nao chi la benchmark ban dau, va ket qua nao van can tap du lieu lon hon.

## 7. Definition of done

Mot hang muc benchmark chi nen duoc xem la hoan tat khi co du cac dau ra sau:

- Dataset manifest: mo ta nguon du lieu, quy mo, nhan ground truth, gioi han va ly do chon mau.
- Script hoac test co the chay lai duoc.
- Raw result JSON/CSV duoc luu kem timestamp, model/config va commit hash neu co.
- Bang tong hop chi so chinh de dua vao bao cao.
- It nhat 3 failure examples co phan tich nguyen nhan.
- Doan han che trung thuc: ket qua chua chung minh dieu gi, va can them du lieu nao neu muon ket luan manh hon.
