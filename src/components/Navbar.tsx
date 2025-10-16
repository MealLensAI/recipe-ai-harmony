"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Utensils, Camera, User, Settings, ChevronDown, Heart } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/utils"

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user, signOut, isAuthenticated } = useAuth()

  const isActive = (path: string) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await signOut()
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

  // Get user data for display
  const userEmail = user?.email || "user@example.com"
  const userDisplayName = user?.displayName || userEmail.split('@')[0] || "User"
  const userInitials = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U"

  // Don't render navbar if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
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
              <p className="text-xs text-gray-500 hidden sm:block">Smart Kitchen Assistant</p>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/planner")}
              className={`transition-colors ${isActive("/planner")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              Meal Planner
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/sickness")}
              className={`transition-colors ${isActive("/sickness")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <Heart className="h-4 w-4 mr-2" />
              Sickness
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/ai-kitchen")}
              className={`transition-colors ${isActive("/ai-kitchen")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              Ingredients Detector
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/detected")}
              className={`transition-colors ${isActive("/detected")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <Camera className="h-4 w-4 mr-2" />
              Detect Food
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/history")}
              className={`transition-colors ${isActive("/history")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              History
            </Button>
          </div>

          {/* User Actions with Dropdown */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-12 w-auto rounded-full flex items-center space-x-3 px-3 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-bold text-lg shadow-md">
                    {userInitials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{userDisplayName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/payment")}>
                  <span className="mr-2">💳</span>
                  <span>Payment</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-100 py-3">
          <div className="grid grid-cols-5 gap-1">

            <Button
              variant="ghost"
              onClick={() => navigate("/planner")}
              className={`flex flex-col items-center justify-center h-16 text-xs space-y-1 transition-colors ${isActive("/planner")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <Settings className="h-5 w-5" />
              <span>Meal Planner</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/sickness")}
              className={`flex flex-col items-center justify-center h-16 text-xs space-y-1 transition-colors ${isActive("/sickness")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <Heart className="h-5 w-5" />
              <span>Sickness</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/ai-kitchen")}
              className={`flex flex-col items-center justify-center h-16 text-xs space-y-1 transition-colors ${isActive("/ai-kitchen")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <Utensils className="h-5 w-5" />
              <span>Ingred Detector</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/detected")}
              className={`flex flex-col items-center justify-center h-16 text-xs space-y-1 transition-colors ${isActive("/detected")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <Camera className="h-5 w-5" />
              <span>Detect Food</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/history")}
              className={`flex flex-col items-center justify-center h-16 text-xs space-y-1 transition-colors ${isActive("/history")
                ? "text-orange-500 bg-orange-50 border border-orange-200 font-semibold"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-50"
                }`}
            >
              <User className="h-5 w-5" />
              <span>History</span>
            </Button>

          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
