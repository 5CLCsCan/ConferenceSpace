# Bug Log

## COI (Conflict of Interest) Data Not Being Saved

**Date:** 2025-01-XX  
**Status:** Known Issue - Temporarily Skipped

### Problem

The COI (Conflict of Interest) tab in the paper submission form collects three types of data:

- People (emails or full names)
- Organizations / Labs
- Email Domains

However, this data is **not being saved** when submitting or updating a paper submission.

### Root Cause

1. The frontend form collects COI data in three separate arrays: `coiPeople`, `coiOrgs`, `coiDomains`
2. The backend expects COI data in `information.declared_conflicts` as an array of `{email: string, reason: string}` objects
3. The submission handlers (`handleSubmit` and `handleSaveAsDraft`) in `paper-submission-form.tsx` do not include COI data in the `submissionData.information` object
4. The `submitPaper` and `updatePaper` API functions do not accept COI data parameters

### Impact

- Users can fill out COI information, but it is lost when the form is submitted
- COI data cannot be pre-filled when editing submissions
- Conflict detection system cannot use user-declared conflicts

### Solution Required

1. Map frontend COI arrays to backend `declared_conflicts` format:
   - Convert `coiPeople` array to `{email: person, reason: "User declared conflict"}`
   - Convert `coiOrgs` array to `{email: org, reason: "Organization conflict"}`
   - Convert `coiDomains` array to `{email: domain, reason: "Domain conflict"}` (or handle domains differently)
2. Include `declared_conflicts` in the `information` object when calling `submitPaper` and `updatePaper`
3. Update API function signatures to accept COI data
4. Implement reverse mapping when loading submissions for editing

### Related Files

- `frontend/components/author/submit/paper-submission-form.tsx` - Form handler
- `frontend/components/author/submit/coi-tab.tsx` - COI form UI
- `frontend/lib/api/papers.ts` - API functions
- `backend/internal/dto/submission.go` - Backend DTO structure
