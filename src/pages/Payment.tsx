import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTrial } from '@/hooks/useTrial';
import { Clock, Camera, Utensils, Heart, Calendar } from 'lucide-react';
// import { TrialService } from '@/lib/trialService'; // No longer needed

// Declare PaystackPop for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

const FEATURES = [
  'MealLensAI meal planner',
  'MealLensAI cooked Food detection and cooking instructions',
  'MealLensAI Ingredient detection with cooking instructions',
  'Share your cooked meals with friends',
  'Health insights and nutrition tracking',
  'Shopping assistant and ingredient ordering',
];

// Pricing plans (USD). DurationDays controls subscription days after payment.
const MONTHLY_PLANS = [
  {
    label: '$1 / week',
    price: 1,              // USD price
    duration: '1 week',
    durationDays: 7,
    paystackAmount: 1,     // USD amount for Paystack
    highlight: false,
    icon: <Camera className="h-8 w-8 text-blue-500" />,
  },
  {
    label: '$5 / two weeks',
    price: 5,              // USD price
    duration: '2 weeks',
    durationDays: 14,
    paystackAmount: 5,     // USD amount for Paystack
    highlight: false,
    icon: <Utensils className="h-8 w-8 text-green-500" />,
  },
  {
    label: '$10 / four weeks',
    price: 10,             // USD price
    duration: '4 weeks',
    durationDays: 28,
    paystackAmount: 10,    // USD amount for Paystack
    highlight: true,       // Most popular
    icon: <Heart className="h-8 w-8 text-red-500" />,
  },
];

const YEARLY_PLAN = {
  label: '$100/year',
  price: 100,              // USD price
  duration: '1 year',
  paystackAmount: 100,     // USD amount for Paystack
  highlight: false,
  icon: <Calendar className="h-8 w-8 text-purple-500" />,
};

