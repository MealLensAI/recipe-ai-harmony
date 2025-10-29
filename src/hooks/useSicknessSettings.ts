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
    const loadSettings = async () => {
      try {
        const result = await api.getUserSettings('health_profile');
        if (result.status === 'success' && result.settings) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error('Error loading sickness settings from API:', error);
        // Fallback to localStorage for migration
        const savedSettings = localStorage.getItem('sicknessSettings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setSettings(parsed);
            // Migrate to API
            await saveSettings(parsed);
          } catch (parseError) {
            console.error('Error parsing saved sickness settings:', parseError);
          }
        }
      }
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<SicknessSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    // Also update localStorage for immediate UI updates
    localStorage.setItem('sicknessSettings', JSON.stringify(updatedSettings));
  };

  const saveSettings = async (newSettings: SicknessSettings) => {
    setLoading(true);
    try {
      // Save to API
      const result = await api.saveUserSettings('health_profile', newSettings);
      
      if (result.status === 'success') {
        setSettings(newSettings);
        // Also save to localStorage for immediate UI updates
        localStorage.setItem('sicknessSettings', JSON.stringify(newSettings));
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving sickness settings:', error);
      return { success: false, error };
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