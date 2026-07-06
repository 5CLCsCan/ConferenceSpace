# Mo ta chi tiet benchmark cac workflow AI

Tai lieu nay mo ta thiet ke benchmark cho hai nhom chuc nang AI can danh gia trong he thong ConferenceSpace:

1. Goi y track ben trong workflow Submission Autofill.
2. Submission Gating day du, gom deterministic rule check va LLM steering check.

Muc tieu cua benchmark khong chi la chung minh script co the chay, ma la tao ra mot quy trinh danh gia co the lap lai, co dau vao ro rang, co artifact de review thu cong, va co gioi han dien giai duoc neu dua vao bao cao. Benchmark duoc thiet ke theo huong toi gian nhung kiem soat chat: chay local, khong dung dispatcher, khong phu thuoc Modal, va luu tat ca ket qua thanh file de co the audit lai tung case.

## 1. Pham vi va nguyen tac danh gia

### 1.1. Pham vi he thong duoc benchmark

Benchmark tap trung vao cac workflow AI sau:

| Nhom benchmark | Workflow he thong | Thanh phan duoc danh gia | Ghi chu pham vi |
| --- | --- | --- | --- |
| Track recommendation | Submission Autofill | `track_rankings` trong output autofill | Khong danh gia workflow track recommendation doc lap. Dau vao la hoi nghi dang hoat dong va paper can nop. |
| Submission Gating - rules | Submission Gating | Cac rule deterministic va verdict blocking do rule tao ra | Danh gia bang fixture co ground truth ro rang. |
| Submission Gating - LLM steering | Submission Gating | Kha nang phat hien van de noi dung theo yeu cau cua chair | Danh gia bang submission that; LLM chi duoc dua ra canh bao/nhan xet, khong duoc tao blocking verdict. |

Phan track recommendation duoc dat trong Submission Autofill vi day la hanh vi thuc te cua platform: khi author upload paper va chon hoi nghi dang hoat dong, workflow autofill trich xuat metadata va dong thoi de xuat track phu hop dua tren thong tin paper va context cua hoi nghi. Do do benchmark nay khong co y nghia neu tach track recommendation thanh mot workflow doc lap voi context khac.

### 1.2. Nguyen tac thiet ke benchmark

Benchmark duoc thiet ke theo bon nguyen tac:

- **Dung runtime that cua he thong**: script benchmark goi runner workflow that trong `ai-service`, khong viet lai logic goc de tranh danh gia mot ban mo phong khac voi san pham.
- **Tach cac loai evidence**: deterministic rules duoc danh gia bang exact match voi expected rule id va verdict; LLM steering duoc danh gia bang artifact de review thu cong va rubric chat luong; track recommendation duoc danh gia bang plausibility review do chua co ground truth track chinh thuc cho tung paper.
- **Luu ket qua de audit**: moi run tao raw response, normalized output, CSV review, summary metrics, audit report, va report-ready summary.
- **Khong trao quyen reject cho LLM**: LLM steering chi phat hien va giai thich rui ro noi dung. Blocking decision chi den tu rule deterministic co the tai lap, giai thich, va kiem tra bang fixture.

## 2. Moi truong benchmark

### 2.1. Vi tri project benchmark

