# Recipe AI Harmony - Backend API

## Executive Summary

Recipe AI Harmony is an enterprise-grade, AI-powered nutrition and meal planning platform designed to help users make informed dietary choices and create personalized meal plans. The backend infrastructure is built on Flask, leveraging Supabase for comprehensive data management and authentication, with integrated Paystack payment processing capabilities.

### Key Capabilities
- **User Authentication & Authorization**: Secure JWT-based authentication with Supabase
- **AI-Powered Food Analysis**: Image and text-based food detection and nutritional analysis
- **Intelligent Meal Planning**: Personalized meal plan generation with dietary restrictions support
- **Subscription Management**: Multi-tier subscription system with trial periods and usage tracking
- **Payment Processing**: Integrated Paystack payment gateway with webhook support
- **Enterprise Features**: Multi-tenant organization management with role-based access control
- **Cloud Storage**: Supabase storage for user-generated content and media files

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATION LAYER                          │
│                  (React/Next.js Web Application)                     │
│                                                                       │
│  • User Interface Components                                        │
│  • State Management                                                 │
│  • API Client Integration                                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS/TLS 1.3
                             │ JWT Bearer Authentication
                             │ RESTful JSON API
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVER LAYER                          │
│                         (Flask REST API)                             │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  PRESENTATION LAYER                            │  │
│  │                    (Route Handlers)                            │  │
│  │                                                                 │  │
│  │  Authentication Routes  │  Food Detection Routes              │  │
│  │  Meal Planning Routes   │  Subscription Management            │  │
│  │  Payment Routes         │  Enterprise Management              │  │
│  │  User Settings Routes   │  Feedback & AI Session Routes       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                             │                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    BUSINESS LOGIC LAYER                        │  │
│  │                      (Service Classes)                         │  │
│  │                                                                 │  │
│  │  AuthService              SubscriptionService                 │  │
│  │  SupabaseService          PaymentService                      │  │
│  │  EmailService             LifecycleService                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                             │                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    UTILITY LAYER                               │  │
│  │                                                                 │  │
│  │  Authentication Utils  │  File Validation Utils               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────┬─────────────────┬────────────┘
             │                        │                 │
             ▼                        ▼                 ▼
