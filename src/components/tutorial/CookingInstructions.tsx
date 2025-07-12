import React from 'react';

interface CookingInstructionsProps {
  instructions: string;
}

const CookingInstructions: React.FC<CookingInstructionsProps> = ({ instructions }) => {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
          <span className="text-xl">👨‍🍳</span>
        </div>
        <h3 className="text-2xl font-bold text-[#2D3436]">Cooking Instructions</h3>
      </div>
      <div 
        className="prose prose-lg max-w-none text-[#1e293b]"
        dangerouslySetInnerHTML={{ __html: instructions }}
      />
    </div>
  );
};

export default CookingInstructions;
