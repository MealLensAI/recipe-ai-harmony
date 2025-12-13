import React from 'react';
import { ChevronDown, User, Settings, LogOut, Plus } from 'lucide-react';
import Logo from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MealPlannerHeaderProps {
  onNewPlan: () => void;
  activeTab: 'active' | 'saved';
  onTabChange: (tab: 'active' | 'saved') => void;
  onManagePlans: () => void;
}

export const MealPlannerHeader: React.FC<MealPlannerHeaderProps> = ({
  onNewPlan,
  activeTab,
  onTabChange,
  onManagePlans
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const userEmail = user?.email || "user@example.com"
  const userDisplayName = user?.displayName || userEmail.split('@')[0] || "User"
  const userInitials = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U"
  
  const handleLogout = async () => {
    try {
      await signOut()
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
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <h1 className="text-3xl font-bold text-gray-900">Diet Planner</h1>
          </div>

          {/* Right: Create New Plan Button and User Profile */}
          <div className="flex items-center gap-4">
            <button
              onClick={onNewPlan}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
            >
              Create New Plan +
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-all">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userDisplayName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{userDisplayName}</span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Tabs Section */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('active')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-white border-2 border-orange-500 text-orange-600'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Active Plan
          </button>
          <button
            onClick={() => {
              onTabChange('saved')
              onManagePlans()
            }}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-white border-2 border-orange-500 text-orange-600'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Manage Plans Here
          </button>
        </div>
      </div>
    </>
  );
};

