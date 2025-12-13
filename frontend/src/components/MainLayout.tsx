"use client"

import { useAuth } from "@/lib/utils"
import Sidebar from "./Sidebar"

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null // Don't render layout if not authenticated
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default MainLayout
