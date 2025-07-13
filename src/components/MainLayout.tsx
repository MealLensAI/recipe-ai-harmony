"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Home, Camera, History, CalendarDays, User } from "lucide-react"

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
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

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { icon: Home, label: "AI Kitchen", path: "/" },
    { icon: Camera, label: "Detect Food", path: "/detected" },
    { icon: History, label: "History", path: "/history" },
    { icon: CalendarDays, label: "Meal Planner", path: "/planner" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Name */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md">
                <img
                  src="/MealLeansBeta/landingpage-main/assets/images/logo.png"
                  alt="MealLens"
                  className="h-6 w-6"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  MealLensAI
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Smart Recipe Assistant</p>
              </div>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors ${
                    isActive(item.path) ? "bg-orange-50 text-orange-500" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
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
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="grid grid-cols-4 gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center h-16 text-xs space-y-1 ${
                    isActive(item.path) ? "bg-orange-50 text-orange-500" : "text-gray-700"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default MainLayout
