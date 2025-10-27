# End-to-End (E2E) Tests

This directory contains end-to-end integration tests that verify complete workflows in the ConferenceSpace application.

## Overview

E2E tests simulate real user scenarios from start to finish, testing multiple components working together. They call the actual running server and verify the entire flow.

## Test Scenarios

### `TestCompleteConferenceWorkflow`

Tests the complete conference management workflow:

#### Step 1: Chair Creates Conference
- Conference chair registers and logs in
- Creates a new conference with details (title, acronym, domains, etc.)
- Verifies conference creation

#### Step 2: Authors Save Draft Papers
- Multiple authors register
- Each author creates draft paper submissions
- Papers are saved with metadata (title, abstract, keywords, etc.)

#### Step 3: Authors Submit Papers with COI
- Authors update their drafts to published status
- Declare Conflicts of Interest (COI) with potential reviewers
- COI declarations include email and reason (e.g., "Former advisor", "Same institution")

#### Step 4: Chair Invites Reviewers
- Chair invites multiple reviewers via batch invite
- Reviewers are assigned domains of expertise
- Verifies all reviewers are successfully invited

#### Step 5: Reviewers Accept Invitations
- Each invited reviewer logs in
- Reviewers update their status to "accepted"
- Confirms acceptance for all reviewers

#### Step 6: Auto-Assignment
- Chair triggers automatic reviewer assignment
- System assigns reviewers to papers based on:
  - Domain expertise matching
  - COI constraints (avoids conflicted reviewers)
  - Load balancing (distributes papers evenly)
- Verifies assignment statistics:
  - Total submissions
  - Total reviewers
  - Total assignments created
  - Average matching score
  - Reviewer load distribution

#### Step 7: Verification
- Verifies conference exists and is accessible
- Confirms all submissions are present
- Validates all reviewers are in "accepted" status
- Ensures workflow completed successfully

## Running E2E Tests

### Prerequisites

1. **Server must be running** on `http://localhost:8080`
2. **Database must be accessible**
3. **All API endpoints must be operational**

### Run the Tests

```bash
# Start your server first
make server

# In another terminal, run E2E tests
cd tests/api
go test -v ./e2e

# Or run specific test
go test -v -run TestCompleteConferenceWorkflow ./e2e
```

### With Make

```bash
# Run all E2E tests
make test-e2e
```

## Test Output

The test provides detailed logging of each step:

```
Step 1: Chair creates conference
✓ Conference created with ID: 1

Step 2: Authors save draft papers
✓ Author1 created draft paper (ID: 1): Advances in Deep Learning Architecture
✓ Author2 created draft paper (ID: 2): Transformer Models for NLP

Step 3: Authors submit papers with declared COI
✓ Author1 submitted paper with 2 COI declarations
✓ Author2 submitted paper with 1 COI declarations

Step 4: Chair invites reviewers
✓ Invited 3 reviewers successfully

Step 5: Reviewers accept invitations
✓ Reviewer1 (Carol Williams) accepted invitation
✓ Reviewer2 (David Brown) accepted invitation
✓ Reviewer3 (Emma Davis) accepted invitation

Step 6: Chair triggers auto-assignment of reviewers to papers
✓ Auto-assignment completed
  Total submissions: 2
  Total reviewers: 3
  Total assignments: 4
  Average score: 0.75
  Reviewer load distribution:
    Reviewer 4: 1 papers
    Reviewer 5: 2 papers
    Reviewer 6: 1 papers

Step 7: Verify workflow results
✓ Conference retrieved successfully
✓ Found 2 submissions in conference
✓ Found 3 accepted reviewers

✅ Complete conference workflow test passed!
```

## Key Features Tested

### ✅ Authentication & Authorization
- User registration and login
- JWT token generation and validation
- Role-based permissions (chair, author, reviewer)

### ✅ Conference Management
- Conference creation
- Conference data persistence
- Access control

### ✅ Submission Workflow
- Draft creation
- Status transitions (draft → published)
- Metadata management
- COI declarations

### ✅ Reviewer Management
- Batch invitation
- Status updates
- Domain expertise tracking

