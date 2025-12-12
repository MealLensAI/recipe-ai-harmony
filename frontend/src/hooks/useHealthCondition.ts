import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/utils';
import { api } from '@/lib/api';
import { getProductType } from '@/lib/productType';

/**
 * Hook to check if user has a health condition (sick user)
 * Returns true if user has health condition, false otherwise
 */
export const useHealthCondition = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [hasHealthCondition, setHasHealthCondition] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealthCondition = async () => {
      if (authLoading || !isAuthenticated) {
        setLoading(true);
        return;
      }

      try {
        console.log('[useHealthCondition] Checking product preference...');
        const result = await api.getProductPreference();
        console.log('[useHealthCondition] API result:', result);
        
        if (result.status === 'success' && result.preference) {
          // User has health condition if preference exists and has_health_condition is true
          const hasCondition = result.preference.has_health_condition === true;
          console.log('[useHealthCondition] User has health condition:', hasCondition, result.preference);
          setHasHealthCondition(hasCondition);
        } else {
          // No preference found in database - check localStorage as fallback
          const productType = getProductType();
          const hasConditionFromStorage = productType === 'health';
          console.log('[useHealthCondition] No DB preference found, checking localStorage:', { productType, hasConditionFromStorage });
          setHasHealthCondition(hasConditionFromStorage);
        }
      } catch (error) {
        console.error('[useHealthCondition] Error checking health condition:', error);
        // On error, check localStorage as fallback
        const productType = getProductType();
        const hasConditionFromStorage = productType === 'health';
        console.log('[useHealthCondition] Error occurred, using localStorage fallback:', { productType, hasConditionFromStorage });
        setHasHealthCondition(hasConditionFromStorage);
      } finally {
        setLoading(false);
      }
    };

    checkHealthCondition();
  }, [isAuthenticated, authLoading]);

  return {
    hasHealthCondition: hasHealthCondition === true,
    loading: loading || authLoading || hasHealthCondition === null
  };
};
