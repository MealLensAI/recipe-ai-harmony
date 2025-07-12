"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, type User } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"
import "../styles/landing-page.css"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfeNB97dUeCtbSBTqTa_oZLNFUoDRCpLg",
  authDomain: "meallensai-e84bc.firebaseapp.com",
  projectId: "meallensai-e84bc",
  storageBucket: "meallensai-e84bc.firebasestorage.app",
  messagingSenderId: "931517253636",
  appId: "1:931517253636:web:344608943b23698df08d51",
  measurementId: "G-XV5LYL1RYJ",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const analytics = getAnalytics(app)

// Google Analytics function
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

const LandingPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [currentFeatureSlide, setCurrentFeatureSlide] = useState(0)

  useEffect(() => {
    // Initialize Google Analytics
    const script1 = document.createElement("script")
    script1.async = true
    script1.src = "https://www.googletagmanager.com/gtag/js?id=G-TPT4ET0Y2Q"
    document.head.appendChild(script1)

    const script2 = document.createElement("script")
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-TPT4ET0Y2Q');
    `
    document.head.appendChild(script2)

    // Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })

    return () => {
      unsubscribe()
      document.head.removeChild(script1)
      document.head.removeChild(script2)
    }
  }, [])

  const handleAuth = async (mode: "signin" | "signup") => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope("email")
      provider.setCustomParameters({
        prompt: "select_account",
      })

      const result = await signInWithPopup(auth, provider)
      console.log(`Successfully ${mode}:`, result.user)

      // Track authentication event
      if (window.gtag) {
        window.gtag("event", mode, {
          event_category: "authentication",
          event_label: "google",
        })
      }
    } catch (error) {
      console.error(`${mode} error:`, error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      console.log("Successfully signed out")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleDonateClick = () => {
    setShowDonateModal(true)
    if (window.gtag) {
      window.gtag("event", "donate_click", {
        event_category: "engagement",
        event_label: "donation_modal",
      })
    }
  }

  const appScreenshots = [
    "/MealLeansBeta/landingpage-main/assets/images/appImage/1.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/2.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/3.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/4.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/5.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/6.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/7.png",
    "/MealLeansBeta/landingpage-main/assets/images/appImage/8.png",
  ]

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/MealLeansBeta/landingpage-main/assets/images/logo.png" alt="MealLens AI" className="h-8 w-8" />
            <span className="font-bold text-xl text-gray-800">MealLens AI</span>
          </div>

          <div className="auth-section">
            {user ? (
              <div className="user-info">
                <img src={user.photoURL || ""} alt="User" className="user-avatar" />
                <span className="text-gray-700">{user.displayName}</span>
                <button onClick={handleSignOut} className="auth-button bg-red-500 hover:bg-red-600">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <button onClick={() => handleAuth("signin")} className="auth-button">
                  Sign In
                </button>
                <button onClick={() => handleAuth("signup")} className="auth-button bg-green-500 hover:bg-green-600">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Transform Your Cooking with AI</h1>
          <p className="hero-subtitle">
            Discover recipes from ingredients, identify food from photos, and plan your meals with the power of
            artificial intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link to="/ai-response" className="cta-button">
              🥗 Detect Ingredients
            </Link>
            <Link to="/detect-food" className="cta-button bg-green-500 hover:bg-green-600">
              📸 Identify Food
            </Link>
            <Link to="/meal-planner" className="cta-button bg-purple-500 hover:bg-purple-600">
              📅 Plan Meals
            </Link>
          </div>
        </div>

        {/* Background shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-5 w-16 h-16 bg-white/10 rounded-full animate-ping"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Powerful AI Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the future of cooking with our advanced AI-powered tools designed to make your culinary journey
              effortless and exciting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="feature-icon">🥗</div>
              <h3 className="text-xl font-bold mb-2">Ingredient Detection</h3>
              <p className="text-gray-600">
                Upload photos of your ingredients and get instant recipe suggestions tailored to what you have
                available.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3 className="text-xl font-bold mb-2">Food Identification</h3>
              <p className="text-gray-600">
                Take a photo of any dish and our AI will identify it, providing nutritional information and cooking
                tips.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3 className="text-xl font-bold mb-2">Meal Planning</h3>
              <p className="text-gray-600">
                Create personalized meal plans based on your dietary preferences, restrictions, and nutritional goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Screenshots */}
      <section className="app-screenshots">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">See It In Action</h2>
            <p className="text-gray-600">
              Explore our intuitive interface and powerful features through these app screenshots.
            </p>
          </div>

          <div className="screenshot-carousel">
            {appScreenshots.map((screenshot, index) => (
              <div key={index} className="screenshot-item">
                <img src={screenshot || "/placeholder.svg"} alt={`App Screenshot ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">About MealLens AI</h2>
              <p className="text-gray-600 mb-4">
                MealLens AI is revolutionizing the way people cook and eat by leveraging cutting-edge artificial
                intelligence technology. Our platform helps you make the most of your ingredients, discover new recipes,
                and maintain a healthy lifestyle.
              </p>
              <p className="text-gray-600 mb-6">
                Whether you're a beginner cook or a culinary expert, our AI-powered tools adapt to your skill level and
                preferences, making cooking more accessible, enjoyable, and efficient for everyone.
              </p>
              <button onClick={handleDonateClick} className="cta-button bg-yellow-500 hover:bg-yellow-600">
                ❤️ Support Our Mission
              </button>
            </div>
            <div>
              <img
                src="/MealLeansBeta/landingpage-main/assets/images/about.png"
                alt="About MealLens AI"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Latest from Our Blog</h2>
            <p className="text-gray-600">Stay updated with cooking tips, AI insights, and culinary trends.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src="/MealLeansBeta/landingpage-main/assets/images/blog-1.jpg"
                alt="Blog Post 1"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">AI in Modern Cooking</h3>
                <p className="text-gray-600 mb-4">
                  Discover how artificial intelligence is transforming the culinary world and making cooking more
                  accessible to everyone.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Read More →
                </a>
              </div>
            </article>

            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src="/MealLeansBeta/landingpage-main/assets/images/blog-2.jpg"
                alt="Blog Post 2"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Healthy Meal Planning</h3>
                <p className="text-gray-600 mb-4">
                  Learn effective strategies for planning nutritious meals that fit your lifestyle and dietary goals.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Read More →
                </a>
              </div>
            </article>

            <article className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src="/MealLeansBeta/landingpage-main/assets/images/blog-3.jpg"
                alt="Blog Post 3"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Ingredient Optimization</h3>
                <p className="text-gray-600 mb-4">
                  Maximize your ingredients and minimize food waste with smart cooking techniques and AI assistance.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Read More →
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/MealLeansBeta/landingpage-main/assets/images/logo.png"
                  alt="MealLens AI"
                  className="h-8 w-8"
                />
                <span className="font-bold text-xl">MealLens AI</span>
              </div>
              <p className="text-gray-400">Transforming cooking with the power of artificial intelligence.</p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/ai-response" className="hover:text-white">
                    Ingredient Detection
                  </Link>
                </li>
                <li>
                  <Link to="/detect-food" className="hover:text-white">
                    Food Identification
                  </Link>
                </li>
                <li>
                  <Link to="/meal-planner" className="hover:text-white">
                    Meal Planning
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MealLens AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="donate-modal">
          <div className="donate-content">
            <button className="close-button" onClick={() => setShowDonateModal(false)}>
              ×
            </button>
            <h3 className="text-2xl font-bold mb-4">Support MealLens AI</h3>
            <p className="text-gray-600 mb-6">
              Help us continue developing innovative AI-powered cooking tools. Your support makes a difference!
            </p>
            <div className="space-y-4">
              <button className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                Donate $5
              </button>
              <button className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors">
                Donate $10
              </button>
              <button className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors">
                Donate $25
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
