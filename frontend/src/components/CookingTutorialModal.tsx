import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Globe, ChevronDown } from 'lucide-react';
import { useTutorialContent } from '../hooks/useTutorialContent';
import { useAuth } from '@/lib/utils';

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
  const { user } = useAuth();

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
    <div className="fixed inset-0 z-50">
      {/* Dark overlay for background */}
      <div 
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      
      {/* Content Panel - positioned to respect sidebar */}
      <div className="fixed top-0 right-0 bottom-0 left-64 bg-white z-50 overflow-hidden flex flex-col">
        
        {/* Top Header - Diet Planner with Profile */}
        <header className="bg-white border-b border-gray-100 px-8 py-5">
          <div className="flex items-center justify-between">
            <h1 
              className="text-[32px] font-medium tracking-[0.03em] leading-[130%]" 
              style={{ fontFamily: "'Work Sans', sans-serif", color: '#2A2A2A' }}
            >
              Diet Planner
            </h1>
            
            {/* Profile Button */}
            <button className="flex items-center h-[48px] gap-3 px-4 rounded-[15px] border border-[#E7E7E7] bg-white hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-semibold text-sm border border-blue-100">
                {(user?.displayName || user?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}
              </div>
              <span className="text-[15px] font-medium text-gray-600 hidden sm:block">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </header>

        {/* Blue accent line under header */}
        <div className="h-[3px] bg-gradient-to-r from-blue-400 to-blue-500" />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white px-10 py-8">
          
          {/* Back button and Recipe Name Row */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-[14px]">Back</span>
            </button>
            <h2 
              className="text-[22px] font-semibold" 
              style={{ fontFamily: "'Work Sans', sans-serif", color: '#2A2A2A' }}
            >
              {recipeName}
            </h2>
          </div>

          {/* Gray Divider */}
          <div className="border-b border-gray-200 mb-6" />

          {/* Section Title - Work Sans 20px Medium #595959 */}
          <h3 
            className="text-[20px] font-medium tracking-[0.03em] leading-[130%] mb-4" 
            style={{ fontFamily: "'Work Sans', sans-serif", color: '#595959' }}
          >
            Cooking instructions
          </h3>

          {/* Tabs Container - Width: 539px Hug, Height: 41px Hug, Left: 39px, Gap: 16px */}
          <div className="inline-flex items-center h-[41px] gap-4 mb-8">
            <button
              onClick={() => setActiveTab('recipe')}
              className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
                activeTab === 'recipe'
                  ? 'bg-[#F6FAFE] text-[#1A76E3] border border-[#1A76E3]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Recipe
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
                activeTab === 'videos'
                  ? 'bg-[#F6FAFE] text-[#1A76E3] border border-[#1A76E3]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Video Tutorials
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
                activeTab === 'articles'
                  ? 'bg-[#F6FAFE] text-[#1A76E3] border border-[#1A76E3]'
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
                <div>
                  {/* Health Tip */}
                  <div className="flex items-start gap-2 mb-5">
                    <span className="text-base">💡</span>
                    <p 
                      className="text-[15px] leading-[140%]"
                      style={{ fontFamily: "'Work Sans', sans-serif", color: '#34C759' }}
                    >
                      Health Tip: Provides fiber and Phytonutrients to support digestion and immunity
                    </p>
                  </div>

                  {/* Recipe Content - left aligned */}
                  <div 
                    className="text-left"
                    style={{ 
                      fontFamily: "'Work Sans', sans-serif",
                      fontSize: '15px',
                      lineHeight: '170%',
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {youtubeVideos.map((video, index) => (
                        /* Card - Width: Fill (511px), Height: 57px, Radius: 15px, Border: 1px #E7E7E7, Background: white */
                        <div 
                          key={index} 
                          className="bg-white rounded-[15px] border border-[#E7E7E7] overflow-hidden"
                        >
                          <div className="relative">
                            <img 
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-[160px] object-cover"
                              onError={handleImageError}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div 
                                className="w-11 h-11 bg-red-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-700 transition-colors"
                                onClick={() => video.videoId && setSelectedVideo(video.videoId)}
                              >
                                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 
                              className="font-medium text-[14px] mb-3 line-clamp-2 leading-snug"
                              style={{ fontFamily: "'Work Sans', sans-serif", color: '#414141' }}
                            >
                              {video.title}
                            </h4>
                            <button
                              onClick={() => video.videoId && setSelectedVideo(video.videoId)}
                              className="w-full h-[44px] rounded-[12px] text-[14px] font-medium bg-white text-[#1A76E3] border border-[#1A76E3] hover:bg-[#1A76E3] hover:text-white transition-all duration-200"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {webResources.map((resource, index) => (
                        /* Card - Width: Fill (511px), Height: 57px, Radius: 15px, Border: 1px #E7E7E7, Background: white */
                        <div 
                          key={index} 
                          className="bg-white rounded-[15px] border border-[#E7E7E7] overflow-hidden"
                        >
                          <div className="relative">
                            <img 
                              src={resource.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop'}
                              alt={resource.title}
                              className="w-full h-[160px] object-cover"
                              onError={handleImageError}
                            />
                            {/* Domain Badge */}
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[12px] text-gray-600">
                              <Globe className="w-3 h-3" />
                              <span>{extractDomain(resource.url)}</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 
                              className="font-medium text-[14px] mb-3 line-clamp-2 leading-snug"
                              style={{ fontFamily: "'Work Sans', sans-serif", color: '#414141' }}
                            >
                              {resource.title}
                            </h4>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full h-[44px] rounded-[12px] text-[14px] font-medium bg-white text-[#1A76E3] border border-[#1A76E3] hover:bg-[#1A76E3] hover:text-white transition-all duration-200"
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
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
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
