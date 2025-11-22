# Enterprise User Management System

## Overview

This document explains how the enterprise (organization) user management system works in MealLens AI.

## Key Concepts

### 1. Enterprise Owner
- **Who**: The user who creates/registers an enterprise
- **Storage**: Stored in `enterprises.created_by` field
- **Permissions**: Full control over the enterprise
- **Important**: The owner is **NOT** stored in the `organization_users` table

### 2. Enterprise Users
- **Who**: Users invited to join the enterprise
- **Storage**: Stored in `organization_users` table
- **Permissions**: Assigned roles (admin, manager, member, viewer, etc.)
- **Important**: Only users can be invited, not other enterprises

### 3. Invitations
- **Purpose**: Invite new users to join the enterprise
- **Storage**: Stored in `invitations` table
- **Lifecycle**: pending → accepted/cancelled/expired

## Database Schema

### `enterprises` Table
```sql
- id: UUID (primary key)
- name: TEXT
- email: TEXT
- created_by: UUID (references auth.users) -- THE OWNER
- max_users: INTEGER (default 100)
- organization_type: TEXT
- created_at: TIMESTAMP
- is_active: BOOLEAN
```

### `organization_users` Table
```sql
- id: UUID (primary key)
- enterprise_id: UUID (references enterprises)
- user_id: UUID (references auth.users)
- role: TEXT (admin, manager, member, viewer, etc.)
- status: TEXT (active, inactive, suspended)
- joined_at: TIMESTAMP
- notes: TEXT
- metadata: JSONB
```

**Important**: The enterprise owner is **NOT** in this table!

### `invitations` Table
```sql
- id: UUID (primary key)
- enterprise_id: UUID (references enterprises)
- email: TEXT
- invited_by: UUID (references auth.users)
- invitation_token: TEXT (unique)
- role: TEXT
- status: TEXT (pending, accepted, cancelled, expired)
- message: TEXT
- sent_at: TIMESTAMP
- accepted_at: TIMESTAMP
- expires_at: TIMESTAMP
```

## API Endpoints

### 1. Get Enterprise Users
```
GET /api/enterprise/<enterprise_id>/users
```

**Returns**: List of users in `organization_users` table (excludes owner)

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "user-relation-id",
      "user_id": "auth-user-id",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "member",
      "status": "active",
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_count": 5
}
```

### 2. Get Enterprise Statistics
```
GET /api/enterprise/<enterprise_id>/statistics
```

**Returns**: Comprehensive statistics about the enterprise

**Response**:
```json
{
  "success": true,
  "statistics": {
    "total_users": 5,
    "active_users": 4,
    "inactive_users": 1,
    "pending_invitations": 2,
    "accepted_invitations": 3,
    "total_invitations": 5,
    "max_users": 100,
    "capacity_percentage": 5.0,
    "owner_info": {
      "id": "owner-user-id",
      "email": "owner@example.com",
      "name": "Jane Smith"
    },
    "enterprise_name": "Acme Corp",
    "organization_type": "Healthcare"
  }
}
```

### 3. Get Enterprise Invitations
```
GET /api/enterprise/<enterprise_id>/invitations
```

**Returns**: List of all invitations (pending, accepted, cancelled, expired)

### 4. Invite User
```
POST /api/enterprise/<enterprise_id>/invite
```

**Body**:
```json
{
  "email": "newuser@example.com",
  "role": "member",
  "message": "Welcome to our organization!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invitation created successfully",
  "invitation": { ... },
  "invitation_link": "https://app.com/accept-invitation?token=...",
  "email_sent": true
}
```

## Frontend Implementation

### TypeScript Types
Located in `frontend/src/types/enterprise.ts`:
- `EnterpriseUser`: User in organization_users table
- `EnterpriseInvitation`: Invitation record
- `EnterpriseStatistics`: Statistics response
- `EnterpriseOwner`: Owner information

### Key Components

#### EnterpriseDashboard
- Displays enterprise statistics
- Shows owner information
- Lists users (excludes owner)
- Lists invitations
- Manages user invitations

#### InviteUserForm
- Form to invite new users
- Validates email and role
- Sends invitation via API
- Handles email service failures

### User Count Display
```typescript
// Total users (excludes owner)
const totalUsers = statistics?.total_users ?? users.length

