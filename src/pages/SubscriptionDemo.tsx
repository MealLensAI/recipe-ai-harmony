import React from 'react';
import { SubscriptionBlocker, FeatureBlocker, FeatureProtector } from '@/components/SubscriptionBlocker';
import { WeeklyFeature, BiWeeklyFeature, MonthlyFeature, YearlyFeature } from '@/components/FeatureProtector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SubscriptionDemo: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">Subscription System Demo</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Basic Subscription Blocker */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Subscription Blocker</h2>
                    <p className="text-gray-600 mb-4">
                        This blocks the entire page when subscription expires
                    </p>
                    <SubscriptionBlocker featureName="this demo page">
                        <div className="space-y-4">
                            <p className="text-green-600">✅ You have access to this content!</p>
                            <Button variant="outline">Access Feature</Button>
                        </div>
                    </SubscriptionBlocker>
                </Card>

                {/* Feature Blocker */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Feature Blocker</h2>
                    <p className="text-gray-600 mb-4">
                        This blocks specific features with upgrade prompts
                    </p>
                    <FeatureBlocker featureName="Advanced Analytics">
                        <div className="space-y-4">
                            <p className="text-green-600">✅ Advanced Analytics Available!</p>
                            <Button variant="outline">View Analytics</Button>
                        </div>
                    </FeatureBlocker>
                </Card>

                {/* Weekly Plan Feature */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Weekly Plan Feature</h2>
                    <p className="text-gray-600 mb-4">
                        Requires at least weekly subscription
                    </p>
                    <WeeklyFeature featureName="Basic Meal Planning">
                        <div className="space-y-4">
                            <p className="text-green-600">✅ Basic Meal Planning Available!</p>
                            <Button variant="outline">Plan Meals</Button>
                        </div>
                    </WeeklyFeature>
                </Card>

                {/* Bi-Weekly Plan Feature */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Bi-Weekly Plan Feature</h2>
                    <p className="text-gray-600 mb-4">
                        Requires at least bi-weekly subscription
                    </p>
                    <BiWeeklyFeature featureName="Recipe Collections">
                        <div className="space-y-4">
                            <p className="text-green-600">✅ Recipe Collections Available!</p>
                            <Button variant="outline">Browse Recipes</Button>
                        </div>
                    </BiWeeklyFeature>
                </Card>

                {/* Monthly Plan Feature */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Monthly Plan Feature</h2>
                    <p className="text-gray-600 mb-4">
                        Requires at least monthly subscription
                    </p>
                    <MonthlyFeature featureName="Nutrition Tracking">
                        <div className="space-y-4">
                            <p className="text-green-600">✅ Nutrition Tracking Available!</p>
                            <Button variant="outline">Track Nutrition</Button>
                        </div>
                    </MonthlyFeature>
                </Card>

                {/* Yearly Plan Feature */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Yearly Plan Feature</h2>
                    <p className="text-gray-600 mb-4">
                        Requires yearly subscription
                    </p>
                    <YearlyFeature featureName="API Access">
                        <div className="space-y-4">
                            <p className="text-green-600">✅ API Access Available!</p>
                            <Button variant="outline">View API Docs</Button>
                        </div>
                    </YearlyFeature>
                </Card>

                {/* Feature Protector with Custom Fallback */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Custom Fallback</h2>
                    <p className="text-gray-600 mb-4">
                        Shows custom content when blocked
                    </p>
                    <FeatureProtector
                        featureName="Premium Feature"
                        requiredPlan="monthly"
                        fallback={
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-2">This is a premium feature</p>
                                <Button size="sm" variant="outline">Learn More</Button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <p className="text-green-600">✅ Premium Feature Available!</p>
                            <Button variant="outline">Use Feature</Button>
                        </div>
                    </FeatureProtector>
                </Card>

                {/* Plan Comparison */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <h3 className="font-semibold">Weekly</h3>
                            <p className="text-gray-600">$2/week</p>
                            <ul className="text-xs text-gray-500 mt-2">
                                <li>Basic Features</li>
                                <li>Meal Planning</li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Bi-Weekly</h3>
                            <p className="text-gray-600">$5/2 weeks</p>
                            <ul className="text-xs text-gray-500 mt-2">
                                <li>Weekly +</li>
                                <li>Recipe Collections</li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Monthly</h3>
                            <p className="text-gray-600">$10/4 weeks</p>
                            <ul className="text-xs text-gray-500 mt-2">
                                <li>Bi-Weekly +</li>
                                <li>Nutrition Tracking</li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold">Yearly</h3>
                            <p className="text-gray-600">$100/year</p>
                            <ul className="text-xs text-gray-500 mt-2">
                                <li>Monthly +</li>
                                <li>API Access</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SubscriptionDemo;



