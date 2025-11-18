# MealLens AI - Frontend

React + TypeScript + Vite frontend application for MealLens AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at: **http://localhost:5173/**

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── enterprise/  # Enterprise features
│   │   └── tutorial/    # Tutorial components
│   ├── pages/           # Page components (routes)
│   │   ├── Settings.tsx      # User settings page
│   │   ├── History.tsx       # Detection history
│   │   ├── Profile.tsx       # User profile
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useSicknessSettings.ts
│   │   ├── useMealPlans.ts
│   │   └── ...
│   ├── lib/             # Utilities and services
│   │   ├── api.ts       # API client
│   │   ├── config.ts    # App configuration
│   │   └── utils.ts     # Helper functions
│   ├── styles/          # CSS files
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## 🛠️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router v6
- **State Management**: React Hooks
- **API Client**: Fetch API with custom wrapper
- **Icons**: Lucide React

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
# API URL (defaults to Vite proxy in development)
VITE_API_URL=

# AI API URL
VITE_AI_API_URL=http://35.238.225.150:7017

# Payment Provider Keys
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### Vite Proxy Configuration

The development server proxies API requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://127.0.0.1:5001',
  },
}
```

This means:
- Frontend: `http://localhost:5173/api/settings`
- Proxies to: `http://127.0.0.1:5001/api/settings`

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## 🔌 API Integration

The frontend communicates with the backend through the API client (`src/lib/api.ts`):

```typescript
import { api } from '@/lib/api';

// Example: Save settings
const result = await api.saveUserSettings('health_profile', settingsData);

// Example: Get history
const history = await api.getDetectionHistory();
```

## 🎨 Styling

### Tailwind CSS
Utility-first CSS framework for rapid UI development.

### shadcn/ui Components
Pre-built, accessible components based on Radix UI:
- Button, Card, Dialog, Input, Select, etc.
- Located in `src/components/ui/`

### Custom Styles
Additional styles in `src/styles/` and component-specific CSS.

## 🧩 Key Features

### Pages
- **Landing/Welcome**: App introduction
- **Login/Signup**: User authentication
- **Settings**: Health profile management
- **History**: Detection history viewer
- **Profile**: User profile management
- **Meal Planner**: AI meal planning
- **Food Detection**: Image-based food detection
- **Enterprise Dashboard**: Organization management

### Components
- **Navbar**: Main navigation
- **RecipeCard**: Display recipe information
- **MealPlanManager**: Manage meal plans
- **ProtectedRoute**: Route authentication

### Hooks
- **useSicknessSettings**: Manage health settings
- **useMealPlans**: Meal plan operations
- **useTrial**: Trial period management
- **useAuth**: Authentication state

## 🔐 Authentication

Authentication is handled through:
1. Supabase Auth (backend)
2. JWT tokens stored in localStorage
3. Protected routes with `ProtectedRoute` component

## 📱 Responsive Design

The application is fully responsive:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly UI elements

## 🚨 Error Handling

- API errors are caught and displayed via toast notifications
- Network errors show user-friendly messages
- Loading states for async operations

## 🧪 Development Tips

### Hot Module Replacement (HMR)
Vite provides instant HMR - changes reflect immediately without full page reload.

### TypeScript
- Strict mode enabled
- Type checking on build
- IntelliSense support

### Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Centralize API calls in `lib/api.ts`
- Store configuration in `lib/config.ts`

## 📚 Dependencies

### Core
- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^6.28.0

### UI
- @radix-ui/*: Various UI primitives
- lucide-react: ^0.454.0 (icons)
- tailwindcss: ^3.4.14

### Utilities
- clsx: ^2.1.1
- tailwind-merge: ^2.5.4
- class-variance-authority: ^0.7.0

### Backend Integration
- @supabase/supabase-js: ^2.51.0

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📞 Support

For issues or questions:
1. Check browser console for errors (F12)
2. Verify backend is running on port 5001
3. Check network tab for failed API requests
4. Review error messages in toast notifications

## 🔗 Related

- **Backend**: See `../backend/README.md`
- **API Documentation**: See `../backend/API_DOCUMENTATION.md`
- **Project Root**: See `../README.md`
