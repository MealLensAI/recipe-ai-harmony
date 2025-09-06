"use client"

import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loader2, Utensils } from "lucide-react"
import { useAuth } from "@/lib/utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
            <p className="text-gray-600 text-lg font-medium">Loading MealLensAI...</p>
            <p className="text-gray-500 text-sm">Please wait while we prepare your experience</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // If fallback is provided, show it instead of redirecting
    if (fallback) {
      return <>{fallback}</>
    }
    // Redirect to landing page route explicitly
    return <Navigate to="/landing" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
