import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MealPlanSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-8 sm:p-12 shadow-sm border border-[#e2e8f0]">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Week navigation skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Meal type filter skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Recipe cards skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <Skeleton className="h-40 w-full mb-3 rounded-lg" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanSkeleton;

