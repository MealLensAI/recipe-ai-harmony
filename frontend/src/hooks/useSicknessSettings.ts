import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface SicknessSettings {
  hasSickness: boolean;
  sicknessType: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  waist?: number; // in cm (measured at navel level)
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'heal' | 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness';
  location?: string;
}

export const useSicknessSettings = () => {
  const [settings, setSettings] = useState<SicknessSettings>({
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
  });
  const [loading, setLoading] = useState(false);

  // Load settings from API on mount
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      setLoading(true);
      try {
        const result = await api.getUserSettings('health_profile');
        if (isMounted) {
          if (result.status === 'success' && result.settings) {
            // Only update state if component is still mounted
            setSettings(result.settings);
            console.log('✅ Health settings loaded from backend:', result.settings);
          } else {
            // No settings found in backend - start with defaults
            console.log('No health settings found in backend, using defaults');
            // Keep default state, don't update
          }
        }
      } catch (error) {
        console.error('Error loading sickness settings from API:', error);
        // Do NOT fall back to localStorage - always use backend as source of truth
        // Keep default state on error
        if (isMounted) {
          console.log('Failed to load from backend, using default settings');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = (newSettings: Partial<SicknessSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    // Do NOT update localStorage - backend is the source of truth
  };

  const saveSettings = async (newSettings: SicknessSettings) => {
    setLoading(true);
    try {
      // Save to API - this will automatically save previous settings to history
      const result = await api.saveUserSettings('health_profile', newSettings);
      
      if (result.status === 'success') {
        // Only update local state after successful save
        setSettings(newSettings);
        // Do NOT save to localStorage - backend is the source of truth
        console.log('✅ Health settings saved to backend successfully');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('❌ Error saving sickness settings:', error);
      // Don't update local state on error - keep previous settings
      return { success: false, error: error?.message || 'Failed to save settings' };
    } finally {
      setLoading(false);
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
    if (!settings.hasSickness || !settings.age || !settings.gender || !settings.height || !settings.weight || !settings.waist || !settings.activityLevel || !settings.goal || !settings.location) {
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
    return settings.hasSickness &&
      !!settings.age &&
      !!settings.gender &&
      !!settings.height &&
      !!settings.weight &&
      !!settings.waist &&
      !!settings.activityLevel &&
      !!settings.goal &&
      !!settings.sicknessType &&
      !!settings.location;
  };

  return {
    settings,
    loading,
    updateSettings,
    saveSettings,
    getSicknessInfo,
    getHealthProfilePayload,
    isHealthProfileComplete
  };
}; 