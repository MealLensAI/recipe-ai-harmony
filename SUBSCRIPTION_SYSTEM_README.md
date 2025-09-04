# 🔒 Subscription System Implementation Guide

## 🎯 **What This System Does**

The subscription system automatically tracks user subscription time and blocks access when plans expire, prompting users to upgrade. It works with all your pricing plans:

- **$2/week** - 7 days access
- **$5/2 weeks** - 14 days access  
- **$10/4 weeks** - 28 days access
- **$100/year** - 365 days access

## 🚀 **How It Works**

### **1. Automatic Time Tracking**
- Tracks when each subscription starts and expires
- Shows remaining time with progress bars
- Automatically blocks access when time runs out

### **2. Smart Blocking**
- Blocks entire pages or specific features
- Shows upgrade prompts with plan information
- Redirects users to payment page

### **3. Plan-Based Access Control**
- Different features require different subscription levels
- Higher plans automatically include lower plan features
- Flexible blocking for any feature or page

## 📱 **Components You Can Use**

### **SubscriptionBlocker** - Block Entire Pages
```tsx
import { SubscriptionBlocker } from '@/components/SubscriptionBlocker';

// Wrap your entire page content
<SubscriptionBlocker featureName="this page">
  <YourPageContent />
</SubscriptionBlocker>
```

### **FeatureBlocker** - Block Specific Features
```tsx
import { FeatureBlocker } from '@/components/SubscriptionBlocker';

// Block a specific feature
<FeatureBlocker featureName="Advanced Analytics">
  <AdvancedAnalyticsComponent />
</FeatureBlocker>
```

### **FeatureProtector** - Plan-Specific Access
```tsx
import { FeatureProtector } from '@/components/FeatureProtector';

// Require specific subscription plan
<FeatureProtector featureName="Premium Feature" requiredPlan="monthly">
  <PremiumFeatureComponent />
</FeatureProtector>
```

### **Convenience Components** - Quick Plan Requirements
```tsx
import { WeeklyFeature, BiWeeklyFeature, MonthlyFeature, YearlyFeature } from '@/components/FeatureProtector';

// Weekly plan required
<WeeklyFeature featureName="Basic Meal Planning">
  <MealPlanningComponent />
</WeeklyFeature>

// Monthly plan required
<MonthlyFeature featureName="Nutrition Tracking">
  <NutritionComponent />
</MonthlyFeature>
```

## 🔧 **Implementation Examples**

### **Example 1: Block Entire App When Subscription Expires**
```tsx
// In your main App.tsx or layout
import { SubscriptionBlocker } from '@/components/SubscriptionBlocker';

function App() {
  return (
    <SubscriptionBlocker featureName="MealLensAI">
      <Router>
        <Routes>
          {/* Your app routes */}
        </Routes>
      </Router>
    </SubscriptionBlocker>
  );
}
```

### **Example 2: Block Specific Features by Plan**
```tsx
// In your AI Response page
import { MonthlyFeature } from '@/components/FeatureProtector';

function AIResponsePage() {
  return (
    <div>
      <h1>AI Food Recognition</h1>
      
      {/* Basic feature - available to all */}
      <BasicFoodRecognition />
      
      {/* Advanced feature - requires monthly plan */}
      <MonthlyFeature featureName="Advanced AI Analysis">
        <AdvancedAIAnalysis />
      </MonthlyFeature>
      
      {/* Premium feature - requires yearly plan */}
      <YearlyFeature featureName="API Access">
        <APIAccess />
      </YearlyFeature>
    </div>
  );
}
```

### **Example 3: Custom Fallback Content**
```tsx
import { FeatureProtector } from '@/components/FeatureProtector';

<FeatureProtector 
  featureName="Premium Recipe Database" 
  requiredPlan="biweekly"
  fallback={
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold mb-2">Premium Recipe Database</h3>
      <p className="text-gray-600 mb-4">
        Access thousands of exclusive recipes with our bi-weekly plan
      </p>
      <Button onClick={() => navigate('/payment')}>
        Upgrade to Bi-Weekly Plan
      </Button>
    </div>
  }
>
  <RecipeDatabase />
</FeatureProtector>
```

## 🎨 **UI Components Available**

### **Subscription Status Banner**
- Shows current plan and remaining time
- Progress bar for time remaining
- Automatic expiration warnings

### **Upgrade Modal**
- Full-screen blocking overlay
- Clear upgrade messaging
- Direct navigation to payment page

### **Feature Blocking**
- Inline blocking with upgrade prompts
- Plan-specific requirements
- Custom fallback content support

## 📊 **Plan Hierarchy**

The system automatically handles plan upgrades:

```
Weekly (1) → Bi-Weekly (2) → Monthly (3) → Yearly (4)
```

- Users with higher plans can access lower plan features
- Plan requirements are automatically enforced
- No manual plan checking needed

## 🔄 **Automatic Updates**

- **Real-time tracking**: Updates every minute
- **Automatic blocking**: No page refresh needed
- **Seamless UX**: Users see immediate access changes

## 🛠 **Customization Options**

### **Custom Messages**
```tsx
<FeatureBlocker featureName="Your Custom Feature">
  <YourComponent />
</FeatureBlocker>
```

### **Custom Styling**
- All components use your existing UI components
- Consistent with your app's design system
- Easy to customize colors and styling

### **Custom Fallbacks**
```tsx
fallback={
  <YourCustomUpgradeComponent />
}
```

## 📍 **Where to Use**

### **Page-Level Blocking**
- Main app wrapper
- Critical feature pages
- Admin areas

### **Feature-Level Blocking**
- AI features
- Advanced analytics
- Premium content
- API access

### **Component-Level Blocking**
- Individual features
- Specific tools
- Advanced options

## 🚨 **Important Notes**

1. **Always wrap content**: Don't leave content unprotected
2. **Use descriptive names**: Clear feature names help users understand what they're missing
3. **Plan requirements**: Set appropriate plan levels for features
4. **Fallback content**: Provide helpful upgrade information

## 🎯 **Quick Start**

1. **Import components** where you need them
2. **Wrap your content** with appropriate blockers
3. **Set plan requirements** for premium features
4. **Test the system** with expired subscriptions

The system is now fully integrated and will automatically handle all subscription management, blocking, and upgrade prompts for your users!



