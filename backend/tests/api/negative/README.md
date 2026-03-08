# Negative & Security API Tests

## Overview

Bộ test này tập trung vào việc kiểm tra các lỗ hổng bảo mật (RBAC), quy tắc nghiệp vụ (Deadline), và tính toàn vẹn dữ liệu của hệ thống ConferenceSpace. Mục tiêu là phát hiện các edge cases, negative scenarios, và security gaps mà happy path tests không cover được.

## Test Cases

### TC-NEG-01: Author Cannot Update Other Author's Submission
**Mục đích:** Kiểm tra phân quyền - Author không được phép sửa submission của Author khác.

**Expected:** HTTP 403 Forbidden

**Status:** ✅ PASS - Hệ thống đã implement đúng authorization check.

---

### TC-NEG-02: Reviewer Cannot Access Unassigned Paper
**Mục đích:** Kiểm tra phân quyền - Reviewer chỉ được xem và review các paper đã được assign cho họ.

**Expected:** HTTP 403/404 khi cố truy cập paper chưa được assign.

**Status:** ✅ PASS - Hệ thống chặn đúng unauthorized access.

---

### TC-NEG-03: Auto-Assign with Insufficient Reviewers Due to COI
**Mục đích:** Kiểm tra xử lý edge case - Auto-assign khi không đủ reviewer do COI conflicts.

**Expected:** Hệ thống xử lý gracefully, không crash, trả về thông tin về unassigned papers.

**Status:** ✅ PASS - Hệ thống xử lý tốt trường hợp thiếu reviewer.

---

### TC-NEG-04: Author Cannot Submit After Deadline
**Mục đích:** Kiểm tra business rule - Author không được phép publish submission sau deadline.

**Expected:** HTTP 400/403 khi cố publish sau `full_paper_submission_deadline`.

**Status:** ❌ FAIL - **BUG PHÁT HIỆN**: Hệ thống trả về 200/201, cho phép submit sau deadline.

---

### TC-NEG-05: Reviewer Cannot Submit Invalid Scoring
**Mục đích:** Kiểm tra validation - Reviewer không được submit review với điểm số không hợp lệ (âm, quá cao).

**Expected:** HTTP 400 Bad Request với validation error message.

**Status:** ✅ PASS - Backend validation hoạt động đúng.

---

### TC-SEC-06: Non-Chair Cannot Trigger Auto-Assign or View COI Dashboard
**Mục đích:** Kiểm tra RBAC - Chỉ Chair mới được trigger auto-assign và xem COI dashboard.

**Expected:** HTTP 403 Forbidden cho Author và Reviewer.

**Status:** ❌ FAIL - **BUG BẢO MẬT NGHIÊM TRỌNG**: Author và Reviewer có thể trigger auto-assign và xem COI dashboard (trả về 200).

---

## Cấu trúc Kỹ thuật

### StateBuilder Pattern
Tests sử dụng `StateBuilder` và các helper functions để setup test data nhanh chóng qua API:

```go
// Tạo conference với deadline trong quá khứ
conference := testutils.CreateConferenceWithDeadline(t, ctx, chairToken, pastDeadline)

// Tạo submission và reviewer
submission := testutils.CreateSubmission(t, ctx, authorToken, conferenceID)
reviewer := testutils.InviteAndAcceptReviewer(t, ctx, chairToken, conferenceID)
```

### TestContext & Assertions
Sử dụng `testutils.TestContext` để quản lý test state và `testutils` package để assert HTTP responses:

```go
ctx := testutils.NewTestContext(t)
resp := ctx.MakeRequest("PUT", url, body, token)
testutils.AssertStatusCode(t, resp, http.StatusForbidden)
```

## Hướng Dẫn Chạy Test

### Chạy toàn bộ negative tests:
```bash
cd backend
go test ./tests/api/negative -v
```

### Chạy một test case cụ thể:
```bash
go test ./tests/api/negative -v -run TestTC_NEG_01
go test ./tests/api/negative -v -run TestTC_SEC_06
```

