-- ═══════════════════════════════════════════════════════════════════
-- ADD ORGANIZATION TIME RESTRICTIONS
-- ═══════════════════════════════════════════════════════════════════
-- This migration adds time restrictions for organization users
-- Organizations can set allowed usage hours for their users

-- Add time restriction columns to organization_users table
ALTER TABLE public.organization_users
ADD COLUMN IF NOT EXISTS allowed_start_time TIME DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS allowed_end_time TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS restrictions_enabled BOOLEAN DEFAULT FALSE;

-- Add time restrictions to enterprises table (organization-wide defaults)
ALTER TABLE public.enterprises
ADD COLUMN IF NOT EXISTS default_start_time TIME DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS default_end_time TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS default_timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS time_restrictions_enabled BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_org_users_restrictions ON public.organization_users(enterprise_id, restrictions_enabled);

-- Add comment
COMMENT ON COLUMN public.organization_users.allowed_start_time IS 'Start time when user can access the app (in user timezone)';
COMMENT ON COLUMN public.organization_users.allowed_end_time IS 'End time when user can access the app (in user timezone)';
COMMENT ON COLUMN public.organization_users.timezone IS 'Timezone for the time restrictions (e.g., America/New_York)';
COMMENT ON COLUMN public.organization_users.restrictions_enabled IS 'Whether time restrictions are enabled for this user';
COMMENT ON COLUMN public.enterprises.default_start_time IS 'Default start time for all users in this organization';
COMMENT ON COLUMN public.enterprises.default_end_time IS 'Default end time for all users in this organization';
COMMENT ON COLUMN public.enterprises.default_timezone IS 'Default timezone for the organization';
COMMENT ON COLUMN public.enterprises.time_restrictions_enabled IS 'Whether time restrictions are enabled organization-wide';