const Payment: React.FC = () => {
  const { formattedRemainingTime, isTrialExpired, hasActiveSubscription, isSubscriptionExpired, subscriptionInfo } = useTrial();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [name, setName] = useState('daniel');
  const [email, setEmail] = useState('danielsamueletukudo@gmail.com');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  React.useEffect(() => {
    if (!document.getElementById('paystack-script')) {
      console.log('🔄 Loading Paystack script...');
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Paystack script loaded successfully');
        console.log('🔍 PaystackPop available:', typeof window.PaystackPop !== 'undefined');
        if (typeof window.PaystackPop !== 'undefined') {
          console.log('🔍 PaystackPop methods:', Object.keys(window.PaystackPop));
        }
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Paystack script:', error);
        console.error('❌ Script src:', script.src);
      };
      document.body.appendChild(script);
    } else {
      console.log('✅ Paystack script already exists');
      console.log('🔍 PaystackPop available:', typeof window.PaystackPop !== 'undefined');
    }
  }, []);

  const openPaymentModal = (plan: any) => {
    console.log('🔍 Opening payment modal for plan:', plan);
    console.log('🔍 PaystackPop available:', typeof window.PaystackPop !== 'undefined');
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const processPayment = () => {
    console.log('🔍 Starting payment process...');

    if (!name || !email || !selectedPlan) {
      console.error('❌ Missing required fields:', { name: !!name, email: !!email, selectedPlan: !!selectedPlan });
      alert('Please fill in all fields');
      return;
    }

    // Use the real Paystack live key from the working HTML
    const publicKey = 'pk_live_5f7de652daf3ea53dc685902c5f28f0a2063bc33';

    if (!publicKey || !publicKey.startsWith('pk_')) {
      console.error('❌ Invalid Paystack public key:', publicKey);
      alert('Invalid Paystack public key configuration.');
      return;
    }

    console.log(`✅ Using Paystack key: ${publicKey.slice(0, 7)}...`);
    console.log('📋 Payment details:', {
      email,
      amount: selectedPlan.paystackAmount,
      plan: selectedPlan.label
    });

    // Check if PaystackPop is available
    if (typeof window.PaystackPop === 'undefined') {
      console.error('❌ PaystackPop is not available. Script may not have loaded.');
      console.log('🔍 Checking if Paystack script exists:', document.getElementById('paystack-script'));
      console.log('🔍 Window object keys:', Object.keys(window).filter(key => key.toLowerCase().includes('paystack')));
      alert('Payment system is not ready. Please refresh the page and try again.');
      return;
    }

    // Additional check for PaystackPop.setup method
    if (typeof window.PaystackPop.setup !== 'function') {
      console.error('❌ PaystackPop.setup is not a function');
      console.log('🔍 PaystackPop object:', window.PaystackPop);
      alert('Payment system is not properly initialized. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('🔧 Setting up Paystack payment...');

      const paymentOptions = {
        key: publicKey,
        email: email,
        amount: Math.round(selectedPlan.paystackAmount * 100), // Convert to cents (smallest USD unit)
        currency: 'KES',
        ref: '' + Math.floor(Math.random() * 1000000000 + 1),
        metadata: {
          custom_fields: [
            {
              display_name: 'Name',
              variable_name: 'name',
              value: name,
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: selectedPlan.label,
            },
          ],
        },
        callback: function (response: any) {
          console.log('✅ Payment successful:', response);
          alert('Thank you for your payment! Reference: ' + response.reference);

          // Handle subscription activation asynchronously
          (async () => {
            try {
              // Get current user info
              const userData = localStorage.getItem('user_data');
              let firebaseUid = 'anonymous';

              if (userData) {
                try {
                  const user = JSON.parse(userData);
                  firebaseUid = user.uid || user.id || user.email || 'anonymous';
                } catch (e) {
                  console.error('Error parsing user data:', e);
                }
              }

              console.log(`🔄 Calling backend to activate subscription...`);
              console.log(`👤 User: ${firebaseUid}`);
              console.log(`📧 Email: ${email}`);
              console.log(`📋 Plan: ${selectedPlan.label}`);
              console.log(`⏰ Duration: ${selectedPlan.durationDays} days`);

              // Call backend payment success endpoint
              const backendResponse = await fetch('http://127.0.0.1:8083/api/payment/success', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  firebase_uid: firebaseUid,
                  email: email,
                  plan_name: selectedPlan.label,
                  plan_duration_days: selectedPlan.durationDays || 30,
                  paystack_data: {
                    reference: response.reference,
                    transaction_id: response.transaction_id,
                    amount: selectedPlan.paystackAmount,
                    plan: selectedPlan.label,
                    status: response.status
                  }
                })
              });

              if (backendResponse.ok) {
                const result = await backendResponse.json();
                console.log('✅ Backend response:', result);

                if (result.success) {
                  console.log('✅ Subscription activated successfully via backend!');
                  alert('Payment successful! Your subscription has been activated.');
                } else {
                  console.error('❌ Backend failed to activate subscription:', result.error);
                  alert('Payment successful but subscription activation failed. Please contact support.');
                }
              } else {
                console.error('❌ Backend request failed:', backendResponse.status);
                alert('Payment successful but subscription activation failed. Please contact support.');
              }

              setShowModal(false);
              setName('');
              setEmail('');
              setSelectedPlan(null);

              console.log('✅ Payment and subscription activation completed successfully!');
            } catch (error) {
              console.error('❌ Error activating subscription:', error);
              alert('Payment successful but there was an error activating your subscription. Please contact support.');
            }
          })();
        },
        onClose: function () {
          console.log('❌ Payment window closed by user');
          alert('Transaction was not completed, window closed.');
        },
      };

      console.log('📋 Payment options:', paymentOptions);

      const handler = window.PaystackPop.setup(paymentOptions);

      console.log('✅ Paystack handler created:', handler);

      console.log('🚀 Opening Paystack payment window...');
      if (handler && typeof handler.openIframe === 'function') {
        handler.openIframe();
        console.log('✅ Paystack payment window opened successfully');
      } else {
        console.error('❌ Failed to create Paystack handler or openIframe method missing');
        console.error('Handler object:', handler);
        alert('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error setting up Paystack payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : undefined;

      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        name: errorName
      });
      alert(`Error setting up payment: ${errorMessage}. Please try again.`);
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#e8e8e8] py-20">
      <div className="max-w-2xl mx-auto text-center mb-8">
        {/* Status Banner */}
        {hasActiveSubscription ? (
          <div className={`mb-6 p-4 rounded-lg border text-sm font-medium inline-flex items-center gap-2 ${isSubscriptionExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <Clock className={`h-4 w-4 ${isSubscriptionExpired ? 'text-red-600' : 'text-green-600'}`} />
            {isSubscriptionExpired
              ? 'Your subscription has ended. Renew to continue using MealLensAI.'
              : `Active Subscription: ${subscriptionInfo?.formattedRemainingTime || formattedRemainingTime} remaining`
            }
          </div>
        ) : (
          <div className={`mb-6 p-4 rounded-lg border text-sm font-medium inline-flex items-center gap-2 ${isTrialExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
            <Clock className={`h-4 w-4 ${isTrialExpired ? 'text-red-600' : 'text-orange-600'}`} />
            {isTrialExpired ? 'Your trial has ended. Upgrade to continue using MealLensAI.' : `Trial: ${formattedRemainingTime}`}
          </div>
        )}

        <h2 className="text-4xl font-bold mb-2 text-gray-900">Plans & Pricing</h2>
        <p className="text-gray-600 mb-6">Choose the plan that fits your needs. All plans include essential features to get you started, with options to scale as you grow. No hidden fees and the flexibility to change anytime.</p>

        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${billing === 'monthly' ? 'bg-[#FF6B6B] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${billing === 'yearly' ? 'bg-[#FF6B6B] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setBilling('yearly')}
          >
            Yearly
          </button>
        </div>

        {billing === 'yearly' && (
          <div className="text-[#FF6B6B] text-sm font-medium bg-yellow-50 px-4 py-2 rounded-full inline-block">
            Save 20% with annual billing!
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch w-full max-w-6xl">
        {billing === 'monthly' ? (
          MONTHLY_PLANS.map((plan) => (
            <Card
              key={plan.label}
              className={`flex-1 flex flex-col justify-between items-center p-8 bg-white shadow-xl rounded-2xl border border-gray-200 relative transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${plan.highlight ? 'ring-2 ring-yellow-400 shadow-2xl' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-6 text-center">
                <div className="mb-4">{plan.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{plan.label}</div>
                <div className="text-gray-500 text-sm mb-4">Billed {plan.duration}</div>
                <div className="text-4xl font-bold text-[#FF6B6B] mb-2">
                  ${plan.price.toLocaleString()}
                </div>
              </div>

              <ul className="mb-8 w-full text-gray-700 text-left space-y-3">
                {FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="inline-block w-5 h-5 rounded-full bg-green-400 mr-3 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white hover:from-[#ff5252] hover:to-[#ff7a3a] text-lg font-semibold rounded-lg py-4 mt-auto shadow-lg transform transition-all duration-200 hover:scale-105"
                onClick={() => openPaymentModal(plan)}
              >
                Select Plan
              </Button>
            </Card>
          ))
        ) : (
          <Card
            className="flex-1 flex flex-col justify-between items-center p-8 bg-white shadow-xl rounded-2xl border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="mb-6 text-center">
              <div className="mb-4">{YEARLY_PLAN.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{YEARLY_PLAN.label}</div>
              <div className="text-gray-500 text-sm mb-4">Billed {YEARLY_PLAN.duration}</div>
              <div className="text-4xl font-bold text-[#FF6B6B] mb-2">
                ${YEARLY_PLAN.price.toLocaleString()}
              </div>
            </div>

            <ul className="mb-8 w-full text-gray-700 text-left space-y-3">
              {FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-green-400 mr-3 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white hover:from-[#ff5252] hover:to-[#ff7a3a] text-lg font-semibold rounded-lg py-4 mt-auto shadow-lg transform transition-all duration-200 hover:scale-105"
              onClick={() => openPaymentModal(YEARLY_PLAN)}
            >
              Select Plan
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#FF6B6B]">
              Complete Your Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Your Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none transition-all duration-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email Address</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-lg font-semibold text-gray-800 mb-2">
                Selected Plan:
              </div>
              <div className="text-xl font-bold text-[#FF6B6B]">
                {selectedPlan?.label}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Amount: ${selectedPlan?.price?.toLocaleString()}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white hover:from-[#ff5252] hover:to-[#ff7a3a] text-lg font-semibold rounded-lg py-3 shadow-lg transform transition-all duration-200 hover:scale-105"
              onClick={processPayment}
            >
              Pay with Paystack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Payment; 