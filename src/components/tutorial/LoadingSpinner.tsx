
import React from 'react';
import { ChefHat } from 'lucide-react';

const TutorialLoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-[#FF6B6B]" />
        </div>
      </div>
      <p className="mt-6 text-lg text-[#1e293b] font-medium">Preparing your cooking guide...</p>
      <p className="text-sm text-gray-500 mt-2">Loading detailed instructions and resources</p>
    </div>
  );
};

// Netflix-style loading bar component
export const NetflixLoadingBar: React.FC = () => {
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden relative">
      <div 
        className="h-full w-1/3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-full animate-pulse"
        style={{
          animation: 'netflix-loading 1.5s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes netflix-loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
};

export default TutorialLoadingSpinner;
