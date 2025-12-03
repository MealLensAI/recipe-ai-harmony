# Enterprise User Deletion and Settings History

## Overview
This document explains how user deletion and settings history tracking works in the MeallensAI enterprise system.

## Complete User Deletion

### What Happens When an Organization Deletes a User

When an enterprise admin/owner deletes a user from their organization, the system performs a **complete deletion** from the entire platform:

#### Backend Process (`backend/routes/enterprise_routes.py`)

```python
@enterprise_bp.route('/api/enterprise/user/<user_relation_id>', methods=['DELETE'])
@require_auth
def delete_organization_user(user_relation_id):
    """Delete a user from the organization"""
```

**Steps:**
1. **Verify Ownership**: Checks that the requesting user owns the enterprise
2. **Get User Details**: Fetches user information before deletion (for response)
3. **Remove from Organization**: Deletes the record from `organization_users` table
4. **Delete Auth Account**: Deletes the user's Supabase authentication account completely

**Code:**
```python
# Delete the user from the organization (this removes them from organization_users table)
delete_result = supabase.table('organization_users').delete().eq('id', user_relation_id).execute()

# Also delete the user's Supabase authentication account
try:
    # Use admin client to delete the user from Supabase Auth
    admin_supabase = get_supabase_client(use_admin=True)
    delete_auth_result = admin_supabase.auth.admin.delete_user(user_id)
    
    if delete_auth_result:
        print(f"✅ Deleted Supabase auth account for user {user_id}")
    else:
        print(f"⚠️ Failed to delete Supabase auth account for user {user_id}")
except Exception as auth_delete_error:
    print(f"⚠️ Error deleting Supabase auth account for user {user_id}: {auth_delete_error}")
    # Don't fail the entire operation if auth deletion fails
```

**Result:**
- User is removed from the `organization_users` table
- User's Supabase authentication account is **completely deleted**
- User **cannot log in** to the platform anymore
- User can be **re-invited** or **re-registered** with the same email

### Frontend Implementation

**Location:** `frontend/src/pages/EnterpriseDashboard.tsx`

**Delete Button:**
- Located in the "Members" section
- Red button next to each user's "Settings" button
- Confirmation dialog before deletion

**Code:**
```typescript
async function confirmDeleteUser() {
  if (!deleteUserId || !selectedEnterprise?.id) return;
  
  setDeletingUser(true);
  try {
    const result: any = await api.deleteEnterpriseUser(deleteUserId);
    
    if (result.success) {
      toast({
        title: "User Deleted",
        description: result.message || "User has been removed from the organization",
      });
      
      // Refresh users list
      if (selectedEnterprise.id) {
        await loadEnterpriseDetails(selectedEnterprise.id);
      }
    }
  } catch (err: any) {
    // Error handling...
  } finally {
    setDeletingUser(false);
    setDeleteUserId(null);
  }
}
```

## Settings History

### Overview
The system tracks all changes made to user health settings, including:
- Who made the change (user or admin)
- What fields were changed
- Previous and current values
- Timestamp of the change

### Database Schema

**Table:** `user_settings_history`

```sql
CREATE TABLE IF NOT EXISTS public.user_settings_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings_type TEXT NOT NULL,
    settings_data JSONB NOT NULL,
    previous_settings_data JSONB,
    changed_fields TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Backend Endpoints

#### Get Enterprise Settings History
**Endpoint:** `GET /api/enterprise/<enterprise_id>/settings-history`

**Description:** Retrieves all settings changes for all users in an enterprise

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "settings_type": "health_profile",
      "settings_data": {
        "age": 30,
        "weight": 75,
        "height": 180,
        "hasSickness": true,
        "sicknessType": "diabetes"
      },
      "previous_settings_data": {
        "age": 29,
        "weight": 73
      },
      "changed_fields": ["age", "weight", "height", "hasSickness", "sicknessType"],
      "created_at": "2025-12-03T10:30:00Z"
    }
  ]
}
```

**Code Location:** `backend/routes/enterprise_routes.py:1622-1690`

### Frontend Implementation

#### History Tab
**Location:** `frontend/src/pages/EnterpriseDashboard.tsx`