Benchmark duoc dat trong project rieng:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks
```

Ly do tach project:

- Runner benchmark cu trong `Benchmarks/workflow_runner` duoc thiet ke cho Modal, khong phu hop voi benchmark local.
- Benchmark moi can isolation de khong lam bien doi code workflow san pham.
- Tat ca artifact dau ra duoc ghi local, phu hop voi quy mo 50-100 test cases.
- Khong can dispatcher vi task list da biet truoc va co the fetch tu dataset local.

### 2.2. Code san pham duoc benchmark

Benchmark tham chieu workflow trong repo ConferenceSpace:

```text
E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service
```

Hai runner chinh:

```text
ai-service/app/workflows/submission_autofill/runner.py
ai-service/app/workflows/submission_gating/runner.py
```

Voi Submission Gating, benchmark can bao dam runner su dung dung thu tu stage, dac biet `document_extraction` phai chay truoc `format_compliance` vi format compliance can `state.extracted_document` de kiem tra font size, margin, paper size, column count va cac thong tin layout khac.

Voi PDF extraction, benchmark su dung extractor that cua workflow, khong thay bang parser don gian. Dieu nay quan trong vi paper IEEE hoac paper hai cot thuong lam sai cac extractor pho thong; neu dung extractor khac, ket qua benchmark se khong dai dien cho hanh vi san pham.

### 2.3. Cau hinh LLM va bien moi truong

Benchmark dung cau hinh OpenAI/OpenRouter san co trong:

```text
E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\.env
```

Run cuoi cung ghi nhan cau hinh runtime nhu sau:

| Truong | Gia tri |
| --- | --- |
| `openai_configured` | `true` |
| `openai_base_url` | `http://13.250.136.185:20128/v1` |
| `openai_model` | `cx/gpt-5.4-mini` |
| `openrouter_configured` | `true` |
| `agent_model` | `openrouter/google/gemini-3.1-flash-lite-preview:nitro` |
| `llm_request_timeout_seconds` | `60` |
| `dispatcher` | `false` |
| `local_first` | `true` |
| `max_concurrency` | `10` |

Neu can fetch lai file tu OpenReview hoac tranh rate limiting, benchmark co the dung proxy list:

```text
E:\Download\proxyscrape_premium_http_proxies (4).txt
```

Trong run da review, benchmark uu tien local cached PDFs va chi dung network khi can. Thiet ke nay lam giam do nhieu tu OpenReview va giup ket qua on dinh hon.

### 2.4. Lenh chay benchmark

Chay tat ca workflow:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow all `
  --track-cases 50 `
  --gating-cases 24 `
  --max-concurrency 10 `
  --task-timeout-seconds 180 `
  --proxy-file "E:\Download\proxyscrape_premium_http_proxies (4).txt"
```

Chay rieng track recommendation:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow track_recommendation `
  --track-cases 50 `
  --max-concurrency 10 `
  --task-timeout-seconds 180 `
  --proxy-file "E:\Download\proxyscrape_premium_http_proxies (4).txt"
```

Chay rieng Submission Gating rules:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow submission_gating_rule_check `
  --max-concurrency 10 `
  --task-timeout-seconds 180
```

Chay rieng Submission Gating LLM steering:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow submission_gating_llm_steering `
  --gating-cases 24 `
  --max-concurrency 10 `
  --task-timeout-seconds 180 `
  --proxy-file "E:\Download\proxyscrape_premium_http_proxies (4).txt"
```

Tao artifact review tong hop:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
$env:PYTHONPATH=(Resolve-Path ai_workflow_benchmarks/src).Path
python -m local_ai_benchmark.review_outputs `
  --track-run "E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\track_recommendation\run_20260706T194602Z" `
  --llm-run "E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_llm_steering\run_20260706T190216Z" `
  --output-dir "E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\final_ai_workflow_review\run_20260706T194602Z_track__20260706T190216Z_llm"
