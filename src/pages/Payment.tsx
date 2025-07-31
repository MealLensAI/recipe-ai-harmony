import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const FEATURES = [
  'MealLensAI meal planner',
  'MealLensAI cooked Food detection and cooking instructions',
  'MealLensAI Ingredient detection with cooking instructions',
  'Share your cooked meals with friends',
];

const MONTHLY_PLANS = [
  {
    label: '$1/week',
    price: 1,
    duration: '1 week',
    paystackAmount: 1,
    highlight: false,
  },
  {
    label: '$2/two weeks',
    price: 2,
    duration: '2 weeks',
    paystackAmount: 2,
    highlight: false,
  },
  {
    label: '$4/month',
    price: 4,
    duration: '1 month',
    paystackAmount: 4,
    highlight: true, // Most popular
  },
];

const YEARLY_PLAN = {
  label: '$47/year',
  price: 47,
  duration: '1 year',
  paystackAmount: 47,
  highlight: false,
};

const Payment: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  React.useEffect(() => {
    if (!document.getElementById('paystack-script')) {
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openPaymentModal = (plan: any) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const processPayment = () => {
    if (!name || !email || !selectedPlan) {
      alert('Please fill in all fields');
      return;
    }
    // @ts-ignore
    const handler = window.PaystackPop && window.PaystackPop.setup({
      key: 'pk_live_5f7de652daf3ea53dc685902c5f28f0a2063bc33',
      email: email,
      amount: Math.round(selectedPlan.paystackAmount * 100), // cents
      currency: 'USD',
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
        alert('Thank you for your payment! Reference: ' + response.reference);
        setShowModal(false);
        setName('');
        setEmail('');
        setSelectedPlan(null);
      },
      onClose: function () {
        alert('Transaction was not completed, window closed.');
      },
    });
    if (handler) handler.openIframe();
  };

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] py-20">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h2 className="text-4xl font-bold mb-2 text-gray-900">Plans & Pricing</h2>
        <p className="text-gray-600 mb-6">Choose the plan that fits your needs. All plans include essential features to get you started, with options to scale as you grow. No hidden fees and the flexibility to change anytime.</p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${billing === 'monthly' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${billing === 'yearly' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setBilling('yearly')}
          >
            Yearly
          </button>
        </div>
        {billing === 'yearly' && (
          <div className="text-blue-600 text-sm font-medium">Save 20% with annual billing!</div>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch w-full max-w-5xl">
        {billing === 'monthly' ? (
          MONTHLY_PLANS.map((plan, idx) => (
            <Card
              key={plan.label}
              className={`flex-1 flex flex-col justify-between items-center p-8 bg-white shadow-lg rounded-2xl border border-gray-200 relative ${plan.highlight ? 'ring-2 ring-yellow-400' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-xs font-bold px-4 py-1 rounded-full shadow">Most Popular</div>
              )}
              <div className="mb-2 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{plan.label}</div>
                <div className="text-gray-500 text-sm mb-4">Billed {plan.duration}</div>
              </div>
              <ul className="mb-6 w-full text-gray-700 text-left space-y-2">
                {FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-green-400 mr-2 flex-shrink-0" style={{minWidth: '1rem'}}></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gray-900 text-white hover:bg-gray-800 text-lg font-semibold rounded-lg py-3 mt-auto"
                onClick={() => openPaymentModal(plan)}
              >
                Select plan
              </Button>
            </Card>
          ))
        ) : (
          <Card
            className="flex-1 flex flex-col justify-between items-center p-8 bg-white shadow-lg rounded-2xl border border-gray-200"
          >
            <div className="mb-2 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{YEARLY_PLAN.label}</div>
              <div className="text-gray-500 text-sm mb-4">Billed {YEARLY_PLAN.duration}</div>
            </div>
            <ul className="mb-6 w-full text-gray-700 text-left space-y-2">
              {FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-green-400 mr-2 flex-shrink-0" style={{minWidth: '1rem'}}></span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-gray-900 text-white hover:bg-gray-800 text-lg font-semibold rounded-lg py-3 mt-auto"
              onClick={() => openPaymentModal(YEARLY_PLAN)}
            >
              Select plan
            </Button>
          </Card>
        )}
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#FF6B6B] focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div className="text-lg font-semibold text-[#2D3436]">
              Plan: <span className="text-[#FF6B6B]">{selectedPlan?.label}</span>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full mt-4" onClick={processPayment}>
              Pay with Paystack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Payment; 