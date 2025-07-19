"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Home, Camera, History, CalendarDays, User } from "lucide-react"
import { useAuth } from "@/lib/utils"
import Navbar from "./Navbar"

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user, signOut, isAuthenticated } = useAuth()

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

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { icon: Home, label: "AI Kitchen", path: "/" },
    { icon: Camera, label: "Detect Food", path: "/detected" },
    { icon: History, label: "History", path: "/history" },
    { icon: CalendarDays, label: "Meal Planner", path: "/planner" },
  ]

  if (!isAuthenticated) {
    return null // Don't render layout if not authenticated
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Use the proper Navbar component with avatar dropdown */}
      <Navbar />

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default MainLayout
