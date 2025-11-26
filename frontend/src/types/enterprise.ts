/**
 * Enterprise/Organization Type Definitions
 * 
 * Key Concepts:
 * - Enterprise Owner: The user who created the enterprise (stored in enterprises.created_by)
 * - Enterprise Users: Users invited to the enterprise (stored in organization_users table)
 * - The owner is NOT in the organization_users table
 * - Only users can be invited, not other enterprises
 */

export interface EnterpriseUser {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  joined_at: string
  notes?: string
  metadata?: Record<string, any>
}

export interface EnterpriseInvitation {
  id: string
  enterprise_id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  invited_by: string
  invitation_token: string
  message?: string
  sent_at: string
  accepted_at?: string
  expires_at: string
}

export interface EnterpriseOwner {
  id: string
  email: string
  name: string
}

export interface EnterpriseStatistics {
  total_users: number
  active_users: number
  inactive_users: number
  pending_invitations: number
  accepted_invitations: number
  total_invitations: number
  max_users: number
  capacity_percentage: number
  owner_info: EnterpriseOwner
  enterprise_name: string
  organization_type: string
}

export interface Enterprise {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  organization_type: string
  created_by: string
  created_at: string
  max_users: number
  is_active: boolean
  settings?: Record<string, any>
}

export interface EnterpriseUsersResponse {
  success: boolean
  users: EnterpriseUser[]
  total_count: number
  error?: string
}

export interface EnterpriseInvitationsResponse {
  success: boolean
  invitations: EnterpriseInvitation[]
  error?: string
}

export interface EnterpriseStatisticsResponse {
  success: boolean
  statistics: EnterpriseStatistics
  error?: string
}
