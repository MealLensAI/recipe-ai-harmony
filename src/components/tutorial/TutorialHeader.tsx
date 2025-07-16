
import React from 'react';
import { X, Share2, ChefHat } from 'lucide-react';

interface TutorialHeaderProps {
  recipeName: string;
  onClose: () => void;
  onShare: () => void;
}

const TutorialHeader: React.FC<TutorialHeaderProps> = ({ recipeName, onClose, onShare }) => {
  return (
    <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-gradient-to-r from-[#FF6B6B]/5 to-[#FF8E53]/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-2xl flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#2D3436]">How to Cook</h2>
          <p className="text-xl text-[#FF6B6B] font-semibold">{recipeName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onShare}
          className="p-3 rounded-xl hover:bg-gray-100 transition-colors group"
          title="Share Recipe"
        >
          <Share2 className="w-6 h-6 text-[#FF6B6B] group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={onClose}
          className="p-3 rounded-xl hover:bg-gray-100 transition-colors group"
        >
          <X className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default TutorialHeader;