### Chạy với timeout dài hơn (nếu cần):
```bash
go test ./tests/api/negative -v -timeout 5m
```

## Yêu Cầu

- Backend server phải đang chạy: `make dev` hoặc `make run`
- Database phải được setup và migrate
- Port 8080 phải available

## Lưu Ý Cho Developer

### ⚠️ Known Issues (Cần Fix)

**1. TC-NEG-04 FAIL - Deadline Bypass Bug**
- **Vấn đề:** Hệ thống không kiểm tra deadline khi Author publish submission
- **Impact:** Author có thể submit paper sau deadline, vi phạm quy tắc conference
- **Location:** `backend/internal/controller/submission/submission.go` - hàm `PublishSubmission`
- **Fix cần thiết:** Thêm logic kiểm tra `full_paper_submission_deadline` trước khi cho phép publish

**2. TC-SEC-06 FAIL - RBAC Security Gap**
- **Vấn đề:** Author và Reviewer có thể trigger auto-assign và xem COI dashboard
- **Impact:** Lỗ hổng bảo mật nghiêm trọng - unauthorized users có thể thao tác dữ liệu nhạy cảm
- **Location:** 
  - `backend/internal/controller/assignment/assignment.go` - endpoint auto-assign
  - `backend/internal/controller/coi/coi.go` - endpoint COI dashboard
- **Fix cần thiết:** Thêm middleware/check role `Chair` trước khi cho phép access

### ✅ Tests Đang Pass

Các test cases còn lại đang PASS, chứng tỏ hệ thống đã implement đúng:
- Authorization check cho submission updates
- Reviewer assignment access control
- COI handling trong auto-assign
- Input validation cho review scores

### Vai Trò Của QA/Tester

Là QA/Tester, chúng ta **KHÔNG sửa code của hệ thống**. Nhiệm vụ của chúng ta là:
1. ✅ Viết test cases để phát hiện bugs
2. ✅ Document rõ ràng các bugs tìm được
3. ✅ Cung cấp reproduction steps
4. ❌ KHÔNG fix application code

Các bugs đã được document trong file này cần được Backend Developer xử lý.

## Test Coverage

Bộ test này cover các scenarios:
- ✅ Authorization & RBAC
- ✅ Business Rules (Deadlines)
- ✅ Data Integrity (Cross-user access)
- ✅ Input Validation
- ✅ Edge Cases (COI conflicts)
- ✅ Error Handling

## Kết Quả Mong Đợi

Sau khi Backend Developer fix các bugs đã phát hiện, tất cả 6 test cases nên PASS:

```
=== RUN   TestTC_NEG_01_AuthorCannotUpdateOtherAuthorSubmission
--- PASS: TestTC_NEG_01_AuthorCannotUpdateOtherAuthorSubmission (0.51s)

=== RUN   TestTC_NEG_02_ReviewerCannotAccessUnassignedPaper
--- PASS: TestTC_NEG_02_ReviewerCannotAccessUnassignedPaper (0.81s)

=== RUN   TestTC_NEG_03_AutoAssignInsufficientReviewersDueToCOI
--- PASS: TestTC_NEG_03_AutoAssignInsufficientReviewersDueToCOI (0.88s)

=== RUN   TestTC_NEG_04_AuthorCannotSubmitAfterDeadline
--- PASS: TestTC_NEG_04_AuthorCannotSubmitAfterDeadline (0.54s)  ← Cần fix

=== RUN   TestTC_NEG_05_ReviewerCannotSubmitInvalidScoring
--- PASS: TestTC_NEG_05_ReviewerCannotSubmitInvalidScoring (0.58s)

=== RUN   TestTC_SEC_06_NonChairCannotTriggerAutoAssignOrViewCOIDashboard
--- PASS: TestTC_SEC_06_NonChairCannotTriggerAutoAssignOrViewCOIDashboard (0.60s)  ← Cần fix
```
