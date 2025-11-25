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

const defaultEnterpriseInfo: EnterpriseInfo = {
  hasEnterprises: false,
  enterpriseCount: 0,
  isOrganizationOwner: false,
  canCreateOrganizations: false,
  enterprises: []
};

export const useEnterpriseRole = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [enterpriseInfo, setEnterpriseInfo] = useState<EnterpriseInfo>(defaultEnterpriseInfo);
  const [role, setRole] = useState<'organization' | 'individual' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const computeRole = (ownsOrganizations: boolean, canCreate: boolean) => {
    if (ownsOrganizations || canCreate) {
      return 'organization';
    }
    return 'individual';
  };

  const fetchEnterpriseAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let enterprises: any[] = [];
      let ownsOrganizations = false;

      try {
        const enterprisesResult = await api.getMyEnterprises();
        enterprises = (enterprisesResult as any).success ? ((enterprisesResult as any).enterprises || []) : [];
        ownsOrganizations = enterprises.length > 0;
      } catch (err: any) {
        console.warn('⚠️ Failed to fetch enterprises (non-critical):', err.message);
        enterprises = [];
        ownsOrganizations = false;
      }

      let canCreate = false;
      try {
        const canCreateResult = await api.canCreateOrganization();
        canCreate = (canCreateResult as any).success && (canCreateResult as any).can_create;
      } catch (err: any) {
        console.warn('⚠️ Failed to check canCreate (non-critical):', err.message);
        canCreate = false;
      }

      setEnterpriseInfo({
        hasEnterprises: ownsOrganizations,
        enterpriseCount: enterprises.length,
        isOrganizationOwner: ownsOrganizations,
        canCreateOrganizations: canCreate,
        enterprises
      });
      setRole(computeRole(ownsOrganizations, canCreate));
    } catch (err: any) {
      console.error('Error checking enterprise access:', err);
      setEnterpriseInfo(defaultEnterpriseInfo);
      setRole('individual');
      setError(err.message || 'Failed to check enterprise access');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!isAuthenticated) {
      setEnterpriseInfo(defaultEnterpriseInfo);
      setRole(null);
      setIsLoading(false);
      return;
    }

    fetchEnterpriseAccess();
  }, [authLoading, isAuthenticated, fetchEnterpriseAccess, refreshKey]);

  const refreshEnterpriseInfo = useCallback(async () => {
    setRefreshKey(Date.now());
  }, []);

  return {
    ...enterpriseInfo,
    role,
    isLoading,
    error,
    refreshEnterpriseInfo
  };
};

