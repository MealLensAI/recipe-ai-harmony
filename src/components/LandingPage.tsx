"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "../styles/landing-page.css"

declare global {
  interface Window {
    PaystackPop: any
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

const LandingPage: React.FC = () => {
  const [currentFeatureSlide, setCurrentFeatureSlide] = useState(0)
  const [showDonateModal, setShowDonateModal] = useState(false)

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

    // Load external stylesheets
    const fontAwesome = document.createElement("link")
    fontAwesome.rel = "stylesheet"
    fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
    document.head.appendChild(fontAwesome)

    const lineIcons = document.createElement("link")
    lineIcons.rel = "stylesheet"
    lineIcons.href = "https://cdn.lineicons.com/2.0/LineIcons.css"
    document.head.appendChild(lineIcons)

    // Load Paystack script
    const paystackScript = document.createElement("script")
    paystackScript.src = "https://js.paystack.co/v1/inline.js"
    document.head.appendChild(paystackScript)

    return () => {
      document.head.removeChild(script1)
      document.head.removeChild(script2)
      document.head.removeChild(fontAwesome)
      document.head.removeChild(lineIcons)
      document.head.removeChild(paystackScript)
    }
  }, [])

  const handleTryMealLensAI = (event: React.MouseEvent) => {
    event.preventDefault()
    window.location.href = "/ai-response"
  }

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      await fetch(
        "https://docs.google.com/forms/d/e/1FAIpQLSfmzSzyjg7h6GYzDLLI-uPLGjjMI3VqVj-hmwpvygqROo1NvQ/formResponse",
        {
          method: "POST",
          body: formData,
          mode: "no-cors",
        },
      )
      alert("Thank you for your feedback! We appreciate your input.")
      form.reset()
    } catch (error) {
      console.error("Error:", error)
      alert("There was an error submitting your feedback. Please try again.")
    }
  }

  const processDonation = () => {
    const nameInput = document.getElementById("donorName") as HTMLInputElement
    const emailInput = document.getElementById("donorEmail") as HTMLInputElement
    const amountInput = document.getElementById("donationAmount") as HTMLInputElement

    const name = nameInput?.value
    const email = emailInput?.value
    const amount = amountInput?.value

    if (!name || !email || !amount) {
      alert("Please fill in all fields")
      return
    }

    if (window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: "pk_live_5f7de652daf3ea53dc685902c5f28f0a2063bc33",
        email: email,
        amount: Number.parseInt(amount) * 100,
        currency: "KES",
        ref: "" + Math.floor(Math.random() * 1000000000 + 1),
        metadata: {
          custom_fields: [
            {
              display_name: "Donor Name",
              variable_name: "donor_name",
              value: name,
            },
          ],
        },
        callback: (response: any) => {
          alert("Thank you for your donation! Reference: " + response.reference)
          setShowDonateModal(false)
          if (nameInput) nameInput.value = ""
          if (emailInput) emailInput.value = ""
          if (amountInput) amountInput.value = "1000"
        },
        onClose: () => {
          alert("Transaction was not completed, window closed.")
        },
      })
      handler.openIframe()
    }
  }

  const nextSlide = () => {
    setCurrentFeatureSlide(1)
  }

  const prevSlide = () => {
    setCurrentFeatureSlide(0)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto">
            <div className="flex items-center justify-between py-4 px-6">
              <nav className="flex items-center justify-between w-full">
                <a href="/" className="flex items-center">
                  <img
                    src="/assets/images/logo.svg"
                    alt="Logo"
                    className="w-48 h-auto"
                  />
                </a>

                <div className="hidden lg:flex items-center space-x-8">
                  <a href="#home" className="text-gray-700 hover:text-orange-500 transition-colors">
                    Home
                  </a>
                  <a href="#features" className="text-gray-700 hover:text-orange-500 transition-colors">
                    Features
                  </a>
                  <a href="#about" className="text-gray-700 hover:text-orange-500 transition-colors">
                    About
                  </a>
                  <button
                    onClick={() => setShowDonateModal(true)}
                    className="text-gray-700 hover:text-orange-500 transition-colors cursor-pointer"
                  >
                    Donate
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <button className="text-gray-700 hover:text-orange-500 transition-colors">Log In</button>
                  <button className="text-gray-700 hover:text-orange-500 transition-colors">Sign Up</button>
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div id="home" className="relative hero-background overflow-hidden">
          {/* Background shapes */}
          <img
            className="absolute top-10 left-10 w-16 h-16 opacity-20 floating-shape"
            src="/assets/images/shape-1.svg"
            alt="shape"
          />
          <img
            className="absolute top-20 right-20 w-20 h-20 opacity-20 floating-shape"
            src="/assets/images/shape-2.svg"
            alt="shape"
            style={{ animationDelay: "2s" }}
          />
          <img
            className="absolute bottom-20 left-20 w-12 h-12 opacity-50 floating-shape"
            src="/assets/images/shape-3.svg"
            alt="shape"
            style={{ animationDelay: "4s" }}
          />

          <div className="container mx-auto px-6 py-20">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="lg:w-1/2 mb-10 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                  Discover Meals with <span className="gradient-text">MealLensAI</span>
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  MealLensAI is your smart kitchen assistant. Snap a picture of your ingredients or a meal, and let AI
                  guide you with recipes, cooking tips, and personalized suggestions. You can also take a picture of a
                  prepared meal, and let AI guide you with detailed cooking instructions, provide a list of ingredients
                  used, a step-by-step guide to recreate the dish, and online resources for preparing the meal. Simplify
                  meal prep like never before!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="#features" className="btn-primary text-white px-8 py-3 rounded-lg text-center inline-block">
                    Explore Features
                  </a>
                  <button onClick={handleTryMealLensAI} className="btn-secondary text-white px-8 py-3 rounded-lg">
                    Try <strong>MealLensAI</strong> Now For Free !!
                  </button>
                </div>
              </div>

              <div className="lg:w-1/2 flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="video-container">
                    <video autoPlay loop muted playsInline controls onContextMenu={(e) => e.preventDefault()}>
                      <source src="/assets/okay.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <img
                    src="/assets/images/dots.svg"
                    alt="decorative dots"
                    className="absolute -bottom-4 -right-4 w-16 h-16 opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Our Features</h2>
            <p className="text-lg text-gray-600">Discover why MealLensAI is the ultimate kitchen companion.</p>
          </div>

          {/* Features Carousel */}
          <div className="relative">
            <div className="overflow-hidden">
              <div className="flex carousel-slide" style={{ transform: `translateX(-${currentFeatureSlide * 100}%)` }}>
                {/* First slide */}
                <div className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-gray-50 rounded-xl feature-card">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="lni lni-camera text-2xl text-orange-500"></i>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Smart Ingredient Recognition</h3>
                      <p className="text-gray-600">
                        Snap a picture or upload an image of your ingredients, and let MealLensAI identify them
                        instantly using cutting-edge AI technology.
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gray-50 rounded-xl feature-card">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="lni lni-restaurant text-2xl text-orange-500"></i>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Recipe Suggestions and AI Review</h3>
                      <p className="text-gray-600">
                        Discover recipes based on your ingredients, get quick meal ideas, and missing ingredients. Also
                        snap your finished dish, and let AI score how well you made it.
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gray-50 rounded-xl feature-card">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-orange-500"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M11.25 7.53169V6L10 6C9.58579 6 9.25 5.66421 9.25 5.25C9.25 4.83579 9.58579 4.5 10 4.5H14C14.4142 4.5 14.75 4.83579 14.75 5.25C14.75 5.66421 14.4142 6 14 6L12.75 6V7.53169C17.2314 7.91212 20.75 11.6702 20.75 16.25V18H21.25C21.6642 18 22 18.3358 22 18.75C22 19.1642 21.6642 19.5 21.25 19.5H2.75C2.33579 19.5 2 19.1642 2 18.75C2 18.3358 2.33579 18 2.75 18H3.25V16.25C3.25 11.6702 6.7686 7.91212 11.25 7.53169ZM4.75 18H19.25V16.25C19.25 12.2459 16.0041 9 12 9C7.99594 9 4.75 12.2459 4.75 16.25V18Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Smart Food Detection</h3>
                      <p className="text-gray-600">
                        Capture a photo of any prepared meal, and let our AI, driven by cutting-edge technology,
                        identify the dish and provide the full recipe with an ingredient list and step-by-step cooking
                        instructions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Second slide */}
                <div className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-gray-50 rounded-xl feature-card">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="lni lni-heart text-2xl text-orange-500"></i>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Health Insights</h3>
                      <p className="text-red-500 font-semibold mb-2">Upcoming Feature!!!</p>
                      <p className="text-gray-600">
                        Gain valuable health insights from your prepared meals, monitor your health and nutrition over
                        time, and receive personalized tips to improve the nutritional quality of your dishes and
                        overall well-being.
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gray-50 rounded-xl feature-card">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="lni lni-shopping-basket text-2xl text-orange-500"></i>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Shopping Assistant</h3>
                      <p className="text-red-500 font-semibold mb-2">Upcoming Feature!!!</p>
                      <p className="text-gray-600">
                        Automatically generate shopping lists based on your planned meals and missing ingredients and
                        place order for them from your app
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gray-50 rounded-xl feature-card">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="lni lni-laptop-phone text-2xl text-orange-500"></i>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">Meal Planning</h3>
                      <p className="text-red-500 font-semibold mb-2">Upcoming Feature!!!</p>
                      <p className="text-gray-600">
                        Plan your weekly meals with smart suggestions based on your preferences and available
                        ingredients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <div className="relative">
                <img
                  src="/assets/images/pics1.png"
                  alt="about MealLensAI"
                  className="w-full max-w-lg rounded-lg shadow-lg"
                />
                <img
                  src="/assets/images/dots.svg"
                  alt="dots"
                  className="absolute -bottom-4 -right-4 w-16 h-16 opacity-50"
                />
              </div>
            </div>

            <div className="lg:w-1/2 lg:pl-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">Transform Your Culinary Experience!</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                MealLensAI is your ultimate kitchen companion. Whether you're a seasoned chef or a curious beginner,
                MealLensAI empowers you to identify ingredients, explore new recipes, and plan meals effortlessly.
                Simply snap a photo of your ingredients and unlock a world of culinary possibilities tailored to your
                preferences and dietary needs. With MealLensAI, cooking has never been this fun, smart, and
                personalized.
              </p>
              <a href="#features" className="btn-primary text-white px-8 py-3 rounded-lg inline-block">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="blog" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">Join Our Mobile App Waitlist Today!</h2>
            <p className="text-lg text-gray-600">Be among the first to experience our app—join the waitlist today!</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-xl p-8 text-center max-w-md">
              <img
                src="/assets/images/blog-1.jpg"
                alt="AI Meal Planning"
                className="w-full rounded-lg mb-6"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Click the link below to join</h3>
              <a
                href="https://forms.gle/aUnxiV1Rhx8yhjCz7"
                className="btn-primary text-white px-8 py-3 rounded-lg inline-block"
              >
                Join
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Feedback Form */}
      <section id="footer" className="py-20 newsletter-section">
        {/* Feedback Form */}
        <div className="container mx-auto px-6 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Share Your Feedback</h2>
            <p className="text-white/90">Help us improve by sharing your thoughts about MealLensAI</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-xl feedback-form">
              <form onSubmit={handleFeedbackSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <input
                    type="text"
                    name="entry.1638190700"
                    placeholder="Your Name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    name="entry.665398406"
                    placeholder="Your Email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <select
                  name="entry.1853582846"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-6"
                >
                  <option value="">Select Rating</option>
                  <option value="Option 1">5 Stars - Excellent</option>
                  <option value="Option 2">4 Stars - Very Good</option>
                  <option value="Option 3">3 Stars - Good</option>
                  <option value="Option 4">2 Stars - Fair</option>
                  <option value="Option 5">1 Star - Poor</option>
                </select>

                <textarea
                  name="entry.2126368368"
                  rows={4}
                  placeholder="Tell us about your experience with MealLensAI..."
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-6 resize-none"
                />

                <div className="text-center">
                  <button type="submit" className="btn-primary text-white px-8 py-3 rounded-lg">
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-6">Stay Updated with MealLensAI</h3>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Enter Your Email..."
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-orange-500 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Donate to Support MealLensAI</h3>
              <button onClick={() => setShowDonateModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  id="donorName"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  id="donorEmail"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Donation Amount (KES)</label>
                <input
                  type="number"
                  id="donationAmount"
                  min="1000"
                  defaultValue="1000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowDonateModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button onClick={processDonation} className="flex-1 px-6 py-3 btn-primary text-white rounded-lg">
                Donate Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
