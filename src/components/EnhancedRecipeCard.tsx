import React from 'react';
import { Utensils, Clock, Flame, Drumstick, Wheat, Droplet, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedRecipeCardProps {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    ingredients: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    benefit?: string;
    onClick: () => void;
}

const EnhancedRecipeCard: React.FC<EnhancedRecipeCardProps> = ({
    mealType,
    name,
    ingredients,
    calories,
    protein,
    carbs,
    fat,
    benefit,
    onClick
}) => {
    const getMealTypeColor = (type: string) => {
        switch (type) {
            case 'breakfast':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'lunch':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'dinner':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'snack':
                return 'bg-purple-50 border-purple-200 text-purple-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getMealIcon = (type: string) => {
        switch (type) {
            case 'breakfast':
                return '🌅';
            case 'lunch':
                return '☀️';
            case 'dinner':
                return '🌙';
            case 'snack':
                return '🍎';
            default:
                return '🍽️';
        }
    };

    const hasNutritionData = calories !== undefined && protein !== undefined;

    return (
        <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-[#FF6B35]"
            onClick={onClick}
        >
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMealIcon(mealType)}</span>
                        <Badge className={`${getMealTypeColor(mealType)} border`}>
                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Badge>
                    </div>
                    {hasNutritionData && calories && (
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 text-orange-800 text-xs font-semibold">
                            <Flame className="h-3 w-3" />
                            {calories} cal
                        </div>
                    )}
                </div>

                {/* Meal Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{name}</h3>

                {/* Nutrition Macros - Only show if data available */}
                {hasNutritionData && (
                    <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Drumstick className="h-3 w-3 text-red-600" />
                            </div>
                            <div className="text-sm font-bold text-gray-900">{protein}g</div>
                            <div className="text-xs text-gray-500">Protein</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Wheat className="h-3 w-3 text-amber-600" />
                            </div>
                            <div className="text-sm font-bold text-gray-900">{carbs}g</div>
                            <div className="text-xs text-gray-500">Carbs</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Droplet className="h-3 w-3 text-yellow-600" />
                            </div>
                            <div className="text-sm font-bold text-gray-900">{fat}g</div>
                            <div className="text-xs text-gray-500">Fat</div>
                        </div>
                    </div>
                )}

                {/* Health Benefit */}
                {benefit && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 text-xs text-green-800">
                        <div className="flex items-start gap-1">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{benefit}</span>
                        </div>
                    </div>
                )}

                {/* Ingredients */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                        <Utensils className="h-3 w-3" />
                        Ingredients:
                    </div>
                    <ul className="text-xs text-gray-600 space-y-0.5 max-h-20 overflow-y-auto">
                        {ingredients.slice(0, 4).map((ingredient, index) => (
                            <li key={index} className="pl-2">• {ingredient}</li>
                        ))}
                        {ingredients.length > 4 && (
                            <li className="pl-2 text-gray-400">+ {ingredients.length - 4} more...</li>
                        )}
                    </ul>
                </div>

                {/* Click to view instructions hint */}
                <div className="mt-3 pt-3 border-t text-center">
                    <span className="text-xs text-[#FF6B35] font-medium">
                        Click to view cooking instructions →
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default EnhancedRecipeCard;

