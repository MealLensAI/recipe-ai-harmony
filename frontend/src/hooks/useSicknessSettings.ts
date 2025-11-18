import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/utils';

export interface SicknessSettings {
  hasSickness: boolean;
  sicknessType: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  waist?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'heal' | 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness';
  location?: string;
}

const DEFAULT_SETTINGS: SicknessSettings = {
  hasSickness: false,
  sicknessType: '',
  age: undefined,
  gender: undefined,
  height: undefined,
  weight: undefined,
  waist: undefined,
  activityLevel: undefined,
  goal: undefined,
  location: undefined
};

const createEmptySettings = (): SicknessSettings => ({
  ...DEFAULT_SETTINGS
});

const normalizeSettings = (incoming?: Partial<SicknessSettings> | null): SicknessSettings => ({
  ...DEFAULT_SETTINGS,
  ...(incoming || {})
});

export const useSicknessSettings = () => {
  const [settings, setSettings] = useState<SicknessSettings>(createEmptySettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMountedRef = useRef(true);
  const lastSavedRef = useRef<SicknessSettings>(createEmptySettings());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadSettingsFromBackend = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      if (isMountedRef.current) {
        const emptySettings = createEmptySettings();
        setSettings(emptySettings);
        lastSavedRef.current = emptySettings;
        setHasExistingData(false);
        setLoading(false);
        setIsReady(true);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const result = await api.getUserSettings('health_profile');
      if (!isMountedRef.current) return;

      const hasData =
        result.status === 'success' &&
        typeof result.settings === 'object' &&
        result.settings !== null &&
        Object.keys(result.settings).length > 0;

      if (hasData) {
        const normalized = normalizeSettings(result.settings);
        setSettings(normalized);
        lastSavedRef.current = normalized;
        setHasExistingData(true);
        console.log('✅ Health settings loaded from backend:', normalized);
      } else {
        console.log('No health settings found in backend, using defaults');
        const emptySettings = createEmptySettings();
        setSettings(emptySettings);
        lastSavedRef.current = emptySettings;
        setHasExistingData(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading sickness settings from API:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsReady(true);
      }
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    loadSettingsFromBackend();
  }, [loadSettingsFromBackend]);

  const updateSettings = (newSettings: Partial<SicknessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToLastSaved = useCallback(() => {
    setSettings({ ...lastSavedRef.current });
  }, []);

  const saveSettings = async (newSettings: SicknessSettings) => {
    const payload = normalizeSettings(newSettings);
    setSaving(true);
    try {
      const result = await api.saveUserSettings('health_profile', payload);

      if (result.status === 'success') {
        lastSavedRef.current = payload;
        setSettings(payload);
        setHasExistingData(true);
        console.log('✅ Health settings saved to backend successfully');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('❌ Error saving sickness settings:', error);
      return { success: false, error: error?.message || 'Failed to save settings' };
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
        setIsReady(true);
      }
    }
  };

  const getSicknessInfo = () => {
    if (!settings.hasSickness) {
      return null;
    }
    return {
      hasSickness: true,
      sicknessType: settings.sicknessType,
      age: settings.age,
      gender: settings.gender,
      height: settings.height,
      weight: settings.weight,
      waist: settings.waist,
      activityLevel: settings.activityLevel,
      goal: settings.goal,
      location: settings.location
    };
  };

  const getHealthProfilePayload = () => {
    if (
      !settings.hasSickness ||
      !settings.age ||
      !settings.gender ||
      !settings.height ||
      !settings.weight ||
      !settings.waist ||
      !settings.activityLevel ||
      !settings.goal ||
      !settings.location
    ) {
      return null;
    }
    return {
      age: settings.age,
      weight: settings.weight,
      height: settings.height,
      waist: settings.waist,
      gender: settings.gender,
      activity_level: settings.activityLevel,
      condition: settings.sicknessType,
      goal: settings.goal,
      location: settings.location
    };
  };

  const isHealthProfileComplete = () => {
    return (
      settings.hasSickness &&
      !!settings.age &&
      !!settings.gender &&
      !!settings.height &&
      !!settings.weight &&
      !!settings.waist &&
      !!settings.activityLevel &&
      !!settings.goal &&
      !!settings.sicknessType &&
      !!settings.location
    );
  };

  return {
    settings,
    loading,
    saving,
    updateSettings,
    saveSettings,
    resetToLastSaved,
    hasExistingData,
    getSicknessInfo,
    getHealthProfilePayload,
    isHealthProfileComplete,
    isReady
  };
};
