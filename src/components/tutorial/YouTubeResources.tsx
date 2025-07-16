
import React, { useState } from 'react';
import { Youtube, Play, ExternalLink, Maximize2, X } from 'lucide-react';

interface VideoResource {
  title: string;
  thumbnail: string;
  url: string;
  videoId?: string;
  channel?: string;
}

interface YouTubeResourcesProps {
  videos: VideoResource[];
  onVideoSelect: (videoId: string | null) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  inlinePlayingIndex?: number | null;
  onInlinePlay?: (index: number | null) => void;
}

const YouTubeResources: React.FC<YouTubeResourcesProps> = ({ videos, onVideoSelect, onImageError, inlinePlayingIndex, onInlinePlay }) => {
  // Remove local playingIndex state, use prop instead
  // const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Helper to play inline and stop modal
  const handlePlayInline = (index: number) => {
    if (onInlinePlay) onInlinePlay(index);
    if (onVideoSelect) onVideoSelect(null); // Stop modal video
  };
  const handleCloseInline = () => {
    if (onInlinePlay) onInlinePlay(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Youtube className="w-8 h-8 text-red-500" />
        <h3 className="text-2xl font-bold text-[#2D3436]">Video Tutorials</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video, index) => (
          <div key={index} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            {inlinePlayingIndex === index && video.videoId ? (
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                  title={video.title}
                  className="w-full h-full rounded-t-3xl"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
                <button
                  className="absolute top-2 right-2 bg-white/80 rounded-full p-2 shadow hover:bg-white"
                  title="Expand"
                  onClick={() => onVideoSelect(video.videoId!)}
                >
                  <Maximize2 className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  className="absolute top-2 left-2 bg-white/80 rounded-full p-2 shadow hover:bg-white"
                  title="Close"
                  onClick={handleCloseInline}
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            ) : (
              <div className="relative overflow-hidden cursor-pointer" onClick={() => handlePlayInline(index)}>
              <img 
                src={video.thumbnail}
                alt={video.title}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={onImageError}
              />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>
            )}
            <div className="p-6">
              <h4 className="font-bold text-[#2D3436] text-base mb-1 line-clamp-2 leading-tight">{video.title}</h4>
              <p className="text-xs text-gray-500 mb-4">{video.channel}</p>
                {video.videoId && (
                  <button
                  onClick={() => handlePlayInline(index)}
                  className="flex items-center gap-2 text-red-500 text-base font-semibold hover:underline focus:outline-none"
                  style={{padding: 0, background: 'none', border: 'none'}}>
                  <Youtube className="w-5 h-5" />
                  Watch Tutorial
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouTubeResources;
