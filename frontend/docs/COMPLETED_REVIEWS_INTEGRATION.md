# Completed Reviews Page - Backend Integration Guide

## Overview

The "Completed Reviews" page has been implemented for the reviewer role. Currently, it uses mock data, but the code is structured to easily integrate with the backend API once it's available.

## Files Created/Modified

### New Files
1. **`frontend/components/reviewer/completed-reviews.tsx`** - Main component for displaying completed reviews
2. **`frontend/hooks/use-completed-reviews.ts`** - SWR hook for fetching completed reviews data
3. **`frontend/docs/COMPLETED_REVIEWS_INTEGRATION.md`** - This documentation file

### Modified Files
1. **`frontend/components/reviewer/reviewer-sidebar.tsx`** - Added "Completed Reviews" navigation button
2. **`frontend/components/reviewer/reviewer-dashboard.tsx`** - Integrated completed reviews view
3. **`frontend/locales/en.json`** - Added English translations
4. **`frontend/locales/vi.json`** - Added Vietnamese translations

## Current Implementation

### Mock Data Structure
The component currently displays mock data with the following structure:

```typescript
interface AssignedPaper {
  id: string
  title: string
  abstract: string
  keywords: string[]
  authors: any[]
  conference_id: string
  track_id: string
  status: string
  submitted_at: string
  updated_at: string
  file_url?: string
  version: number
  reviews: any[]
  assignment_status: string  // "completed" for finished reviews
  due_date?: string
  assigned_at: string
  assignment_id: number
}
```

### Features Implemented
- ✅ Display list of completed reviews with paper details
- ✅ Statistics cards (total completed, conferences, this month)
- ✅ Search by title or keywords
- ✅ Filter by conference
- ✅ Sort by date or title
- ✅ Responsive design with card layout
- ✅ Click to view individual review details
- ✅ Infinite scroll support (ready for pagination)
- ✅ Loading states and empty states
- ✅ Bilingual support (English/Vietnamese)

## Backend Integration Steps

### Step 1: Create Backend Endpoint

Create a new endpoint in the backend to fetch completed reviews:

**Endpoint:** `GET /api/v1/reviewer/:reviewerId/completed-reviews`

**Query Parameters:**
- `limit` (optional, default: 20) - Number of results per page
- `offset` (optional, default: 0) - Pagination offset
- `search` (optional) - Search by title or keywords
- `conference_id` (optional) - Filter by conference

**Expected Response:**
```json
{
  "data": {
    "reviews": [
      {
        "id": "1",
        "title": "Paper Title",
        "abstract": "Paper abstract...",
        "keywords": ["keyword1", "keyword2"],
        "authors": [...],
        "conference_id": "1",
        "track_id": "ml",
        "status": "under_review",
        "submitted_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-02-20T14:30:00Z",
        "version": 2,
        "reviews": [...],
        "assignment_status": "completed",
        "assigned_at": "2024-01-20T09:00:00Z",
        "assignment_id": 1
      }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

### Step 2: Update the Hook

Replace the mock fetcher in `frontend/hooks/use-completed-reviews.ts`:

```typescript
import { apiFetch } from "@/lib/api/client"

const fetcher = async () => {
  if (!reviewerId) return []
  
  const queryParams = new URLSearchParams()
  if (options.limit) queryParams.append("limit", options.limit.toString())
  if (options.offset) queryParams.append("offset", options.offset.toString())
  
  const queryString = queryParams.toString()
  const url = `/api/v1/reviewer/${reviewerId}/completed-reviews${queryString ? `?${queryString}` : ""}`
  
  try {
    const { data } = await apiFetch<{ data: { reviews: AssignedPaper[]; total: number } }>(url)
    return data.data.reviews
  } catch (error: any) {
    console.error("Failed to fetch completed reviews:", error)
    return []
  }
}

const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
  ...swrConfig,
  dedupingInterval: 300000,
})
```

### Step 3: Add Pagination Support (Optional)

If you want to implement infinite scroll with real pagination:

1. Update the hook to return total count:
```typescript
return {
  reviews: data?.reviews || [],
  total: data?.total || 0,
  isLoading,
  error: error?.message || null,
  refresh: mutate,
}
```

2. Update the dashboard component to handle pagination:
```typescript
const [completedOffset, setCompletedOffset] = useState(0)

// In the completed-reviews case:
<CompletedReviews
  reviews={completedReviews}
  onSelectPaper={handleSelectPaper}
  onLoadMore={() => {
    if (!isLoadingCompleted) {
      setCompletedOffset((prev) => prev + 20)
    }
  }}
  hasMore={completedReviews.length < totalCompleted}
  isLoadingMore={isLoadingCompleted && completedOffset > 0}
/>
```

### Step 4: Backend Database Query

The backend should query for papers where:
- The reviewer has a completed review assignment
- Join with papers table to get paper details
- Filter by `assignment_status = 'completed'`

Example SQL (adjust for your schema):
```sql
SELECT 
  p.*,
  ra.id as assignment_id,
  ra.assigned_at,
  ra.status as assignment_status
FROM papers p
INNER JOIN review_assignments ra ON p.id = ra.paper_id
WHERE ra.reviewer_id = $1 
  AND ra.status = 'completed'
ORDER BY ra.updated_at DESC
LIMIT $2 OFFSET $3
```

## Testing

### Test with Mock Data
The page is already functional with mock data. Navigate to:
1. Login as a reviewer
2. Go to Reviewer Dashboard
3. Click "Completed Reviews" (Phản biện đã hoàn thành) in the sidebar
4. You should see 3 mock completed reviews

### Test with Real Backend
Once the backend endpoint is implemented:
1. Replace the mock fetcher in `use-completed-reviews.ts`
2. Ensure the backend returns data in the expected format
3. Test pagination, search, and filtering
4. Verify the "View Review" button navigates correctly

## Future Enhancements

Potential improvements for the future:
- Add export functionality (CSV/PDF)
- Add review quality metrics
- Add filtering by date range
- Add sorting by review score
- Add bulk actions
- Add review history timeline
- Add comparison with other reviewers' statistics

## Notes

- The component uses the existing `AssignedPaper` type from `@/lib/types`
- All UI components are from the existing design system
- The page follows the same patterns as other reviewer pages
- Translation keys follow the existing naming convention
- The code is fully typed with TypeScript
