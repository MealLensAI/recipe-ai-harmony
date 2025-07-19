import { useState, useEffect } from 'react';
import { api } from '../lib/api';

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

  // Fetch all meal plans from backend API on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const response = await api.getMealPlans();
        if (response.status === 'success' && response.data) {
          const plans = response.data.map((plan: any) => ({
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
        updated_at: now.toISOString(),
      };
      
      const response = await api.saveMealPlan(planData);
      if (response.status === 'success' && response.data) {
        const newPlan: SavedMealPlan = {
          id: response.data.id,
          name: response.data.name,
          startDate: response.data.start_date,
          endDate: response.data.end_date,
          mealPlan: response.data.meal_plan,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
        };
        setSavedPlans(prev => [newPlan, ...prev]);
        setCurrentPlan(newPlan);
        return newPlan;
      } else {
        throw new Error(response.message || 'Failed to save meal plan');
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
      const response = await api.updateMealPlan(id, { 
        meal_plan: mealPlan, 
        updated_at: now.toISOString() 
      });
      if (response.status === 'success' && response.data) {
        setSavedPlans(prev => prev.map(plan => plan.id === id ? {
          ...plan,
          mealPlan: response.data.meal_plan,
          updatedAt: response.data.updated_at,
        } : plan));
        setCurrentPlan(prev => prev?.id === id ? {
          ...prev,
          mealPlan: response.data.meal_plan,
          updatedAt: response.data.updated_at,
        } : prev);
      } else {
        throw new Error(response.message || 'Failed to update meal plan');
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
      const response = await api.deleteMealPlan(id);
      if (response.status === 'success') {
        const remainingPlans = savedPlans.filter(plan => plan.id !== id);
        setSavedPlans(remainingPlans);
        if (remainingPlans.length > 0) {
          setCurrentPlan(remainingPlans[0]);
        } else {
          setCurrentPlan(null);
        }
      } else {
        throw new Error(response.message || 'Failed to delete meal plan');
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
      updated_at: now.toISOString(),
    };
    
    const response = await api.saveMealPlan(planData);
    if (response.status === 'success' && response.data) {
      const duplicatedPlan: SavedMealPlan = {
        id: response.data.id,
        name: response.data.name,
        startDate: response.data.start_date,
        endDate: response.data.end_date,
        mealPlan: response.data.meal_plan,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
      };
      setSavedPlans(prev => [duplicatedPlan, ...prev]);
      setCurrentPlan(duplicatedPlan);
      return duplicatedPlan;
    } else {
      throw new Error(response.message || 'Failed to duplicate meal plan');
    }
  };

  const clearAllPlans = async () => {
    setLoading(true);
    try {
      const response = await api.clearMealPlans();
      if (response.status === 'success') {
        setSavedPlans([]);
        setCurrentPlan(null);
      } else {
        throw new Error(response.message || 'Failed to clear meal plans');
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
      const response = await api.getMealPlans();
      if (response.status === 'success' && response.data) {
        const plans = response.data.map((plan: any) => ({
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