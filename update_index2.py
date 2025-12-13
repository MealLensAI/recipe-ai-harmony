#!/usr/bin/env python3
import re

# Read the current file
with open('frontend/src/pages/Index.tsx', 'r') as f:
    content = f.read()

# The old header section (lines 869-1089 in original)
old_section = '''  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0] px-4 sm:px-6 py-3 sm:py-4">
        <div className="w-full flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🍓</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2D3436]">MealLensAI Meal Planner</h1>
              <p className="text-xs sm:text-sm text-[#1e293b] flex items-center gap-1">
                <span>🥑</span>
                a healthy outside starts from the inside
              </p>
            </div>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowPlanManager(!showPlanManager)}
              className="flex items-center justify-center gap-2 bg-gray-100 text-[#2D3436] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              <Calendar className="w-4 h-4" />
              Manage Plans
            </button>
            <button
              onClick={handleNewPlan}
              className="flex items-center justify-center gap-2 bg-[#FF6B6B] text-white px-4 py-2 rounded-lg hover:bg-[#FF8E53] transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>
        </div>
        {/* Mobile actions stacked under title */}
        <div className="mt-2 md:hidden space-y-2">
          <button
            onClick={() => setShowPlanManager(!showPlanManager)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-[#2D3436] px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Manage Plans
          </button>
          <button
            onClick={handleNewPlan}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B6B] text-white px-4 py-3 rounded-lg hover:bg-[#FF8E53] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </header>

      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 sm:p-6">
        {/* Mobile top day-chip selector */}
        <div className="md:hidden">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e2e8f0]">
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-2 whitespace-nowrap">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-full border transition-colors text-sm ${selectedDay === day ? 'bg-[#FF6B6B] text-white border-[#FF6B6B]' : 'bg-gray-100 text-[#2D3436] border-gray-200'}`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Sidebar: visible only on desktop (lg+) */}
        <div className="hidden lg:block lg:w-64 space-y-4 order-1 lg:order-none">
          {/* Weekly Planner */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
            <WeeklyPlanner
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              mealPlan={currentPlan?.mealPlan || []}
              startDay={currentPlan ? getDayName(new Date(currentPlan.startDate)) : undefined}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 order-0 lg:order-none">
          {/* Show loading skeleton while fetching data (only if not initialized and loading) */}
          {!mealPlansInitialized && mealPlansLoading && !currentPlan ? (
            <MealPlanSkeleton />
          ) : currentPlan ? (
            <React.Fragment>
              <div className="mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#2D3436]">Recipes for {savedWeeks[currentWeekIndex]?.name || weekDates.name}</h2>
                    {currentPlan?.healthAssessment ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-green-100 text-green-900 border-2 border-green-300 rounded-full text-xs sm:text-sm font-bold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        🏥 Medical-Grade Plan
                      </div>
                    ) : getSicknessInfo() && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm font-medium">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Health-aware meal plan
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[#2D3436]">
                    <button
                      onClick={handlePrevWeek}
                      disabled={currentWeekIndex <= 0}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${currentWeekIndex <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Previous Saved Week"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#2D3436]" />
                    </button>
                    <span className="flex items-center gap-1 text-[#2D3436]">
                      <Calendar className="w-5 h-5 text-[#2D3436]" />
                      {savedWeeks[currentWeekIndex]?.name || weekDates.name}
                    </span>
                    <button
                      onClick={handleNextWeek}
                      disabled={currentWeekIndex === -1 || currentWeekIndex >= savedWeeks.length - 1}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${currentWeekIndex === -1 || currentWeekIndex >= savedWeeks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Next Saved Week"
                    >
                      <ChevronRight className="w-5 h-5 text-[#2D3436]" />
                    </button>
                  </div>
                </div>
                <MealTypeFilter
                  selectedType={selectedMealType}
                  onTypeSelect={setSelectedMealType}
                />
              </div>

              {/* Health Assessment Card - Show if available */}
              {currentPlan?.healthAssessment && (
                <div className="mb-6">
                  <HealthAssessmentCard
                    healthAssessment={currentPlan.healthAssessment}
                    userInfo={currentPlan.userInfo}
                  />
                </div>
              )}

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {getRecipesForSelectedDay().map((recipe, index) => {
                    // Use EnhancedRecipeCard if current health settings indicate sickness, otherwise use basic RecipeCard
                    const shouldShowEnhancedUI = sicknessSettings.hasSickness;

                    console.log('[DEBUG] Index page - Health settings:', {
                      hasSickness: sicknessSettings.hasSickness,
                      shouldShowEnhancedUI,
                      recipeTitle: recipe.title
                    });

                    if (shouldShowEnhancedUI) {
                      return (
                        <EnhancedRecipeCard
                          key={`${selectedDay}-${recipe.type}-${index}`}
                          mealType={recipe.type as 'breakfast' | 'lunch' | 'dinner' | 'snack'}
                          name={recipe.name || recipe.title}
                          ingredients={recipe.ingredients || []}
                          calories={recipe.calories}
                          protein={recipe.protein}
                          carbs={recipe.carbs}
                          fat={recipe.fat}
                          benefit={recipe.benefit}
                          onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                        />
                      );
                    }

                    return (
                      <RecipeCard
                        key={`${selectedDay}-${recipe.type}-${index}`}
                        title={recipe.title}
                        originalTitle={recipe.originalTitle}
                        time={recipe.time}
                        rating={recipe.rating}
                        mealType={recipe.type as any}
                        onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                      />
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          ) : (
            // Only show empty state if we've finished loading and there's no plan
            mealPlansInitialized && !mealPlansLoading ? (
              <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm border border-[#e2e8f0]">
                <ChefHat className="w-16 h-16 text-[#e2e8f0] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#2D3436] mb-2">No Meal Plan Selected</h3>
                <p className="text-[#1e293b] mb-6">Create a new meal plan or select an existing one to get started!</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleNewPlan}
                    className="bg-[#FF6B6B] text-white px-6 py-3 rounded-lg hover:bg-[#FF8E53] transition-colors w-full max-w-xs sm:w-auto"
                  >
                    Create New Plan
                  </button>
                  <button
                    onClick={() => setShowPlanManager(true)}
                    className="bg-gray-100 text-[#2D3436] px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors w-full max-w-xs sm:w-auto"
                  >
                    View Saved Plans
                  </button>
                </div>
              </div>
            ) : (
              // Still loading - show skeleton
              <MealPlanSkeleton />
            )
          )}
        </div>
      </div>'''

