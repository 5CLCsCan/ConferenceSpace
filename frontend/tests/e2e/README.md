# End-to-End (E2E) UI Tests

## Overview

Bộ End-to-End (E2E) UI Tests sử dụng Playwright để kiểm tra trải nghiệm người dùng đối với các ràng buộc bảo mật và nghiệp vụ. Tests này đảm bảo rằng UI không chỉ gọi API đúng, mà còn hiển thị/ẩn các thành phần giao diện phù hợp với quyền hạn và trạng thái của người dùng.

## Phạm Vi Kiểm Thử

### 1. RBAC (Role-Based Access Control)

- Kiểm tra ẩn/hiện các thành phần giao diện dựa trên Role
- Verify các nút/menu chỉ hiển thị cho đúng user role
- Kiểm tra redirect khi user cố truy cập URL không có quyền

### 2. Business Rules (Deadline Enforcement)

- Kiểm tra việc vô hiệu hóa (disable) tính năng nộp bài khi quá hạn Deadline
- Verify hiển thị warning message khi deadline đã qua
- Đảm bảo UX rõ ràng về trạng thái submission

### 3. Frontend Validation

- Kiểm tra Validation trực tiếp trên Form (Frontend Validation)
- Verify error messages hiển thị ngay khi nhập dữ liệu không hợp lệ
- Đảm bảo submit button bị disable khi form invalid

## Test Cases

### [UI-SEC-01] Author and Reviewer Cannot Access Chair-Only Features

**Mục đích:** Kiểm tra RBAC trên UI - Author và Reviewer không được thấy/truy cập tính năng của Chair.

**Test Steps:**

1. Login với role Author
2. Verify nút "Auto-assign" không hiển thị
3. Verify link "COI Dashboard" không hiển thị
4. Cố truy cập trực tiếp `/chair/dashboard` → phải bị redirect hoặc hiển thị "Access Denied"
5. Lặp lại với role Reviewer

**Expected Result:**

- Các nút/menu Chair-only không visible
- Direct URL access bị chặn với redirect hoặc error page

**Status:** ❌ FAIL - **UI Security Gap**: Buttons vẫn hiển thị hoặc không redirect đúng.

---

### [UI-NEG-02] Submit Button Disabled After Deadline

**Mục đích:** Kiểm tra UI enforcement của deadline - nút Submit phải bị disable sau deadline.

**Test Steps:**

1. Tạo conference với deadline trong quá khứ
2. Login với role Author
3. Truy cập trang submission
4. Verify nút "Submit/Publish" bị disabled hoặc không hiển thị
5. Verify có warning message về deadline

**Expected Result:**

- Submit button disabled hoặc hidden
- Warning message rõ ràng về deadline đã qua

**Status:** ❌ FAIL/TIMEOUT - UI không enforce deadline đúng cách.

---

### [UI-NEG-03] Frontend Validation for Invalid Review Scores

**Mục đích:** Kiểm tra frontend validation - form phải validate điểm số trước khi submit.

**Test Steps:**

1. Login với role Reviewer
2. Truy cập form chấm điểm
3. Nhập điểm số âm (-1) → verify error message hiển thị
4. Nhập điểm số quá cao (100) → verify error message hiển thị
5. Verify submit button bị disabled khi có lỗi
6. Nhập điểm hợp lệ (4) → verify error message biến mất

**Expected Result:**

- Error messages hiển thị ngay khi blur khỏi input
- Submit button disabled khi form invalid
- Validation hoạt động client-side, không cần gọi API

**Status:** ✅ PASS - Frontend validation hoạt động đúng.

---

## Prerequisites (Yêu Cầu Chuẩn Bị)

### 1. Backend Server

Backend phải đang chạy tại `http://localhost:8080`:

```bash
cd backend
make dev
# hoặc
make run
```

### 2. Frontend Server

Frontend phải đang chạy tại `http://localhost:3000`:

```bash
cd frontend
npm run dev
```

### 3. Dependencies

Cài đặt Playwright và dependencies:

```bash
cd frontend
npm install
npx playwright install chromium
```

## Hướng Dẫn Chạy Test

### Chạy toàn bộ negative UI tests:

```bash
cd frontend
npx playwright test tests/e2e/negative-ui.spec.ts
```

### Chạy với UI mode (xem browser):

```bash
npx playwright test tests/e2e/negative-ui.spec.ts --headed
```

### Chạy một test case cụ thể:

```bash
npx playwright test tests/e2e/negative-ui.spec.ts -g "UI-SEC-01"
npx playwright test tests/e2e/negative-ui.spec.ts -g "UI-NEG-02"
npx playwright test tests/e2e/negative-ui.spec.ts -g "UI-NEG-03"
```

### Debug mode (step-by-step):

```bash
npx playwright test tests/e2e/negative-ui.spec.ts --debug
```

### Xem HTML report sau khi chạy:

```bash
npx playwright show-report
```

## Cấu Trúc Kỹ Thuật

### StateBuilder Pattern

Tests sử dụng `StateBuilder` để setup test data nhanh qua API:

```typescript
const state = await StateBuilder.create(request)
  .withUsers({ reviewerCount: 1, authorCount: 1 })
  .withConference()
  .buildPhase1()
```