```

## 3. Dataset dau vao

### 3.1. Dataset cho track recommendation

Track recommendation dung submission that da co trong benchmark dataset:

```text
E:\HCMUS\Graduate-Project\Benchmarks\dataset
```

Cac nguon dau vao chinh:

| Artifact | Vai tro |
| --- | --- |
| `conference_dataset.json` | Chua context cua hoi nghi: ten, acronym, nam, mo ta, CFP text, track/topic neu co. |
| `submission_data.jsonl` | Danh sach submission/paper duoc lay tu cac hoi nghi trong dataset. |
| PDF cached theo paper | File goc de Submission Autofill doc va trich xuat metadata. |
| Extracted metadata cached | Dung de tham khao va giam fetch lai khi co san. |

Moi test case cho track recommendation can co toi thieu:

- `case_id`: ma benchmark case.
- `conference_id`: hoi nghi dang hoat dong.
- `paper_id`: paper can nop.
- `paper_pdf`: file PDF goc.
- `conference_context`: thong tin hoi nghi dang hoat dong.
- `available_tracks`: danh sach track hop le ma workflow duoc phep de xuat.

Danh sach `available_tracks` duoc trich xuat tu CFP hoac tu domain/topic list cua hoi nghi. Benchmark co buoc loc cac item khong phai track, vi CFP thuong chua lich su kien, deadline, dia diem, ngay thang, hoac noi dung huong dan. Neu khong loc, workflow co the goi y cac chuoi nhu "2-4 August: Main conference", lam sai metric invalid track rate va khong phan anh dung bai toan.

### 3.2. Dataset cho Submission Gating rule check

Rule check khong dung submission that lam ground truth chinh, vi muc tieu la kiem tra deterministic rule co hoat dong dung hay khong. Benchmark tao seed fixture cuc bo, moi fixture duoc thiet ke de kich hoat mot hoac mot nhom rule cu the.

Tap case seed gom 8 case:

| Case | Muc tieu |
| --- | --- |
| `valid_baseline` | Paper hop le, khong bi block. |
| `min_references_block` | Thieu so luong references toi thieu, ky vong block theo rule reference. |
| `required_sections_block` | Thieu section bat buoc, ky vong block theo rule section. |
| `banned_phrases_block` | Chua phrase bi cam, ky vong block theo rule policy. |
| `unsupported_format_block` | File khong phai PDF hop le, ky vong block o binary/document integrity. |
| `unreadable_pdf_block` | PDF hong/khong doc duoc, ky vong block o extraction integrity. |
| `required_sections_pass` | Co du required sections, xac nhan rule khong false positive. |
| `maximum_pages_warn` | Vuot nguong page warning neu policy chi yeu cau canh bao, khong tao sai blocking verdict. |

LLM steering bi tat trong benchmark rules bang cach de `prompt_fragments=[]`. Neu khong tat, benchmark deterministic se bi nhieu boi output cua LLM va khong the quy loi sai ve rule nao.

### 3.3. Dataset cho Submission Gating LLM steering

LLM steering dung 24 submission that tu dataset, moi submission co PDF goc va metadata hoi nghi. Khac voi rule check, benchmark nay khong tao paper gia lap, vi muc tieu la xem LLM co phat hien cac van de noi dung thuc te theo yeu cau cua chair hay khong.

Moi case co them mot steering prompt rieng, dong vai tro nhu input cua chair truoc khi mo cong nop bai. Steering prompt mo ta ky vong noi dung cua hoi nghi, nhung viet theo ngon ngu business/reviewer, khong dua ra chi dan ky thuat cho model.

Bon nhom steering duoc bao phu:

| Nhom steering | So case | Dieu can danh gia |
| --- | ---: | --- |
| `readiness_and_limitations` | 6 | Paper co neu ro limitation, assumption, threat to validity, hoac dieu kien ap dung khong. |
| `evidence_quality` | 6 | Paper co bang chung thuc nghiem, baseline, metric, hoac lap luan du manh khong. |
| `conference_fit` | 6 | Paper co phu hop voi scope va muc tieu cua hoi nghi/track khong. |
| `general_submission_readiness` | 6 | Paper co san sang de nop ve mat noi dung, ro rang, day du, khong thieu thong tin quan trong khong. |

Trong LLM steering benchmark, deterministic rules duoc neutralize toi muc toi thieu, ngoai tru binary integrity va document extraction integrity. Dieu nay can thiet vi benchmark gia dinh submission da qua cac rule format co ban; phan con lai la danh gia noi dung ma rule khong the bat bang thuat toan.

## 4. Benchmark track recommendation trong Submission Autofill

### 4.1. Cau truc input

Moi case goi Submission Autofill voi cac thanh phan:

```text
{
  "conference": {
    "id": "...",
    "name": "...",
    "acronym": "...",
    "description": "...",
    "cfp_text": "...",
    "available_tracks": ["...", "..."]
  },
  "submission": {
    "paper_id": "...",
    "pdf_file": "...",
    "known_title": "...",
    "known_abstract": "...",
    "known_keywords": ["...", "..."]
  }
}
```

Trong san pham, Submission Autofill khong chi nhan text metadata co san. Workflow phai doc PDF, trich xuat title, authors, abstract, keywords va cac metadata lien quan; sau do dung noi dung do cung voi context hoi nghi de xep hang track. Vi vay benchmark khong nen chi dua abstract vao model, vi lam vay se bo qua loi extraction va bo qua hanh vi tich hop cua workflow.

### 4.2. Output can thu thap

Moi response can duoc luu o hai lop:

- Raw response: giu nguyen output cua workflow de audit loi parser, loi schema, loi runtime.
- Normalized prediction: chuan hoa thanh cac cot review on dinh.

Voi track recommendation, normalized output can co:

| Truong | Y nghia |
| --- | --- |
| `case_id` | Ma case benchmark. |
| `conference_id` | Hoi nghi active. |
| `paper_id` | Paper can danh gia. |
| `paper_title` | Tieu de paper sau extraction hoac metadata cache. |
| `available_tracks` | Danh sach track hop le. |
| `rank_1_track` | Track top 1 workflow de xuat. |
| `rank_1_confidence` | Confidence neu workflow tra ve. |
| `rank_1_rationale` | Ly do cua top 1. |
| `top_3_tracks` | Ba track dau tien sau khi chuan hoa. |
| `invalid_tracks` | Track khong nam trong `available_tracks`. |
| `duplicate_tracks` | Track bi lap trong ranking. |
| `review_decision` | Ket qua review thu cong: strong/plausible/weak/reject. |
| `review_note` | Ly do reviewer chap nhan hoac nghi ngo. |

### 4.3. Metric

Vi dataset hien tai khong co ground truth track chinh thuc cho tung paper, benchmark khong duoc goi metric nay la accuracy theo nghia supervised. Cac metric hop le la:

| Metric | Cong thuc/dien giai | Ly do su dung |
| --- | --- | --- |
| Completion rate | `completed_count / case_count` | Do on dinh runtime. |
| Invalid track rate | So track ngoai danh sach hop le / tong so track duoc de xuat | Kiem tra workflow co ton trong option cua hoi nghi khong. |
| Duplicate track rate | So ranking co track lap / tong case | Kiem tra chat luong ranking. |
| Strong Top-1 plausible rate | So case top 1 duoc reviewer danh gia strong / tong case | Uoc luong muc do phu hop cao. |
| Top-1 plausible rate | So case top 1 duoc reviewer chap nhan / tong case | Uoc luong muc do co the dung duoc. |
| Top-3 acceptable rate | So case co it nhat mot track chap nhan duoc trong top 3 / tong case | Phu hop voi UX neu user co the chon lai track. |

Neu sau nay co ground truth track tu conference management system, co the bo sung Top-1 accuracy, Top-3 accuracy, MRR va NDCG@K. Trong benchmark hien tai, dung cac metric do se tao cam giac chinh xac gia vi khong co label tin cay.

### 4.4. Ket qua run da review

Run cuoi cung:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\track_recommendation\run_20260706T194602Z
```

