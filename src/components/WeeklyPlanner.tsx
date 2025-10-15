import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Flame, Drumstick, Wheat, Droplet } from 'lucide-react';

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

interface WeeklyPlannerProps {
  selectedDay: string;
  onDaySelect: (day: string) => void;
  mealPlan?: MealPlan[];
  startDay?: string; // new prop: the start day of the week (from calendar)
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ selectedDay, onDaySelect, mealPlan = [], startDay }) => {
  // Helper function to extract clean food name from meal description
  const extractFoodName = (mealDescription: string): string => {
    return mealDescription.replace(/\s*\(buy:[^)]*\)/, '').trim();
  };

  // Helper function to get meal preview for a day
  const getMealPreview = (day: string) => {
    const dayPlan = mealPlan.find(plan => plan.day === day);
    if (!dayPlan) return null;
    return {
      breakfast: {
        name: dayPlan.breakfast_name || extractFoodName(dayPlan.breakfast),
        calories: dayPlan.breakfast_calories,
        protein: dayPlan.breakfast_protein,
        carbs: dayPlan.breakfast_carbs,
        fat: dayPlan.breakfast_fat,
        benefit: dayPlan.breakfast_benefit
      },
      lunch: {
        name: dayPlan.lunch_name || extractFoodName(dayPlan.lunch),
        calories: dayPlan.lunch_calories,
        protein: dayPlan.lunch_protein,
        carbs: dayPlan.lunch_carbs,
        fat: dayPlan.lunch_fat,
        benefit: dayPlan.lunch_benefit
      },
      dinner: {
        name: dayPlan.dinner_name || extractFoodName(dayPlan.dinner),
        calories: dayPlan.dinner_calories,
        protein: dayPlan.dinner_protein,
        carbs: dayPlan.dinner_carbs,
        fat: dayPlan.dinner_fat,
        benefit: dayPlan.dinner_benefit
      },
      snack: dayPlan.snack ? {
        name: dayPlan.snack_name || extractFoodName(dayPlan.snack),
        calories: dayPlan.snack_calories,
        protein: dayPlan.snack_protein,
        carbs: dayPlan.snack_carbs,
        fat: dayPlan.snack_fat,
        benefit: dayPlan.snack_benefit
      } : null
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
                className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${expandedDay === day
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
                <div className="ml-6 mt-2 space-y-3 text-xs">
                  {/* Breakfast */}
                  <div className="bg-yellow-50 p-2 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#e09026]">🥞</span>
                      <span className="text-[#1e293b] font-medium truncate">{mealPreview.breakfast.name}</span>
                    </div>
                    {mealPreview.breakfast.calories && (
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{mealPreview.breakfast.calories} cal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Drumstick className="h-3 w-3 text-red-500" />
                          <span>{mealPreview.breakfast.protein}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wheat className="h-3 w-3 text-amber-500" />
                          <span>{mealPreview.breakfast.carbs}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplet className="h-3 w-3 text-yellow-500" />
                          <span>{mealPreview.breakfast.fat}g</span>
                        </div>
                      </div>
                    )}
                    {mealPreview.breakfast.benefit && (
                      <div className="text-xs text-green-700 mt-1 italic">
                        💡 {mealPreview.breakfast.benefit}
                      </div>
                    )}
                  </div>

                  {/* Lunch */}
                  <div className="bg-green-50 p-2 border border-green-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#FF6B6B]">🍽️</span>
                      <span className="text-[#1e293b] font-medium truncate">{mealPreview.lunch.name}</span>
                    </div>
                    {mealPreview.lunch.calories && (
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{mealPreview.lunch.calories} cal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Drumstick className="h-3 w-3 text-red-500" />
                          <span>{mealPreview.lunch.protein}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wheat className="h-3 w-3 text-amber-500" />
                          <span>{mealPreview.lunch.carbs}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplet className="h-3 w-3 text-yellow-500" />
                          <span>{mealPreview.lunch.fat}g</span>
                        </div>
                      </div>
                    )}
                    {mealPreview.lunch.benefit && (
                      <div className="text-xs text-green-700 mt-1 italic">
                        💡 {mealPreview.lunch.benefit}
                      </div>
                    )}
                  </div>

                  {/* Dinner */}
                  <div className="bg-blue-50 p-2 border border-blue-200 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#6366f1]">🍛</span>
                      <span className="text-[#1e293b] font-medium truncate">{mealPreview.dinner.name}</span>
                    </div>
                    {mealPreview.dinner.calories && (
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{mealPreview.dinner.calories} cal</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Drumstick className="h-3 w-3 text-red-500" />
                          <span>{mealPreview.dinner.protein}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wheat className="h-3 w-3 text-amber-500" />
                          <span>{mealPreview.dinner.carbs}g</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplet className="h-3 w-3 text-yellow-500" />
                          <span>{mealPreview.dinner.fat}g</span>
                        </div>
                      </div>
                    )}
                    {mealPreview.dinner.benefit && (
                      <div className="text-xs text-green-700 mt-1 italic">
                        💡 {mealPreview.dinner.benefit}
                      </div>
                    )}
                  </div>

                  {/* Snack */}
                  {mealPreview.snack && (
                    <div className="bg-purple-50 p-2 border border-purple-200 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#00b894]">🍪</span>
                        <span className="text-[#1e293b] font-medium truncate">{mealPreview.snack.name}</span>
                      </div>
                      {mealPreview.snack.calories && (
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span>{mealPreview.snack.calories} cal</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Drumstick className="h-3 w-3 text-red-500" />
                            <span>{mealPreview.snack.protein}g</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wheat className="h-3 w-3 text-amber-500" />
                            <span>{mealPreview.snack.carbs}g</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplet className="h-3 w-3 text-yellow-500" />
                            <span>{mealPreview.snack.fat}g</span>
                          </div>
                        </div>
                      )}
                      {mealPreview.snack.benefit && (
                        <div className="text-xs text-green-700 mt-1 italic">
                          💡 {mealPreview.snack.benefit}
                        </div>
                      )}
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
