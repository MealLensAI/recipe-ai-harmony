import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/utils';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    ArrowRight,
    Camera,
    ChefHat,
    Sparkles,
    CheckCircle,
    Calendar,
    Search,
    Lightbulb,
    UtensilsCrossed,
    Menu,
    X
} from 'lucide-react';
import { setProductType } from '@/lib/productType';

const ProductCookingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Store product type preference when user views this page
        setProductType('cooking');
        
        // If user is already logged in, redirect to dashboard
        if (user) {
            navigate('/ai-kitchen', { replace: true });
        }
    }, [user, navigate]);

    const handleGetStarted = () => {
        if (!user) {
            navigate('/signup', { state: { productType: 'cooking' } });
        } else {
            navigate('/ai-kitchen');
        }
    };

    const handleLogin = () => {
        navigate('/login', { state: { productType: 'cooking' } });
    };

    const features = [
        {
            icon: <Camera className="h-8 w-8 text-white" />,
            title: "Snap & Get Recipes",
            description: "Take a photo of your ingredients and get 10+ recipe ideas instantly with step-by-step cooking instructions."
        },
        {
            icon: <ChefHat className="h-8 w-8 text-white" />,
            title: "End Cooking Burnout",
            description: "Never cook the same meal twice. Get endless variations from the ingredients you already have in your kitchen."
        },
        {
            icon: <Calendar className="h-8 w-8 text-white" />,
            title: "Automatic Meal Plans",
            description: "Generate weekly meal plans based on your budget, location, and preferences. Breakfast, lunch, dinner, and dessert included."
        },
        {
            icon: <Search className="h-8 w-8 text-white" />,
            title: "Budget & Location-Based",
            description: "Get meal suggestions that match your local grocery stores and fit within your budget. No expensive ingredients needed."
        },
        {
            icon: <Lightbulb className="h-8 w-8 text-white" />,
            title: "Smart Ingredient Detection",
            description: "AI identifies what's in your fridge and pantry, then suggests creative recipes you never thought of."
        },
        {
            icon: <Sparkles className="h-8 w-8 text-white" />,
            title: "Reduce Food Waste",
            description: "Use what you have instead of buying more. Save money and reduce waste while discovering new favorite dishes."
        }
    ];

    const benefits = [
        "End cooking burnout once and for all",
        "Save money by using ingredients you already have",
        "Reduce food waste and help the environment",
        "Get 10+ recipe variations from the same ingredients",
        "Automatic weekly meal planning",
        "Budget-friendly meal suggestions",
        "Location-based ingredient availability",
        "Step-by-step cooking instructions",
        "Video resources for learning new recipes",
        "Make dinner decisions in seconds"
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/landing')}
                                className="p-2"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <Logo size="lg" />
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {!user ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleLogin}
                                        className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={handleGetStarted}
                                        className="bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                        Get Started
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => navigate('/ai-kitchen')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    Go to Dashboard
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-4 bg-orange-100 text-orange-600 border-orange-200">
                            <UtensilsCrossed className="h-3 w-3 mr-2" />
                            Product A: End Cooking Burnout
                        </Badge>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            End Cooking Burnout
                            <span className="block text-orange-500 mt-2">For Everyone</span>
                        </h1>

                        <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                            You buy ingredients for the month, but end up cooking the same 1–2 meals with them again and again. 
                            Soon, the food feels boring, food gets exhausting, decision fatigue kicks in, and you feel like you have 
                            "no food" even when your kitchen is full.
                        </p>

                        <p className="text-lg text-gray-700 mb-10 max-w-3xl mx-auto">
                            <strong>Solution:</strong> Snap a photo of those ingredients, and our AI will identify them, 
                            suggest 10 new dishes, and guide you step-by-step on how to cook them each.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={handleGetStarted}
                                size="lg"
                                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleLogin}
                                className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-6 text-lg font-semibold"
                            >
                                Sign In
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem & Solution */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                        <Card className="border-2 border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="text-red-800 flex items-center gap-2">
                                    <span className="text-2xl">🚨</span> The Problem
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p className="font-semibold">You experience:</p>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>Cooking the same meals repeatedly</li>
                                    <li>Feeling like you have "no food" even with a full kitchen</li>
                                    <li>Decision fatigue about what to cook</li>
                                    <li>Food getting boring and exhausting</li>
                                    <li>Wasting ingredients you don't know how to use</li>
                                    <li>Not knowing what to cook with what you have</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-800 flex items-center gap-2">
                                    <span className="text-2xl">✨</span> Our Solution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p className="font-semibold">MealLensAI provides:</p>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>10+ recipe ideas from your ingredients</li>
                                    <li>Step-by-step cooking instructions</li>
                                    <li>Automatic weekly meal plans</li>
                                    <li>Budget and location-based suggestions</li>
                                    <li>Use-what-you-have cooking</li>
                                    <li>Instant dinner decisions</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Everything You Need
                            <span className="text-orange-500 block">To End Cooking Burnout</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-2 border-gray-200 hover:border-orange-500 transition-all hover:shadow-xl">
                                <CardHeader>
                                    <div className={`w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mb-4`}>
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-lg font-bold text-gray-900">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                                Why Choose This Product?
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                                    <span className="text-gray-700 text-lg">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-orange-500">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Ready to End Cooking Burnout?
                    </h2>
                    <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                        Start your free 2-day trial and discover endless meal possibilities from your kitchen
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={handleGetStarted}
                            size="lg"
                            variant="secondary"
                            className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            onClick={handleLogin}
                            size="lg"
                            variant="outline"
                            className="border-white text-white hover:bg-orange-600 px-8 py-6 text-lg font-semibold"
                        >
                            Log In
                        </Button>
                    </div>
                    <p className="text-orange-100 mt-6 text-sm">
                        One payment gives you access to both products - Cooking and Health
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <Logo size="lg" />
                        <p className="mt-4 text-gray-400">
                            &copy; 2024 MealLens AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ProductCookingPage;
