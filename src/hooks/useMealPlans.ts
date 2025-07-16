import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  // Fetch all meal plans from Supabase on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_plan_management')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('Error fetching meal plans:', error);
        setSavedPlans([]);
        setCurrentPlan(null);
      } else {
        const plans = (data || []).map((plan: any) => ({
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
      const { data, error } = await supabase
        .from('meal_plan_management')
        .insert([
          {
            name: weekDates.name,
            start_date: weekDates.startDate,
            end_date: weekDates.endDate,
            meal_plan: mealPlan,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          }
        ])
        .select()
        .single();
      if (error) throw error;
      const newPlan: SavedMealPlan = {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        mealPlan: data.meal_plan,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setSavedPlans(prev => [newPlan, ...prev]);
      setCurrentPlan(newPlan);
      return newPlan;
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
      const { data, error } = await supabase
        .from('meal_plan_management')
        .update({ meal_plan: mealPlan, updated_at: now.toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setSavedPlans(prev => prev.map(plan => plan.id === id ? {
        ...plan,
        mealPlan: data.meal_plan,
        updatedAt: data.updated_at,
      } : plan));
      setCurrentPlan(prev => prev?.id === id ? {
        ...prev,
        mealPlan: data.meal_plan,
        updatedAt: data.updated_at,
      } : prev);
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
      const { error } = await supabase
        .from('meal_plan_management')
        .delete()
        .eq('id', id);
      if (error) throw error;
      const remainingPlans = savedPlans.filter(plan => plan.id !== id);
      setSavedPlans(remainingPlans);
      if (remainingPlans.length > 0) {
        setCurrentPlan(remainingPlans[0]);
      } else {
        setCurrentPlan(null);
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
    const { data, error } = await supabase
      .from('meal_plan_management')
      .insert([
        {
          name: weekDates.name,
          start_date: weekDates.startDate,
          end_date: weekDates.endDate,
          meal_plan: originalPlan.mealPlan,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }
      ])
      .select()
      .single();
    if (error) throw error;
    const duplicatedPlan: SavedMealPlan = {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      mealPlan: data.meal_plan,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    setSavedPlans(prev => [duplicatedPlan, ...prev]);
    setCurrentPlan(duplicatedPlan);
    return duplicatedPlan;
  };

  const clearAllPlans = async () => {
    setLoading(true);
    try {
      // Delete all plans from Supabase
      const { error } = await supabase.from('meal_plan_management').delete().neq('id', '');
      if (error) throw error;
      setSavedPlans([]);
      setCurrentPlan(null);
    } catch (error) {
      console.error('Error clearing all meal plans:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshMealPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meal_plan_management')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      setSavedPlans([]);
      setCurrentPlan(null);
    } else {
      const plans = (data || []).map((plan: any) => ({
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