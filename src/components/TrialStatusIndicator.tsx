import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTrial } from '@/hooks/useTrial';

const TrialStatusIndicator: React.FC = () => {
  const {
    trialInfo,
    hasActiveSubscription,
    trialProgress,
    formattedRemainingTime
  } = useTrial();

  // Don't show if user has subscription or no trial info
  if (!trialInfo || hasActiveSubscription) {
    return null;
  }

  const getStatusColor = () => {
    if (trialInfo.isExpired) return 'text-red-600';
    if (trialInfo.remainingHours < 2) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getProgressColor = () => {
    if (trialInfo.isExpired) return 'bg-red-500';
    if (trialInfo.remainingHours < 2) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
      <Clock className={`h-4 w-4 ${getStatusColor()}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-gray-700">Trial</span>
          <span className={`font-semibold ${getStatusColor()}`}>
            {trialInfo.isExpired ? 'Expired' : formattedRemainingTime}
          </span>
        </div>

        {!trialInfo.isExpired && (
          <Progress
            value={trialProgress}
            className="h-1.5"
            style={{
              '--progress-background': getProgressColor()
            } as React.CSSProperties}
          />
        )}
      </div>

      {trialInfo.remainingHours < 2 && !trialInfo.isExpired && (
        <AlertTriangle className="h-4 w-4 text-orange-500" />
      )}
    </div>
  );
};

export default TrialStatusIndicator;
