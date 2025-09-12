# Authentication API Documentation

## Overview

This API provides authentication endpoints using Supabase authentication. It supports user registration, login, and token verification.

## Endpoints

### 1. Test Authentication

```http
GET /api/test_auth
```

**Description:**
Test endpoint to verify authentication is working. Returns the authenticated user's information.

**Request Headers:**
- `Authorization: Bearer <token>` - Required. Supabase JWT token.

**Response:**
```json
{
    "status": "success",
    "user_id": "string",
    "auth_type": "supabase",
    "user_data": {
        "id": "string",
        "email": "string",
        "metadata": object
    },
    "message": "Authentication successful!"
}
```

### 2. Login

```http
POST /api/login
```

**Description:**
Login endpoint that uses Supabase email/password authentication.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "Login successful",
    "user_id": "string",
    "auth_type": "supabase",
    "user_data": {
        "id": "string",
        "email": "string",
        "metadata": object
    }
}
```

### 3. Register

```http
POST /api/register
```

**Description:**
Register a new user with email and password using Supabase Auth.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "User registered successfully",
    "user_id": "string",
    "email": "string",
    "email_confirmed": boolean
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
    "status": "error",
    "message": "string",
    "details": object  // Optional, contains additional error information
}
```

Common error codes:
- `400` - Bad Request (invalid input, missing required fields)
- `401` - Unauthorized (invalid token, authentication failed)
- `403` - Forbidden (service not configured)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

## Security Notes

1. All endpoints require HTTPS
2. Passwords should be sent over HTTPS only
3. Tokens should be stored securely on the client side
4. Supabase JWT tokens are verified using Supabase Auth
6. All user data is stored in Supabase with proper RLS policies

## Implementation Notes

1. The AuthService handles token verification using Supabase Auth
2. User profiles are stored in the `profiles` table in Supabase
3. Email verification is handled by Supabase Auth
4. Password requirements are enforced by Supabase Auth
