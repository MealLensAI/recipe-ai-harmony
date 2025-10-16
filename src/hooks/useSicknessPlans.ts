import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/lib/config';
import { safeGetItem } from '@/lib/utils';

export interface MealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  breakfast_ingredients?: string[];
  lunch_ingredients?: string[];
  dinner_ingredients?: string[];
  snack_ingredients?: string[];
  // Enhanced nutritional information
  breakfast_name?: string;
  breakfast_calories?: number;
  breakfast_protein?: number;
  breakfast_carbs?: number;
  breakfast_fat?: number;
  breakfast_benefit?: string;
  lunch_name?: string;
  lunch_calories?: number;
  lunch_protein?: number;
  lunch_carbs?: number;
  lunch_fat?: number;
  lunch_benefit?: string;
  dinner_name?: string;
  dinner_calories?: number;
  dinner_protein?: number;
  dinner_carbs?: number;
  dinner_fat?: number;
  dinner_benefit?: string;
  snack_name?: string;
  snack_calories?: number;
  snack_protein?: number;
  snack_carbs?: number;
  snack_fat?: number;
  snack_benefit?: string;
}

export interface HealthAssessment {
  bmi: number;
  bmi_category: string;
  bmr: number;
  daily_calories: number;
}

export interface SavedMealPlan {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  mealPlan: MealPlan[];
  createdAt: string;
  updatedAt: string;
  healthAssessment?: HealthAssessment; // Added for medical-grade plans
  userInfo?: any; // Store user health profile
}

