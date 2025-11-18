import React, { useState, useEffect } from 'react';
import TutorialHeader from './tutorial/TutorialHeader';
import CookingInstructions from './tutorial/CookingInstructions';
import VideoPlayer from './tutorial/VideoPlayer';
import YouTubeResources from './tutorial/YouTubeResources';
import WebResources from './tutorial/WebResources';
import { useTutorialContent } from '../hooks/useTutorialContent';

interface CookingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  ingredients?: string[]; // New prop for ingredients
}

const CookingTutorialModal: React.FC<CookingTutorialModalProps> = ({ 
  isOpen, 
  onClose, 
  recipeName,
  ingredients = [] // Default to empty array
}) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [inlinePlayingIndex, setInlinePlayingIndex] = useState<number | null>(null);
  const { instructions, youtubeVideos, webResources, loading, loadingResources, generateContent } = useTutorialContent();

  useEffect(() => {
    if (isOpen && recipeName) {
      console.log('[CookingTutorialModal] Generating content for:', { recipeName, ingredients });
      generateContent(recipeName, ingredients);
    }
  }, [isOpen, recipeName, ingredients]);

  // Reset video states when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedVideo(null);
      setInlinePlayingIndex(null);
    }
  }, [isOpen]);

  const handleShare = async () => {
    const shareData = {
      title: `${recipeName} Recipe`,
      text: `Check out this amazing recipe for ${recipeName}!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const fallbackImages = [
      `https://source.unsplash.com/400x250/?food,meal,cooking`,
      `https://source.unsplash.com/400x250/?recipe,kitchen`,
      `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop`
    ];
    
    const currentSrc = target.src;
    const currentIndex = fallbackImages.findIndex(img => currentSrc.includes(img.split('?')[0]));
    
    if (currentIndex < fallbackImages.length - 1) {
      target.src = fallbackImages[currentIndex + 1];
    }
  };

  // When modal video opens, stop inline
  const handleVideoSelect = (videoId: string | null) => {
    setSelectedVideo(videoId);
    if (videoId) setInlinePlayingIndex(null);
  };

  // When inline video plays, stop modal
  const handleInlinePlay = (index: number | null) => {
    setInlinePlayingIndex(index);
    if (index !== null) setSelectedVideo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        <TutorialHeader 
          recipeName={recipeName}
          onClose={onClose}
          onShare={handleShare}
        />

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading ? (
            <div className="py-24 text-center text-gray-600">
              Cooking tips are on the way…
            </div>
          ) : (
            <div className="p-8 space-y-10">
              {/* Cooking Instructions - Always show when loaded */}
              {instructions && (
                <CookingInstructions instructions={instructions} />
              )}

              {/* Video Player Modal */}
              {selectedVideo && (
                <VideoPlayer 
                  videoId={selectedVideo}
                  onClose={() => setSelectedVideo(null)}
                />
              )}

              {/* Resources Section - Show loading or content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* YouTube Resources */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">📺</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#2D3436]">Video Tutorials</h3>
                  </div>
                  
                  {loadingResources ? (
                    <div className="space-y-4">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-600 text-center">Loading video tutorials...</p>
                    </div>
                  ) : youtubeVideos.length > 0 ? (
                    <YouTubeResources 
                      videos={youtubeVideos}
                      onVideoSelect={handleVideoSelect}
                      inlinePlayingIndex={inlinePlayingIndex}
                      onInlinePlay={handleInlinePlay}
                      onImageError={handleImageError}
                    />
                  ) : (
                    <p className="text-gray-600 text-center">No video tutorials available.</p>
                  )}
                </div>

                {/* Google Resources */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🌐</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#2D3436]">Recommended Articles</h3>
                  </div>
                  
                  {loadingResources ? (
                    <div className="space-y-4">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{
                            animation: 'loading-slide 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-600 text-center">Loading articles...</p>
                    </div>
                  ) : webResources.length > 0 ? (
                    <WebResources 
                      resources={webResources}
                      onImageError={handleImageError}
                    />
                  ) : (
                    <p className="text-gray-600 text-center">No articles available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS animation for loading bar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes loading-slide {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(400%);
            }
          }
        `
      }} />
    </div>
  );
};

export default CookingTutorialModal;