Ket qua tong hop:

| Chi so | Gia tri |
| --- | ---: |
| So case | 48 |
| Completed | 48 |
| Failed | 0 |
| Invalid track rate | 0.0 |
| Strong Top-1 plausible | 45/48 = 93.8% |
| Top-1 plausible | 47/48 = 97.9% |
| Top-3 acceptable | 48/48 = 100.0% |

Case can chu y:

| Case | Van de |
| --- | --- |
| `trackrec_0004` | Top-1 yeu/low confidence, can review khi dua vao bao cao. |
| `trackrec_0015` | Khong duoc xep strong, nhung van co the chap nhan tuy ngu canh. |
| `trackrec_0044` | Khong duoc xep strong, can ghi la case bien. |

Dien giai bao cao nen than trong: workflow cho ket qua de xuat track on dinh va khong tao invalid track trong 48 case, nhung con so 97.9% la reviewer plausibility, khong phai accuracy co ground truth.

## 5. Benchmark Submission Gating - deterministic rules

### 5.1. Muc tieu

Rule benchmark kiem tra cac dieu kien co the xac dinh bang thuat toan:

- File co phai PDF hop le khong.
- PDF co doc duoc khong.
- Paper co du section bat buoc khong.
- Paper co dat so references toi thieu khong.
- Paper co chua phrase bi cam khong.
- Paper co vi pham nguong format/page policy khong.

