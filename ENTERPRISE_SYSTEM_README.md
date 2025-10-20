# Enterprise System for MeallensAI

## Overview

The Enterprise System allows organizations (clinics, hospitals, doctors, nutritionists) to register on MeallensAI, invite users (patients/clients), and manage their nutrition plans. This is designed for healthcare providers who want to give their patients access to MeallensAI's AI-powered nutrition platform.

## Features

### For Organizations (Doctors/Clinics)

1. **Organization Registration**
   - Register your clinic, hospital, or practice
   - Specify organization type (clinic, hospital, doctor, nutritionist, wellness center)
   - Set contact information and address

2. **User Invitation System**
   - Invite users via email
   - Send personalized invitation messages
   - Track invitation status (pending, accepted, expired, cancelled)
   - Automatic email notifications

3. **User Management**
   - View all invited and enrolled users
   - Monitor user activity
   - Add notes for each user (patient notes)
   - Assign roles (patient, member, client)
   - Remove users when needed

4. **Analytics Dashboard**
   - Total users enrolled
   - Active users count
   - Pending invitations
   - Accepted invitations

### For Invited Users (Patients)

1. **Email Invitations**
   - Receive professional email invitations
   - View organization details
   - See personal messages from their healthcare provider
   - Accept or decline invitations

2. **Easy Onboarding**
   - Accept invitation via link
   - Login or create account if needed
   - Automatic enrollment in organization
   - Welcome email on acceptance

## Installation & Setup

### 1. Database Migration

Run the database migration to create the necessary tables:

```bash
# Option 1: Using Supabase Dashboard (Recommended)
# 1. Go to your Supabase Dashboard
# 2. Navigate to SQL Editor
# 3. Copy the contents of backend/scripts/019_create_enterprise_system.sql
# 4. Paste and execute

# Option 2: Using psql
psql your_database_url < backend/scripts/019_create_enterprise_system.sql

# Option 3: Using the Python script (will print instructions)
cd backend/scripts
python run_enterprise_migration.py
```

### 2. Email Configuration (Optional but Recommended)

To enable automatic email invitations, add these environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=MeallensAI
```

**Without Email Configuration:**
- The system will still work perfectly
- Invitations will be created in the database
- A modal will display the invitation link with a copy button
- You can share the link manually via email, text, WhatsApp, etc.
- Users can still register and join the organization using the link

**This is actually the recommended approach for testing and small deployments!**

#### Gmail Setup

If using Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in `SMTP_PASSWORD`

### 3. Backend Setup

The backend routes are automatically registered when the app starts. No additional configuration needed.

### 4. Frontend Setup

The frontend components and routes are automatically available:
- Enterprise Dashboard: `/enterprise`
- Accept Invitation: `/accept-invitation?token=<invitation_token>`

## Usage Guide

### For Healthcare Providers

#### 1. Register Your Organization

1. Log in to MeallensAI
2. Click on your profile menu (top right)
3. Select "My Organizations"
4. Click "Register Organization"
5. Fill in your organization details:
   - Organization name
   - Email
   - Phone (optional)
   - Address (optional)
   - Organization type
6. Submit the form

#### 2. Invite Users/Patients

1. Go to your Enterprise Dashboard (`/enterprise`)
2. Select your organization (if you have multiple)
3. Click "Invite User"
4. Enter:
   - User's email address
   - Role (patient, member, client)
   - Personal message (optional)
5. Click "Send Invitation"

The user will receive an email with:
- Organization information
- Your personal message (if provided)
- A link to accept the invitation
- Instructions on how to get started

#### 3. Manage Users

**View Users:**
- Navigate to the "Users" tab in your Enterprise Dashboard
- See all enrolled users with their status and join date
- View any notes you've added

**Track Invitations:**
- Navigate to the "Invitations" tab
- See all sent invitations and their status
- Cancel pending invitations if needed

**Add Notes:**
- Click on a user in your dashboard
- Add or edit notes (for tracking patient progress, preferences, etc.)

### For Patients/Users

#### 1. Receive Invitation

You'll receive an email invitation from your healthcare provider with:
- Information about the organization
- Personal message from your doctor/provider
- An "Accept Invitation" button
- Details about what you'll get access to

#### 2. Accept Invitation

1. Click "Accept Invitation" in the email or use the provided link
2. If you're not logged in:
   - You'll be redirected to login
   - Or create a new account if you don't have one
3. Review the invitation details
4. Click "Accept Invitation" on the page
5. You'll be enrolled and redirected to the app

#### 3. Start Using MeallensAI

Once accepted, you'll have access to:
- AI-powered food detection
- Personalized meal planning
- Nutritional analysis
- Recipe suggestions
- Your healthcare provider can monitor your progress

## API Endpoints

### Enterprise Management

#### POST `/api/enterprise/register`
Register a new enterprise/organization.

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "name": "Dr. Smith Medical Clinic",
  "email": "contact@drsmith.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State",
  "organization_type": "clinic",
  "max_users": 50
}
```

#### GET `/api/enterprise/my-enterprises`
Get all enterprises owned by the current user.

#### GET `/api/enterprise/<enterprise_id>`
Get details of a specific enterprise.

