# Recipe AI Harmony - Backend API

## Overview

Recipe AI Harmony is an AI-powered nutrition and meal planning platform that helps users make healthier food choices and create personalized meal plans. The backend is built with Flask and uses Supabase for data storage and authentication, with Paystack integration for payment processing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React/Next.js Client)                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS Requests
             │ JWT Authentication
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK BACKEND API                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Route Handlers                         │  │
│  │  • auth_routes         • ai_session_routes               │  │
│  │  • food_detection      • feedback_routes                 │  │
│  │  • meal_plan_routes    • user_settings                   │  │
│  │  • subscription_routes • payment_routes                  │  │
│  │  • lifecycle_routes    • enterprise_routes               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Service Layer                           │  │
│  │  • AuthService            • SubscriptionService          │  │
│  │  • SupabaseService        • PaymentService               │  │
│  │  • EmailService           • LifecycleService             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Utility Layer                           │  │
│  │  • auth_utils (Token validation)                         │  │
│  │  • file_utils (File validation)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────────┬───────────────┬─────────┘
             │                          │               │
             ▼                          ▼               ▼
┌────────────────────┐  ┌──────────────────────┐  ┌────────────────┐
│    SUPABASE        │  │    PAYSTACK API      │  │  SMTP SERVER   │
│                    │  │                      │  │                │
│ • PostgreSQL DB    │  │ • Payment Gateway    │  │ • Email        │
│ • Authentication   │  │ • Subscriptions      │  │   Notifications│
│ • Storage          │  │ • Webhooks           │  │                │
│ • RPC Functions    │  └──────────────────────┘  └────────────────┘
└────────────────────┘
```

## Technology Stack

- **Framework**: Flask 2.x
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Payment**: Paystack
- **Email**: SMTP (Gmail/Custom)
- **Storage**: Supabase Storage
- **Deployment**: Docker

## Project Structure

```
backend/
├── app.py                          # Main application entry point
├── Dockerfile                      # Docker configuration
├── requirements.txt                # Python dependencies
│
├── routes/                         # API route handlers
│   ├── auth_routes.py             # Authentication endpoints
│   ├── ai_session_routes.py       # AI session management
│   ├── food_detection_routes.py   # Food detection & analysis
│   ├── feedback_routes.py         # User feedback
│   ├── meal_plan_routes.py        # Meal planning
│   ├── user_settings_routes.py    # User preferences
│   ├── subscription_routes.py     # Subscription management
│   ├── payment_routes.py          # Payment processing
│   ├── lifecycle_routes.py        # User lifecycle management
│   └── enterprise_routes.py       # Organization management
│
├── services/                       # Business logic layer
│   ├── auth_service.py            # Authentication logic
│   ├── supabase_service.py        # Database operations
│   ├── subscription_service.py    # Subscription logic
│   ├── payment_service.py         # Payment processing
│   ├── lifecycle_subscription_service.py  # Lifecycle management
│   └── email_service.py           # Email notifications
│
└── utils/                          # Utility functions
    ├── auth_utils.py              # Token validation helpers
    └── file_utils.py              # File validation helpers
```

## Database Schema

### Core Tables

#### `profiles`
- User profile information
- Columns: `id`, `email`, `first_name`, `last_name`, `created_at`, `updated_at`

#### `user_subscriptions`
- User subscription records
- Columns: `id`, `user_id`, `plan_id`, `status`, `current_period_start`, `current_period_end`, `created_at`, `updated_at`

#### `subscription_plans`
- Available subscription plans
- Columns: `id`, `name`, `display_name`, `price_usd`, `duration_days`, `features`, `is_active`

#### `user_trials`
- Trial period tracking
- Columns: `id`, `user_id`, `start_date`, `end_date`, `is_used`, `created_at`

#### `payment_transactions`
- Payment history
- Columns: `id`, `user_id`, `plan_id`, `amount`, `currency`, `status`, `paystack_reference`, `created_at`

#### `detection_history`
- Food detection records
- Columns: `id`, `user_id`, `detection_type`, `recipe_suggestion`, `recipe_instructions`, `recipe_ingredients`, `detected_foods`, `analysis_id`, `created_at`

#### `meal_plan_management`
- User meal plans
- Columns: `id`, `user_id`, `name`, `start_date`, `end_date`, `meal_plan`, `has_sickness`, `sickness_type`, `created_at`, `updated_at`

#### `user_settings`
- User preferences and settings
- Columns: `id`, `user_id`, `settings_type`, `settings_data`, `created_at`, `updated_at`

#### `enterprises`
- Organization records
- Columns: `id`, `name`, `email`, `phone`, `address`, `organization_type`, `created_by`, `max_users`, `is_active`, `created_at`

#### `organization_users`
- Organization membership
- Columns: `id`, `enterprise_id`, `user_id`, `role`, `status`, `joined_at`, `notes`, `metadata`

#### `invitations`
- Organization invitations
- Columns: `id`, `enterprise_id`, `email`, `invited_by`, `invitation_token`, `role`, `status`, `message`, `sent_at`, `expires_at`

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Paystack Configuration (Optional)
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# SMTP Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@meallensai.com
FROM_NAME=MeallensAI

# Frontend Configuration
FRONTEND_BASE_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
RESET_PASSWORD_REDIRECT_URL=http://localhost:5173/reset-password
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Testing Configuration (Optional)
SUB_TIME_UNIT=days  # Change to 'minutes' or 'seconds' for testing
```

