
import React from 'react';
import { NetflixLoadingBar } from './LoadingSpinner';

interface CookingInstructionsProps {
  instructions: string;
  loading?: boolean;
}

const CookingInstructions: React.FC<CookingInstructionsProps> = ({ instructions, loading = false }) => {
  return (
    <div className="bg-gradient-to-br from-white/95 to-white/80 rounded-3xl border border-gray-100 overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">👨‍🍳</span>
          </div>
          <h3 className="text-3xl font-bold text-[#2D3436]">Cooking Instructions</h3>
        </div>
        
        {loading ? (
          <div className="space-y-6">
            <NetflixLoadingBar />
            <p className="text-gray-500 text-center text-lg">Loading cooking instructions...</p>
          </div>
        ) : (
          <div 
            className="prose prose-lg max-w-none text-[#1e293b] leading-relaxed"
            style={{
              lineHeight: '1.6',
              margin: 0,
            }}
            dangerouslySetInnerHTML={{ __html: instructions }}
          />
        )}
      </div>
    </div>
  );
};

export default CookingInstructions;
