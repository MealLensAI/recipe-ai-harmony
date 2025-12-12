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
    Heart,
    Stethoscope,
    Sparkles,
    CheckCircle,
    Calendar,
    Search,
    Lightbulb,
    Activity,
    Menu,
    X,
    Shield
} from 'lucide-react';
import { setProductType } from '@/lib/productType';

const ProductHealthPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Store product type preference when user views this page
        setProductType('health');
        
        // If user is already logged in, redirect to dashboard
        if (user) {
            navigate('/ai-kitchen', { replace: true });
        }
    }, [user, navigate]);

    const handleGetStarted = () => {
        if (!user) {
            navigate('/signup', { state: { productType: 'health' } });
        } else {
            navigate('/ai-kitchen');
        }
    };

    const handleLogin = () => {
        navigate('/login', { state: { productType: 'health' } });
    };

    const features = [
        {
            icon: <Stethoscope className="h-8 w-8 text-white" />,
            title: "Health-First Meal Planning",
            description: "Personalized 7-day meal plans designed specifically for your chronic condition (diabetes, hypertension, PCOS, renal care, etc.)."
        },
        {
            icon: <Heart className="h-8 w-8 text-white" />,
            title: "Improve Health Through Food",
            description: "Maintain or improve your health condition naturally through carefully curated meals. No drugs, just food that helps."
        },
        {
            icon: <Activity className="h-8 w-8 text-white" />,
            title: "BMI & BMR Calculations",
            description: "AI calculates your BMI and BMR based on your height, weight, gender, age, and activity level to determine your nutritional needs."
        },
        {
            icon: <Search className="h-8 w-8 text-white" />,
            title: "Restricted Ingredient Recipes",
            description: "If you're told you can only eat yam and beans, we'll generate 10+ creative recipes using just those ingredients, tailored to your condition."
        },
        {
            icon: <Calendar className="h-8 w-8 text-white" />,
            title: "Track Progress Over Time",
            description: "Monitor your health improvements with personalized tracking. See how food choices impact your well-being."
        },
        {
            icon: <Shield className="h-8 w-8 text-white" />,
            title: "AI Nutritionist",
            description: "Get professional nutrition guidance 24/7. Your AI nutritionist understands your condition and suggests safe, beneficial foods."
        }
    ];

    const conditions = [
        "Diabetes",
        "Hypertension",
        "PCOS",
        "Renal Care",
        "Weight Loss",
        "Weight Gain",
        "Cardiac Conditions",
        "And more..."
    ];

    const benefits = [
        "Personalized meal plans for your specific condition",
        "Maintain or improve health naturally through food",
        "No need to eat the same restrictive meals repeatedly",
        "Get 10+ recipe variations from limited ingredients",
        "BMI and BMR calculations for optimal nutrition",
        "Track your health progress over time",
        "24/7 AI nutritionist support",
        "Step-by-step cooking instructions",
        "Safe food recommendations for your condition",
        "Cost-effective alternative to frequent nutritionist visits"
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
                                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={handleGetStarted}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        Get Started
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => navigate('/ai-kitchen')}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Go to Dashboard
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-4 bg-red-100 text-red-600 border-red-200">
                            <Stethoscope className="h-3 w-3 mr-2" />
                            Product B: Improve Health Through Food
                        </Badge>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Improve Health Through Food
                            <span className="block text-red-500 mt-2">For Chronic Conditions</span>
                        </h1>

                        <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
                            Most people with chronic conditions don't know that they can get better health by using food. 
                            Or they don't know <strong>what food is safe</strong>, <strong>what food helps</strong>, or 
                            <strong>how to cook within restrictions</strong>.
                        </p>

                        <p className="text-lg text-gray-700 mb-10 max-w-3xl mx-auto">
                            <strong>Solution:</strong> MealLensAI becomes your food-based health coach. Input your symptoms/conditions 
                            or snap your ingredients, and our AI generates health-safe meals and variations personalized to your specific needs.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={handleGetStarted}
                                size="lg"
                                className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleLogin}
                                className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-6 text-lg font-semibold"
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
                                <p className="font-semibold">People with chronic conditions struggle with:</p>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>Not knowing what food is safe for their condition</li>
                                    <li>Not knowing what food helps improve their health</li>
                                    <li>Not knowing how to cook within dietary restrictions</li>
                                    <li>Being told they can only eat limited ingredients (e.g., yam and beans)</li>
                                    <li>Getting bored with the same restrictive meals</li>
                                    <li>Frequent nutritionist visits being expensive and time-consuming</li>
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
                                <p className="font-semibold">MealLensAI Health provides:</p>
                                <ul className="space-y-2 list-disc list-inside">
                                    <li>Health-safe meal recommendations</li>
                                    <li>10+ recipe variations from restricted ingredients</li>
                                    <li>Personalized plans using BMI, BMR, age, gender, activity level</li>
                                    <li>Progress tracking over time</li>
                                    <li>AI nutritionist available 24/7</li>
                                    <li>Cost-effective alternative to frequent visits</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Conditions Supported */}
            <section className="py-16 bg-red-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Conditions We Support
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Get personalized meal plans tailored to your specific health condition
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {conditions.map((condition, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 border-2 border-red-200 hover:border-red-500 transition-all">
                                    <div className="text-gray-900 font-semibold">{condition}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Everything You Need
                            <span className="text-red-500 block">To Improve Your Health</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-2 border-gray-200 hover:border-red-500 transition-all hover:shadow-xl">
                                <CardHeader>
                                    <div className={`w-14 h-14 bg-gradient-to-br from-red-500 to-red-400 rounded-xl flex items-center justify-center mb-4`}>
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

            {/* Example Use Case */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-2 border-blue-200 bg-blue-50">
                            <CardHeader>
                                <CardTitle className="text-blue-900 flex items-center gap-2">
                                    <Lightbulb className="h-6 w-6" />
                                    Real Example
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p className="font-semibold text-lg">If you're a patient who is being told you can only eat yam and beans alone for your entire life:</p>
                                <p>
                                    Give our AI those food ingredients, and we can generate like 10+ food you can make with those 
                                    that are tailored to your sickness. No more eating the same boring meal every day - get variety 
                                    while staying within your dietary restrictions.
                                </p>
                                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                                    <p className="font-semibold mb-2">AI considers:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Your specific health condition</li>
                                        <li>Your height, weight, gender, waist measurements</li>
                                        <li>Your age and country</li>
                                        <li>Your activity level</li>
                                        <li>Your health goals (heal, maintain, improve)</li>
                                        <li>BMI and BMR calculations for optimal nutrition</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 bg-gray-50">
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
                                    <CheckCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                                    <span className="text-gray-700 text-lg">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-red-500">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Ready to Improve Your Health Through Food?
                    </h2>
                    <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
                        Start your free 2-day trial and get personalized meal plans for your chronic condition
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={handleGetStarted}
                            size="lg"
                            variant="secondary"
                            className="bg-white text-red-500 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            onClick={handleLogin}
                            size="lg"
                            variant="outline"
                            className="border-white text-white hover:bg-red-600 px-8 py-6 text-lg font-semibold"
                        >
                            Log In
                        </Button>
                    </div>
                    <p className="text-red-100 mt-6 text-sm">
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

export default ProductHealthPage;
