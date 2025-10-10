# API Documentation

## Overview

Base URL: `http://localhost:8080/api/v1`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 🔓 Public Endpoints (No Authentication)

#### Register User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123",
  "domain": ["Computer Science", "AI"]
}
```

**Response (201):**
```json
{
  "data": {
    "user_id": 1,
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
      "user_id": 1,
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

#### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "user_id": 1,
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

#### Get User by ID
```http
GET /api/v1/users/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "user_id": 1,
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

#### List All Users
```http
GET /api/v1/users
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "user_id": 1,
      "email": "user1@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "domain": ["Computer Science", "AI"],
      "created_at": "2025-10-10T10:00:00Z",
      "updated_at": "2025-10-10T10:00:00Z"
    },
    {
      "user_id": 2,
      "email": "user2@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "domain": ["Biology", "Research"],
      "created_at": "2025-10-10T11:00:00Z",
      "updated_at": "2025-10-10T11:00:00Z"
    }
  ]
}
```

---

#### Update User
```http
PUT /api/v1/users/:id
Authorization: Bearer <token>
```

**Note:** Users can only update their own profile.

**Request Body** (all fields optional):
```json
{
  "email": "newemail@example.com",
  "first_name": "Johnny",
  "last_name": "Doe",
  "domain": ["AI", "Machine Learning", "NLP"]
}
```

**Response (200):**
```json
{
  "data": {
    "user_id": 1,
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

#### Delete User
```http
DELETE /api/v1/users/:id
Authorization: Bearer <token>
```

**Note:** Users can only delete their own account.

**Response (200):**
```json
{
  "message": "user deleted successfully"
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

### 401 Unauthorized
```json
{
  "error": "invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "you can only update your own profile"
}
```

### 404 Not Found
```json
{
  "error": "user not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "internal server error"
}
```

---

## Example Usage with curl

### Register
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "password123",
    "domain": ["Computer Science"]
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

### Get Current User (with token)
```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Update User
```bash
curl -X PUT http://localhost:8080/api/v1/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "domain": ["AI", "ML"]
  }'
```

---

## Features

✅ **JWT Authentication** - Secure token-based auth
✅ **Password Hashing** - bcrypt for secure password storage  
✅ **SQL Builder** - Squirrel for clean, safe queries
✅ **Middleware** - Auth middleware protects routes
✅ **Validation** - Input validation on all requests
✅ **PostgreSQL Arrays** - Native array support for domain field
✅ **Clean Architecture** - Entity, DTO, Storage, Service, Controller layers
✅ **Dependency Injection** - Manual DI pattern

