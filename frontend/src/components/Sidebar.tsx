"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { LogOut, CalendarDays, History, Scan, Menu, X } from "lucide-react"
import Logo from "@/components/Logo"
import { useAuth } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { signOut, isAuthenticated } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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

  if (!isAuthenticated) {
    return null
  }

  const navItems = [
    { 
      icon: CalendarDays, 
      label: "Diet Planner", 
      path: "/planner",
      active: isActive("/planner")
    },
    { 
      icon: Scan, 
      label: "Ingredients Detector", 
      path: "/health-meals",
      active: isActive("/health-meals")
    },
    { 
      icon: History, 
      label: "History", 
      path: "/history",
      active: isActive("/history")
    },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo - with full width border */}
      <div className="h-[76px] flex items-center px-6">
        <Logo size="md" />
      </div>
      {/* Full width border line - Width: 250px, Border: 1px #E7E7E7 */}
      <div className="w-full border-b border-[#E7E7E7]" />

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setIsMobileOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border
                ${item.active 
                  ? 'bg-blue-50 text-blue-600 border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                }
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${item.active ? 'text-blue-600' : ''}`} />
              <span className="font-medium text-[15px]">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Log Out */}
      <div className="px-4 py-6 border-t border-gray-100 mt-auto">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-[15px]">Log Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop - Width: 250px, Border: 1px #E7E7E7 on right */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[250px] bg-white flex-col z-40 border-r border-[#E7E7E7]">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`
        md:hidden fixed left-0 top-0 h-full w-[250px] bg-white flex flex-col z-50 shadow-xl border-r border-[#E7E7E7]
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>
    </>
  )
}

export default Sidebar
