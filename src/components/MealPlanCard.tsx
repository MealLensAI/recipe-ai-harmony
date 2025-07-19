
import React, { useEffect, useState } from 'react';

interface MealPlanCardProps {
  planId: string;
  day: string;
}

const MealPlanCard: React.FC<MealPlanCardProps> = ({ planId, day }) => {
  const [dayPlan, setDayPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meal_plan/${planId}/${day}`, {
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setDayPlan(data.day_plan);
        setLoading(false);
      });
  }, [planId, day]);

  if (loading) return <div>Loading...</div>;
  if (!dayPlan) return <div>No data for {day}</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-[#2D3436] mb-2">{day}</h3>
        <div className="h-1 w-16 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-full mx-auto"></div>
      </div>
      
      <div className="space-y-4">
        <div className="meal-item">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-[#e09026] rounded-full mr-2"></div>
            <span className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">Breakfast</span>
          </div>
          <p className="text-[#2D3436] text-sm leading-relaxed ml-5">{dayPlan.breakfast}</p>
        </div>
        
        <div className="meal-item">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-[#FF6B6B] rounded-full mr-2"></div>
            <span className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">Lunch</span>
          </div>
          <p className="text-[#2D3436] text-sm leading-relaxed ml-5">{dayPlan.lunch}</p>
        </div>
        
        <div className="meal-item">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-[#6366f1] rounded-full mr-2"></div>
            <span className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">Dinner</span>
          </div>
          <p className="text-[#2D3436] text-sm leading-relaxed ml-5">{dayPlan.dinner}</p>
        </div>
        
        {dayPlan.snack && (
          <div className="meal-item">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-[#00b894] rounded-full mr-2"></div>
              <span className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">Snack</span>
            </div>
            <p className="text-[#2D3436] text-sm leading-relaxed ml-5">{dayPlan.snack}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanCard;
