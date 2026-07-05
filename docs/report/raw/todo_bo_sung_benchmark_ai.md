# To-do bo sung benchmark AI cho bao cao ConferenceSpace

Tai lieu nay ghi lai cac khoang trong thuc nghiem can bo sung cho bao cao. Muc tieu khong phai viet them nhan xet chung, ma la tao du bang chung dinh luong de Chuong 5 co the ket luan chat che ve chat luong cac tinh nang AI va thuat toan lien quan.

## 1. Ket qua audit nhanh he thong hien co

- Chatbot agent dang di theo luong `frontend/app/api/chat/route.ts` -> `ai-service/app/services/agent_runtime.py` -> server tools trong `ai-service/app/services/tool_registry.py` -> query engine cua backend tai `backend/internal/agentquery`. He thong da co metrics runtime nhu request count, error count, tool timeout, resume success rate, TTFT va stream duration, nhung chua co benchmark chuc nang de do do dung cua cau tra loi.
- Submission Gating nam tai `ai-service/app/workflows/submission_gating`. Runner hien co da chia stage ro rang: intake normalization, binary integrity, format compliance, document extraction, fact derivation, content evaluation, policy evaluation, verdict mapping, guidance rendering va persistence audit. Response da co verdict, score, findings, guidance va stage timings, nhung chua co bo du lieu ground truth de do verdict accuracy hoac rule-level precision/recall.
- Goi y track can danh gia trong pham vi Submission Autofill tai `ai-service/app/workflows/submission_autofill`, cu the la truong `track_rankings` duoc tao dua tren hoi nghi dang hoat dong, danh sach track cua hoi nghi va thong tin bai nop da trich xuat hoac duoc cung cap trong form. Workflow doc lap `ai-service/app/workflows/track_recommendation` ton tai trong codebase nhung khong phai trong tam cua hang muc benchmark nay.
- Reviewer matching hien la lop thuat toan xac dinh, khong phai AI sinh. Thanh phan lien quan gom `backend/internal/assignment/scoring/domain_jaccard.go`, `backend/internal/assignment/matching/greedy.go`, COI exclusion trong `backend/internal/assignment/coi`, va reviewer suggestion service tai `backend/internal/service/reviewer_suggestion/service.go`. Benchmark hien co trong `backend/benchmarks` chu yeu do hieu nang va tai nguyen, chua do do chinh xac hoac chat luong phan cong.

## 2. To-do uu tien

| Uu tien | Hang muc | Muc tieu can dat | Dau ra toi thieu |
| --- | --- | --- | --- |
| P0 | Reviewer matching accuracy | Chung minh goi y/phan cong phan bien phu hop chuyen mon va khong vi pham COI | Bang Precision@K, Recall@K, coverage, load balance, COI violation rate |
| P0 | Submission Gating benchmark | Do do dung cua verdict `pass/warn/block` va cac finding theo rule | Bang verdict accuracy, block precision/recall, warning F1, false block rate, stage latency |
| P1 | Goi y track trong Submission Autofill | Do kha nang goi y track dung va on dinh dua tren hoi nghi dang hoat dong va input bai nop | Bang Top-1, Top-3, MRR, NDCG@K, invalid/duplicate rate, calibration |
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

## 5. Benchmark goi y track trong Submission Autofill

### 5.1 Pham vi can danh gia

Hang muc nay chi danh gia phan suggest tracks nam ben trong Submission Autofill. Dau vao can phan anh dung runtime cua he thong:

- Hoi nghi dang hoat dong ma tac gia dang nop bai.
- Danh sach track cua hoi nghi, kem ten track va mo ta neu co.
- Thong tin bai nop duoc trich xuat tu PDF hoac da co trong form, gom title, abstract, keywords va cac metadata lien quan.
- Output `track_rankings` cua Submission Autofill, gom track name, confidence va rationale.

Workflow `track_recommendation` doc lap khong phai trong tam cua benchmark nay. Chi nen dua workflow do vao bao cao neu can doi chieu nhu mot baseline phu, va khi do phai ghi ro day la thuc nghiem rieng.

### 5.2 Bo du lieu de xuat

Su dung tap paper co track ground truth, uu tien du lieu cong khai tu cac hoi nghi tren OpenReview hoac tap paper noi bo da co track:

- Toi thieu 8 hoi nghi/track group khac nhau neu co the.
- Toi thieu 200 paper de Top-K co y nghia; neu thoi gian han che, chon 50-80 paper can bang giua cac track.
- Moi mau gom active conference id, title, abstract, keywords, selected track, danh sach track cua conference va mo ta track/call for papers neu co.
- Can co PDF goc neu muon do end-to-end tu file upload den `track_rankings`. Neu chi do logic suggest tracks trong autofill, co the dung metadata da trich xuat de tach loi doc PDF khoi loi goi y track.

### 5.3 Chi so can do