### Test Login Helper

Sử dụng `/test/login` endpoint để login nhanh:

```typescript
await page.goto(`${FRONTEND_URL}/test/login?email=${author.email}`)
```

### Short Timeout Strategy

Tests sử dụng timeout ngắn (5s) để fail nhanh khi phát hiện security gap:

```typescript
const SHORT_TIMEOUT = 5000 // 5 seconds
const isVisible = await button.isVisible({ timeout: SHORT_TIMEOUT })
```

## Current Status (Tình Trạng Hiện Tại)

### ⚠️ Known Issues (Cần Fix)

**1. [UI-SEC-01] FAIL - RBAC Not Enforced in UI**

- **Vấn đề:**
  - Nút "Auto-assign" và "COI Dashboard" vẫn hiển thị cho Author/Reviewer
  - Hoặc: Không có redirect/access denied khi truy cập trực tiếp URL của Chair
- **Impact:** Lỗ hổng bảo mật UI - users có thể thấy và click vào tính năng không có quyền
- **Location:**
  - Frontend components: Conference detail page, Navigation menu
  - Routing: `/chair/dashboard`, `/coi-dashboard/:id`
- **Fix cần thiết:**
  - Thêm conditional rendering dựa trên user role
  - Implement route guards/middleware để redirect unauthorized access
  - Hiển thị "Access Denied" page thay vì cho phép render

**2. [UI-NEG-02] FAIL/TIMEOUT - Deadline Not Enforced in UI**

- **Vấn đề:**
  - Nút "Submit/Publish" vẫn enabled sau deadline
  - Hoặc: Không có warning message về deadline
- **Impact:** UX kém - user không biết deadline đã qua, có thể cố submit và bị reject
- **Location:**
  - Submission form component
  - Conference configuration display
- **Fix cần thiết:**
  - Check `full_paper_submission_deadline` trước khi render submit button
  - Disable button và hiển thị clear warning message
  - Có thể ẩn hoàn toàn form submission nếu deadline đã qua

### ✅ Tests Đang Pass

**[UI-NEG-03] PASS - Frontend Validation Working**

- Frontend validation cho review scores hoạt động tốt
- Error messages hiển thị đúng
- Submit button disabled khi form invalid

## Test Results Example

### Khi có bugs (hiện tại):

```
Running 3 tests using 1 worker

  ✓  [UI-NEG-03] Frontend validation for invalid review scores (5.2s)
  ✗  [UI-SEC-01] Author and Reviewer cannot access Chair-only features (timeout)
     Error: UI Security Gap: Auto-assign button is still visible for Author
  ✗  [UI-NEG-02] Submit button disabled after deadline (timeout)
     Error: UI Security Gap: Submit/Publish button is still enabled after deadline

  1 passed (5.2s)
  2 failed (35.4s)
```

### Sau khi fix (mong đợi):

```
Running 3 tests using 1 worker

  ✓  [UI-SEC-01] Author and Reviewer cannot access Chair-only features (3.8s)
  ✓  [UI-NEG-02] Submit button disabled after deadline (2.5s)
  ✓  [UI-NEG-03] Frontend validation for invalid review scores (5.2s)

  3 passed (11.5s)
```

## Lưu Ý Cho Developer

### Vai Trò Của QA/Tester

Là QA/Tester, chúng ta **KHÔNG sửa code của hệ thống**. Nhiệm vụ của chúng ta là:

1. ✅ Viết E2E tests để verify UX
2. ✅ Document rõ ràng các UI bugs/gaps
3. ✅ Cung cấp reproduction steps với screenshots
4. ❌ KHÔNG fix frontend components

### Debugging Tips

**Khi test fail, check:**

1. Backend có đang chạy không? (`http://localhost:8080`)
2. Frontend có đang chạy không? (`http://localhost:3000`)
3. Xem screenshot trong `test-results/` folder
4. Chạy với `--headed` để xem browser thực tế
5. Chạy với `--debug` để step through từng bước

**Common Issues:**

- `ECONNREFUSED`: Backend/Frontend chưa chạy
- `Timeout`: Element không tồn tại hoặc không visible trong 5s
- `UI Security Gap`: Element vẫn visible/enabled khi không nên

### Integration với CI/CD

Tests này có thể chạy trong CI/CD pipeline:

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E Tests
  run: |
    cd frontend
    npx playwright test tests/e2e/negative-ui.spec.ts
```

## Related Documentation

- Backend API Tests: `backend/tests/api/negative/README.md`
- Playwright Docs: https://playwright.dev
- StateBuilder Pattern: `frontend/tests/utils/state/state-builder.ts`
- Test Utils: `frontend/tests/utils/`

## Test Coverage Summary

| Category                | Coverage     |
| ----------------------- | ------------ |
| RBAC UI Enforcement     | ❌ Needs Fix |
| Deadline UI Enforcement | ❌ Needs Fix |
| Frontend Validation     | ✅ Working   |
| Error Messages          | ⚠️ Partial   |
| Route Guards            | ❌ Missing   |

**Overall Status:** 1/3 tests passing. Cần Frontend Developer fix RBAC và Deadline enforcement trên UI.
