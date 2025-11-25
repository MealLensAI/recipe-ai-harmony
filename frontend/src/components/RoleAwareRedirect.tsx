"use client"

import { Navigate } from "react-router-dom"
import { Loader2, Utensils } from "lucide-react"
import { useAuth } from "@/lib/utils"
import { useEnterpriseRole } from "@/hooks/useEnterpriseRole"

const RoleAwareRedirect = () => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { role, isLoading: roleLoading } = useEnterpriseRole()

  if (authLoading || roleLoading || !isAuthenticated || role === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
            <p className="text-gray-600 text-lg font-medium">Preparing your dashboard…</p>
            <p className="text-gray-500 text-sm">Please wait while we verify your workspace</p>
          </div>
        </div>
      </div>
    )
  }

  const destination = role === "organization" ? "/enterprise" : "/ai-kitchen"
  return <Navigate to={destination} replace />
}

export default RoleAwareRedirect

