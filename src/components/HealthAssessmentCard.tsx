import React from 'react';
import { Activity, Heart, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthAssessment } from '@/hooks/useMealPlans';

interface HealthAssessmentCardProps {
    healthAssessment: HealthAssessment;
    userInfo?: any;
}

const HealthAssessmentCard: React.FC<HealthAssessmentCardProps> = ({ healthAssessment, userInfo }) => {
    const getWHtRColor = (category: string) => {
        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('underweight')) {
            return 'text-blue-600 bg-blue-50';
        } else if (lowerCategory.includes('healthy') || lowerCategory.includes('normal')) {
            return 'text-green-600 bg-green-50';
        } else if (lowerCategory.includes('overweight') || lowerCategory.includes('increased risk')) {
            return 'text-orange-600 bg-orange-50';
        } else if (lowerCategory.includes('obese') || lowerCategory.includes('high risk')) {
            return 'text-red-600 bg-red-50';
        } else {
            return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Heart className="h-5 w-5 text-red-500" />
                    Your Health Assessment
                </CardTitle>
                <CardDescription>
                    Based on your profile: {userInfo?.age} years old, {userInfo?.gender}, {userInfo?.height}cm, {userInfo?.weight}kg
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* WHtR (Waist-to-Height Ratio) */}
                    <div className="bg-white p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">WHtR</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{healthAssessment.whtr.toFixed(2)}</div>
                        <div className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded ${getWHtRColor(healthAssessment.whtr_category)}`}>
                            {healthAssessment.whtr_category}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Waist-to-Height Ratio</div>
                    </div>

                    {/* BMR */}
                    <div className="bg-white p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-600">BMR</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{healthAssessment.bmr.toFixed(0)}</div>
                        <div className="text-xs text-gray-500 mt-1">calories/day at rest</div>
                    </div>

                    {/* Daily Calories */}
                    <div className="bg-white p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-600">Daily Target</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{healthAssessment.daily_calories.toFixed(0)}</div>
                        <div className="text-xs text-gray-500 mt-1">calories needed</div>
                    </div>

                    {/* Condition & Goal */}
                    <div className="bg-white p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-600">Health Plan</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 capitalize">{userInfo?.condition}</div>
                        <div className="text-xs text-gray-500 mt-1 capitalize">Goal: {userInfo?.goal?.replace('_', ' ')}</div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-100 border border-blue-200 text-sm text-blue-900">
                    <strong>Note:</strong> This meal plan has been designed by medical AI specifically for your health condition and goals. Follow it consistently for best results.
                </div>
            </CardContent>
        </Card>
    );
};

export default HealthAssessmentCard;

