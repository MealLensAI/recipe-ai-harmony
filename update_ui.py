#!/usr/bin/env python3
import re

# Read the current file
with open('frontend/src/pages/Index.tsx', 'r') as f:
    content = f.read()

# Find and replace the header and top section
old_header = '''  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <h1 className="text-2xl font-bold text-gray-900">Diet Planner</h1>
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                {(user?.displayName || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-6">
        {/* Top Bar: Tabs and Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Tabs: Active Plan / Saved Plans */}
          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => {
                setViewMode('active');
                setShowPlanManager(false);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'active'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Active Plan
            </button>
            <button
              onClick={() => {
                setViewMode('saved');
                setShowPlanManager(true);
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'saved'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Saved Plans
            </button>
          </div>

          {/* Create New Plan Button */}
          <button
            onClick={handleNewPlan}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create New Plan
          </button>
        </div>

        {/* Date Range and Day Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          {/* Date Range Display */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevWeek}
              disabled={currentWeekIndex <= 0}
              className={`p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${currentWeekIndex <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-lg font-bold text-gray-900 min-w-[180px] text-center">
              {savedWeeks[currentWeekIndex]?.name || weekDates.name}
            </span>
            <button
              onClick={handleNextWeek}
              disabled={currentWeekIndex === -1 || currentWeekIndex >= savedWeeks.length - 1}
              className={`p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${currentWeekIndex === -1 || currentWeekIndex >= savedWeeks.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day Tabs */}
          <div className="flex-1">
            <div className="flex bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm overflow-x-auto">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 min-w-[80px] px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>'''

new_header = '''  // Format date range for display
  const formatDateRange = () => {
    if (currentPlan) {
      const start = new Date(currentPlan.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      const formatDate = (d: Date) => {
        const day = d.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                      day === 2 || day === 22 ? 'nd' : 
                      day === 3 || day === 23 ? 'rd' : 'th';
        return d.toLocaleDateString('en-US', { month: 'short' }) + ' ' + day + suffix;
      };
      
      return formatDate(start) + ' - ' + formatDate(end);
    }
    return weekDates.name;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Diet Planner</h1>
          
          {/* User Profile */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm border border-gray-200">
                {(user?.displayName || user?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()}
              </div>
              <span className="text-[15px] font-medium text-gray-700 hidden sm:block">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-8 py-6">
        {/* Top Bar: Tabs and Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Tabs: Active Plan / Saved Plans */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('active');
                setShowPlanManager(false);
              }}
              className={`px-6 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 border-2 ${
                viewMode === 'active'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
              }`}
            >
              Active Plan
            </button>
            <button
              onClick={() => {
                setViewMode('saved');
                setShowPlanManager(true);
              }}
              className={`px-6 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 border-2 ${
                viewMode === 'saved'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
              }`}
            >
              Saved Plans
            </button>
          </div>

          {/* Create New Plan Button */}
          <button
            onClick={handleNewPlan}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 shadow-sm"
          >
            Create New Plan
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Date Range and Day Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8">
          {/* Date Range Display */}
          <div className="flex items-center">
            <span className="text-[17px] font-bold text-gray-900">
              {formatDateRange()}
            </span>
          </div>

          {/* Day Tabs */}
          <div className="flex-1">
            <div className="inline-flex bg-gray-100 rounded-full p-1.5 gap-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 ${
                    selectedDay === day
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>'''

if old_header in content:
    content = content.replace(old_header, new_header)
    with open('frontend/src/pages/Index.tsx', 'w') as f:
        f.write(content)
    print("Successfully updated the header section!")
else:
    print("Could not find the old header section")

