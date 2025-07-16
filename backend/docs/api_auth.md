# Authentication API Documentation

## Overview

This API provides authentication endpoints for both Firebase and Supabase authentication methods. It supports user registration, login, and token verification.

## Endpoints

### 1. Test Authentication

```http
GET /api/test_auth
```

**Description:**
Test endpoint to verify authentication is working. Returns the authenticated user's information.

**Request Headers:**
- `Authorization: Bearer <token>` - Required. Either Firebase JWT or Supabase JWT token.

**Response:**
```json
{
    "status": "success",
    "user_id": "string",
    "auth_type": "firebase" | "supabase",
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
Login endpoint that supports both Firebase and Supabase authentication.

**Request Body:**
```json
// Firebase Login
{
    "token": "firebase_token"  // Required for Firebase login
}

// Supabase Login
{
    "email": "user@example.com",
    "password": "securepassword123"  // Required for Supabase login
}
```

**Response:**
```json
{
    "status": "success",
    "message": "Login successful",
    "user_id": "string",
    "auth_type": "firebase" | "supabase",
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
Register a new user with email and password using Supabase Auth. Supports optional Firebase UID linking for existing Firebase users.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123",
    "firebase_uid": "optional_firebase_uid"  // Only needed if linking to existing Firebase account
}
```

**Response:**
```json
{
    "status": "success",
    "message": "User registered successfully",
    "user_id": "string",
    "email": "string",
    "email_confirmed": boolean,
    "firebase_linked": boolean
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
4. Firebase JWT tokens are verified using Firebase Admin SDK
5. Supabase JWT tokens are verified using Supabase Auth
6. All user data is stored in Supabase with proper RLS policies

## Implementation Notes

1. The AuthService handles token verification and user mapping between Firebase and Supabase
2. User profiles are stored in the `profiles` table in Supabase
3. Firebase UID is stored in user metadata for linking accounts
4. Email verification is handled by Supabase Auth
5. Password requirements are enforced by Supabase Auth
