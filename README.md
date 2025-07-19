# 🍽️ MealLensAI - Smart Food Detection & Recipe Assistant

<div align="center">

![MealLensAI Logo](https://img.shields.io/badge/MealLensAI-Smart%20Kitchen%20Assistant-orange?style=for-the-badge&logo=utensils)
![React](https://img.shields.io/badge/React-18.0+-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?style=for-the-badge&logo=supabase)

**Your AI-powered kitchen companion for smart food detection, recipe generation, and meal planning! 🚀**

</div>

---

## 📋 Table of Contents

- [🌟 Features Overview](#-features-overview)
- [🏗️ Architecture](#️-architecture)
- [🔐 Authentication System](#-authentication-system)
- [📱 Pages & Components](#-pages--components)
- [🎨 UI/UX Design](#-uiux-design)
- [🔄 Data Flow](#-data-flow)
- [🚀 Getting Started](#-getting-started)
- [🛠️ Development](#️-development)

---

## 🌟 Features Overview

### 🍎 **AI Food Detection**
- **📸 Image Upload**: Upload food images for instant ingredient detection
- **🔍 Smart Recognition**: AI-powered food identification with confidence scores
- **📝 Auto-Save**: Automatically saves detections to user history
- **🎯 Real-time Processing**: Instant results with loading states

### 👨‍🍳 **AI Recipe Generation**
- **🧠 Smart Suggestions**: AI generates personalized recipe recommendations
- **📋 Ingredient Lists**: Detailed ingredient lists with measurements
- **📖 Step-by-Step Instructions**: Clear cooking instructions
- **🔗 Resource Links**: YouTube tutorials and Google search results

### 📅 **Meal Planning**
- **📊 Weekly Planner**: Interactive weekly meal planning interface
- **🔄 Plan Management**: Save, edit, and manage multiple meal plans
- **📱 Mobile Responsive**: Works perfectly on all devices
- **💾 Persistent Storage**: Plans saved locally and in database

### 📚 **History & Analytics**
- **📈 Detection History**: Complete history of all food detections
- **🔍 Search & Filter**: Easy navigation through past results
- **📊 Usage Analytics**: Track your cooking journey
- **💾 Data Persistence**: All data saved securely

---

## 🏗️ Architecture

### 🎯 **Frontend Stack**
```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 User Interface                        │
├─────────────────────────────────────────────────────────────┤
│  📱 React 18 + TypeScript + Tailwind CSS + Shadcn/ui      │
├─────────────────────────────────────────────────────────────┤
│                    🔐 Authentication                        │
├─────────────────────────────────────────────────────────────┤
│  🔑 Supabase Auth + JWT Tokens + Session Management       │
├─────────────────────────────────────────────────────────────┤
│                    🌐 API Integration                       │
├─────────────────────────────────────────────────────────────┤
│  🚀 Custom API Service + Error Handling + Loading States   │
├─────────────────────────────────────────────────────────────┤
│                    💾 Data Storage                          │
├─────────────────────────────────────────────────────────────┤
│  🗄️ Supabase Database + Local Storage + State Management  │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 **Key Technologies**
- **⚛️ React 18**: Modern React with hooks and functional components
- **📘 TypeScript**: Type-safe development with interfaces
- **🎨 Tailwind CSS**: Utility-first CSS framework
- **🎭 Shadcn/ui**: Beautiful, accessible component library
- **🔐 Supabase**: Authentication and database backend
- **🔄 React Router**: Client-side routing
- **📦 Vite**: Fast build tool and development server

---

## 🔐 Authentication System

### 🎯 **Supabase Integration**
```typescript
// 🔑 Authentication Flow
User Login → Supabase Auth → JWT Token → API Requests → Database
```

### 🛡️ **Security Features**
- **🔒 JWT Token Authentication**: Secure token-based auth
- **🔄 Auto Token Refresh**: Automatic token renewal
- **🚪 Protected Routes**: Route-level authentication guards
- **🧹 Session Cleanup**: Proper logout and session clearing
- **🛡️ 401 Error Handling**: Automatic redirect on auth failure

### 👤 **User Experience**
- **🎨 Beautiful Login/Signup**: Modern, responsive forms
- **📱 Avatar Dropdown**: User profile with settings and logout
- **🔄 Persistent Sessions**: Stay logged in across browser sessions
- **🚪 Graceful Logout**: Clean session termination

---

## 📱 Pages & Components

### 🏠 **Main Pages**

#### 🎯 **Index Page (`/`) - AI Kitchen**
```typescript
Features:
✅ Interactive meal planning interface
✅ Weekly calendar view
✅ Recipe card components
✅ Meal type filtering
✅ Plan management modal
✅ Tutorial modal for recipes
✅ Mobile-responsive design
```

#### 📸 **Detect Food Page (`/detected`)**
```typescript
Features:
✅ Image upload with drag & drop
✅ Real-time food detection
✅ Auto-save to database
✅ Resource aggregation (YouTube + Google)
✅ Loading states and error handling
✅ Mobile camera integration
```

#### 🤖 **AI Response Page (`/ai-response`)**
```typescript
Features:
✅ Multi-step form wizard
✅ Ingredient detection from images
✅ Recipe suggestion system
✅ Instruction generation
✅ Resource linking
✅ Auto-save functionality
```

#### 📚 **History Page (`/history`)**
```typescript
Features:
✅ Complete detection history
✅ Expandable instruction cards
✅ Date-based filtering
✅ Recipe type categorization
✅ Resource link access
✅ Empty state handling
```

#### 🔐 **Authentication Pages**
```typescript
Login Page (/login):
✅ Email/password authentication
✅ Form validation
✅ Error handling
✅ Redirect after login

Signup Page (/signup):
✅ User registration
✅ Password strength validation
✅ Email verification
✅ Welcome flow
```

### 🧩 **Core Components**

#### 🧭 **Navigation**
```typescript
Navbar Component:
✅ Responsive design
✅ Avatar dropdown menu
✅ User profile display
✅ Navigation links
✅ Mobile hamburger menu
```

#### 🛡️ **Route Protection**
```typescript
ProtectedRoute Component:
✅ Authentication guards
✅ Loading states
✅ Redirect handling
✅ User session validation
```

#### 📊 **Data Display**
```typescript
RecipeCard Component:
✅ Recipe information display
✅ Interactive elements
✅ Responsive design
✅ Loading states

HistoryCard Component:
✅ Expandable content
✅ Resource links
✅ Date formatting
✅ Category badges
```

---

## 🎨 UI/UX Design

### 🎨 **Design System**
```css
Color Palette:
🔴 Primary Red: #ef4444 (Error, Actions)
🟠 Primary Orange: #f97316 (Brand, Accents)
⚪ White: #ffffff (Background, Cards)
⚫ Dark Gray: #1f2937 (Text, Headers)
🔵 Blue: #3b82f6 (Links, Info)
🟢 Green: #10b981 (Success, Positive)
```

### 📱 **Responsive Design**
- **🖥️ Desktop**: Full-featured interface with sidebar navigation
- **📱 Mobile**: Optimized touch interface with bottom navigation
- **📟 Tablet**: Hybrid layout with adaptive components
- **🔄 Breakpoints**: Tailwind CSS responsive utilities

### 🎭 **Component Library**
```typescript
Shadcn/ui Components:
✅ Button - Primary, secondary, ghost variants
✅ Card - Content containers with headers
✅ Input - Form inputs with validation
✅ Dropdown - Menu components
✅ Modal - Overlay dialogs
✅ Badge - Status indicators
✅ Avatar - User profile images
✅ Loading - Spinner components
```

### 🎪 **Animations & Transitions**
- **🔄 Loading States**: Smooth spinners and skeletons
- **📱 Page Transitions**: Fade and slide animations
- **🎯 Hover Effects**: Interactive feedback
- **📊 Progress Indicators**: Visual feedback for actions

---

## 🔄 Data Flow

### 📊 **State Management**
```typescript
Global State:
🔐 Authentication State (useAuth hook)
📱 UI State (modals, loading, errors)
📊 User Data (profile, preferences)
💾 Local Storage (tokens, settings)

Component State:
📝 Form Data (inputs, validation)
🔄 Loading States (API calls)
📊 Display Data (filtered, sorted)
🎯 User Interactions (selections, clicks)
```

### 🌐 **API Integration**
```typescript
API Service Layer:
✅ Centralized API client
✅ Automatic token injection
✅ Error handling and retry logic
✅ Request/response interceptors
✅ Loading state management
```

### 💾 **Data Persistence**
```typescript
Storage Strategy:
🗄️ Supabase Database - User data, history
💾 Local Storage - Tokens, preferences
🔄 Session Storage - Temporary data
📱 IndexedDB - Offline support (future)
```

---

## 🚀 Getting Started

### ⚡ **Quick Start (5 minutes)**
```bash
# 1. Clone and install
git clone https://github.com/your-username/meallens-ai.git
cd meallens-ai
npm install

# 2. Set up environment (see details below)
cp .env.example .env.local

# 3. Start the app
npm run dev

# 4. Open http://localhost:5173 in your browser
```

### 📋 **Prerequisites**
```bash
✅ Node.js 18+ installed (check with: node --version)
✅ npm or yarn package manager (check with: npm --version)
✅ Git for version control (check with: git --version)
✅ Modern web browser (Chrome, Firefox, Safari, Edge)
✅ Supabase account (free tier available)
```

### 🔧 **Detailed Installation**

#### **Step 1: Clone the Repository**
```bash
# Clone the repository
git clone https://github.com/your-username/meallens-ai.git

# Navigate to project directory
cd meallens-ai

# Verify you're in the right directory
ls -la
# Should show: package.json, src/, public/, etc.
```

#### **Step 2: Install Dependencies**
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
# Should show all packages installed successfully
```

#### **Step 3: Set Up Supabase (Required)**
```bash
# 1. Go to https://supabase.com and create a free account
# 2. Create a new project
# 3. Get your project URL and anon key from Settings > API
# 4. Copy the environment template
cp .env.example .env.local

# 5. Edit .env.local with your Supabase credentials
nano .env.local  # or use your preferred editor
```

#### **Step 4: Configure Environment Variables**
```env
# Required: Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: API Endpoints (if using custom backend)
VITE_API_BASE_URL=https://your-api-url.com

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_OFFLINE_MODE=false
```

#### **Step 5: Start Development Server**
```bash
# Start the development server
npm run dev

# You should see output like:
# VITE v4.x.x ready in xxx ms
# ➜ Local: http://localhost:5173/
# ➜ Network: use --host to expose
```

#### **Step 6: Open in Browser**
```bash
# Open your browser and navigate to:
http://localhost:5173

# Or use the command line:
open http://localhost:5173  # macOS
xdg-open http://localhost:5173  # Linux
start http://localhost:5173  # Windows
```

### 🎯 **First Time Setup**

#### **1. Create Your Account**
- Click "Sign Up" on the login page
- Enter your email and create a password
- Verify your email (check spam folder)

#### **2. Test the Features**
- **🍎 Food Detection**: Upload a food image
- **👨‍🍳 AI Kitchen**: Try the meal planner
- **📚 History**: Check your detection history

#### **3. Verify Everything Works**
```bash
# Check for any console errors
# Open browser dev tools (F12)
# Look for any red error messages
# All features should work without errors
```

### 🚨 **Troubleshooting**

#### **Common Issues & Solutions**

**❌ "Module not found" errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**❌ "Supabase connection failed"**
```bash
# Check your environment variables
cat .env.local
# Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
```

**❌ "Port 5173 already in use"**
```bash
# Kill the process or use a different port
npm run dev -- --port 3000
```

**❌ "Authentication not working"**
```bash
# Check Supabase project settings
# Ensure email auth is enabled
# Verify your environment variables
```

### 🧪 **Testing the Setup**

#### **Run All Tests**
```bash
# Run unit tests
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

#### **Manual Testing Checklist**
- [ ] ✅ App loads without errors
- [ ] ✅ Can create an account
- [ ] ✅ Can log in and out
- [ ] ✅ Food detection works
- [ ] ✅ Meal planning works
- [ ] ✅ History saves properly
- [ ] ✅ Mobile responsive design
- [ ] ✅ No console errors

### 🚀 **Production Deployment**

#### **Build for Production**
```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

#### **Deploy Options**
```bash
# Deploy to Vercel (recommended)
npm install -g vercel
vercel --prod

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod

# Deploy to GitHub Pages
npm run build
# Upload dist/ folder to GitHub Pages
```

---

## 🛠️ Development

### 📁 **Project Structure**
```
src/
├── 📁 components/          # Reusable UI components
│   ├── 📁 ui/             # Shadcn/ui components
│   ├── 📁 forms/          # Form components
│   └── 📁 layout/         # Layout components
├── 📁 pages/              # Page components
│   ├── 📄 Index.tsx       # Main AI Kitchen page
│   ├── 📄 DetectFoodPage.tsx
│   ├── 📄 AIResponsePage.tsx
│   ├── 📄 History.tsx
│   ├── 📄 Login.tsx
│   └── 📄 Signup.tsx
├── 📁 lib/                # Utility libraries
│   ├── 📄 utils.ts        # Auth context & utilities
│   ├── 📄 api.ts          # API service layer
│   └── 📄 types.ts        # TypeScript interfaces
├── 📁 hooks/              # Custom React hooks
├── 📁 styles/             # Global styles
└── 📁 assets/             # Static assets
```

### 🧪 **Testing**
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### 🚀 **Build & Deploy**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

### 🔧 **Development Commands**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

---

## 🎯 **Key Features Summary**

| Feature | Description | Status |
|---------|-------------|--------|
| 🍎 Food Detection | AI-powered image recognition | ✅ Complete |
| 👨‍🍳 Recipe Generation | Smart recipe suggestions | ✅ Complete |
| 📅 Meal Planning | Weekly meal planner | ✅ Complete |
| 📚 History Tracking | User detection history | ✅ Complete |
| 🔐 Authentication | Supabase auth system | ✅ Complete |
| 📱 Mobile Responsive | Cross-device compatibility | ✅ Complete |
| 🎨 Modern UI | Beautiful, accessible design | ✅ Complete |
| 🚀 Performance | Optimized loading and rendering | ✅ Complete |

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🐛 **Bug Reports**
Please use the [Issue Tracker](https://github.com/your-username/meallens-ai/issues) to report bugs.

### 💡 **Feature Requests**
Have an idea? Create a [Feature Request](https://github.com/your-username/meallens-ai/issues/new)!

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by the MealLensAI Team**

[![GitHub stars](https://img.shields.io/github/stars/your-username/meallens-ai?style=social)](https://github.com/your-username/meallens-ai)
[![GitHub forks](https://img.shields.io/github/forks/your-username/meallens-ai?style=social)](https://github.com/your-username/meallens-ai)
[![GitHub issues](https://img.shields.io/github/issues/your-username/meallens-ai)](https://github.com/your-username/meallens-ai/issues)

</div>
