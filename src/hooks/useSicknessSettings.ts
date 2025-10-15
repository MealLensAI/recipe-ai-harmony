import { useState, useEffect } from 'react';

export interface SicknessSettings {
  hasSickness: boolean;
  sicknessType: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'heal' | 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness';
}

export const useSicknessSettings = () => {
  const [settings, setSettings] = useState<SicknessSettings>({
    hasSickness: false,
    sicknessType: '',
    age: undefined,
    gender: undefined,
    height: undefined,
    weight: undefined,
    activityLevel: undefined,
    goal: undefined
  });
  const [loading, setLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('sicknessSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        } catch (error) {
          console.error('Error parsing saved sickness settings:', error);
        }
      }
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<SicknessSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('sicknessSettings', JSON.stringify(updatedSettings));
  };

  const saveSettings = async (newSettings: SicknessSettings) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('sicknessSettings', JSON.stringify(newSettings));
      setSettings(newSettings);

      // TODO: Save to backend API when endpoint is available
      // const response = await fetch('http://127.0.0.1:5000/api/settings/sickness', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      //   },
      //   body: JSON.stringify(newSettings)
      // });

      return { success: true };
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
      activityLevel: settings.activityLevel,
      goal: settings.goal
    };
  };

  const getHealthProfilePayload = () => {
    if (!settings.hasSickness || !settings.age || !settings.gender || !settings.height || !settings.weight || !settings.activityLevel || !settings.goal) {
      return null;
    }
    return {
      age: settings.age,
      weight: settings.weight,
      height: settings.height,
      gender: settings.gender,
      activity_level: settings.activityLevel,
      condition: settings.sicknessType,
      goal: settings.goal
    };
  };

  const isHealthProfileComplete = () => {
    return settings.hasSickness &&
      !!settings.age &&
      !!settings.gender &&
      !!settings.height &&
      !!settings.weight &&
      !!settings.activityLevel &&
      !!settings.goal &&
      !!settings.sicknessType;
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