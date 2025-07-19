import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Copy, Edit, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { SavedMealPlan, useMealPlans } from '../hooks/useMealPlans';
import { useToast } from '@/hooks/use-toast';

interface MealPlanManagerProps {
  onNewPlan: () => void;
  onEditPlan: (plan: SavedMealPlan) => void;
  onSelectPlan?: (plan: SavedMealPlan) => void;
}

const MealPlanManager: React.FC<MealPlanManagerProps> = ({ onNewPlan, onEditPlan, onSelectPlan }) => {
  const { savedPlans, currentPlan, selectMealPlan, deleteMealPlan, duplicateMealPlan, generateWeekDates } = useMealPlans();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleDeletePlan = (plan: SavedMealPlan) => {
    if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      try {
        deleteMealPlan(plan.id);
        toast({
          title: "Plan Deleted",
          description: `"${plan.name}" has been deleted successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete meal plan. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicatePlan = (plan: SavedMealPlan) => {
    try {
      const weekDates = generateWeekDates(selectedDate);
      duplicateMealPlan(plan.id, selectedDate);
      toast({
        title: "Plan Duplicated",
        description: `"${plan.name}" has been duplicated for ${weekDates.name}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate meal plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCurrentWeekDates = () => {
    const weekDates = generateWeekDates(selectedDate);
    return formatDateRange(weekDates.startDate, weekDates.endDate);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#2D3436]">Meal Plans</h2>
        <button
          onClick={onNewPlan}
          className="flex items-center gap-2 bg-[#FF6B6B] text-white px-4 py-2 rounded-lg hover:bg-[#FF8E53] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Week Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#2D3436]">Week of {getCurrentWeekDates()}</h3>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 text-[#FF6B6B] hover:text-[#FF8E53] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Change Week
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#2D3436]" />
          </button>
          
          <div className="text-center">
            <div className="text-sm text-[#1e293b]">
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
          
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[#2D3436]" />
          </button>
        </div>

        {showDatePicker && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Saved Plans */}
      <div>
        <h3 className="text-lg font-semibold text-[#2D3436] mb-4">Saved Plans</h3>
        
        {savedPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No saved meal plans yet</p>
            <p className="text-sm">Create your first plan to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  currentPlan?.id === plan.id
                    ? 'border-[#FF6B6B] bg-[#FF6B6B]/5'
                    : 'border-gray-200 hover:border-[#FF6B6B]/50 hover:bg-gray-50'
                }`}
                onClick={() => {
                  selectMealPlan(plan.id);
                  if (onSelectPlan) onSelectPlan(plan); // plan includes id
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#2D3436]">{plan.name}</h4>
                    <p className="text-sm text-[#1e293b]">
                      {formatDateRange(plan.startDate, plan.endDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Updated {new Date(plan.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPlan(plan);
                      }}
                      className="p-2 text-gray-600 hover:text-[#FF6B6B] transition-colors"
                      title="Edit Plan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePlan(plan);
                      }}
                      className="p-2 text-gray-600 hover:text-[#FF6B6B] transition-colors"
                      title="Duplicate Plan"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan);
                      }}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanManager; 