Day la nhom rule co the tao blocking verdict vi:

- Dau vao va dau ra co the tai lap.
- Rule co the giai thich bang dieu kien cu the.
- Author co the sua truc tiep.
- Ket qua khong phu thuoc vao danh gia mo ho cua LLM.

### 5.2. Cau truc input

Moi fixture gom:

```text
{
  "case_id": "...",
  "file_mode": "generated_pdf | unsupported_text | invalid_pdf",
  "paper_content": "...",
  "policy": {
    "required_sections": ["Abstract", "Introduction", "Conclusion"],
    "min_references": 8,
    "banned_phrases": ["..."],
    "max_pages": 8
  },
  "expected": {
    "verdict": "pass | warning | desk_reject",
    "blocking_rule_ids": ["..."]
  }
}
```

Fixture PDF duoc sinh local de kiem soat noi dung. Cac case file hong hoac unsupported format khong can paper that, vi muc tieu la validate boundary behavior cua upload/document extraction.

### 5.3. Output can thu thap

Normalized rule output can co:

| Truong | Y nghia |
| --- | --- |
| `case_id` | Ma fixture. |
| `expected_verdict` | Verdict mong doi. |
| `actual_verdict` | Verdict workflow tra ve. |
| `expected_rule_ids` | Rule id ky vong bi kich hoat. |
| `actual_rule_ids` | Rule id workflow kich hoat. |
| `missing_rule_ids` | Rule ky vong nhung khong xuat hien. |
| `unexpected_rule_ids` | Rule xuat hien ngoai ky vong. |
| `false_block` | Co block khi expected khong block. |
| `false_pass` | Pass khi expected block. |
| `review_note` | Ghi chu de doc lai loi neu co. |

### 5.4. Metric

| Metric | Dien giai |
| --- | --- |
| Blocking verdict accuracy | Ty le case co verdict dung voi expected. |
| Rule id recall | Ty le expected blocking/warning rule duoc kich hoat. |
| False block count | So case bi block sai. |
| False pass count | So case dang le block nhung pass. |
| Runtime failure count | So case loi runner, parser, extractor hoac schema. |

Voi deterministic rules, metric phai dat gan 100% truoc khi dung de benchmark tiep. Neu rule check sai, cac benchmark LLM steering va track recommendation van co the chay, nhung bao cao ve gating se khong dang tin vi pipeline co loi nen tang.

### 5.5. Ket qua run da review