export const useSicknessPlans = () => {
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SavedMealPlan | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all meal plans from backend API on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const token = safeGetItem('access_token');
        const response = await fetch(`${APP_CONFIG.api.base_url}/api/sickness_plan`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log('[DEBUG] Received meal plans response:', result);

        if (result.status === 'success' && result.meal_plans) {
          const plans = result.meal_plans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            startDate: plan.start_date,
            endDate: plan.end_date,
            mealPlan: plan.meal_plan,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
            healthAssessment: plan.health_assessment,
            userInfo: plan.user_info
          }));
          console.log('[DEBUG] Processed meal plans:', plans);
          setSavedPlans(plans);
          if (plans.length > 0) setCurrentPlan(plans[0]);
        } else {
          console.error('Error fetching meal plans:', result.message);
          setSavedPlans([]);
          setCurrentPlan(null);
        }
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        setSavedPlans([]);
        setCurrentPlan(null);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const generateWeekDates = (startDate: Date): { startDate: string; endDate: string; name: string } => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      name: `${formatDate(startDate)} - ${formatDate(endDate)}`
    };
  };

  const saveMealPlan = async (mealPlan: MealPlan[], startDate?: Date, healthAssessment?: HealthAssessment, userInfo?: any) => {
    setLoading(true);
    try {
      const now = new Date();
      const weekDates = startDate ? generateWeekDates(startDate) : generateWeekDates(now);

      const planData = {
        name: weekDates.name,
        start_date: weekDates.startDate,
        end_date: weekDates.endDate,
        meal_plan: mealPlan,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        health_assessment: healthAssessment,
        user_info: userInfo
      };

      console.log('[DEBUG] Sending meal plan data:', planData);

      const token = safeGetItem('access_token');
      console.log('[DEBUG] Using access token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

      const response = await fetch(`${APP_CONFIG.api.base_url}/api/meal_plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(planData)
      });

      if (!response.ok) {
        // Try to parse the error message from the response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse the response as JSON, use the generic error
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const newPlan: SavedMealPlan = {
          id: result.data.id,
          name: result.data.name,
          startDate: result.data.startDate,
          endDate: result.data.endDate,
          mealPlan: result.data.mealPlan,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
          healthAssessment: result.data.healthAssessment,
          userInfo: result.data.userInfo
        };
        setSavedPlans(prev => [newPlan, ...prev]);
        setCurrentPlan(newPlan);
        return newPlan;
      } else {
        throw new Error(result.message || 'Failed to save meal plan');
      }
    } catch (error) {
      console.error('Error saving meal plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMealPlan = async (id: string, mealPlan: MealPlan[]) => {
    setLoading(true);
    try {
      const now = new Date();
      const token = safeGetItem('access_token');
      const response = await fetch(`${APP_CONFIG.api.base_url}/api/sickness_plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          meal_plan: mealPlan,
          updated_at: now.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        // Update local state
        setSavedPlans(prev => prev.map(plan => plan.id === id ? {
          ...plan,
          mealPlan: mealPlan,
          updatedAt: now.toISOString(),
        } : plan));
        setCurrentPlan(prev => prev?.id === id ? {
          ...prev,
          mealPlan: mealPlan,
          updatedAt: now.toISOString(),
        } : prev);
      } else {
        throw new Error(result.message || 'Failed to update meal plan');
      }
    } catch (error) {
      console.error('Error updating meal plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMealPlan = async (id: string) => {
    setLoading(true);
    try {
      const token = safeGetItem('access_token');
      const response = await fetch(`${APP_CONFIG.api.base_url}/api/sickness_plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        setSavedPlans(prev => {
          const remainingPlans = prev.filter(plan => plan.id !== id);
          setCurrentPlan(remainingPlans.length > 0 ? remainingPlans[0] : null);
          return remainingPlans;
        });
      } else {
        throw new Error(result.message || 'Failed to delete meal plan');
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectMealPlan = (id: string) => {
    const plan = savedPlans.find(p => p.id === id);
    if (plan) {
      setCurrentPlan(plan);
    }
  };

  const duplicateMealPlan = async (id: string, newStartDate: Date) => {
    const originalPlan = savedPlans.find(p => p.id === id);
    if (!originalPlan) return;

    const weekDates = generateWeekDates(newStartDate);
    const now = new Date();

    const planData = {
      name: weekDates.name,
      start_date: weekDates.startDate,
      end_date: weekDates.endDate,
      meal_plan: originalPlan.mealPlan,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const token = safeGetItem('access_token');
    const response = await fetch(`${APP_CONFIG.api.base_url}/api/meal_plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify(planData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success' && result.data) {
      const duplicatedPlan: SavedMealPlan = {
        id: result.data.id,
        name: result.data.name,
        startDate: result.data.startDate,
        endDate: result.data.endDate,
        mealPlan: result.data.mealPlan,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      };
      setSavedPlans(prev => [duplicatedPlan, ...prev]);
      setCurrentPlan(duplicatedPlan);
      return duplicatedPlan;
    } else {
      throw new Error(result.message || 'Failed to duplicate meal plan');
    }
  };

  const clearAllPlans = async () => {
    setLoading(true);
    try {
      const token = safeGetItem('access_token');
      const response = await fetch(`${APP_CONFIG.api.base_url}/api/sickness_plans/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        setSavedPlans([]);
        setCurrentPlan(null);
      } else {
        throw new Error(result.message || 'Failed to clear meal plans');
      }
    } catch (error) {
      console.error('Error clearing all meal plans:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshMealPlans = async () => {
    setLoading(true);
    try {
      const token = safeGetItem('access_token');
      const response = await fetch(`${APP_CONFIG.api.base_url}/api/meal_plan`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.meal_plans) {
        const plans = result.meal_plans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          startDate: plan.start_date,
          endDate: plan.end_date,
          mealPlan: plan.meal_plan,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at,
          healthAssessment: plan.health_assessment,
          userInfo: plan.user_info
        }));
        setSavedPlans(plans);
        setCurrentPlan(plans.length > 0 ? plans[0] : null);
      } else {
        setSavedPlans([]);
        setCurrentPlan(null);
      }
    } catch (error) {
      console.error('Error refreshing meal plans:', error);
      setSavedPlans([]);
      setCurrentPlan(null);
    }
    setLoading(false);
  };

  return {
    savedPlans,
    currentPlan,
    loading,
    saveMealPlan,
    updateMealPlan,
    deleteMealPlan,
    selectMealPlan,
    duplicateMealPlan,
    clearAllPlans,
    generateWeekDates,
    refreshMealPlans,
  };
}; 