### ✅ Auto-Assignment Algorithm
- Domain matching
- COI constraint enforcement
- Load balancing
- Score calculation

## Data Flow

```
Chair → Create Conference
  ↓
Authors → Register → Create Drafts → Submit with COI
  ↓
Chair → Invite Reviewers
  ↓
Reviewers → Accept Invitations
  ↓
Chair → Trigger Auto-Assignment
  ↓
System → Match Reviewers to Papers (respecting COI)
```

## Test Data

### Users Created
- 1 Conference Chair
- 2 Paper Authors
- 3 Reviewers

### Conferences Created
- 1 AI Conference with complete details

### Submissions Created
- 2 Papers (from different authors)
- Each with COI declarations

### Reviewers Created
- 3 Reviewers with different expertise domains
- All accept invitations

### Assignments Created
- Variable (based on algorithm)
- Respects COI constraints
- Balanced distribution

## Customization

You can modify the test to:

### Change Number of Papers
```go
// Add more authors and papers
author3Token, author3, _ := ctx.RegisterAndLogin(...)
draftPaper3 := &dto.Submission{...}
```

### Change Reviewer Count
```go
// Add more reviewers to the batch invite
Reviewers: []dto.Reviewer{
    {UserID: reviewer1.ID, Domain: [...]},
    {UserID: reviewer2.ID, Domain: [...]},
    {UserID: reviewer3.ID, Domain: [...]},
    {UserID: reviewer4.ID, Domain: [...]}, // Add more
}
```

### Adjust Assignment Parameters
```go
autoAssignReq := &dto.AutoAssignRequest{
    MinReviewersPerPaper: 3,  // Require more reviewers per paper
    MaxReviewersPerPaper: 5,
    MinScoreThreshold:    0.5, // Higher matching threshold
    DryRun:               true, // Test without creating assignments
}
```

### Test Different COI Scenarios
```go
DeclaredConflicts: []dto.ConflictDeclaration{
    {Email: "...", Reason: "Co-author"},
    {Email: "...", Reason: "Same institution"},
    {Email: "...", Reason: "Former student"},
    {Email: "...", Reason: "Collaborator"},
}
```

## Debugging

### Enable Verbose Logging
```bash
go test -v ./e2e
```

### Run with Race Detector
```bash
go test -race -v ./e2e
```

### Check Server Logs
If a step fails, check the server logs to see what went wrong:
```bash
# In the terminal running the server
# Look for error messages or stack traces
```

### Test Individual Steps
You can comment out later steps to test up to a certain point:
```go
func TestCompleteConferenceWorkflow(t *testing.T) {
    // Step 1-3 working
    
    // Comment out steps 4-7 to test only up to step 3
    // return
    
    // Step 4...
}
```

## Best Practices

1. **Clean State**: E2E tests create all data via API calls
2. **Real Workflow**: Tests follow the exact user journey
3. **Comprehensive Verification**: Each step verifies its results
4. **Clear Logging**: Detailed output shows progress
5. **Idempotent**: Can be run multiple times safely

## Troubleshooting

### Test Fails at Step 1
- **Issue**: Cannot create conference
- **Check**: Is server running? Is authentication working?

### Test Fails at Step 4
- **Issue**: Cannot invite reviewers
- **Check**: Does the batch invite endpoint exist? Are user IDs valid?

### Test Fails at Step 6
- **Issue**: Auto-assignment fails
- **Check**: Are there accepted reviewers? Are papers published?

### Assignments Don't Respect COI
- **Issue**: Conflicted reviewers assigned to papers
- **Check**: Are COI declarations properly saved? Is COI detection working?

## Future Enhancements

Potential additions to E2E tests:

- [ ] Test reviewer submitting reviews
- [ ] Test paper status transitions (accept/reject)
- [ ] Test notification system
- [ ] Test file upload/download
- [ ] Test conference deadlines
- [ ] Test reviewer workload limits
- [ ] Test multiple assignment rounds
- [ ] Test paper withdrawal
- [ ] Test reviewer decline invitation

## Related Documentation

- [API Tests README](../README.md)
- [Quick Start Guide](../../QUICKSTART.md)
- [API Documentation](../../../API.md)