#### PUT `/api/enterprise/<enterprise_id>`
Update enterprise details.

### User Invitation

#### POST `/api/enterprise/<enterprise_id>/invite`
Invite a user to the enterprise.

**Body:**
```json
{
  "email": "patient@example.com",
  "role": "patient",
  "message": "I'm inviting you to use MeallensAI for your nutrition planning."
}
```

#### GET `/api/enterprise/<enterprise_id>/invitations`
Get all invitations for an enterprise.

#### POST `/api/enterprise/invitation/<invitation_id>/cancel`
Cancel a pending invitation.

#### GET `/api/enterprise/invitation/verify/<token>`
Verify an invitation token (public endpoint).

#### POST `/api/enterprise/invitation/accept`
Accept an invitation.

**Body:**
```json
{
  "token": "<invitation_token>"
}
```

### User Management

#### GET `/api/enterprise/<enterprise_id>/users`
Get all users in an enterprise.

#### PUT `/api/enterprise/<enterprise_id>/user/<user_relation_id>`
Update a user's relationship (status, notes, etc.).

**Body:**
```json
{
  "status": "active",
  "notes": "Patient is following meal plan well.",
  "metadata": {}
}
```

#### DELETE `/api/enterprise/<enterprise_id>/user/<user_relation_id>`
Remove a user from the enterprise.

## Database Schema

### Tables

#### `enterprises`
Stores organization information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Organization name |
| email | TEXT | Organization email (unique) |
| phone | TEXT | Contact phone |
| address | TEXT | Physical address |
| organization_type | TEXT | Type of organization |
| created_by | UUID | User who created the org |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| is_active | BOOLEAN | Active status |
| max_users | INTEGER | Maximum users allowed |
| settings | JSONB | Custom settings |

#### `organization_users`
Junction table linking users to organizations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| enterprise_id | UUID | FK to enterprises |
| user_id | UUID | FK to auth.users |
| invited_by | UUID | User who invited |
| joined_at | TIMESTAMP | When user joined |
| status | TEXT | active/inactive/suspended |
| role | TEXT | patient/member/client |
| notes | TEXT | Provider notes |
| metadata | JSONB | Additional data |

#### `invitations`
Stores user invitations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| enterprise_id | UUID | FK to enterprises |
| email | TEXT | Invitee email |
| invited_by | UUID | User who invited |
| invitation_token | TEXT | Unique token (unique) |
| status | TEXT | pending/accepted/expired/cancelled |
| sent_at | TIMESTAMP | When sent |
| expires_at | TIMESTAMP | Expiration time (7 days) |
| accepted_at | TIMESTAMP | When accepted |
| accepted_by | UUID | User who accepted |
| role | TEXT | Role being offered |
| message | TEXT | Personal message |
| metadata | JSONB | Additional data |

### Functions

#### `get_enterprise_stats(enterprise_uuid UUID)`
Returns statistics for an enterprise.

#### `accept_invitation(token TEXT, user_uuid UUID)`
Accepts an invitation and enrolls the user.

#### `user_enterprise_access(user_uuid UUID)`
Returns all enterprises a user has access to.

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies to ensure:
- Users can only see their own enterprises
- Enterprise owners can manage their organization's users
- Users can view their own memberships
- Invitation tokens are validated securely

### Authentication

All API endpoints (except invitation verification and acceptance) require JWT authentication via Bearer token.

## Troubleshooting

### Email Not Sending

**Problem:** Invitations are created but emails aren't sent.

**Solution:**
1. Check that SMTP environment variables are set
2. Verify SMTP credentials are correct
3. For Gmail, ensure you're using an App Password
4. Check backend logs for email errors
5. If email service is not configured, copy the invitation link from the API response and share manually

### Invitation Link Expired

**Problem:** User tries to accept invitation but it's expired.

**Solution:**
- Invitations expire after 7 days
- Cancel the old invitation
- Send a new invitation to the user

### User Already Member

**Problem:** Cannot accept invitation because user is already a member.

**Solution:**
- Check if the user is already enrolled in the organization
- If they need re-enrollment, remove them first, then send a new invitation

### Database Migration Errors

**Problem:** Migration script fails to run.

**Solution:**
1. Use Supabase Dashboard SQL Editor (most reliable)
2. Ensure you have admin permissions
3. Check for conflicting table names
4. Run statements one at a time if needed

## Future Enhancements

Potential features for future development:

1. **Multi-tier Subscriptions**
   - Different pricing for organizations based on user count
   - Premium features for larger organizations

2. **Patient Progress Tracking**
   - View individual patient nutrition data
   - Track meal plan adherence
   - Generate reports

3. **Bulk Invitations**
   - CSV upload for inviting multiple users
   - Template messages

4. **Integration with EHR Systems**
   - Export patient data to electronic health records
   - Two-way sync with medical systems

5. **Custom Branding**
   - Organizations can customize invitation emails
   - Add their logo and colors

6. **Role Permissions**
   - More granular permissions for different roles
   - Admin, supervisor, and viewer roles

## Support

For questions or issues:
- Check this documentation
- Review the API documentation
- Contact support at support@meallensai.com

## License

Copyright © 2025 MeallensAI. All rights reserved.