**Features:**
- Displays all settings changes for organization members
- Shows user name, email, and timestamp
- Lists changed fields as badges
- Expandable details to view current settings
- Auto-loads when "History" tab is selected

**UI Components:**
- Card layout for each history record
- Badge for changed fields
- Collapsible details section for full settings view
- Refresh button to reload history

**Code:**
```typescript
// Load settings history when history tab is activated
useEffect(() => {
  if (activeSidebarItem === "history" && selectedEnterprise?.id) {
    console.log('[EnterpriseDashboard] Loading settings history...');
    loadSettingsHistory(selectedEnterprise.id);
  }
}, [activeSidebarItem, selectedEnterprise]);

async function loadSettingsHistory(enterpriseId: string) {
  if (!enterpriseId) {
    setSettingsHistory([]);
    return;
  }
  setLoadingHistory(true);
  try {
    const res: any = await api.getEnterpriseSettingsHistory(enterpriseId);
    if (res.success) {
      setSettingsHistory(res.history || []);
      console.log('[HISTORY] Loaded settings history:', res.history?.length || 0, 'records');
    } else {
      setSettingsHistory([]);
    }
  } catch (err: any) {
    console.error('[HISTORY] Error loading settings history:', err);
    setSettingsHistory([]);
  } finally {
    setLoadingHistory(false);
  }
}
```

## Organization Can Edit Member Settings

### Overview
Enterprise admins/owners can view and edit health settings for all members in their organization.

### Backend Endpoints

#### Get User Settings
**Endpoint:** `GET /api/enterprise/<enterprise_id>/user/<user_id>/settings`

**Permissions:** Admin or Owner only

**Response:**
```json
{
  "success": true,
  "user_id": "uuid",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "settings": {
    "age": 30,
    "gender": "male",
    "height": 180,
    "weight": 75,
    "waist": 85,
    "activityLevel": "moderate",
    "goal": "maintain",
    "location": "New York",
    "hasSickness": true,
    "sicknessType": "diabetes"
  },
  "updated_at": "2025-12-03T10:30:00Z"
}
```

#### Update User Settings
**Endpoint:** `PUT /api/enterprise/<enterprise_id>/user/<user_id>/settings`

**Permissions:** Admin or Owner only

**Request Body:**
```json
{
  "settings_data": {
    "age": 31,
    "weight": 76,
    "hasSickness": true,
    "sicknessType": "diabetes type 2"
  },
  "settings_type": "health_profile"
}
```

**Features:**
- Automatically creates history record
- Tracks changed fields
- Stores previous values for comparison

#### Delete User Settings
**Endpoint:** `DELETE /api/enterprise/<enterprise_id>/user/<user_id>/settings?settings_type=health_profile`

**Permissions:** Admin or Owner only

### Frontend Implementation

**Location:** `frontend/src/pages/EnterpriseDashboard.tsx` - Settings Tab

**Features:**
1. **User Selector Dropdown**: Choose which member's settings to edit
2. **Inline Form**: Edit settings directly on the Settings page
3. **Navigation from Members**: Click "Settings" button on member card to jump to Settings page with user pre-selected

**Workflow:**
1. Admin goes to "Settings" tab
2. Selects a user from the dropdown
3. Settings are loaded and displayed in an editable form
4. Admin makes changes
5. Clicks "Save Changes"
6. Backend updates settings and creates history record
7. Success toast notification shown

**Code:**
```typescript
async function handleEditUserSettings(userId: string, userEmail: string, firstName?: string, lastName?: string) {
  if (!selectedEnterprise?.id) return;
  
  setLoadingUserSettings(true);
  setEditingUserSettings({
    userId,
    userName: firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : userEmail,
    userEmail
  });
  
  try {
    const result: any = await api.getEnterpriseUserSettings(selectedEnterprise.id, userId);
    if (result.success) {
      setUserSettingsData(result.settings || {});
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load user settings",
        variant: "destructive"
      });
      setEditingUserSettings(null);
    }
  } catch (err: any) {
    toast({
      title: "Error",
      description: err?.message || "Failed to load user settings",
      variant: "destructive"
    });
    setEditingUserSettings(null);
  } finally {
    setLoadingUserSettings(false);
  }
}

async function handleSaveUserSettings() {
  if (!selectedEnterprise?.id || !editingUserSettings) return;
  
  setLoadingUserSettings(true);
  try {
    const result: any = await api.updateEnterpriseUserSettings(
      selectedEnterprise.id,
      editingUserSettings.userId,
      userSettingsData
    );
    
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: "User settings have been updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save settings",
        variant: "destructive"
      });
    }
  } catch (err: any) {
    toast({
      title: "Error",
      description: err?.message || "Failed to save settings",
      variant: "destructive"
    });
  } finally {
    setLoadingUserSettings(false);
  }
}
```

