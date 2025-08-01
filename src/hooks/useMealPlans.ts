import { useState, useEffect } from 'react';
import { useAPI } from '@/lib/api';

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
}

export interface SavedMealPlan {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  mealPlan: MealPlan[];
  createdAt: string;
  updatedAt: string;
}

export const useMealPlans = () => {
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SavedMealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const { api } = useAPI();

  // Fetch all meal plans from backend API on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const result = await api.getMealPlansFromFlask();
        
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
  }, [api]);

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

  const saveMealPlan = async (mealPlan: MealPlan[], startDate?: Date) => {
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
        updated_at: now.toISOString()
      };

      console.log('[DEBUG] Sending meal plan data:', planData);

      const result = await api.saveMealPlanToFlask(planData);

      if (result.status === 'success') {
        console.log('[DEBUG] Meal plan saved successfully:', result);
        
        // Refresh the plans list
        const refreshResult = await api.getMealPlansFromFlask();
        if (refreshResult.status === 'success' && refreshResult.meal_plans) {
          const plans = refreshResult.meal_plans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            startDate: plan.start_date,
            endDate: plan.end_date,
            mealPlan: plan.meal_plan,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
          }));
          setSavedPlans(plans);
          if (plans.length > 0) setCurrentPlan(plans[0]);
        }
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
      const planData = {
        meal_plan: mealPlan,
        updated_at: now.toISOString()
      };

      console.log('[DEBUG] Updating meal plan:', id, planData);

      const result = await api.updateMealPlanInFlask(id, planData);

      if (result.status === 'success') {
        console.log('[DEBUG] Meal plan updated successfully:', result);
        
        // Update the current plan if it's the one being updated
        if (currentPlan && currentPlan.id === id) {
          setCurrentPlan({
            ...currentPlan,
            mealPlan: mealPlan,
            updatedAt: now.toISOString()
          });
        }
        
        // Update the plans list
        const refreshResult = await api.getMealPlansFromFlask();
        if (refreshResult.status === 'success' && refreshResult.meal_plans) {
          const plans = refreshResult.meal_plans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            startDate: plan.start_date,
            endDate: plan.end_date,
            mealPlan: plan.meal_plan,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
          }));
          setSavedPlans(plans);
        }
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
      console.log('[DEBUG] Deleting meal plan:', id);

      const result = await api.deleteMealPlanFromFlask(id);

      if (result.status === 'success') {
        console.log('[DEBUG] Meal plan deleted successfully:', result);
        
        // Remove from current plan if it's the one being deleted
        if (currentPlan && currentPlan.id === id) {
          setCurrentPlan(null);
        }
        
        // Update the plans list
        const refreshResult = await api.getMealPlansFromFlask();
        if (refreshResult.status === 'success' && refreshResult.meal_plans) {
          const plans = refreshResult.meal_plans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            startDate: plan.start_date,
            endDate: plan.end_date,
            mealPlan: plan.meal_plan,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
          }));
          setSavedPlans(plans);
        }
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
    setLoading(true);
    try {
      const originalPlan = savedPlans.find(p => p.id === id);
      if (!originalPlan) {
        throw new Error('Original plan not found');
      }

      const weekDates = generateWeekDates(newStartDate);
      const planData = {
        name: weekDates.name,
        start_date: weekDates.startDate,
        end_date: weekDates.endDate,
        meal_plan: originalPlan.mealPlan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[DEBUG] Duplicating meal plan:', planData);

      const result = await api.saveMealPlanToFlask(planData);

      if (result.status === 'success') {
        console.log('[DEBUG] Meal plan duplicated successfully:', result);
        
        // Refresh the plans list
        const refreshResult = await api.getMealPlansFromFlask();
        if (refreshResult.status === 'success' && refreshResult.meal_plans) {
          const plans = refreshResult.meal_plans.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            startDate: plan.start_date,
            endDate: plan.end_date,
            mealPlan: plan.meal_plan,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
          }));
          setSavedPlans(plans);
          if (plans.length > 0) setCurrentPlan(plans[0]);
        }
      } else {
        throw new Error(result.message || 'Failed to duplicate meal plan');
      }
    } catch (error) {
      console.error('Error duplicating meal plan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearAllPlans = async () => {
    setLoading(true);
    try {
      console.log('[DEBUG] Clearing all meal plans');

      const result = await api.clearAllMealPlansFromFlask();

      if (result.status === 'success') {
        console.log('[DEBUG] All meal plans cleared successfully:', result);
        setSavedPlans([]);
        setCurrentPlan(null);
      } else {
        throw new Error(result.message || 'Failed to clear meal plans');
      }
    } catch (error) {
      console.error('Error clearing meal plans:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshMealPlans = async () => {
    setLoading(true);
    try {
      const result = await api.getMealPlansFromFlask();
      
      if (result.status === 'success' && result.meal_plans) {
        const plans = result.meal_plans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          startDate: plan.start_date,
          endDate: plan.end_date,
          mealPlan: plan.meal_plan,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at,
        }));
        setSavedPlans(plans);
        if (plans.length > 0) setCurrentPlan(plans[0]);
      } else {
        console.error('Error refreshing meal plans:', result.message);
        setSavedPlans([]);
        setCurrentPlan(null);
      }
    } catch (error) {
      console.error('Error refreshing meal plans:', error);
      setSavedPlans([]);
      setCurrentPlan(null);
    } finally {
      setLoading(false);
    }
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
    refreshMealPlans,
    generateWeekDates
  };
}; 