Run cuoi cung:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_rule_check\run_20260706T185930Z
```

Ket qua:

| Chi so | Gia tri |
| --- | ---: |
| So case | 8 |
| Completed | 8 |
| Failed | 0 |
| Correct verdict | 8 |
| Correct rules | 8 |
| False block | 0 |
| Blocking verdict accuracy | 1.0 |
| Rule id recall | 1.0 |

Ket qua nay cho thay runner va cac rule deterministic da du on dinh de dung lam lop gating co quyen block. Tuy nhien, vi fixture hien tai chi bao phu cac rule chinh, khong nen dien giai thanh bao dam toan bo format compliance cua moi template paper. Neu can claim rong hon, can them fixture ve font size, margin, paper size va column count.

## 6. Benchmark Submission Gating - LLM steering

### 6.1. Muc tieu

LLM steering benchmark danh gia kha nang workflow dua ra feedback noi dung theo yeu cau cua chair. Day la nhom van de ma deterministic rules khong the bat tot, vi chung can doc y nghia cua paper:

- Paper co lech scope hoi nghi khong.
- Evidence co du de support claim khong.
- Limitation co du ro khong.
- Noi dung co san sang de author nop chinh thuc khong.
- Paper co thieu thong tin quan trong ma rule format khong phat hien duoc khong.

LLM steering khong duoc tao blocking verdict. Neu LLM thay co van de, output dung phai la advisory finding: noi ro van de, vi sao quan trong, va author nen xem lai diem nao. Quyen reject hoac block chi nam o deterministic rule hoac quyet dinh con nguoi.

### 6.2. Cau truc input

Moi case gom:

```text
{
  "case_id": "...",
  "paper_id": "...",
  "conference_id": "...",
  "paper_pdf": "...",
  "conference_context": {
    "name": "...",
    "scope": "...",
    "tracks": ["...", "..."]
  },
  "chair_steering": {
    "focus": "conference_fit | evidence_quality | readiness_and_limitations | general_submission_readiness",
    "instruction": "..."
  },
  "policy": {
    "deterministic_rules": "neutralized_except_document_integrity"
  }
}
```

Steering prompt phai viet nhu chair dang dua ra yeu cau noi dung cho cong nop bai. Prompt khong nen noi ve model, token, pipeline, embedding, hay cach he thong suy luan. Ly do la prompt san pham can giong input nghiep vu that, de ket qua benchmark dai dien cho cach chair su dung chuc nang.

### 6.3. Output can thu thap

Normalized LLM steering output can co:

| Truong | Y nghia |
| --- | --- |
| `case_id` | Ma case benchmark. |
| `paper_title` | Tieu de paper. |
| `conference_id` | Hoi nghi active. |
| `focus` | Nhom steering duoc test. |
| `chair_instruction` | Yeu cau noi dung cua chair. |
| `finding_severity` | `pass`, `warning`, hoac severity advisory tu workflow. |
| `finding_summary` | Tom tat van de hoac ly do pass. |
| `evidence` | Doan bang chung/ly do workflow dua ra. |
| `actionability` | Reviewer danh gia feedback co giup author sua bai khong. |
| `groundedness` | Reviewer danh gia finding co bam vao paper/context khong. |
| `llm_block_violation` | Co vi pham contract khong: LLM tu tao blocking verdict. |
| `manual_review_decision` | Accepted / caution / rejected. |
| `review_note` | Ghi chu cua reviewer. |

### 6.4. Rubric review

LLM steering khong nen duoc danh gia bang exact match. Thay vao do, moi finding duoc review theo rubric:

| Tieu chi | Dat | Khong dat |
| --- | --- | --- |
| Groundedness | Nhan xet co lien he ro voi noi dung paper hoac scope hoi nghi. | Nhan xet chung chung, khong chung minh duoc da doc paper. |
| Actionability | Author biet can sua/kiem tra diem nao. | Feedback mo ho, khong tao hanh dong. |
| Severity appropriateness | Warning/pass phu hop voi muc do van de. | Phong dai rui ro hoac bo qua van de ro rang. |
| Chair alignment | Nhan xet bam vao steering instruction. | Tra loi lech sang yeu cau khac. |
| Contract compliance | Khong tao blocking verdict. | LLM tu de xuat reject/block nhu mot quyet dinh he thong. |

### 6.5. Ket qua run da review

Run cuoi cung:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_llm_steering\run_20260706T190216Z
```

