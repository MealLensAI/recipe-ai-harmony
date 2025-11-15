import { Input } from '@/components/ui/input';
import { Activity, Building2, ChevronDown, FileText, LayoutDashboard, Search, Settings, Users } from 'lucide-react';
import React, { useState } from 'react'

const EntrepriseSidebar = () => {
  // Sidebar "page" (Overview / Activity / Members / ...)
  const [sidebarView, setSidebarView] = useState<"overview" | "activity" | "members" | "settings" | "notes">(
    "overview"
  );
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);

   const [searchTerm, setSearchTerm] = useState("");
   const [enterprises, setEnterprises] = useState<any[]>([])
  return (
    <div>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-8 w-8 text-orange-500" />
                  <span className="text-xl font-bold">MealLens</span>
                </div>
              </div>
      
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users or invites"
                    className="pl-10 bg-gray-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
      
              <nav className="flex-1 px-3 py-2 space-y-1">
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "activity", label: "Activity", icon: Activity },
                  { id: "members", label: "Members", icon: Users },
                  { id: "settings", label: "Settings", icon: Settings },
                  { id: "notes", label: "Notes", icon: FileText },
                ].map((n) => {
                  const Icon = n.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSidebarView(n.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                        sidebarView === n.id ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{n.label}</span>
                    </button>
                  );
                })}
              </nav>
      
              {enterprises.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium">{selectedEnterprise?.name || "Select Org"}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              )}
            </aside>
      
    </div>
  )
}

export default EntrepriseSidebar
