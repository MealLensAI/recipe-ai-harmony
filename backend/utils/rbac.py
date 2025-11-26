"""
Role-Based Access Control (RBAC) System for Enterprise Users

This module defines the permissions and access levels for different user roles
within an organization.

Key Concepts:
- Owner: The user who created the enterprise (stored in enterprises.created_by)
  - Has FULL access to everything
  - NOT stored in organization_users table
  
- Invited Users: Users added to organization_users table with specific roles:
  - doctor: Medical professionals who can view patient data and provide consultations
  - patient: End users who can manage their own health data
  - client: Business clients who can view reports and analytics
  - nutritionist: Nutrition experts who can create meal plans and provide guidance
"""

from enum import Enum
from typing import Set, Dict

class UserRole(str, Enum):
    """Enumeration of all possible user roles in the system"""
    OWNER = "owner"  # Enterprise owner (not in organization_users table)
    DOCTOR = "doctor"
    PATIENT = "patient"
    CLIENT = "client"
    NUTRITIONIST = "nutritionist"

class Permission(str, Enum):
    """Enumeration of all possible permissions in the system"""
    # Enterprise Management
    MANAGE_ENTERPRISE = "manage_enterprise"
    VIEW_ENTERPRISE = "view_enterprise"
    INVITE_USERS = "invite_users"
    REMOVE_USERS = "remove_users"
    VIEW_ALL_USERS = "view_all_users"
    
    # User Management
    VIEW_OWN_PROFILE = "view_own_profile"
    EDIT_OWN_PROFILE = "edit_own_profile"
    VIEW_USER_PROFILES = "view_user_profiles"
    EDIT_USER_PROFILES = "edit_user_profiles"
    
    # Health Data
    VIEW_OWN_HEALTH_DATA = "view_own_health_data"
    EDIT_OWN_HEALTH_DATA = "edit_own_health_data"
    VIEW_PATIENT_HEALTH_DATA = "view_patient_health_data"
    EDIT_PATIENT_HEALTH_DATA = "edit_patient_health_data"
    
    # Meal Plans
    CREATE_MEAL_PLANS = "create_meal_plans"
    VIEW_OWN_MEAL_PLANS = "view_own_meal_plans"
    VIEW_ALL_MEAL_PLANS = "view_all_meal_plans"
    
    # Reports & Analytics
    VIEW_REPORTS = "view_reports"
    VIEW_ANALYTICS = "view_analytics"
    EXPORT_DATA = "export_data"
    
    # Settings
    MANAGE_SETTINGS = "manage_settings"
    VIEW_SETTINGS = "view_settings"