## Installation

### Prerequisites
- Python 3.10 or higher
- PostgreSQL (via Supabase)
- pip (Python package manager)

### Setup

1. **Clone the repository**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run the application**
```bash
python app.py
```

The server will start on `http://localhost:5001`

## Docker Deployment

### Build Docker Image
```bash
docker build -t recipe-ai-backend .
```

### Run Container
```bash
docker run -d \
  -p 5001:5001 \
  --env-file .env \
  --name recipe-ai-backend \
  recipe-ai-backend
```

## Features

### 1. **Authentication & User Management**
- User registration with Supabase Auth
- Email/password login
- JWT token authentication
- Password reset functionality
- Profile management

### 2. **Food Detection & Analysis**
- Image-based food detection
- Ingredient list analysis
- Recipe suggestions
- Nutrition information
- Detection history tracking

### 3. **Meal Planning**
- Personalized meal plan creation
- Daily meal scheduling
- Dietary restrictions support
- Meal plan history
- Export and sharing capabilities

### 4. **Subscription Management**
- Multiple subscription tiers (Free, Basic, Premium, Enterprise)
- Trial period support
- Usage tracking and limits
- Automatic expiration handling
- Lifecycle management (new → trial → paid → expired)

### 5. **Payment Processing**
- Paystack integration
- Secure payment handling
- Webhook support
- Transaction history
- Multiple payment methods

### 6. **Enterprise Features**
- Organization management
- User invitations
- Role-based access control
- Team member management
- Bulk user creation

### 7. **User Settings**
- Health profiles
- Dietary preferences
- Notification settings
- Customizable preferences

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error message",
  "error_type": "validation_error|auth_error|server_error"
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Alternatively, tokens can be passed via httpOnly cookies:
```
Cookie: access_token=<your_jwt_token>
```

## CORS Configuration

The API supports CORS with the following allowed origins:
- `http://localhost:5173`
- `http://localhost:5174`
- `https://meallensai.com`
- `https://www.meallensai.com`
- Custom origins via `ALLOWED_ORIGINS` environment variable

## Error Handling

The application implements comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- Server errors (500)

## Testing

### Time Unit Override for Testing

For rapid testing of subscription features, set the `SUB_TIME_UNIT` environment variable:

```env
SUB_TIME_UNIT=minutes  # Makes 1 day = 1 minute
# or
SUB_TIME_UNIT=seconds  # Makes 1 day = 1 second
```

This allows you to test trial expirations and subscription renewals without waiting for real days.

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **API Keys**: Keep Supabase and Paystack keys secure
3. **CORS**: Configure allowed origins appropriately for production
4. **Rate Limiting**: Implement rate limiting in production
5. **Input Validation**: All user inputs are validated before processing
6. **SQL Injection**: Protected via Supabase parameterized queries
7. **XSS Protection**: Sanitize user-generated content

## Monitoring and Logging

The application logs to console by default. Key events logged include:
- Authentication attempts
- Payment transactions
- Subscription changes
- Error occurrences
- API request/response cycles

## Support

For issues or questions:
- Check the API documentation below
- Review error messages and logs
- Ensure environment variables are correctly set
- Verify Supabase and Paystack configurations

## License

[Your License Here]

## Contributors

[Your Team/Contributors Here]

---

**Next Steps**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API endpoint details and payload specifications.

