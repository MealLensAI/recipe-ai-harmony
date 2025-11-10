
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#f1f5f9] border-t-[#FF6B6B] rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-[#FF8E53] rounded-full animate-spin animation-delay-150"></div>
      </div>
      <p className="mt-4 text-[#2D3436] font-medium">Generating your meal plan...</p>
      <p className="text-sm text-[#1e293b] mt-1">This may take a few seconds</p>
    </div>
  );
};

export default LoadingSpinner;
