-- Enterprise System for Organizations (Doctors/Clinics)
-- This allows organizations to invite and manage users (patients)

-- Create enterprises table
CREATE TABLE IF NOT EXISTS public.enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    organization_type TEXT DEFAULT 'clinic', -- clinic, hospital, doctor, nutritionist
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    subscription_plan TEXT DEFAULT 'trial', -- trial, basic, premium
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    max_users INTEGER DEFAULT 10, -- Maximum users they can invite
    settings JSONB DEFAULT '{}'::jsonb -- Store custom settings
);

-- Create organization_users junction table (users managed by enterprises)
CREATE TABLE IF NOT EXISTS public.organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active', -- active, inactive, suspended
    role TEXT DEFAULT 'patient', -- patient, member, client
    notes TEXT, -- For doctor notes about patient
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(enterprise_id, user_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NOT NULL REFERENCES public.enterprises(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, expired, cancelled
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES auth.users(id),
    role TEXT DEFAULT 'patient',
    message TEXT, -- Optional personal message from inviter
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enterprises_created_by ON public.enterprises(created_by);
CREATE INDEX IF NOT EXISTS idx_enterprises_is_active ON public.enterprises(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_users_enterprise_id ON public.organization_users(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_status ON public.organization_users(status);
CREATE INDEX IF NOT EXISTS idx_invitations_enterprise_id ON public.invitations(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Enterprises: Users can view/edit their own enterprises
CREATE POLICY "Users can view their own enterprises" ON public.enterprises
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create enterprises" ON public.enterprises
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own enterprises" ON public.enterprises
    FOR UPDATE USING (auth.uid() = created_by);

-- Organization users: Enterprise owners can view their organization's users
CREATE POLICY "Enterprise owners can view their users" ON public.organization_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enterprises 
            WHERE id = organization_users.enterprise_id 
            AND created_by = auth.uid()
        )
    );

-- Users can view their own organization memberships
CREATE POLICY "Users can view their own memberships" ON public.organization_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Enterprise owners can manage users" ON public.organization_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.enterprises 
            WHERE id = organization_users.enterprise_id 
            AND created_by = auth.uid()
        )
    );

-- Invitations: Enterprise owners can manage invitations
CREATE POLICY "Enterprise owners can view invitations" ON public.invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enterprises 
            WHERE id = invitations.enterprise_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Enterprise owners can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.enterprises 
            WHERE id = invitations.enterprise_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Enterprise owners can update invitations" ON public.invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.enterprises 
            WHERE id = invitations.enterprise_id 
            AND created_by = auth.uid()
        )
    );

-- Anyone with the token can view the invitation (for acceptance page)
CREATE POLICY "Anyone with token can view invitation" ON public.invitations
    FOR SELECT USING (TRUE);

-- Helper function to get enterprise statistics
CREATE OR REPLACE FUNCTION get_enterprise_stats(enterprise_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', COUNT(DISTINCT ou.user_id),
        'active_users', COUNT(DISTINCT ou.user_id) FILTER (WHERE ou.status = 'active'),
        'pending_invitations', COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'pending'),
        'accepted_invitations', COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'accepted')
    )
    INTO result
    FROM public.enterprises e
    LEFT JOIN public.organization_users ou ON e.id = ou.enterprise_id
    LEFT JOIN public.invitations i ON e.id = i.enterprise_id
    WHERE e.id = enterprise_uuid
    GROUP BY e.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(token TEXT, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
    result JSON;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE invitation_token = token
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Invalid or expired invitation');
    END IF;
    
    -- Check if user is already part of this organization
    IF EXISTS (
        SELECT 1 FROM public.organization_users
        WHERE enterprise_id = invitation_record.enterprise_id
        AND user_id = user_uuid
    ) THEN
        RETURN json_build_object('success', false, 'message', 'You are already a member of this organization');
    END IF;
    
    -- Update invitation status
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = user_uuid
    WHERE id = invitation_record.id;
    
    -- Add user to organization
    INSERT INTO public.organization_users (
        enterprise_id,
        user_id,
        invited_by,
        role,
        status
    ) VALUES (
        invitation_record.enterprise_id,
        user_uuid,
        invitation_record.invited_by,
        invitation_record.role,
        'active'
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation accepted successfully',
        'enterprise_id', invitation_record.enterprise_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to enterprise features
CREATE OR REPLACE FUNCTION user_enterprise_access(user_uuid UUID)
RETURNS TABLE (
    enterprise_id UUID,
    enterprise_name TEXT,
    role TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as enterprise_id,
        e.name as enterprise_name,
        CASE 
            WHEN e.created_by = user_uuid THEN 'owner'
            ELSE ou.role
        END as role,
        e.created_by = user_uuid as is_owner
    FROM public.enterprises e
    LEFT JOIN public.organization_users ou ON e.id = ou.enterprise_id AND ou.user_id = user_uuid
    WHERE e.created_by = user_uuid
       OR ou.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enterprises_updated_at
    BEFORE UPDATE ON public.enterprises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- UNCOMMENT FOR TESTING ONLY
/*
INSERT INTO public.enterprises (name, email, organization_type, max_users)
VALUES 
    ('Dr. Smith Medical Clinic', 'contact@drsmith.com', 'clinic', 50),
    ('City Hospital Nutrition Dept', 'nutrition@cityhospital.com', 'hospital', 100);
*/

