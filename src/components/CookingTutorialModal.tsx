import React, { useState, useEffect } from 'react';
import TutorialHeader from './tutorial/TutorialHeader';
import CookingInstructions from './tutorial/CookingInstructions';
import VideoPlayer from './tutorial/VideoPlayer';
import YouTubeResources from './tutorial/YouTubeResources';
import WebResources from './tutorial/WebResources';
import TutorialLoadingSpinner from './tutorial/LoadingSpinner';
import { useTutorialContent } from '../hooks/useTutorialContent';

interface CookingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
}

const CookingTutorialModal: React.FC<CookingTutorialModalProps> = ({ 
  isOpen, 
  onClose, 
  recipeName 
}) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const { instructions, youtubeVideos, webResources, loading, generateContent } = useTutorialContent();

  useEffect(() => {
    if (isOpen && recipeName) {
      generateContent(recipeName);
    }
  }, [isOpen, recipeName]);

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
            <TutorialLoadingSpinner />
          ) : (
            <div className="p-8 space-y-10">
              <CookingInstructions instructions={instructions} />

              {selectedVideo && (
                <VideoPlayer 
                  videoId={selectedVideo}
                  onClose={() => setSelectedVideo(null)}
                />
              )}

              <YouTubeResources 
                videos={youtubeVideos}
                onVideoSelect={setSelectedVideo}
                onImageError={handleImageError}
              />

              <WebResources 
                resources={webResources}
                onImageError={handleImageError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookingTutorialModal;
