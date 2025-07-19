import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MealPlan {
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

interface WeeklyPlannerProps {
  planId: string;
  selectedDay: string;
  onDaySelect: (day: string) => void;
  startDay?: string; // new prop: the start day of the week (from calendar)
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ planId, selectedDay, onDaySelect, startDay }) => {
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meal_plan/${planId}`, {
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.meal_plan && data.meal_plan.meal_plan) {
          setMealPlan(data.meal_plan.meal_plan);
        } else {
          setMealPlan([]); // fallback if not found or error
        }
        setLoading(false);
      })
      .catch(() => {
        setMealPlan([]);
        setLoading(false);
      });
  }, [planId]);

  if (loading) return <div>Loading...</div>;

  // Helper function to extract clean food name from meal description
  const extractFoodName = (mealDescription: string): string => {
    return mealDescription.replace(/\s*\(buy:[^)]*\)/, '').trim();
  };

  // Helper function to get meal preview for a day
  const getMealPreview = (day: string) => {
    const dayPlan = mealPlan.find(plan => plan.day === day);
    if (!dayPlan) return null;
    return {
      breakfast: extractFoodName(dayPlan.breakfast),
      lunch: extractFoodName(dayPlan.lunch),
      dinner: extractFoodName(dayPlan.dinner),
      snack: dayPlan.snack ? extractFoodName(dayPlan.snack) : null
    };
  };

  // State to store the visible days order, rotated only when startDay changes
  const [visibleDays, setVisibleDays] = useState<string[]>(days);
  // State to track which day is expanded (only one at a time)
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Rotate days only when startDay changes, and expand only startDay
  useEffect(() => {
    const start = startDay || days[0];
    const startIdx = days.indexOf(start);
    const rotated = startIdx === -1 ? days : [...days.slice(startIdx), ...days.slice(0, startIdx)];
    setVisibleDays(rotated);
    setExpandedDay(start); // Only expand the start day
  }, [startDay]);

  // When selectedDay changes, expand only that day
  useEffect(() => {
    setExpandedDay(selectedDay);
  }, [selectedDay]);

  const handleDayClick = (day: string) => {
    setExpandedDay(prev => (prev === day ? null : day));
    onDaySelect(day);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-[#2D3436] mb-4">This Week</h3>
      <div className="space-y-1">
     
        {visibleDays.map((day) => {
          const mealPreview = getMealPreview(day);
          const hasMeals = mealPlan.length > 0;
          const isExpanded = expandedDay === day;
          return (
            <div key={day}>
              <div
                onClick={() => handleDayClick(day)}
                className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                  expandedDay === day
                    ? 'bg-[#FF6B6B] text-white'
                    : 'text-[#2D3436] hover:bg-[#f8f9fa]'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                <span className="text-sm font-medium">{day}</span>
                {hasMeals && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </div>
              {/* Show meal preview when day is expanded and meals are available */}
              {isExpanded && mealPreview && (
                <div className="ml-6 mt-2 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#e09026]">🥞</span>
                    <span className="text-[#1e293b] truncate">{mealPreview.breakfast}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B6B]">🍽️</span>
                    <span className="text-[#1e293b] truncate">{mealPreview.lunch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6366f1]">🍛</span>
                    <span className="text-[#1e293b] truncate">{mealPreview.dinner}</span>
                  </div>
                  {mealPreview.snack && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#00b894]">🍪</span>
                      <span className="text-[#1e293b] truncate">{mealPreview.snack}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlanner;
