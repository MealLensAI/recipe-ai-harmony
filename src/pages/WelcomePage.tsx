import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/utils';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Camera,
    ChefHat,
    Search,
    Sparkles,
    Shield,
    Users,
    Star,
    ArrowRight,
    CheckCircle,
    Zap,
    Heart,
    Crown,
    Play,
    Menu,
    X,
    Target,
    TrendingUp,
    Calendar,
    History
} from 'lucide-react';
import { APP_CONFIG, getPlanPrice, getPlanDisplayName, getPlanDurationText, getPlanFeatures } from '../lib/config';

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userCount, setUserCount] = useState(1000); // Default fallback

    // Fetch user count - start from 1000 and fetch actual count if available
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                // Try to fetch actual user count from public endpoint
                const base = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8083' : 'https://meallens-ai-cmps.onrender.com');
                const response = await fetch(`${base}/api/public/user-count`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' && data.user_count) {
                        setUserCount(Math.max(1000, data.user_count)); // Ensure minimum of 1000
                    }
                }
            } catch (error) {
                console.error('Error fetching user count:', error);
                // Keep default fallback count of 1000
            }
        };

        fetchUserCount();
    }, []);

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

    // Features with actual data from config
    const features = [
        {
            icon: <Camera className="h-8 w-8 text-white" />,
            title: "Food Detection",
            description: "Identify food items from photos instantly with AI-powered recognition",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <ChefHat className="h-8 w-8 text-white" />,
            title: "AI Kitchen Assistant",
            description: "Get personalized recipe suggestions and cooking instructions",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <Calendar className="h-8 w-8 text-white" />,
            title: "Meal Planning",
            description: "Create personalized meal plans based on your preferences and dietary needs",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <History className="h-8 w-8 text-white" />,
            title: "History & Tracking",
            description: "Keep track of your food discoveries and favorite recipes",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <Target className="h-8 w-8 text-white" />,
            title: "Health Tracking",
            description: "Monitor your nutrition and get health-conscious meal suggestions",
            gradient: "from-orange-500 to-orange-400"
        },
        {
            icon: <TrendingUp className="h-8 w-8 text-white" />,
            title: "Progress Analytics",
            description: "Track your cooking journey and see your improvement over time",
            gradient: "from-orange-500 to-orange-400"
        }
    ];

    const benefits = [
        "7-day free trial for all features",
        "Unlimited food detection",
        "AI-powered recipe suggestions",
        "Personalized meal planning",
        "Cross-platform compatibility",
        "Secure and private"
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
                                <Sparkles className="h-3 w-3 mr-2" />
                                AI-Powered Kitchen Assistant
                            </Badge>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                                Transform Your
                                <span className="block text-orange-500">Culinary Journey</span>
                            </h1>

                            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Snap a picture of your ingredients or meal, and let our AI guide you with recipes,
                                cooking tips, and personalized suggestions. Your smart kitchen companion.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button
                                    onClick={handleTryMealLensAI}
                                    size="lg"
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                                >
                                    Start Cooking Now
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

                            {/* Trust indicators */}
                            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="text-xs sm:text-sm">{userCount.toLocaleString()}+ Happy Users</span>
                                </div>
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
                                                <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Smart Food Detection</h3>
                                            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Point your camera at any food and get instant recognition</p>
                                            <div className="flex justify-center space-x-3 sm:space-x-4">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                                                    <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
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
                                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
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
            <section id="features" className="py-16 sm:py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <Badge className="mb-4 bg-orange-50 text-orange-500 border-orange-200">
                            <Sparkles className="h-3 w-3 mr-2" />
                            Powerful Features
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                            Everything You Need for
                            <span className="text-orange-500 block">Smart Cooking</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                            From ingredient detection to personalized meal planning, we've got you covered with AI-powered features.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                                <CardHeader className="text-center pb-4">
                                    <div className="flex justify-center mb-4">
                                        <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                            {feature.icon}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
                                    <CardDescription className="text-gray-600">
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
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
                                Join {userCount.toLocaleString()}+ users who have transformed their cooking experience
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                {benefits.slice(0, 3).map((benefit, index) => (
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
            <section id="pricing" className="py-16 sm:py-20 bg-white">
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
                            Start with a 7-day free trial, then choose the plan that works best for you. All plans are billed in USD.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {APP_CONFIG.subscriptionPlans.map((plan: any) => (
                            <Card key={plan.id} className="relative border-2 hover:shadow-xl transition-all duration-300">
                                {plan.id === 'monthly' && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-orange-500 text-white px-4 py-1">Most Popular</Badge>
                                    </div>
                                )}
                                <CardHeader className="text-center pb-4">
                                    <CardTitle className="text-2xl font-bold text-gray-900">
                                        {getPlanDisplayName(plan.id)}
                                    </CardTitle>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-orange-500">
                                            ${getPlanPrice(plan.id, plan.billing_cycle).toFixed(2)}
                                        </span>
                                        <span className="text-gray-600 ml-2">
                                            {getPlanDurationText(plan.billing_cycle)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-3">
                                        {getPlanFeatures(plan.id).map((feature: string, index: number) => (
                                            <li key={index} className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        onClick={handleGetStarted}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-6"
                                    >
                                        Get Started
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-gray-600">
                            All plans include a 7-day free trial. Cancel anytime.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-20 bg-orange-500">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                        Ready to Transform Your Cooking?
                    </h2>
                    <p className="text-lg sm:text-xl text-orange-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
                        Join {userCount.toLocaleString()}+ users who are already cooking smarter with MealLens AI
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
                                Your AI-powered food detection and meal planning assistant.
                                Making cooking smarter and easier for everyone.
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