# Define permissions for each role
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.OWNER: {
        # Owners have ALL permissions
        Permission.MANAGE_ENTERPRISE,
        Permission.VIEW_ENTERPRISE,
        Permission.INVITE_USERS,
        Permission.REMOVE_USERS,
        Permission.VIEW_ALL_USERS,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_USER_PROFILES,
        Permission.EDIT_USER_PROFILES,
        Permission.VIEW_OWN_HEALTH_DATA,
        Permission.EDIT_OWN_HEALTH_DATA,
        Permission.VIEW_PATIENT_HEALTH_DATA,
        Permission.EDIT_PATIENT_HEALTH_DATA,
        Permission.CREATE_MEAL_PLANS,
        Permission.VIEW_OWN_MEAL_PLANS,
        Permission.VIEW_ALL_MEAL_PLANS,
        Permission.VIEW_REPORTS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.MANAGE_SETTINGS,
        Permission.VIEW_SETTINGS,
    },
    
    UserRole.DOCTOR: {
        # Doctors can view and manage patient health data
        Permission.VIEW_ENTERPRISE,
        Permission.VIEW_ALL_USERS,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_USER_PROFILES,
        Permission.VIEW_OWN_HEALTH_DATA,
        Permission.EDIT_OWN_HEALTH_DATA,
        Permission.VIEW_PATIENT_HEALTH_DATA,
        Permission.EDIT_PATIENT_HEALTH_DATA,
        Permission.CREATE_MEAL_PLANS,
        Permission.VIEW_OWN_MEAL_PLANS,
        Permission.VIEW_ALL_MEAL_PLANS,
        Permission.VIEW_REPORTS,
        Permission.VIEW_SETTINGS,
    },
    
    UserRole.PATIENT: {
        # Patients can only manage their own data
        Permission.VIEW_ENTERPRISE,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_OWN_HEALTH_DATA,
        Permission.EDIT_OWN_HEALTH_DATA,
        Permission.VIEW_OWN_MEAL_PLANS,
        Permission.VIEW_SETTINGS,
    },
    
    UserRole.CLIENT: {
        # Clients can view reports and analytics
        Permission.VIEW_ENTERPRISE,
        Permission.VIEW_ALL_USERS,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_REPORTS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.VIEW_SETTINGS,
    },
    
    UserRole.NUTRITIONIST: {
        # Nutritionists can create meal plans and view patient data
        Permission.VIEW_ENTERPRISE,
        Permission.VIEW_ALL_USERS,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_USER_PROFILES,
        Permission.VIEW_OWN_HEALTH_DATA,
        Permission.EDIT_OWN_HEALTH_DATA,
        Permission.VIEW_PATIENT_HEALTH_DATA,
        Permission.CREATE_MEAL_PLANS,
        Permission.VIEW_OWN_MEAL_PLANS,
        Permission.VIEW_ALL_MEAL_PLANS,
        Permission.VIEW_SETTINGS,
    },
}

def has_permission(role: str, permission: Permission) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        role: The user's role (e.g., 'doctor', 'patient', 'owner')
        permission: The permission to check
        
    Returns:
        bool: True if the role has the permission, False otherwise
    """
    try:
        user_role = UserRole(role.lower())
        return permission in ROLE_PERMISSIONS.get(user_role, set())
    except ValueError:
        # Invalid role
        return False

def get_role_permissions(role: str) -> Set[Permission]:
    """
    Get all permissions for a specific role.
    
    Args:
        role: The user's role
        
    Returns:
        Set[Permission]: Set of permissions for the role
    """
    try:
        user_role = UserRole(role.lower())
        return ROLE_PERMISSIONS.get(user_role, set())
    except ValueError:
        return set()

def can_invite_users(role: str) -> bool:
    """Check if a role can invite users to the organization"""
    return has_permission(role, Permission.INVITE_USERS)

def can_remove_users(role: str) -> bool:
    """Check if a role can remove users from the organization"""
    return has_permission(role, Permission.REMOVE_USERS)

def can_view_patient_data(role: str) -> bool:
    """Check if a role can view patient health data"""
    return has_permission(role, Permission.VIEW_PATIENT_HEALTH_DATA)

def can_manage_enterprise(role: str) -> bool:
    """Check if a role can manage enterprise settings"""
    return has_permission(role, Permission.MANAGE_ENTERPRISE)

def is_owner(user_id: str, enterprise_created_by: str) -> bool:
    """
    Check if a user is the owner of an enterprise.
    
    Args:
        user_id: The user's ID
        enterprise_created_by: The enterprise's created_by field
        
    Returns:
        bool: True if the user is the owner
    """
    return user_id == enterprise_created_by

def get_user_role_in_enterprise(user_id: str, enterprise_created_by: str, org_user_role: str = None) -> str:
    """
    Determine a user's role in an enterprise.
    
    Args:
        user_id: The user's ID
        enterprise_created_by: The enterprise's created_by field
        org_user_role: The user's role from organization_users table (if any)
        
    Returns:
        str: The user's role ('owner' or the role from organization_users)
    """
    if is_owner(user_id, enterprise_created_by):
        return UserRole.OWNER.value
    return org_user_role or "unknown"