┌─────────────────────┐  ┌──────────────────────┐  ┌────────────────┐
│  SUPABASE PLATFORM  │  │   PAYSTACK API       │  │  SMTP GATEWAY  │
│                     │  │                      │  │                │
│ • PostgreSQL DB     │  │ • Payment Gateway    │  │ • Transactional│
│ • Authentication    │  │ • Subscription Mgmt  │  │   Email        │
│ • Object Storage    │  │ • Webhook Events     │  │ • Notifications│
│ • Edge Functions    │  │ • Transaction Verify │  │                │
└─────────────────────┘  └──────────────────────┘  └────────────────┘
```

### Architecture Patterns

**Layered Architecture**: The application follows a strict three-tier architecture pattern:
- **Presentation Layer**: Route handlers manage HTTP request/response cycles
- **Business Logic Layer**: Service classes encapsulate domain logic and business rules
- **Data Access Layer**: Supabase service provides abstraction over database operations

**Separation of Concerns**: Each layer has distinct responsibilities with minimal coupling, facilitating maintainability and testability.

## Technology Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Web Framework** | Flask | 2.x | RESTful API server |
| **Database** | Supabase (PostgreSQL) | 15+ | Primary data store |
| **Authentication** | Supabase Auth | Latest | JWT-based authentication |
| **Payment Gateway** | Paystack | API v1 | Payment processing |
| **Email Service** | SMTP | Standard | Transactional emails |
| **Object Storage** | Supabase Storage | Latest | Media file storage |
| **Containerization** | Docker | 20+ | Application deployment |

### Supporting Libraries

- **flask-cors**: Cross-Origin Resource Sharing support
- **marshmallow**: Request validation and serialization
- **requests**: HTTP client for external API integration
- **python-dotenv**: Environment variable management
- **werkzeug**: WSGI utilities and security helpers

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

## Core Features

### Authentication & Identity Management
The platform provides enterprise-grade authentication services including:
- Secure user registration and onboarding workflow
- Email/password authentication with JWT token issuance
- Password recovery and reset mechanisms
- Session management and token refresh capabilities
- User profile management and data retrieval
- Multi-factor authentication readiness

### Food Detection & Nutritional Analysis
Advanced AI-powered food recognition and analysis capabilities:
- Computer vision-based food detection from images
- Text-based ingredient list processing
- Automated recipe generation and suggestions
- Nutritional information extraction and calculation
- Historical analysis tracking and retrieval
- Recipe sharing and community features

### Meal Planning System
Comprehensive meal planning functionality tailored to user preferences:
- AI-driven personalized meal plan generation
- Multi-day meal scheduling and calendar integration
- Dietary restriction and allergy accommodation
- Health condition-based meal recommendations
- Meal plan versioning and history management
- Individual meal and ingredient-level access

### Subscription & Monetization
Flexible subscription management supporting multiple business models:
- Multi-tier subscription plans (Free, Basic, Premium, Enterprise)
- Automated trial period provisioning and management
- Feature-based usage tracking and enforcement
- Subscription lifecycle management (trial, active, expired, renewal)
- Automated expiration monitoring and notifications
- Proration and upgrade/downgrade handling

### Payment Processing
Secure payment infrastructure with comprehensive transaction management:
- Paystack payment gateway integration
- Multi-currency transaction support
- PCI-compliant payment handling
- Automated payment verification and reconciliation
- Webhook event processing for real-time updates
- Transaction history and audit trails
- Refund and chargeback management capabilities

### Enterprise & Multi-Tenancy
B2B features supporting organizational deployments:
- Organization registration and management
- User invitation system with secure token generation
- Role-based access control (Owner, Admin, Nutritionist, Patient)
- Team member management and provisioning
- Organization-level settings and customization
- Bulk user operations and CSV import readiness

### User Preferences & Settings
Flexible user configuration system:
- Health profile management (age, weight, medical conditions)
- Dietary preference storage (restrictions, allergies, goals)
- Activity level and lifestyle tracking
- Notification and communication preferences
- Data export and privacy controls

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

### ⚠️ Important: Content-Type Variations

**Most endpoints use JSON** (`Content-Type: application/json`), but some use form-data:
- `/api/food_detection/process` - multipart/form-data (for image uploads)
- `/api/feedback` - multipart/form-data

**See API_DOCUMENTATION.md for specific endpoint requirements.**

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

## Security Architecture

### Authentication & Authorization
- **JWT Token-Based Authentication**: Stateless authentication using Supabase-issued JWT tokens
- **Token Lifecycle Management**: Access tokens with configurable expiration (7-day default)
- **HttpOnly Cookie Support**: Secure cookie storage for browser-based authentication
- **Row-Level Security**: Supabase RLS policies enforce data access controls

### Data Protection
- **Environment Variable Security**: All sensitive credentials managed via environment variables
- **API Key Management**: Secure storage of third-party service credentials
- **CORS Configuration**: Whitelist-based origin validation for cross-origin requests
- **SQL Injection Prevention**: Parameterized queries via Supabase client library
- **XSS Mitigation**: Input sanitization and output encoding

### Compliance & Best Practices
- **PCI DSS Compliance**: Payment data handled exclusively by Paystack (no card data storage)
- **Data Encryption**: TLS 1.3 for data in transit; Supabase encryption at rest
- **Audit Logging**: Comprehensive logging of authentication and transaction events
- **Rate Limiting**: Planned implementation for production deployment

### Recommended Security Enhancements
1. Implement rate limiting middleware for authentication endpoints
2. Add request validation layer for all incoming payloads
3. Enable API key authentication for webhook endpoints
4. Implement IP whitelisting for administrative functions
5. Add security headers (HSTS, CSP, X-Frame-Options)

## Monitoring & Observability

### Logging Strategy
The application implements structured logging with the following event categories:
- **Authentication Events**: Registration, login attempts, token validation
- **Transaction Events**: Payment initiation, verification, webhook processing
- **Subscription Events**: Trial creation, subscription activation, expiration
- **Error Events**: Exception traces, validation failures, external service errors
- **Performance Metrics**: Request duration, database query timing

### Operational Monitoring
Recommended monitoring setup for production:
- **Application Performance Monitoring (APM)**: New Relic, DataDog, or Sentry
- **Database Monitoring**: Supabase built-in metrics and query performance insights
- **Error Tracking**: Sentry for exception tracking and alerting
- **Log Aggregation**: CloudWatch, Elasticsearch, or Papertrail
- **Uptime Monitoring**: Pingdom, UptimeRobot for endpoint availability

## Deployment Architecture

### Container-Based Deployment
The application is containerized using Docker for consistent deployment across environments:
- Multi-stage Docker builds for optimized image size
- Environment-specific configuration via environment variables
- Health check endpoints for container orchestration
- Graceful shutdown handling

### Recommended Production Setup
```
Load Balancer (AWS ALB / Nginx)
    ↓
