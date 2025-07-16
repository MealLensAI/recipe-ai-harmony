"use client"

import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase" // Assuming this path is correct for your Firebase setup
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Utensils, Camera, User, Settings, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
      navigate("/login") // Assuming /login is your login route
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const userEmail = auth.currentUser?.email || "User"
  const userInitials = userEmail ? userEmail.charAt(0).toUpperCase() : "U"

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
            {/* Add other main navigation links here if needed */}
          </div>

          {/* User Actions with Dropdown */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-auto rounded-full flex items-center space-x-2 px-2 hover:bg-gray-100"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback className="bg-red-500 text-white">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{userEmail}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userEmail}</p>
                    <p className="text-xs leading-none text-muted-foreground">{auth.currentUser?.email}</p>
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
                <DropdownMenuSeparator />
                {/* Removed Sign Out button */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-100 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/detected")}
            className="w-full justify-start text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Camera className="h-4 w-4 mr-2" />
            Detect Food
          </Button>
          {/* Add other mobile navigation links here if needed */}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
