"use client"

import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

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
