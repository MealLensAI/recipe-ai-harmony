import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Clock, Utensils, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSicknessSettings } from '@/hooks/useSicknessSettings';

interface MealPlan {
    id: string;
    day: string;
    breakfast: {
        name: string;
        description: string;
        time: string;
        healthBenefits: string[];
    };
    lunch: {
        name: string;
        description: string;
        time: string;
        healthBenefits: string[];
    };
    dinner: {
        name: string;
        description: string;
        time: string;
        healthBenefits: string[];
    };
    snacks: {
        name: string;
        description: string;
        time: string;
        healthBenefits: string[];
    }[];
}

const HealthPlanner = () => {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
    const { toast } = useToast();
    const { getSicknessInfo } = useSicknessSettings();

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const getWeekDates = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start.setDate(diff);

        const week = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            week.push(day);
        }
        return week;
    };

    const weekDates = getWeekDates(currentWeek);

    const generateHealthMealPlan = async () => {
        setIsLoading(true);
        try {
            const sicknessInfo = getSicknessInfo();

            // Simulate API call to generate health-focused meal plan
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate sample meal plans for the week
            const generatedPlans: MealPlan[] = weekDates.map((date, index) => ({
                id: `plan-${date.toISOString().split('T')[0]}`,
                day: daysOfWeek[index],
                breakfast: {
                    name: "Oatmeal with Berries",
                    description: "Steel-cut oats with fresh berries and nuts",
                    time: "8:00 AM",
                    healthBenefits: ["High fiber", "Antioxidants", "Heart healthy"]
                },
                lunch: {
                    name: "Grilled Salmon Salad",
                    description: "Fresh salmon with mixed greens and vegetables",
                    time: "1:00 PM",
                    healthBenefits: ["Omega-3 fatty acids", "Protein", "Vitamins"]
                },
                dinner: {
                    name: "Vegetable Stir-fry",
                    description: "Mixed vegetables with lean protein",
                    time: "7:00 PM",
                    healthBenefits: ["Low sodium", "High vitamins", "Balanced nutrition"]
                },
                snacks: [
                    {
                        name: "Greek Yogurt",
                        description: "Plain Greek yogurt with honey",
                        time: "3:00 PM",
                        healthBenefits: ["Probiotics", "Protein", "Calcium"]
                    }
                ]
            }));

            setMealPlans(generatedPlans);

            toast({
                title: "Health Meal Plan Generated",
                description: `Personalized meal plan created for your health condition: ${sicknessInfo?.sicknessType || 'General health'}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate meal plan. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getMealPlanForDay = (date: Date) => {
        return mealPlans.find(plan => {
            const planDate = new Date(plan.id.replace('plan-', ''));
            return planDate.toDateString() === date.toDateString();
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Health Meal Planner
                            </h1>
                            <p className="text-lg text-gray-600">
                                Personalized nutrition plans for your health journey
                            </p>
                        </div>
                        <Button
                            onClick={generateHealthMealPlan}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Generate Health Plan
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                            className="flex items-center"
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous Week
                        </Button>

                        <h2 className="text-xl font-semibold text-gray-800">
                            {currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>

                        <Button
                            variant="outline"
                            onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                            className="flex items-center"
                        >
                            Next Week
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-2">
                        {weekDates.map((date, index) => {
                            const mealPlan = getMealPlanForDay(date);
                            const isSelected = selectedDay.toDateString() === date.toDateString();

                            return (
                                <Card
                                    key={index}
                                    className={`cursor-pointer transition-all duration-200 ${isSelected
                                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                            : isToday(date)
                                                ? 'bg-blue-100 border-blue-300'
                                                : 'bg-white hover:bg-blue-50'
                                        }`}
                                    onClick={() => setSelectedDay(date)}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div className="text-sm font-medium mb-1">
                                            {daysOfWeek[index]}
                                        </div>
                                        <div className="text-lg font-bold mb-2">
                                            {date.getDate()}
                                        </div>
                                        <div className="text-xs opacity-75">
                                            {formatDate(date)}
                                        </div>
                                        {mealPlan && (
                                            <div className="mt-2">
                                                <Badge
                                                    variant={isSelected ? "secondary" : "default"}
                                                    className="text-xs"
                                                >
                                                    <Heart className="h-3 w-3 mr-1" />
                                                    Planned
                                                </Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Meal Plan */}
                {(() => {
                    const selectedMealPlan = getMealPlanForDay(selectedDay);

                    if (!selectedMealPlan) {
                        return (
                            <Card className="bg-white shadow-lg">
                                <CardContent className="p-8 text-center">
                                    <Heart className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No meal plan for {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Generate a health-focused meal plan to get started
                                    </p>
                                    <Button
                                        onClick={generateHealthMealPlan}
                                        disabled={isLoading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Generate Plan
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    }

                    return (
                        <div className="space-y-6">
                            <Card className="bg-white shadow-lg">
                                <CardHeader className="bg-blue-600 text-white rounded-t-lg">
                                    <CardTitle className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </CardTitle>
                                    <CardDescription className="text-blue-100">
                                        Your personalized health meal plan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        {/* Breakfast */}
                                        <div className="border-l-4 border-blue-500 pl-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">Breakfast</h3>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {selectedMealPlan.breakfast.time}
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                                                {selectedMealPlan.breakfast.name}
                                            </h4>
                                            <p className="text-gray-600 mb-3">
                                                {selectedMealPlan.breakfast.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedMealPlan.breakfast.healthBenefits.map((benefit, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                                        {benefit}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Lunch */}
                                        <div className="border-l-4 border-green-500 pl-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">Lunch</h3>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {selectedMealPlan.lunch.time}
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                                                {selectedMealPlan.lunch.name}
                                            </h4>
                                            <p className="text-gray-600 mb-3">
                                                {selectedMealPlan.lunch.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedMealPlan.lunch.healthBenefits.map((benefit, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                                                        {benefit}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dinner */}
                                        <div className="border-l-4 border-purple-500 pl-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-800">Dinner</h3>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {selectedMealPlan.dinner.time}
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                                                {selectedMealPlan.dinner.name}
                                            </h4>
                                            <p className="text-gray-600 mb-3">
                                                {selectedMealPlan.dinner.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedMealPlan.dinner.healthBenefits.map((benefit, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                                        {benefit}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Snacks */}
                                        {selectedMealPlan.snacks.map((snack, index) => (
                                            <div key={index} className="border-l-4 border-orange-500 pl-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800">Snack</h3>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Clock className="h-4 w-4 mr-1" />
                                                        {snack.time}
                                                    </div>
                                                </div>
                                                <h4 className="text-xl font-bold text-gray-900 mb-2">
                                                    {snack.name}
                                                </h4>
                                                <p className="text-gray-600 mb-3">
                                                    {snack.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {snack.healthBenefits.map((benefit, benefitIndex) => (
                                                        <Badge key={benefitIndex} variant="secondary" className="bg-orange-100 text-orange-800">
                                                            {benefit}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default HealthPlanner;
