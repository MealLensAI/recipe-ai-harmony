import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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
 */
export const useEnterpriseRole = () => {
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
    try {
      setIsLoading(true);
      setError(null);

      // Check if user can create organizations
      const canCreateResult = await api.canCreateOrganization();
      const canCreate = canCreateResult.success && canCreateResult.can_create;

      // Get user's enterprises
      const enterprisesResult = await api.getMyEnterprises();
      const enterprises = enterprisesResult.success ? (enterprisesResult.enterprises || []) : [];

      setEnterpriseInfo({
        hasEnterprises: enterprises.length > 0,
        enterpriseCount: enterprises.length,
        isOrganizationOwner: enterprises.length > 0,
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
  }, []);

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

