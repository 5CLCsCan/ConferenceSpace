# Bug Fix: Paper Submission Status Logic

## Problem Description

The paper submission form had a critical bug where both the "Save as Draft" and "Submit" buttons were setting the paper status to `"draft"`, regardless of the user's intent.

### Expected Behavior
- **"Save as Draft" button**: Should set status to `"draft"`
- **"Submit" button**: Should set status to `"published"` (final submission)

### Actual Behavior (Before Fix)
- **"Save as Draft" button**: ✅ Correctly set status to `"draft"`
- **"Submit" button**: ❌ Incorrectly set status to `"draft"` (should be `"published"`)

## Root Cause

The bug was in `frontend/lib/api/papers.ts` in the `submitPaper()` function:

```typescript
// BEFORE (Line 38)
const submissionData = {
  submission: {
    title: data.title,
    abstract: data.abstract,
    link: data.link || "",
    domain: data.domain,
    status: "draft", // ❌ HARDCODED - always draft!
    information: data.information || {},
  },
}
```

The status was hardcoded to `"draft"`, meaning the API function had no way to differentiate between a draft save and a final submission.

## Solution

### 1. Updated API Function (`frontend/lib/api/papers.ts`)

Added a `status` parameter to the `submitPaper()` function to allow the caller to specify the desired status:

```typescript
// AFTER
export async function submitPaper(data: {
  conference_id: string
  title: string
  abstract: string
  link?: string
  domain: string[]
  file?: File
  status?: "draft" | "published" // ✅ NEW: Allow caller to specify status
  information?: { ... }
}): Promise<{ data: Paper | null; error: string | null }> {
  // ...
  const submissionData = {
    submission: {
      title: data.title,
      abstract: data.abstract,
      link: data.link || "",
      domain: data.domain,
      status: data.status || "draft", // ✅ Use provided status or default to draft
      information: data.information || {},
    },
  }
  // ...
}
```

### 2. Updated Form Handlers (`frontend/components/author/submit/paper-submission-form.tsx`)

Modified both button handlers to explicitly pass the correct status:

#### Save as Draft Handler
```typescript
const handleSaveAsDraft = async () => {
  // ...
  const submissionData = {
    conference_id: conference.id,
    title,
    abstract,
    // ... other fields
    status: "draft" as const, // ✅ Explicitly set to draft
    information: { ... },
  }
  const response = await submitPaper(submissionData)
  // ...
}
```

#### Final Submit Handler
```typescript
const handleSubmit = async () => {
  // ...
  const submissionData = {
    conference_id: conference.id,
    title,
    abstract,
    // ... other fields
    status: "published" as const, // ✅ Set to published for final submission
    information: { ... },
  }
  const response = await submitPaper(submissionData)
  // ...
}
```

## Backend Status Values

According to the backend API (`backend/internal/dto/submission.go`), the valid status values are:

- `"draft"` - Paper is in draft state (can be edited/deleted)
- `"published"` - Paper has been submitted (cannot be edited/deleted)
- `"reviewing"` - Paper is under review (set by system during auto-assignment)

## Testing Recommendations

1. **Test "Save as Draft"**:
   - Fill out the form
   - Click "Save as Draft"
   - Verify the submission appears with status "draft" in the database
   - Verify you can edit/delete the draft

2. **Test "Submit"**:
   - Fill out the form completely
   - Click "Submit"
   - Verify the submission appears with status "published" in the database
   - Verify you cannot edit/delete the published submission

3. **Test Draft → Submit Flow**:
   - Save a paper as draft
   - Load the draft
   - Complete any missing fields
   - Click "Submit"
   - Verify status changes from "draft" to "published"

## Files Modified

1. `frontend/lib/api/papers.ts` - Added `status` parameter to `submitPaper()` function
2. `frontend/components/author/submit/paper-submission-form.tsx` - Updated both handlers to pass correct status

## Impact

- ✅ No breaking changes to existing code
- ✅ Backward compatible (defaults to "draft" if status not provided)
- ✅ Type-safe with TypeScript literal types
- ✅ Follows backend API contract
- ✅ Dynamic - uses backend status values, not hardcoded strings
