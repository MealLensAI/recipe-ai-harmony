import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/utils';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Shield,
    Star,
    ArrowRight,
    CheckCircle,
    Zap,
    Heart,
    Crown,
    Play,
    Menu,
    X,
    Calendar,
    Activity,
    TrendingUp,
    Camera
} from 'lucide-react';
import { APP_CONFIG, getPlanPrice, getPlanDisplayName, getPlanDurationText, getPlanFeatures } from '../lib/config';

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Removed user count feature

    // If a logged-in user hits the landing page, immediately send them to the app
    useEffect(() => {
        if (user) {
            try {
                window.location.replace('/ai-kitchen');
            } catch {
                navigate('/ai-kitchen', { replace: true });
            }
        }
    }, [user, navigate]);

    const handleTryMealLensAI = () => {
        if (!user) {
            navigate('/signup');
        } else {
            navigate('/ai-kitchen');
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleGetStarted = () => {
        if (!user) {
            navigate('/signup');
        } else {
            navigate('/ai-kitchen');
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    // Features focused on health
    const features = [
        {
            icon: <Heart className="h-8 w-8 text-white" />,
            title: "⭐️ Health-First Meal Planning for Chronic Conditions",
            description: "The Problem: Managing chronic conditions like diabetes, hypertension, renal care, and PCOS through diet is complex and confusing, and you need to eat food that will not worsen your health.\n\nOur Solution: Practical, 7-day meal plan (breakfast, lunch, dinner, dessert) designed specifically for health conditions so you gradually heal or maintain the sickness without getting it worse with AI instructions on how to cook them each.\n\nImpact: We're making healthy eating accessible and sustainable.",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <Activity className="h-8 w-8 text-white" />,
            title: "⭐️ BMI & BMR Calculations",
            description: "The Problem: Understanding your nutritional needs requires complex calculations based on your body metrics.\n\nOur Solution: AI automatically calculates your BMI and BMR based on your height, weight, gender, age, and activity level to determine your exact nutritional needs.\n\nImpact: Personalized nutrition recommendations tailored to your body.",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <Search className="h-8 w-8 text-white" />,
            title: "⭐️ Restricted Ingredient Recipes",
            description: "The Problem: When told you can only eat specific ingredients for your condition, it's hard to find creative recipes.\n\nOur Solution: If you're told you can only eat yam and beans, we'll generate 10+ creative recipes using just those ingredients, tailored to your condition.\n\nImpact: Never feel limited by dietary restrictions again.",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <Calendar className="h-8 w-8 text-white" />,
            title: "⭐️ Automatic 7-Day Health Meal Plans",
            description: "The Problem: Planning meals for your health condition is time-consuming and stressful.\n\nOur Solution: Health-focused plans for breakfast, lunch, dinner, and dessert that run on autopilot, designed for your specific condition.\n\nImpact: Eliminate meal planning stress while improving your health.",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <Shield className="h-8 w-8 text-white" />,
            title: "⭐️ AI Nutritionist",
            description: "The Problem: Getting professional nutrition guidance is expensive and not always accessible.\n\nOur Solution: Get professional nutrition guidance 24/7. Your AI nutritionist understands your condition and suggests safe, beneficial foods.\n\nImpact: Professional nutrition advice whenever you need it.",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <TrendingUp className="h-8 w-8 text-white" />,
            title: "⭐️ Track Progress Over Time",
            description: "The Problem: It's hard to see if your dietary changes are actually improving your health.\n\nOur Solution: Monitor your health improvements with personalized tracking. See how food choices impact your well-being.\n\nImpact: Data-driven health improvements you can actually see.",
            gradient: "from-orange-500 to-orange-400"
        }
    ];

    const benefits = [
        "Health-first meal plans for diabetes, hypertension, renal care, and PCOS",
        "Automatic 7-day meal plans tailored to your health condition",
        "BMI & BMR calculations for personalized nutrition",
        "Restricted ingredient recipes that work with your dietary needs",
        "24/7 AI nutritionist guidance",
        "Track your health progress over time",
        "Personalized meal plans based on your body metrics",
        "Improve your health through food, naturally"
    ];

    useEffect(() => {
        // Remove any transition overlay that may exist from a redirect
        try {
            const el = document.getElementById('page-transition-overlay');
            if (el) {
                el.style.opacity = '0';
                setTimeout(() => { if (el && el.parentNode) { el.parentNode.removeChild(el); } }, 200);
            }
        } catch { }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Logo size="lg" />
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-6 lg:space-x-8">
                            <a href="#home" className="text-gray-700 hover:text-[#FF6B6B] text-sm lg:text-base transition-colors font-medium">Home</a>
                            <a href="#features" className="text-gray-700 hover:text-[#FF6B6B] text-sm lg:text-base transition-colors font-medium">Features</a>
                            <a href="#pricing" className="text-gray-700 hover:text-[#FF6B6B] text-sm lg:text-base transition-colors font-medium">Pricing</a>
                        </nav>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {!user ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleLogin}
                                        className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors hidden sm:inline-flex"
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={handleGetStarted}
                                        className="bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                                    >
                                        Get Started
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <span className="hidden sm:block text-gray-700 text-sm lg:text-base truncate max-w-32 lg:max-w-none">{user.email}</span>
                                    <Button
                                        variant="outline"
                                        onClick={signOut}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Sign Out
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMobileMenu}
                                className="md:hidden p-2"
                            >
                                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
                            <nav className="flex flex-col space-y-3 pt-4">
                                <a href="#home" className="text-gray-700 hover:text-[#FF6B6B] transition-colors font-medium">Home</a>
                                <a href="#features" className="text-gray-700 hover:text-[#FF6B6B] transition-colors font-medium">Features</a>
                                <a href="#pricing" className="text-gray-700 hover:text-[#FF6B6B] transition-colors font-medium">Pricing</a>
                                {!user ? (
                                    <Button
                                        variant="outline"
                                        onClick={handleLogin}
                                        className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors mt-2"
                                    >
                                        Sign In
                                    </Button>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-gray-700 text-sm truncate">{user.email}</div>
                                        <Button
                                            variant="outline"
                                            onClick={signOut}
                                            className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors w-full"
                                        >
                                            Sign Out
                                        </Button>
                                    </div>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Section with Countdown */}
            <section id="home" className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <Badge className="mb-4 sm:mb-6 bg-orange-50 text-orange-500 border-orange-200">
                                <Heart className="h-3 w-3 mr-2" />
                                AI Health Nutrition • Personalized Meal Plans
                            </Badge>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                                AI Health Nutrition
                                <span className="block text-orange-500">Get Better Health From Your Food.</span>
                            </h1>

                            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                MealLensAI helps you improve your health by giving you personalized meal plans tailored to your health condition.
                                Generate health-focused meals from ingredients or get
                                comprehensive 7-day meal plans for conditions like diabetes,
                                hypertension, PCOS, and more
                                or hypertension. Generate budget-friendly,
                                location-based meal plans, making dinner
                                simple again, all powered by AI. </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button
                                    onClick={handleTryMealLensAI}
                                    size="lg"
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300"
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Learn More
                                </Button>
                            </div>

                            {/* Trust indicators (without user count) */}
                            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                                    <span className="text-xs sm:text-sm">4.9/5 Rating</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-xs sm:text-sm">Secure & Private</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center order-first lg:order-last">
                            <div className="relative">
                                {/* Main illustration */}
                                <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-400/20 rounded-3xl blur-2xl"></div>
                                    <div className="relative bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-2xl">
                                        <div className="text-center">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                                                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Health-Focused Meal Plans</h3>
                                            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Personalized meal plans designed for your health condition</p>
                                            <div className="flex justify-center space-x-3 sm:space-x-4">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                                                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                                                </div>
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                                                    <Search className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                                                </div>
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                                                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating elements */}
                                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                </div>
                                <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 -left-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12 sm:mb-16">
                        <Badge className="mb-4 bg-orange-50 text-orange-500 border-orange-200 shadow-sm">
                            <Heart className="h-3 w-3 mr-2" />
                            Powerful Features
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                            Everything You Need for
                            <span className="text-orange-500 block">Better Health</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            From personalized meal planning to health condition management, we've got you covered with AI-powered features that transform your health through nutrition.
                        </p>
                    </div>

                    {/* Scrollable Features Container */}
                    <div className="relative">
                        <div className="overflow-x-auto pb-4">
                            <div className="flex gap-6 min-w-max px-4">
                                {features.map((feature, index) => (
                                    <div key={index} className="group relative flex-shrink-0 w-96">
                                        <Card className="h-full border-2 border-gray-200 hover:border-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden">
                                            <CardHeader className="p-6">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg flex-shrink-0`}>
                                                        {feature.icon}
                                                    </div>
                                                    <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                                                        {feature.title}
                                                    </CardTitle>
                                                </div>

                                                <div className="space-y-4">
                                                    {feature.description.split('\n\n').map((section, sectionIndex) => {
                                                        const [label, ...content] = section.split(': ');
                                                        const contentText = content.join(': ');

                                                        return (
                                                            <div key={sectionIndex} className="space-y-2">
                                                                <h4 className="font-bold text-orange-600 text-sm uppercase tracking-wide flex items-center gap-2">
                                                                    {label === 'Problem' && '🚨 Problem'}
                                                                    {label === 'The Problem' && '🚨 Problem'}
                                                                    {label === 'Solution' && '✨ Solution'}
                                                                    {label === 'Our Solution' && '✨ Solution'}
                                                                    {label === 'Impact' && '🎯 Impact'}
                                                                </h4>
                                                                <p className="text-gray-700 text-sm leading-relaxed pl-4 border-l-2 border-orange-200 font-medium">
                                                                    {contentText}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardHeader>

                                            {/* Subtle hover effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-400/0 group-hover:from-orange-500/5 group-hover:to-orange-400/5 transition-all duration-300 rounded-2xl"></div>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scroll indicators */}
                        <div className="flex justify-center mt-4 space-x-2">
                            <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12 sm:mb-16">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                                Why Choose MealLens AI?
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-600">
                                Join thousands of users who have improved their health through personalized nutrition
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                {benefits.slice(0, 4).map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                {benefits.slice(3).map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section with Real Data */}
            <section id="pricing" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <Badge className="mb-4 bg-orange-50 text-orange-500 border-orange-200">
                            <Crown className="h-3 w-3 mr-2" />
                            Simple Pricing
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                            Choose Your Perfect
                            <span className="text-orange-500 block">Plan</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                            Start with a 2-day free trial, then choose the plan that works best for you. All plans include the same features - only the duration differs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                        {APP_CONFIG.subscriptionPlans.map((plan: any) => (
                            <Card key={plan.id} className={`relative border-2 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${plan.id === 'monthly' ? 'border-orange-500 shadow-lg' : 'border-gray-200'
                                }`}>
                                {plan.id === 'monthly' && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                        <Badge className="bg-orange-500 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}
                                {plan.id === 'yearly' && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                        <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                                            Best Value
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader className="text-center pb-4 pt-6">
                                    <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                                        {getPlanDisplayName(plan.id)}
                                    </CardTitle>
                                    <div className="mt-4">
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-3xl font-bold text-orange-500">
                                                ${getPlanPrice(plan.id, plan.billing_cycle).toFixed(2)}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-600 mt-1 block">
                                            {getPlanDurationText(plan.billing_cycle)}
                                        </span>
                                        {plan.id === 'yearly' && (
                                            <div className="mt-2">
                                                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                                                    Save $20/year
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 pb-6">
                                    <ul className="space-y-2">
                                        {getPlanFeatures(plan.id).map((feature: string, index: number) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-xs text-gray-700 leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        onClick={handleGetStarted}
                                        className={`w-full mt-4 text-sm font-semibold py-2 ${plan.id === 'monthly'
                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                            : 'bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-700 transition-all duration-300'
                                            }`}
                                    >
                                        Get Started
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Plans Include:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-orange-500" />
                                    <span>2-day free trial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-orange-500" />
                                    <span>Cancel anytime</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-orange-500" />
                                    <span>All features included</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-orange-500" />
                                    <span>No hidden fees</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-20 bg-orange-500">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                        Ready to Improve Your Health?
                    </h2>
                    <p className="text-lg sm:text-xl text-orange-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
                        Join thousands of users who are already improving their health through personalized nutrition with MealLens AI
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={handleGetStarted}
                            size="lg"
                            variant="secondary"
                            className="bg-white text-orange-500 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                            onClick={handleLogin}
                            size="lg"
                            variant="outline"
                            className="border-white text-white hover:bg-orange-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                        >
                            Log In
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="col-span-2">
                            <Logo size="lg" />
                            <p className="mt-4 text-gray-400 max-w-md">
                                Your AI-powered health nutrition assistant.
                                Making healthy eating accessible and personalized for everyone.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 MealLens AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WelcomePage;
