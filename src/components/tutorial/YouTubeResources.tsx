import React from 'react';
import { Youtube, Play, ExternalLink } from 'lucide-react';

interface VideoResource {
  title: string;
  thumbnail: string;
  url: string;
  videoId?: string;
  channel?: string;
}

interface YouTubeResourcesProps {
  videos: VideoResource[];
  onVideoSelect: (videoId: string) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const YouTubeResources: React.FC<YouTubeResourcesProps> = ({ videos, onVideoSelect, onImageError }) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Youtube className="w-8 h-8 text-red-500" />
        <h3 className="text-2xl font-bold text-[#2D3436]">Video Tutorials</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <div key={index} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative overflow-hidden">
              <img 
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={onImageError}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-bold text-[#2D3436] text-sm mb-2 line-clamp-2 leading-tight">{video.title}</h4>
              <p className="text-xs text-gray-600 mb-4">{video.channel}</p>
              <div className="flex gap-2">
                {video.videoId && (
                  <button
                    onClick={() => onVideoSelect(video.videoId!)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 text-white text-sm font-semibold px-3 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Watch Here
                  </button>
                )}
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-red-500 text-sm font-semibold px-3 py-2 border border-red-500 rounded hover:bg-red-50 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  YouTube
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouTubeResources;