## Navigation Structure

### Sidebar Items
1. **Overview** - Dashboard with stats, invitations, and quick actions
2. **Activity** - (Placeholder for future activity feed)
3. **Members** - List of accepted users with delete and settings buttons
4. **History** - Settings change history for all members
5. **Settings** - Organization settings and user settings editor

### User Management Flow
1. **Invite Users** → Send invitation emails
2. **Users Accept** → They create accounts and join organization
3. **View Members** → See all accepted users in "Members" tab
4. **Edit Settings** → Go to "Settings" tab, select user, edit their health profile
5. **View History** → Go to "History" tab to see all changes
6. **Delete Users** → Click delete button in "Members" tab (removes from platform completely)

## Security & Permissions

### Role-Based Access Control (RBAC)

**Owner:**
- Created the enterprise (`enterprises.created_by`)
- NOT in `organization_users` table
- Has full access to all features

**Admin:**
- In `organization_users` table with `role = 'admin'`
- Can manage users, view settings, edit settings

**Members (patient, doctor, nutritionist, client):**
- In `organization_users` table with respective role
- Can only view/edit their own settings
- Cannot access enterprise dashboard

### Permission Checks

**Function:** `check_user_is_org_admin(user_id, enterprise_id, supabase)`

**Logic:**
1. Check if user is the owner (`enterprises.created_by`)
2. If not owner, check if user is admin in `organization_users`
3. Return `(is_admin: bool, reason: str)`

**Used By:**
- Get enterprise users
- Invite users
- Delete users
- View/edit user settings
- View settings history

## Testing Checklist

- [ ] Delete a user from Members tab
- [ ] Verify user cannot log in after deletion
- [ ] Re-invite the same email
- [ ] User can register again with same email
- [ ] Edit a user's settings from Settings tab
- [ ] Verify history record is created
- [ ] View history in History tab
- [ ] Check changed fields are highlighted
- [ ] Verify only admin/owner can access these features
- [ ] Test with multiple users and multiple changes

## Future Enhancements

1. **Bulk Operations**: Delete or edit settings for multiple users at once
2. **Export History**: Download settings history as CSV/JSON
3. **Restore Settings**: Ability to restore previous settings from history
4. **Activity Feed**: Real-time feed of all organization activities
5. **Audit Log**: Complete audit trail of all admin actions
6. **User Notifications**: Notify users when their settings are changed by admin
7. **Settings Templates**: Create templates for common health profiles
8. **Comparison View**: Compare settings between different time periods

## Troubleshooting

### User Still Can Log In After Deletion
- Check backend logs for auth deletion errors
- Verify admin client has correct permissions
- Check Supabase dashboard to confirm user is deleted

### Settings History Not Showing
- Verify `user_settings_history` table exists
- Check RLS policies allow admin to read history
- Ensure settings changes are triggering history creation

### Cannot Edit User Settings
- Verify user is admin or owner
- Check `check_user_is_org_admin` function
- Ensure user is part of the organization

## Related Files

**Backend:**
- `backend/routes/enterprise_routes.py` - All enterprise endpoints
- `backend/services/supabase_service.py` - Settings save/history logic
- `backend/migrations/001_add_settings_history.sql` - History table schema

**Frontend:**
- `frontend/src/pages/EnterpriseDashboard.tsx` - Main dashboard
- `frontend/src/components/enterprise/sidebar/EntrepriseSidebar.tsx` - Navigation
- `frontend/src/lib/api.ts` - API service methods

**Documentation:**
- `docs/ENTERPRISE_USER_MANAGEMENT.md` - User management guide
- `backend/docs/API_DOCUMENTATION.md` - API reference

