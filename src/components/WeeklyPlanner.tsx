import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface WeeklyPlannerProps {
  selectedDay: string;
  onDaySelect: (day: string) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ selectedDay, onDaySelect }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-[#2D3436] mb-4">This Week</h3>
      
      <div className="space-y-1">
        <div className="flex items-center py-2 px-3 text-[#2D3436] hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
          <ChevronRight className="w-4 h-4 mr-2" />
          <span className="text-sm">Food Pyramid</span>
        </div>
        
        {days.map((day) => (
          <div 
            key={day}
            onClick={() => onDaySelect(day)}
            className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${
              selectedDay === day 
                ? 'bg-[#FF6B6B] text-white' 
                : 'text-[#2D3436] hover:bg-[#f8f9fa]'
            }`}
          >
            {selectedDay === day ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            <span className="text-sm font-medium">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlanner;
