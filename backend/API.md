# API Documentation

## Overview

Base URL: `http://localhost:8080/api/v1`

This is a RESTful API for managing conferences, submissions, and users. It supports:

- User authentication and authorization
- Conference management (CRUD operations)
- Paper submission management
- Role-based access control (Chair, Author)
- Status-based workflow (Draft/Published)

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#-public-endpoints-no-authentication)
  - [Register User](#register-user)
  - [Login](#login)
- [Protected Endpoints](#-protected-endpoints-authentication-required)
  - [Users](#users)
  - [Conferences](#conferences)
  - [Submissions](#submissions)
- [Error Responses](#error-responses)
- [Example Usage](#example-usage-with-curl)
- [Features](#features)

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

**Token Details:**

- Expires in 24 hours (configurable)
- Contains user ID and email
- Required for all protected endpoints

---

## Endpoints

### 🔓 Public Endpoints (No Authentication)

#### Register User

```http
POST /api/v1/auth/register
```

**Description:** Create a new user account.

**Request Body:**

```json
{
  "user": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "domain": ["Computer Science", "AI"]
  },
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "domain": ["Computer Science", "AI"],
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
}
```

---

#### Login

```http
POST /api/v1/auth/login
```

**Description:** Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "domain": ["Computer Science", "AI"],
      "created_at": "2025-10-10T10:00:00Z",
      "updated_at": "2025-10-10T10:00:00Z"
    }
  }
}
```

---

### 🔒 Protected Endpoints (Authentication Required)

All endpoints below require JWT token in Authorization header.

---

## Users

### Get Current User

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Description:** Get the authenticated user's profile information.

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "domain": ["Computer Science", "AI"],
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
}
```

---

### Get User by ID

```http
GET /api/v1/users/:id
Authorization: Bearer <token>
```

**Description:** Get a specific user's profile by their ID.

**URL Parameters:**

- `id` (integer, required) - User ID

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "domain": ["Computer Science", "AI"],
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
}
```

---

### List Users

```http
GET /api/v1/users?limit=10&offset=0&email=user@example.com&first_name=John&last_name=Doe
Authorization: Bearer <token>
```

**Description:** Get a paginated list of users with optional filters.

**Query Parameters:**

- `limit` (integer, optional) - Number of results to return (default: 10)
- `offset` (integer, optional) - Offset for pagination (default: 0)
- `email` (string, optional) - Filter by email
- `first_name` (string, optional) - Filter by first name
- `last_name` (string, optional) - Filter by last name

**Response (200):**

```json
{
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user1@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "domain": ["Computer Science", "AI"],
        "created_at": "2025-10-10T10:00:00Z",
        "updated_at": "2025-10-10T10:00:00Z"
      },
      {
        "id": 2,
        "email": "user2@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "domain": ["Biology", "Research"],
        "created_at": "2025-10-10T11:00:00Z",
        "updated_at": "2025-10-10T11:00:00Z"
      }
    ],
    "total": 2
  }
}
```

---

### Update User

```http
PUT /api/v1/users/:id
Authorization: Bearer <token>
```

**Description:** Update user profile. Users can only update their own profile.

**URL Parameters:**

- `id` (integer, required) - User ID

**Request Body:**

```json
{
  "user": {
    "email": "newemail@example.com",
    "first_name": "Johnny",
    "last_name": "Doe",
    "domain": ["AI", "Machine Learning", "NLP"]
  }
}
```

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "first_name": "Johnny",
    "last_name": "Doe",
    "domain": ["AI", "Machine Learning", "NLP"],
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T12:00:00Z"
  }
}
```

---

### Delete User

```http
DELETE /api/v1/users/:id
Authorization: Bearer <token>
```

**Description:** Delete user account. Users can only delete their own account.

**URL Parameters:**

- `id` (integer, required) - User ID

**Response (200):**

```json
{
  "message": "user deleted successfully"
}
```

---

## Conferences

### List Conferences

```http
GET /api/v1/conferences?limit=10&offset=0&title=AI&acronym=AAAI&chair=john@example.com&status=active&myConferences=true&role=author
Authorization: Bearer <token>
```

**Description:** Get a paginated list of conferences with optional filters.

**Query Parameters:**

- `limit` (integer, optional) - Number of results to return (default: all)
- `offset` (integer, optional) - Offset for pagination (default: 0)
- `title` (string, optional) - Filter by title (partial match)
- `acronym` (string, optional) - Filter by acronym (partial match)
- `chair` (string, optional) - Filter by chair email (partial match)
- `status` (string, optional) - Filter by status: `active`, `upcoming`, or `archived`
- `myConferences` (boolean, optional) - Only return conferences where the user has a role (default: false)
- `role` (string, optional) - Filter by user's specific role: `chair`, `author`, or `reviewer` (requires `myConferences=true`)
- `myBookmark` (boolean, optional) - Only return bookmarked conferences (default: false)

**Response (200):**

```json
{
  "data": {
    "conferences": [
      {
        "id": 1,
        "title": "International Conference on Artificial Intelligence",
        "acronym": "ICAI",
        "description": "A premier conference on AI research",
        "chair": "john@example.com",
        "primary_contact": 1,
        "area_chair": 2,
        "domain": ["Computer Science", "AI", "Machine Learning"],
        "configurations": {
          "start_date": "2025-06-01T00:00:00Z",
          "end_date": "2025-06-05T00:00:00Z",
          "abstract_submission_deadline": "2025-02-01T00:00:00Z",
          "full_paper_submission_deadline": "2025-03-01T00:00:00Z",
          "format": "hybrid",
          "review_type": "double-blind",
          "maximum_pages": 8
        },
        "created_at": "2025-01-01T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### Get Conference by ID

```http
GET /api/v1/conferences/:conference_id
Authorization: Bearer <token>
```

**Description:** Get a specific conference by its ID.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "International Conference on Artificial Intelligence",
    "acronym": "ICAI",
    "description": "A premier conference on AI research",
    "chair": "john@example.com",
    "primary_contact": 1,
    "area_chair": 2,
    "domain": ["Computer Science", "AI", "Machine Learning"],
    "configurations": {
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-06-05T00:00:00Z",
      "abstract_submission_deadline": "2025-02-01T00:00:00Z",
      "full_paper_submission_deadline": "2025-03-01T00:00:00Z",
      "format": "hybrid",
      "review_type": "double-blind",
      "maximum_pages": 8
    },
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### Create Conference

```http
POST /api/v1/conferences
Authorization: Bearer <token>
```

**Description:** Create a new conference. The authenticated user becomes the chair automatically.

**Request Body:**

```json
{
  "conference": {
    "title": "International Conference on Artificial Intelligence",
    "acronym": "ICAI",
    "description": "A premier conference on AI research",
    "chair": "john@example.com",
    "primary_contact": 1,
    "area_chair": 2,
    "domain": ["Computer Science", "AI", "Machine Learning"],
    "configurations": {
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-06-05T00:00:00Z",
      "abstract_submission_deadline": "2025-02-01T00:00:00Z",
      "full_paper_submission_deadline": "2025-03-01T00:00:00Z",
      "camera_ready_deadline": "2025-04-15T00:00:00Z",
      "format": "hybrid",
      "estimated_number_of_submission": 500,
      "review_type": "double-blind",
      "submission_type": "full-paper",
      "have_coi": true,
      "maximum_pages": 8,
      "submission_format": "PDF",
      "require_complete_author_profile": true,
      "allow_paper_withdrawls": true
    }
  }
}
```

**Response (201):**

```json
{
  "data": {
    "id": 1,
    "title": "International Conference on Artificial Intelligence",
    "acronym": "ICAI",
    "description": "A premier conference on AI research",
    "chair": "john@example.com",
    "primary_contact": 1,
    "area_chair": 2,
    "domain": ["Computer Science", "AI", "Machine Learning"],
    "configurations": {
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-06-05T00:00:00Z",
      "abstract_submission_deadline": "2025-02-01T00:00:00Z",
      "full_paper_submission_deadline": "2025-03-01T00:00:00Z",
      "camera_ready_deadline": "2025-04-15T00:00:00Z",
      "format": "hybrid",
      "estimated_number_of_submission": 500,
      "review_type": "double-blind",
      "submission_type": "full-paper",
      "have_coi": true,
      "maximum_pages": 8,
      "submission_format": "PDF",
      "require_complete_author_profile": true,
      "allow_paper_withdrawls": true
    },
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
}
```

---

### Update Conference

```http
PUT /api/v1/conferences/:conference_id
Authorization: Bearer <token>
```

**Description:** Update conference details. Only the chair can update the conference.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID

**Request Body:**

```json
{
  "conference": {
    "title": "Updated Conference Title",
    "description": "Updated description",
    "domain": ["AI", "Deep Learning"],
    "configurations": {
      "maximum_pages": 10
    }
  }
}
```

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "title": "Updated Conference Title",
    "acronym": "ICAI",
    "description": "Updated description",
    "chair": "john@example.com",
    "primary_contact": 1,
    "area_chair": 2,
    "domain": ["AI", "Deep Learning"],
    "configurations": {
      "maximum_pages": 10
    },
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

---

### Delete Conference

```http
DELETE /api/v1/conferences/:conference_id
Authorization: Bearer <token>
```

**Description:** Delete a conference. Only the chair can delete the conference.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID

**Response (200):**

```json
{
  "message": "conference deleted successfully"
}
```

---

## Submissions

### List Submissions

```http
GET /api/v1/conferences/:conference_id/submissions?limit=10&offset=0&author=user@example.com&status=draft&title=Machine%20Learning
Authorization: Bearer <token>
```

**Description:** Get a paginated list of submissions for a specific conference with optional filters.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID

**Query Parameters:**

- `limit` (integer, optional) - Number of results to return
- `offset` (integer, optional) - Offset for pagination
- `author` (string, optional) - Filter by author email
- `status` (string, optional) - Filter by status (`draft` or `published`)
- `title` (string, optional) - Filter by title

**Response (200):**

```json
{
  "data": {
    "submissions": [
      {
        "id": 1,
        "conference_id": 1,
        "author": "author@example.com",
        "title": "Advances in Deep Learning",
        "abstract": "This paper presents novel techniques...",
        "link": "https://example.com/paper.pdf",
        "domain": ["Deep Learning", "Neural Networks"],
        "status": "draft",
        "information": {
          "co_authors": ["coauthor1@example.com", "coauthor2@example.com"],
          "keywords": ["deep learning", "neural networks", "optimization"],
          "paper_type": "research",
          "track_name": "Machine Learning",
          "additional_notes": "Extended version of workshop paper",
          "metadata": {
            "language": "en",
            "page_count": 8
          }
        },
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-20T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### Get Submission by ID

```http
GET /api/v1/conferences/:conference_id/submissions/:id
Authorization: Bearer <token>
```

**Description:** Get a specific submission by its ID within a conference.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID
- `id` (integer, required) - Submission ID

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "conference_id": 1,
    "author": "author@example.com",
    "title": "Advances in Deep Learning",
    "abstract": "This paper presents novel techniques...",
    "link": "https://example.com/paper.pdf",
    "domain": ["Deep Learning", "Neural Networks"],
    "status": "draft",
    "information": {
      "co_authors": ["coauthor1@example.com", "coauthor2@example.com"],
      "keywords": ["deep learning", "neural networks", "optimization"],
      "paper_type": "research",
      "track_name": "Machine Learning",
      "additional_notes": "Extended version of workshop paper",
      "metadata": {
        "language": "en",
        "page_count": 8
      }
    },
    "file": {
      "filename": "1234567890_paper.pdf",
      "original_name": "paper.pdf",
      "size": 2048576,
      "mime_type": "application/pdf",
      "path": "/uploads/submissions/1/1/1234567890_paper.pdf"
    },
    "cover_letter": {
      "filename": "cover_letter_1234567891_cover.pdf",
      "original_name": "cover.pdf",
      "size": 102400,
      "mime_type": "application/pdf",
      "path": "/uploads/submissions/1/1/cover_letter_1234567891_cover.pdf"
    },
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  }
}
```

---

### Create Submission

```http
POST /api/v1/conferences/:conference_id/submissions
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Description:** Create a new submission for a conference. The authenticated user becomes the author automatically.

**File Requirements:**
- **Draft** (`status: "draft"`): All fields including paper file are **OPTIONAL** (can save empty draft)
- **Published** (`status: "published"`): Paper file is **REQUIRED**

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID

**Request Body (multipart/form-data):**

- `submission` (string, required) - JSON string containing submission data:

```json
{
  "submission": {
    "title": "Advances in Deep Learning",
    "abstract": "This paper presents novel techniques in deep learning optimization.",
    "link": "https://example.com/paper.pdf",
    "domain": ["Deep Learning", "Neural Networks"],
    "status": "draft",  // "draft" or "published"
    "information": {
      "co_authors": ["coauthor1@example.com", "coauthor2@example.com"],
      "keywords": ["deep learning", "neural networks", "optimization"],
      "paper_type": "research",
      "track_name": "Machine Learning",
      "additional_notes": "Extended version of workshop paper",
      "metadata": {
        "language": "en",
        "page_count": 8
      }
    }
  }
}
```

- `file` (file, conditional) - PDF file for the main paper (max 20MB)
  - **Required** if `status: "published"`
  - **Optional** if `status: "draft"`
- `cover_letter` (file, optional) - Cover letter file in PDF, DOCX, or TXT format (max 20MB)

**Response (201):**

```json
{
  "data": {
    "id": 1,
    "conference_id": 1,
    "author": "author@example.com",
    "title": "Advances in Deep Learning",
    "abstract": "This paper presents novel techniques in deep learning optimization.",
    "link": "https://example.com/paper.pdf",
    "domain": ["Deep Learning", "Neural Networks"],
    "status": "draft",
    "information": {
      "co_authors": ["coauthor1@example.com", "coauthor2@example.com"],
      "keywords": ["deep learning", "neural networks", "optimization"],
      "paper_type": "research",
      "track_name": "Machine Learning",
      "additional_notes": "Extended version of workshop paper",
      "metadata": {
        "language": "en",
        "page_count": 8
      }
    },
    "file": {
      "filename": "1234567890_paper.pdf",
      "original_name": "paper.pdf",
      "size": 2048576,
      "mime_type": "application/pdf",
      "path": "/uploads/submissions/1/1/1234567890_paper.pdf"
    },
    "cover_letter": {
      "filename": "cover_letter_1234567891_cover.pdf",
      "original_name": "cover.pdf",
      "size": 102400,
      "mime_type": "application/pdf",
      "path": "/uploads/submissions/1/1/cover_letter_1234567891_cover.pdf"
    },
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
}
```

---

### Update Submission

```http
PUT /api/v1/conferences/:conference_id/submissions/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data OR application/json
```

**Description:** Update a submission including metadata, paper file, and cover letter. Only the author can update, and only if the status is `draft`. Supports both JSON (metadata only) and multipart/form-data (with file uploads).

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID
- `id` (integer, required) - Submission ID

**Option 1: Multipart Form-Data (for file uploads)**

- `submission` (string, required) - JSON string containing updated submission data:

```json
{
  "submission": {
    "title": "Updated Paper Title",
    "abstract": "Updated abstract",
    "domain": ["Deep Learning", "AI"],
    "information": {
      "keywords": ["machine learning", "optimization"]
    }
  }
}
```

- `file` (file, optional) - Paper PDF file (max 20MB). If provided, replaces existing paper file.
- `cover_letter` (file, optional) - Cover letter file in PDF, DOCX, or TXT format (max 20MB). If provided, replaces existing cover letter.

**Option 2: JSON (for metadata updates only)**

```json
{
  "submission": {
    "title": "Updated Paper Title",
    "abstract": "Updated abstract",
    "domain": ["Deep Learning", "AI"],
    "information": {
      "keywords": ["machine learning", "optimization"]
    }
  }
}
```

**Notes:**
- You can update metadata only (JSON) without affecting files
- You can update paper file independently of cover letter
- Each file field is optional - only provided files will be updated
- All file uploads replace existing files (they don't append)

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "conference_id": 1,
    "author": "author@example.com",
    "title": "Updated Paper Title",
    "abstract": "Updated abstract",
    "link": "https://example.com/paper.pdf",
    "domain": ["Deep Learning", "AI"],
    "status": "draft",
    "information": {
      "keywords": ["machine learning", "optimization"]
    },
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-25T10:00:00Z"
  }
}
```

---

### Get Submission Cover Letter

```http
GET /api/v1/conferences/:conference_id/submissions/:id/cover_letter
Authorization: Bearer <token>
```

**Description:** Download the cover letter file associated with a submission.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID
- `id` (integer, required) - Submission ID

**Response (200):**

Returns the cover letter file with appropriate Content-Type header (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, or text/plain).

**Response (404):**

```json
{
  "error": "cover letter not found"
}
```

---

### Delete Submission

```http
DELETE /api/v1/conferences/:conference_id/submissions/:id
Authorization: Bearer <token>
```

**Description:** Delete a submission. Only the author can delete, and only if the status is `draft`.

**URL Parameters:**

- `conference_id` (integer, required) - Conference ID
- `id` (integer, required) - Submission ID

**Response (200):**

```json
{
  "message": "submission deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "validation error message"
}
```

**Common causes:**

- Missing required fields
- Invalid data format
- Invalid email format
- Invalid ID format

### 401 Unauthorized

```json
{
  "error": "invalid or expired token"
}
```

**Common causes:**

- Missing Authorization header
- Invalid token format
- Expired token
- Invalid token signature

### 403 Forbidden

```json
{
  "error": "you can only update your own profile"
}
```

**Common causes:**

- Attempting to modify resources you don't own
- Attempting to update published submissions
- Attempting to delete published submissions
- Non-chair trying to modify conference

### 404 Not Found

```json
{
  "error": "user not found"
}
```

**Common causes:**

- Resource doesn't exist
- Invalid ID provided
- Submission not found in specified conference

### 500 Internal Server Error

```json
{
  "error": "internal server error"
}
```

**Common causes:**

- Database connection issues
- Unexpected server errors

---

## Example Usage with curl

### Register User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "first_name": "Test",
      "last_name": "User",
      "domain": ["Computer Science"]
    },
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User

```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### List Users

```bash
curl -X GET "http://localhost:8080/api/v1/users?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### Update User

```bash
curl -X PUT http://localhost:8080/api/v1/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "first_name": "Updated",
      "domain": ["AI", "ML"]
    }
  }'
```

### Create Conference

```bash
curl -X POST http://localhost:8080/api/v1/conferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conference": {
      "title": "AI Conference 2025",
      "acronym": "AIC2025",
      "description": "Annual AI conference",
      "chair": "chair@example.com",
      "primary_contact": 1,
      "area_chair": 2,
      "domain": ["AI", "Machine Learning"]
    }
  }'
