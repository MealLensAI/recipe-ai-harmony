import { useState, useEffect } from 'react';
import { useAPI, APIError } from '../lib/api';

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
  const [error, setError] = useState<string | null>(null);
  const { api, isAuthenticated } = useAPI();

  // Fetch all meal plans from backend on mount
  useEffect(() => {
    const fetchPlans = async () => {
      if (!isAuthenticated) {
        setSavedPlans([]);
        setCurrentPlan(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await api.getMealPlans();
        
        if (result.status === 'success') {
          const plans = (result.data?.meal_plan_management || []).map((plan: any) => ({
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
          setSavedPlans([]);
          setCurrentPlan(null);
          setError(result.message || 'Failed to load meal plans');
        }
      } catch (err) {
        setSavedPlans([]);
        setCurrentPlan(null);
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('Failed to load meal plans. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isAuthenticated, api]);

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
    setError(null);
    
    try {
      const now = new Date();
      const weekDates = startDate ? generateWeekDates(startDate) : generateWeekDates(now);
      const planData = {
        name: weekDates.name,
        startDate: weekDates.startDate,
        endDate: weekDates.endDate,
        mealPlan,
      };
      
      const result = await api.saveMealPlan(planData);
      
      if (result.status !== 'success') {
        throw new APIError(result.message || 'Failed to save meal plan', 0);
      }
      
      await refreshMealPlans();
      return savedPlans[0];
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to save meal plan. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMealPlan = async (id: string, mealPlan: MealPlan[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const result = await api.updateMealPlan(id, { 
        meal_plan: mealPlan, 
        updated_at: now.toISOString() 
      });
      
      if (result.status !== 'success') {
        throw new APIError(result.message || 'Failed to update meal plan', 0);
      }
      
      await refreshMealPlans();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to update meal plan. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMealPlan = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.deleteMealPlan(id);
      
      if (result.status !== 'success') {
        throw new APIError(result.message || 'Failed to delete meal plan', 0);
      }
      
      await refreshMealPlans();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to delete meal plan. Please try again.');
      }
      throw err;
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
    
    setLoading(true);
    setError(null);
    
    try {
      const weekDates = generateWeekDates(newStartDate);
      const now = new Date();
      const planData = {
        name: weekDates.name,
        startDate: weekDates.startDate,
        endDate: weekDates.endDate,
        mealPlan: originalPlan.mealPlan,
      };
      
      const result = await api.saveMealPlan(planData);
      
      if (result.status !== 'success') {
        throw new APIError(result.message || 'Failed to duplicate meal plan', 0);
      }
      
      await refreshMealPlans();
      return savedPlans[0];
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to duplicate meal plan. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearAllPlans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.clearMealPlans();
      
      if (result.status !== 'success') {
        throw new APIError(result.message || 'Failed to clear meal plans', 0);
      }
      
      setSavedPlans([]);
      setCurrentPlan(null);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to clear meal plans. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshMealPlans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.getMealPlans();
      
      if (result.status === 'success') {
        const plans = (result.data?.meal_plan_management || []).map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          startDate: plan.start_date,
          endDate: plan.end_date,
          mealPlan: plan.meal_plan,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at,
        }));
        setSavedPlans(plans);
        setCurrentPlan(plans.length > 0 ? plans[0] : null);
      } else {
        setSavedPlans([]);
        setCurrentPlan(null);
        setError(result.message || 'Failed to refresh meal plans');
      }
    } catch (err) {
      setSavedPlans([]);
      setCurrentPlan(null);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to refresh meal plans. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    savedPlans,
    currentPlan,
    loading,
    error,
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