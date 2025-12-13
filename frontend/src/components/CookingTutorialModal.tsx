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
      {/* Header - same as Diet Planner */}
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

        {/* Tabs Container - Width: Fill (511px), Height: 57px, Radius: 15px, Border: 1px, Color: white, Border: #E7E7E7 */}
        <div 
          className="inline-flex items-center h-[57px] bg-white border border-[#E7E7E7] rounded-[15px] p-[10px] gap-[10px] mb-6"
        >
          {/* Recipe Tab - Width: 124px, Height: 41px (Hug), Radius: 10px, Border: 2px when active, Padding: 10px, Gap: 10px, Color: #F6FAFE when active, Border: #1A76E3 when active */}
          <button
            onClick={() => setActiveTab('recipe')}
            className={`w-[124px] h-[41px] rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
              activeTab === 'recipe'
                ? 'bg-[#F6FAFE] text-[#1A76E3] border-2 border-[#1A76E3]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Recipe
          </button>
          {/* Video Tutorials Tab - Width: 149px, Height: 41px (Hug), Radius: 10px, Border: 2px, Padding: 10px, Gap: 10px, Color: #F6FAFE, Border: #1A76E3 */}
          <button
            onClick={() => setActiveTab('videos')}
            className={`w-[149px] h-[41px] rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
              activeTab === 'videos'
                ? 'bg-[#F6FAFE] text-[#1A76E3] border-2 border-[#1A76E3]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Video Tutorials
          </button>
          {/* Recommended Articles Tab - Width: 220px, Height: 41px (Hug), Radius: 10px, Border: 2px, Padding: 10px, Gap: 10px */}
          <button
            onClick={() => setActiveTab('articles')}
            className={`w-[220px] h-[41px] rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
              activeTab === 'articles'
                ? 'bg-[#F6FAFE] text-[#1A76E3] border-2 border-[#1A76E3]'
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
            {/* Recipe Tab Content */}
            {activeTab === 'recipe' && instructions && (
              <div className="w-[511px]" style={{ gap: '12px' }}>
                {/* Health Tip - Width: 707px, Height: 28px, Gap: 12px, Font: Work Sans 16px Regular, Color: #34C759 */}
                <div 
                  className="flex items-center gap-3 mb-6"
                  style={{ height: '28px' }}
                >
                  <span className="text-lg">💡</span>
                  <p 
                    className="text-[16px] leading-[130%] tracking-[0.03em]"
                    style={{ fontFamily: "'Work Sans', sans-serif", color: '#34C759' }}
                  >
                    Health Tip: Provides fiber and Phytonutrients to support digestion and immunity
                  </p>
                </div>

                {/* Recipe Content - Font: Work Sans 16px, "Ingredients" is 500 weight, content is 400 weight, Color: #414141 */}
                <div 
                  className="prose prose-lg max-w-none"
                  style={{ 
                    fontFamily: "'Work Sans', sans-serif",
                    fontSize: '16px',
                    lineHeight: '130%',
                    letterSpacing: '0.03em',
                    color: '#414141'
                  }}
                  dangerouslySetInnerHTML={{ __html: instructions }}
                />
              </div>
            )}

            {/* Videos Tab Content */}
            {activeTab === 'videos' && (
              <div>
                {loadingResources ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading video tutorials...</p>
                  </div>
                ) : youtubeVideos.length > 0 ? (
                  /* Video Cards Container - Width: 280px per card, Height: Hug (323px), Top/Left: 18px, Gap: 20px */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-[18px] pl-[18px]">
                    {youtubeVideos.map((video, index) => (
                      /* Video Card - Width: 316px, Height: 359px, Radius: 15px, Border: 1px, Color: white, Border: #E7E7E7 */
                      <div 
                        key={index} 
                        className="w-[280px] bg-white rounded-[15px] border border-[#E7E7E7] overflow-hidden"
                      >
                        {/* Video Thumbnail */}
                        <div className="relative">
                          <img 
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-[180px] object-cover"
                            onError={handleImageError}
                          />
                          {/* Play Button Overlay - Red circle with play icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-700 transition-colors"
                              onClick={() => video.videoId && setSelectedVideo(video.videoId)}
                            >
                              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                        </div>

                        {/* Video Info - Padding matches card specs */}
                        <div className="p-4">
                          <h4 
                            className="font-medium text-[15px] mb-4 line-clamp-2 leading-snug"
                            style={{ fontFamily: "'Work Sans', sans-serif", color: '#414141' }}
                          >
                            {video.title}
                          </h4>
                          {/* Watch Tutorial Button - Width: Fill (280px), Height: 48px, Radius: 15px, Border: 1.5px, Padding: 10px, Gap: 10px, Color: #F6FAFE, Border: #1A76E3 */}
                          <button
                            onClick={() => video.videoId && setSelectedVideo(video.videoId)}
                            className="w-full h-[48px] rounded-[15px] text-[14px] font-semibold bg-[#F6FAFE] text-[#1A76E3] border-[1.5px] border-[#1A76E3] hover:bg-[#1A76E3] hover:text-white transition-all duration-200"
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

            {/* Articles Tab Content */}
            {activeTab === 'articles' && (
              <div>
                {loadingResources ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading articles...</p>
                  </div>
                ) : webResources.length > 0 ? (
                  /* Article Cards Container */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-[18px] pl-[18px]">
                    {webResources.map((resource, index) => (
                      /* Article Card - Width: 316px, Height: 359px, Radius: 15px, Border: 1px, Color: white, Border: #E7E7E7 */
                      <div 
                        key={index} 
                        className="w-[280px] bg-white rounded-[15px] border border-[#E7E7E7] overflow-hidden"
                      >
                        {/* Article Image */}
                        <div className="relative">
                          <img 
                            src={resource.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop'}
                            alt={resource.title}
                            className="w-full h-[180px] object-cover"
                            onError={handleImageError}
                          />
                          {/* Domain Badge - Bottom right corner with globe icon */}
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm text-gray-600">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{extractDomain(resource.url)}</span>
                          </div>
                        </div>

                        {/* Article Info */}
                        <div className="p-4">
                          <h4 
                            className="font-medium text-[15px] mb-4 line-clamp-2 leading-snug"
                            style={{ fontFamily: "'Work Sans', sans-serif", color: '#414141' }}
                          >
                            {resource.title}
                          </h4>
                          {/* Read Article Button - Same style as Watch Tutorial */}
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full h-[48px] rounded-[15px] text-[14px] font-semibold bg-[#F6FAFE] text-[#1A76E3] border-[1.5px] border-[#1A76E3] hover:bg-[#1A76E3] hover:text-white transition-all duration-200"
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