```

### List Conferences

```bash
curl -X GET "http://localhost:8080/api/v1/conferences?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### Create Submission

```bash
curl -X POST http://localhost:8080/api/v1/conferences/1/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission": {
      "title": "My Research Paper",
      "abstract": "Abstract text here",
      "link": "https://example.com/paper.pdf",
      "domain": ["Deep Learning"],
      "status": "draft",
      "information": {
        "keywords": ["neural networks", "optimization"]
      }
    }
  }'
```

### List Submissions

```bash
curl -X GET "http://localhost:8080/api/v1/conferences/1/submissions?status=draft" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Features

✅ **JWT Authentication** - Secure token-based auth
✅ **Password Hashing** - bcrypt for secure password storage  
✅ **SQL Builder** - Squirrel for clean, safe queries
✅ **Middleware** - Auth middleware protects routes
✅ **Validation** - Input validation on all requests
✅ **PostgreSQL Arrays** - Native array support for domain field
✅ **JSONB Support** - Configuration and information fields stored as JSONB
✅ **Clean Architecture** - Entity, DTO, Storage, Service, Controller layers
✅ **Dependency Injection** - Manual DI pattern
✅ **Role-Based Access** - Chair-only modifications, author-only submissions
✅ **Status Management** - Draft/Published workflow for submissions
