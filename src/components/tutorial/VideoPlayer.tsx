
import React from 'react';
import { X } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onClose }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#2D3436]">Watch Tutorial</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="Recipe Tutorial"
          className="w-full h-full rounded-lg"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
