"use client"

import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Utensils, Camera, User } from "lucide-react"

const Navbar = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      })
      navigate("/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                MealLensAI
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Smart Food Detection</p>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/detected")}
              className="text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              <Camera className="h-4 w-4 mr-2" />
              Detect Food
            </Button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{auth.currentUser?.displayName || auth.currentUser?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-500 bg-transparent transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/detected")}
            className="w-full justify-start text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Camera className="h-4 w-4 mr-2" />
            Detect Food
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
