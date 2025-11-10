import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/utils';

interface EnterpriseInfo {
  hasEnterprises: boolean;
  enterpriseCount: number;
  isOrganizationOwner: boolean;
  canCreateOrganizations: boolean;
  enterprises: any[];
}

/**
 * Hook to check if user has enterprise/organization access
 * This determines if enterprise features should be shown in the UI
 * 
 * IMPORTANT: Only makes API calls when user is authenticated
 * to prevent 401 errors that would trigger logout
 * 
 * STRICT RULES:
 * - Regular users (invited members) should NOT see enterprise features
 * - Only organization OWNERS can see enterprise features
 * - Users who can create organizations (not invited members) can see creation option
 */
export const useEnterpriseRole = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [enterpriseInfo, setEnterpriseInfo] = useState<EnterpriseInfo>({
    hasEnterprises: false,
    enterpriseCount: 0,
    isOrganizationOwner: false,
    canCreateOrganizations: false,
    enterprises: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkEnterpriseAccess = useCallback(async () => {
    // Don't check if not authenticated or still loading auth
    if (!isAuthenticated || authLoading) {
      console.log('⏸️ useEnterpriseRole: Skipping check (not authenticated or auth loading)');
      setEnterpriseInfo({
        hasEnterprises: false,
        enterpriseCount: 0,
        isOrganizationOwner: false,
        canCreateOrganizations: false,
        enterprises: []
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 useEnterpriseRole: Checking enterprise access');

      // Get user's enterprises FIRST (owned organizations)
      // Handle errors gracefully - don't let enterprise errors break the app
      let enterprises: any[] = [];
      let ownsOrganizations = false;
      
      try {
        const enterprisesResult = await api.getMyEnterprises();
        enterprises = (enterprisesResult as any).success ? ((enterprisesResult as any).enterprises || []) : [];
        ownsOrganizations = enterprises.length > 0;
      } catch (err: any) {
        console.warn('⚠️ Failed to fetch enterprises (non-critical):', err.message);
        // Default to no organizations - don't break the app
        enterprises = [];
        ownsOrganizations = false;
      }

      // Check if user can create organizations
      let canCreate = false;
      
      try {
        const canCreateResult = await api.canCreateOrganization();
        canCreate = (canCreateResult as any).success && (canCreateResult as any).can_create;
      } catch (err: any) {
        console.warn('⚠️ Failed to check canCreate (non-critical):', err.message);
        // Default to false - don't break the app
        canCreate = false;
      }

      console.log('✅ useEnterpriseRole: Got results', {
        ownsOrganizations,
        enterpriseCount: enterprises.length,
        canCreate
      });

      // STRICT LOGIC:
      // Only show enterprise features if:
      // 1. User OWNS organizations (hasEnterprises = true)
      // 2. User CAN create organizations (not an invited member)
      // Regular invited members: ownsOrganizations = false, canCreate = false
      
      const shouldShowEnterpriseFeatures = ownsOrganizations || canCreate;

      console.log('🔐 Enterprise Access Decision:', {
        shouldShowEnterpriseFeatures,
        reason: ownsOrganizations ? 'Owns organizations' : canCreate ? 'Can create organizations' : 'No access'
      });

      setEnterpriseInfo({
        hasEnterprises: ownsOrganizations,
        enterpriseCount: enterprises.length,
        isOrganizationOwner: ownsOrganizations,
        canCreateOrganizations: canCreate,
        enterprises: enterprises
      });
    } catch (err: any) {
      console.error('Error checking enterprise access:', err);
      setError(err.message || 'Failed to check enterprise access');
      // Default to no access on error
      setEnterpriseInfo({
        hasEnterprises: false,
        enterpriseCount: 0,
        isOrganizationOwner: false,
        canCreateOrganizations: false,
        enterprises: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    checkEnterpriseAccess();
  }, [checkEnterpriseAccess]);

  const refreshEnterpriseInfo = useCallback(() => {
    return checkEnterpriseAccess();
  }, [checkEnterpriseAccess]);

  return {
    ...enterpriseInfo,
    isLoading,
    error,
    refreshEnterpriseInfo
  };
};