- Top-1 accuracy: track dung co dung hang 1 khong.
- Top-3 accuracy: track dung co nam trong 3 goi y dau khong.
- MRR va NDCG@K: do chat luong xep hang, khong chi dung/sai.
- Invalid/duplicate track rate: ty le output chua track khong ton tai trong hoi nghi dang hoat dong hoac lap lai.
- Coverage rate: ty le response xep hang day du cac track duoc cung cap.
- Confidence calibration: so sanh confidence voi ty le dung thuc te. `AutofillTrackRanking` dung confidence 1-10, can chuan hoa ve 0-1 neu cong cu cham diem yeu cau.
- Stability: chay lap lai cung input va do bien dong rank cua track dung.
- Rationale quality: ty le ly do co nhac dung keyword/abstract/track description thay vi noi chung chung.

### 5.4 Cach trien khai

1. Chay workflow `submission_autofill` voi active conference context va danh sach track dung nhu luong nop bai that.
2. Lay `track_rankings` tu response va map track name ve track id hoac canonical track name trong dataset.
3. Chuan hoa output ve schema chung: paper id, conference id, gold track, ranked tracks, confidence, rationale, latency va model/config.
4. Cham diem theo gold track va tach loi thanh ba nhom: loi trich xuat metadata, loi mapping track name va loi xep hang track.
5. Bao cao ket qua cua phan suggest tracks trong Submission Autofill; khong tron voi workflow `track_recommendation` doc lap neu chua co thiet ke so sanh rieng.

## 6. Benchmark do chinh xac reviewer matching

### 6.1 Pham vi can danh gia

Reviewer matching can duoc danh gia nhu mot pipeline gom scoring, conflict filtering va assignment:

- `DomainJaccardScorer` tinh diem phu hop giua domain/keyword cua paper va reviewer.
- `GreedyMatcher` chon assignment theo diem, reviewer load, min/max reviewer per paper, score threshold va COI.
- COI layer dam bao khong gan reviewer co xung dot.
- Reviewer suggestion service co the duoc danh gia rieng neu bao cao muon noi ve goi y reviewer moi cho committee.

### 6.2 Bo du lieu de xuat

Can co it nhat mot trong ba loai ground truth:

- Historical assignment: paper, reviewer profile va assignment that tu hoi nghi cu hoac du lieu public.
- Chair-labeled assignment: chair/chuyen gia gan nhan top reviewer phu hop cho mot tap paper nho.
- Synthetic gold set: tao paper/reviewer voi topic va COI da biet truoc de kiem tra thuat toan trong dieu kien kiem soat.

Moi mau can co:

- Paper id, title, abstract, domains, keywords.
- Reviewer id, domains, expertise keywords, current load.
- COI pairs bat buoc loai tru.
- Gold reviewers hoac gold ranking.
- Cau hinh min/max reviewer, score threshold va reviewer max load.

### 6.3 Chi so can do

- Precision@K va Recall@K: gold reviewer co nam trong top K goi y hay khong.
- Assignment coverage: ty le paper dat du so reviewer toi thieu.
- COI violation rate: phai bang 0.
- Load balance: do lech chuan load, max-min load va ty le reviewer vuot tai.
- Average assigned score: diem phu hop trung binh cua assignment da chon.
- Fallback rate: ty le paper can fallback vi khong dat threshold hoac thieu reviewer.
- Optimality gap: tren tap nho, so sanh greedy assignment voi baseline toi uu nhu min-cost flow hoac ILP de biet thuat toan mat bao nhieu diem vi chay nhanh/don gian.
- Chair acceptance rate: neu co UAT, ty le chair giu nguyen goi y cua he thong.

### 6.4 Cach trien khai

1. Tai su dung generator trong `backend/benchmarks` cho data quy mo lon, nhung bo sung fixture co ground truth de cham chat luong.
2. Chay scorer de tao score matrix, sau do chay matcher voi nhieu cau hinh threshold/load.
3. Luu assignment output gom reviewer, score, COI status, fallback flag va load.
4. Bao cao tach hai lop: hieu nang xu ly da co benchmark hien tai, va chat luong phan cong can bo sung bang cac chi so tren.

## 7. Vi tri chen vao bao cao

- Muc 5.2 can them mot tieu muc rieng ve bo du lieu doi chung va quy trinh cham diem cho AI/algorithm benchmark.
- Muc 5.4 can tach ro benchmark toc do cua reviewer matching voi benchmark do chinh xac/chat luong reviewer matching.
- Muc 5.5 can them cac tieu muc rieng cho goi y track trong Submission Autofill, Submission Gating va Chatbot Agent. Khong nen gop cac hang muc nay vao "workflow chua danh gia day du" vi day la cac tinh nang da ton tai trong he thong va co du dau moi de do luong.
- Muc 5.8 can tong hop ro: ket qua nao da du bang chung, ket qua nao chi la benchmark ban dau, va ket qua nao van can tap du lieu lon hon.

## 8. Definition of done

Mot hang muc benchmark chi nen duoc xem la hoan tat khi co du cac dau ra sau:

- Dataset manifest: mo ta nguon du lieu, quy mo, nhan ground truth, gioi han va ly do chon mau.
- Script hoac test co the chay lai duoc.
- Raw result JSON/CSV duoc luu kem timestamp, model/config va commit hash neu co.
- Bang tong hop chi so chinh de dua vao bao cao.
- It nhat 3 failure examples co phan tich nguyen nhan.
- Doan han che trung thuc: ket qua chua chung minh dieu gi, va can them du lieu nao neu muon ket luan manh hon.
