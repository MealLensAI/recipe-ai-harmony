import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Globe } from 'lucide-react';
import { useTutorialContent } from '../hooks/useTutorialContent';

interface CookingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  ingredients?: string[];
}

const CookingTutorialModal: React.FC<CookingTutorialModalProps> = ({ 
  isOpen, 
  onClose, 
  recipeName,
  ingredients = []
}) => {
  const [activeTab, setActiveTab] = useState<'recipe' | 'videos' | 'articles'>('recipe');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const { instructions, youtubeVideos, webResources, loading, loadingResources, generateContent } = useTutorialContent();

  useEffect(() => {
    if (isOpen && recipeName) {
      generateContent(recipeName, ingredients);
    }
  }, [isOpen, recipeName, ingredients]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedVideo(null);
      setActiveTab('recipe');
    }
  }, [isOpen]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop';
  };

  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return 'website';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-[24px] font-semibold text-[#2A2A2A]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
            {recipeName}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="overflow-y-auto h-[calc(100vh-80px)] px-8 py-6">
        {/* Section Title */}
        <h2 className="text-[20px] font-semibold text-[#2A2A2A] mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
          Cooking instructions
        </h2>

        {/* Tabs */}
        <div className="inline-flex items-center bg-[#F7F7F7] border border-[#E7E7E7] rounded-[12px] p-1 mb-8">
          <button
            onClick={() => setActiveTab('recipe')}
            className={`px-6 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
              activeTab === 'recipe'
                ? 'bg-white text-blue-600 border border-[#E7E7E7]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Recipe
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
              activeTab === 'videos'
                ? 'bg-white text-blue-600 border border-[#E7E7E7]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Video Tutorials
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
              activeTab === 'articles'
                ? 'bg-white text-blue-600 border border-[#E7E7E7]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Recommended Articles
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading content...</p>
          </div>
        ) : (
          <>
            {/* Recipe Tab */}
            {activeTab === 'recipe' && instructions && (
              <div className="max-w-4xl">
                {/* Health Tip */}
                <div className="flex items-start gap-2 text-green-600 mb-6">
                  <span className="text-lg">💡</span>
                  <p className="text-[15px] font-medium">
                    Health Tip: Provides fiber and Phytonutrients to support digestion and immunity
                  </p>
                </div>

                {/* Recipe Content */}
                <div 
                  className="prose prose-lg max-w-none text-gray-800"
                  style={{ lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{ __html: instructions }}
                />
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div>
                {loadingResources ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading video tutorials...</p>
                  </div>
                ) : youtubeVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {youtubeVideos.map((video, index) => (
                      <div 
                        key={index} 
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                      >
                        {/* Video Thumbnail */}
                        <div className="relative">
                          <img 
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-48 object-cover"
                            onError={handleImageError}
                          />
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-700 transition-colors"
                              onClick={() => video.videoId && setSelectedVideo(video.videoId)}
                            >
                              <Play className="w-6 h-6 text-white ml-1" fill="white" />
                            </div>
                          </div>
                        </div>

                        {/* Video Info */}
                        <div className="p-5">
                          <h4 className="font-semibold text-gray-900 text-[15px] mb-4 line-clamp-2 leading-snug">
                            {video.title}
                          </h4>
                          <button
                            onClick={() => video.videoId && setSelectedVideo(video.videoId)}
                            className="w-full py-3 rounded-xl text-[14px] font-semibold border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200"
                          >
                            Watch Tutorial
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    No video tutorials available for this recipe.
                  </div>
                )}
              </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div>
                {loadingResources ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading articles...</p>
                  </div>
                ) : webResources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {webResources.map((resource, index) => (
                      <div 
                        key={index} 
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                      >
                        {/* Article Image */}
                        <div className="relative">
                          <img 
                            src={resource.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop'}
                            alt={resource.title}
                            className="w-full h-48 object-cover"
                            onError={handleImageError}
                          />
                          {/* Domain Badge */}
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm text-gray-600">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{extractDomain(resource.url)}</span>
                          </div>
                        </div>

                        {/* Article Info */}
                        <div className="p-5">
                          <h4 className="font-semibold text-gray-900 text-[15px] mb-4 line-clamp-2 leading-snug">
                            {resource.title}
                          </h4>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3 rounded-xl text-[14px] font-semibold border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 text-center"
                          >
                            Read Article
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    No articles available for this recipe.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
              title="Video"
              className="w-full h-full rounded-xl"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CookingTutorialModal;