Ket qua:

| Chi so | Gia tri |
| --- | ---: |
| So case | 24 |
| Completed | 24 |
| Failed | 0 |
| Review rows | 26 |
| Warning findings | 14 |
| Usable warnings | 14 |
| No-content-issue cases | 6 |
| Positive pass checks | 6 |
| Needs manual caution | 0 |
| LLM block contract violation | 0 |
| Grounded rate tren non-empty findings | 1.0 |
| Actionable rate tren warnings | 1.0 |
| Severity OK rate | 1.0 |

Ket qua nay co the duoc dien giai la workflow LLM steering da tao feedback co the review va co tinh hanh dong trong tap test hien tai, dong thoi tuan thu contract quan trong: LLM khong tao blocking verdict. Tuy nhien, day van la benchmark reviewer-assessed, khong phai ground truth doc lap tu program committee.

## 7. Artifact dau ra

### 7.1. Artifact cua track recommendation

Run:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\track_recommendation\run_20260706T194602Z
```

Can co:

| File | Noi dung |
| --- | --- |
| `raw_responses.jsonl` | Output workflow nguyen ban theo tung case. |
| `normalized_predictions.jsonl` | Output da chuan hoa cho metric va review. |
| `human_review.csv` | Bang review thu cong top track, rationale va note. |
| `summary_metrics.json` | Metric tong hop. |
| `audit_report.json` | Ket qua audit script: pass/fail, loi schema, loi runtime. |

### 7.2. Artifact cua Submission Gating rules

Run:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_rule_check\run_20260706T185930Z
```

Can co:

| File | Noi dung |
| --- | --- |
| `raw_responses.jsonl` | Output workflow nguyen ban. |
| `normalized_rule_findings.jsonl` | Verdict/rule ids da chuan hoa. |
| `rule_review.csv` | Bang so sanh expected vs actual cho tung fixture. |
| `summary_metrics.json` | Accuracy, recall, false block, failure count. |
| `audit_report.json` | Trang thai audit cua run. |

### 7.3. Artifact cua Submission Gating LLM steering

Run:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_llm_steering\run_20260706T190216Z
```

Can co:

| File | Noi dung |
| --- | --- |
| `raw_responses.jsonl` | Output workflow nguyen ban. |
| `normalized_content_findings.jsonl` | Finding da chuan hoa theo case/focus. |
| `llm_steering_review.csv` | Bang review thu cong groundedness, actionability, severity va contract. |
| `summary_metrics.json` | Metric tong hop cua LLM steering. |
| `audit_report.json` | Ket qua audit run. |

### 7.4. Artifact review tong hop

Run review tong hop:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\final_ai_workflow_review\run_20260706T194602Z_track__20260706T190216Z_llm
```

Can co:

| File | Noi dung |
| --- | --- |
| `reviewed_track_recommendation.csv` | Bang review 48 case track recommendation. |
| `reviewed_llm_steering.csv` | Bang review 26 finding/case LLM steering. |
| `final_review_metrics.json` | Metric tong hop da tinh sau review. |
| `failure_and_limitation_cases.md` | Cac case yeu, caveat va gioi han dien giai. |
| `report_ready_ai_workflow_evaluation.md` | Ban tom tat ket qua co the dua vao report. |

## 8. Dien giai ket qua cho bao cao

### 8.1. Track recommendation

Ket qua nen duoc viet theo huong:

> Benchmark tren 48 submission that cho thay Submission Autofill co the tao ranking track hop le voi invalid track rate bang 0.0. Reviewer danh gia 45/48 case co Top-1 recommendation manh, 47/48 case co Top-1 recommendation chap nhan duoc, va 48/48 case co it nhat mot track phu hop trong Top-3. Do dataset chua co ground truth track chinh thuc cho tung paper, cac chi so nay phan anh muc do hop ly duoi review thu cong, khong duoc dien giai la accuracy supervised.