new_section = '''  return (
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
        </div>

        {/* Health Badge */}
        {currentPlan && (
          <div className="mb-6">
            {currentPlan?.healthAssessment ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                🏥 Medical-Grade Plan
              </div>
            ) : getSicknessInfo() && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Health-aware meal plan
              </div>
            )}
          </div>
        )}

        {/* Health Assessment Card - Show if available */}
        {currentPlan?.healthAssessment && (
          <div className="mb-6">
            <HealthAssessmentCard
              healthAssessment={currentPlan.healthAssessment}
              userInfo={currentPlan.userInfo}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Show loading skeleton while fetching data */}
          {!mealPlansInitialized && mealPlansLoading && !currentPlan ? (
            <MealPlanSkeleton />
          ) : currentPlan ? (
            <React.Fragment>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getRecipesForSelectedDay().map((recipe, index) => {
                    const shouldShowEnhancedUI = sicknessSettings.hasSickness;

                    if (shouldShowEnhancedUI) {
                      return (
                        <EnhancedRecipeCard
                          key={`${selectedDay}-${recipe.type}-${index}`}
                          mealType={recipe.type as 'breakfast' | 'lunch' | 'dinner' | 'snack'}
                          name={recipe.name || recipe.title}
                          ingredients={recipe.ingredients || []}
                          calories={recipe.calories}
                          protein={recipe.protein}
                          carbs={recipe.carbs}
                          fat={recipe.fat}
                          benefit={recipe.benefit}
                          onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                        />
                      );
                    }

                    return (
                      <RecipeCard
                        key={`${selectedDay}-${recipe.type}-${index}`}
                        title={recipe.title}
                        originalTitle={recipe.originalTitle}
                        time={recipe.time}
                        rating={recipe.rating}
                        mealType={recipe.type as any}
                        onClick={() => handleRecipeClick(recipe.originalTitle || recipe.title, recipe.type)}
                      />
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          ) : (
            // Empty state
            mealPlansInitialized && !mealPlansLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ChefHat className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Meal Plan Selected</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Create a new meal plan or select an existing one to get started with your health journey!</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleNewPlan}
                    className="bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Create New Plan
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('saved');
                      setShowPlanManager(true);
                    }}
                    className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    View Saved Plans
                  </button>
                </div>
              </div>
            ) : (
              <MealPlanSkeleton />
            )
          )}
        </div>
      </div>'''

if old_section in content:
    content = content.replace(old_section, new_section)
    with open('frontend/src/pages/Index.tsx', 'w') as f:
        f.write(content)
    print("Successfully updated the return section!")
else:
    print("Could not find the old section - may have already been updated or content differs")

