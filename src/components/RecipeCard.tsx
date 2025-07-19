import React, { useEffect, useState } from 'react';
import { Clock, Star } from 'lucide-react';

interface RecipeCardProps {
  planId: string;
  day: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

const RecipeCard: React.FC<RecipeCardProps> = ({ planId, day, mealType }) => {
  const [meal, setMeal] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meal_plan/${planId}/${day}/${mealType}`, {
      headers: {
        'Authorization': `Bearer ${window.localStorage.getItem('access_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setMeal(data.meal);
        setIngredients(data.ingredients || []);
        setLoading(false);
      });
  }, [planId, day, mealType]);

  if (loading) return <div>Loading...</div>;
  if (!meal) return <div>No {mealType} for {day}</div>;

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

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
    >
      <div className="relative h-48">
        {loading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading image...</div>
          </div>
        )}
        <img 
          src={getFallbackImage()}
          alt={meal || 'Meal'}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
          <span className="text-lg">{getMealTypeIcon()}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-[#2D3436] mb-2 text-sm leading-tight line-clamp-2">
          {meal}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[#1e293b] text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>N/A</span>
          </div>
          
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-3 h-3 ${
                  i < 3 ? 'text-[#e09026] fill-current' : 'text-gray-300'
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