// Active users
const activeUsers = statistics?.active_users ?? 
  users.filter(u => u.status === 'active').length

// Pending invitations
const pendingInvitations = statistics?.pending_invitations ?? 
  invitations.filter(i => i.status === 'pending').length
```

## Business Rules

### 1. Enterprise Creation
- ✅ Any user can create an enterprise
- ✅ Creator becomes the owner
- ✅ Owner is stored in `enterprises.created_by`
- ❌ Owner is NOT added to `organization_users` table

### 2. User Invitations
- ✅ Only owner and admins can invite users
- ✅ Invitations are sent via email
- ✅ Users must accept invitation to join
- ❌ Cannot invite other enterprises
- ❌ Cannot exceed `max_users` limit

### 3. User Management
- ✅ Owner can view all users
- ✅ Owner can remove users
- ✅ Owner can update user roles
- ❌ Owner cannot remove themselves
- ❌ Users cannot invite other users (unless admin)

### 4. Statistics
- Total users = Count of `organization_users` (excludes owner)
- Active users = Users with `status='active'`
- Pending invitations = Invitations with `status='pending'`
- Capacity = (total_users / max_users) * 100

## Code Examples

### Backend: Check if User is Owner
```python
def check_user_is_org_admin(user_id: str, enterprise_id: str, supabase: Client):
    # Check if user created this organization (owner)
    enterprise_result = supabase.table('enterprises').select('id, created_by').eq('id', enterprise_id).execute()
    
    if not enterprise_result.data:
        return False, "Organization not found"
    
    enterprise = enterprise_result.data[0]
    
    # If user is the creator, they're automatically an admin
    if enterprise['created_by'] == user_id:
        return True, "User is organization owner"
    
    # Check if user is an admin member
    membership_result = supabase.table('organization_users').select('role').eq('enterprise_id', enterprise_id).eq('user_id', user_id).execute()
    
    if not membership_result.data:
        return False, "User is not a member of this organization"
    
    role = membership_result.data[0]['role']
    
    if role in ['admin', 'owner']:
        return True, f"User has {role} role"
    
    return False, f"User role '{role}' does not have permission"
```

### Frontend: Load Enterprise Data
```typescript
async function loadEnterpriseDetails(enterpriseId: string) {
  const [usersRes, invitationsRes, statsRes] = await Promise.allSettled([
    api.getEnterpriseUsers(enterpriseId),
    api.getEnterpriseInvitations(enterpriseId),
    api.getEnterpriseStatistics(enterpriseId)
  ]);
  
  // Handle responses...
  // Note: users list excludes the owner
}
```

## Testing Checklist

- [ ] Owner can create enterprise
- [ ] Owner can invite users
- [ ] Invited users receive email
- [ ] Users can accept invitation
- [ ] Accepted users appear in users list
- [ ] Owner does NOT appear in users list
- [ ] Statistics show correct counts
- [ ] Cannot exceed max_users limit
- [ ] Non-owners cannot invite users
- [ ] Owner can remove users
- [ ] Removed users cannot access enterprise

## Common Issues & Solutions

### Issue: Owner appears in user count
**Solution**: Owner is NOT in `organization_users` table. Only count records from that table.

### Issue: User count doesn't match
**Solution**: Use the statistics endpoint for accurate counts. It excludes the owner.

### Issue: Cannot invite users
**Solution**: Check if user is owner or admin using `check_user_is_org_admin()`.

### Issue: Invitation email not sent
**Solution**: Email service may be unavailable. Provide manual invitation link.

## Security Considerations

1. **Authorization**: Always verify user is owner/admin before allowing actions
2. **RLS Policies**: Supabase RLS policies should enforce enterprise isolation
3. **Token Security**: Invitation tokens should be cryptographically secure
4. **Email Validation**: Validate email format before creating invitations
5. **Rate Limiting**: Implement rate limiting on invitation endpoints

## Future Enhancements

- [ ] Bulk user invitations
- [ ] User groups/teams within enterprise
- [ ] Custom roles and permissions
- [ ] User activity tracking
- [ ] Invitation expiry notifications
- [ ] User onboarding workflow