Diem quan trong can nhan manh:

- Workflow ton trong danh sach track hop le cua hoi nghi.
- Ket qua Top-3 phu hop voi UX vi author van co buoc review/chon lai.
- Can giu caveat ve ground truth.

### 8.2. Submission Gating rules

Ket qua nen duoc viet theo huong:

> Benchmark deterministic rules tren 8 fixture co ground truth cho thay workflow tra ve dung verdict va dung rule id trong tat ca case. Ket qua nay ung ho viec dung rule deterministic lam lop gating co quyen block, vi cac rule nay co the tai lap, giai thich va kiem tra bang case duoc seed.

Diem quan trong:

- Rule check la lop co quyen block.
- Fixture hien tai bao phu rule chinh, khong phai moi bien the format cua moi template paper.
- Neu claim ve format compliance nang cao, can them fixture rieng cho layout.

### 8.3. Submission Gating LLM steering

Ket qua nen duoc viet theo huong:

> Benchmark LLM steering tren 24 submission that cho thay workflow tao duoc feedback noi dung co tinh hanh dong va bam vao steering instruction cua chair. Tat ca warning finding trong tap test duoc danh gia la usable, groundedness tren non-empty findings dat 1.0, va khong co case nao LLM vi pham contract bang cach tao blocking verdict. Dieu nay phu hop voi vai tro thiet ke cua LLM steering: ho tro author phat hien rui ro noi dung truoc khi nop, khong thay the deterministic rule hay quyet dinh reject cua con nguoi.

Diem quan trong:

- LLM steering la advisory, khong phai desk reject automation.
- Ket qua phu hop de viet ve kha nang ho tro chair/author.
- Khong nen claim LLM co do chinh xac reject cao, vi benchmark khong duoc thiet ke cho quyet dinh reject.

## 9. Gioi han va rui ro can cong bo

Benchmark co cac gioi han sau:

1. **Track recommendation chua co ground truth chinh thuc**: ket qua la reviewer plausibility. Neu co label track that tu he thong nop bai, can chay lai voi Top-1 accuracy, Top-3 accuracy, MRR va NDCG@K.
2. **So luong case con nho**: 48 track cases va 24 LLM steering cases du de review thu cong chat luong, nhung chua du de ket luan thong ke manh tren moi domain hoi nghi.
3. **Rule fixtures bao phu rule chinh, khong bao phu moi bien the layout**: neu bao cao muon claim ve IEEE format compliance sau hon, can them case font size, margin, paper size, column count va bibliography edge cases.
4. **LLM steering phu thuoc vao steering prompt**: ket qua tot voi tap prompt da review khong dam bao moi chair prompt ngoai doi se cho output tuong duong.
5. **Review thu cong co tinh chu quan**: rubric lam giam chu quan, nhung chua thay the double-blind independent annotation.
6. **Network va provider co the anh huong reproducibility**: model, base URL, timeout va cached PDF can duoc ghi vao manifest moi run.

## 10. Dieu kien de xem benchmark la review-ready

Mot run benchmark chi nen duoc dua vao bao cao neu dat tat ca dieu kien:

- Tat ca workflow hoan thanh voi `failed_count = 0`.
- Track recommendation co `invalid_track_rate = 0.0` hoac moi invalid case duoc giai thich ro.
- Rule check khong co false pass va khong co false block.
- LLM steering khong co `llm_block_contract_violation`.
- Moi output deu co raw response va normalized review artifact.
- Cac case yeu duoc liet ke trong `failure_and_limitation_cases.md`.
- Report-ready summary khong dien giai reviewer plausibility thanh ground truth accuracy.

Theo cac run da review, tap artifact hien tai dat dieu kien review-ready cho muc tieu bao cao: chung minh workflow da chay end-to-end, co output de review thu cong, va co bang chung du de dua ra nhan dinh can trong ve chat luong cua track recommendation va Submission Gating.