Multiple Application Instances (Docker containers)
    ↓
External Services (Supabase, Paystack, SMTP)
```

## Support & Documentation

### Documentation Resources
- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete endpoint reference
- **Getting Started Guide**: [GETTING_STARTED.md](./GETTING_STARTED.md) - Quick start instructions
- **Architecture Summary**: [DOCUMENTATION_SUMMARY.md](./DOCUMENTATION_SUMMARY.md) - System overview

### Technical Support
For technical assistance and inquiries:
- **Email**: support@meallensai.com
- **Documentation**: https://docs.meallensai.com
- **Issue Tracking**: GitHub Issues (internal)

## Maintenance & Updates

### Version Control
- **Repository**: Git-based version control
- **Branching Strategy**: GitFlow (main, develop, feature branches)
- **Release Management**: Semantic versioning (MAJOR.MINOR.PATCH)

### Continuous Integration
Recommended CI/CD pipeline:
- Automated testing on pull requests
- Code quality checks (linting, type checking)
- Security vulnerability scanning
- Automated deployment to staging/production

---

## Quick Start Guide

### Initial Setup

1. **Install Dependencies**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
# Create .env file with required credentials
cp .env.example .env  # If example exists, or create manually
```

**Minimum Required Variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
FRONTEND_BASE_URL=http://localhost:5173
```

3. **Start Development Server**
```bash
python app.py
```

Server runs at: `http://localhost:5001`

### Testing API Endpoints

**Register a User:**
```bash
curl -X POST http://localhost:5001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "signup_type": "individual"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Get Profile (authenticated):**
```bash
curl -X GET http://localhost:5001/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Common Setup Issues

| Issue | Solution |
|-------|----------|
| "Supabase client not initialized" | Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env |
| "Payment service not available" | Optional - add PAYSTACK_SECRET_KEY or ignore |
| "Email not sent" | Optional - configure SMTP settings or ignore |
| CORS errors | Add frontend URL to ALLOWED_ORIGINS in .env |

### Production Deployment Checklist

- [ ] Use production WSGI server (Gunicorn/uWSGI)
- [ ] Set `FLASK_ENV=production`
- [ ] Configure proper ALLOWED_ORIGINS
- [ ] Enable HTTPS/TLS certificates
- [ ] Set secure cookie flags
- [ ] Configure error monitoring (Sentry)
- [ ] Set up automated backups
- [ ] Implement rate limiting
- [ ] Configure health check endpoints
- [ ] Set up log aggregation

---

## Known Issues & Technical Debt

### Critical Items
1. **Dual Subscription Services**: SubscriptionService and LifecycleSubscriptionService contain duplicate logic
2. **No Automatic Expiration**: Subscriptions/trials only expire when checked, not automatically
3. **Timezone Inconsistencies**: Mix of naive and timezone-aware datetime objects
4. **Array Index Bugs**: Missing bounds checks on `result.data[0]` accesses

### Improvement Roadmap
- **Q1 2025**: Implement caching layer, merge subscription services
- **Q2 2025**: Add background job queue, implement rate limiting
- **Q3 2025**: Migrate to async framework, add comprehensive testing
- **Q4 2025**: Microservices evaluation for high-scale deployments

---

## License

Proprietary - All Rights Reserved  
© 2025 MeallensAI. All rights reserved.

---

## Related Documentation

- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete endpoint specifications with request/response examples
- **Supabase Dashboard**: Access your database schema, RLS policies, and monitoring
- **Internal Wiki**: [Additional internal documentation links]

---

**For complete API endpoint documentation with payloads, refer to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

