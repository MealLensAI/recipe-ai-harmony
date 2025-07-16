import React, { useState, useEffect } from 'react';
import { Clock, Star } from 'lucide-react';

interface RecipeCardProps {
  title: string;
  image?: string;
  time: string;
  rating: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onClick?: () => void;
  originalTitle?: string; // Optional prop for displaying the full meal description
}

const RecipeCard: React.FC<RecipeCardProps> = ({ title, image, time, rating, mealType, onClick, originalTitle }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [foodImage, setFoodImage] = useState<string>('');

  // Fetch food image using your hosted API
  const fetchFoodImage = async (foodName: string) => {
    if (image) {
      setFoodImage(image);
      setImageLoading(false);
      return;
    }

    try {
      console.log('[RecipeCard] Sending to image API:', foodName);
      const response = await fetch('https://get-images-qa23.onrender.com/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: foodName }),
      });
      console.log('[RecipeCard] API response status:', response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('[RecipeCard] API response JSON:', data);

      if (data.image_url) {
        setFoodImage(data.image_url);
        setImageLoading(false);
        console.log('[RecipeCard] Set foodImage to:', data.image_url);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('[RecipeCard] Error fetching food image:', error);
      setFoodImage(getFallbackImage());
      setImageLoading(false);
    }
  };

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    fetchFoodImage(title); // Use the clean title for image fetching
  }, [title, image]);

  const getFallbackImage = () => {
    const fallbackImages = {
      breakfast: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Floading-circle&psig=AOvVaw28Iyc-z4JEXpGmOScNoX_Q&ust=1752286755158000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCODk74Dfs44DFQAAAAAdAAAAABAE',
      lunch: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Floading-circle&psig=AOvVaw28Iyc-z4JEXpGmOScNoX_Q&ust=1752286755158000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCODk74Dfs44DFQAAAAAdAAAAABAE',
      dinner: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Floading-circle&psig=AOvVaw28Iyc-z4JEXpGmOScNoX_Q&ust=1752286755158000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCODk74Dfs44DFQAAAAAdAAAAABAE',
      snack: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fphotos%2Floading-circle&psig=AOvVaw28Iyc-z4JEXpGmOScNoX_Q&ust=1752286755158000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCODk74Dfs44DFQAAAAAdAAAAABAE'
    };
    return fallbackImages[mealType] || fallbackImages.dinner;
  };

  const getMealTypeIcon = () => {
    switch (mealType) {
      case 'breakfast':
        return '🥞';
      case 'lunch':
        return '🍽️';
      case 'dinner':
        return '🍛';
      case 'snack':
        return '🍪';
      default:
        return '🍽️';
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Try to fetch a new image from the API with a slightly modified search term
      fetchFoodImage(title + ' food');
    } else {
      setFoodImage(getFallbackImage());
      setImageLoading(false);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
      onClick={onClick}
    >
      <div className="relative h-48">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading image...</div>
          </div>
        )}
        <img 
          src={foodImage || getFallbackImage()}
          alt={title}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
          <span className="text-lg">{getMealTypeIcon()}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-[#2D3436] mb-2 text-sm leading-tight line-clamp-2">
          {originalTitle || title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[#1e293b] text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>{time}</span>
          </div>
          
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-3 h-3 ${
                  i < rating ? 'text-[#e09026] fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
