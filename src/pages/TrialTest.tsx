import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrial } from '@/hooks/useTrial';
import { TrialService } from '@/lib/trialService';

const TrialTest: React.FC = () => {
  const {
    trialInfo,
    canAccess,
    isLoading,
    isTrialExpired,
    hasActiveSubscription,
    remainingTime,
    remainingHours,
    remainingMinutes,
    formattedRemainingTime,
    trialProgress,
    activateSubscription,
    resetTrial,
    updateTrialInfo
  } = useTrial();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trial information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trial System Test Page</h1>
          <p className="text-gray-600">Test and manage the trial system functionality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trial Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Trial Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={`font-semibold ${
                    hasActiveSubscription ? 'text-green-600' : 
                    isTrialExpired ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {hasActiveSubscription ? 'Active Subscription' : 
                     isTrialExpired ? 'Trial Expired' : 'Trial Active'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Can Access App:</span>
                  <span className={`font-semibold ${canAccess ? 'text-green-600' : 'text-red-600'}`}>
                    {canAccess ? 'Yes' : 'No'}
                  </span>
                </div>

                {trialInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Trial Start:</span>
                      <span className="text-sm text-gray-600">
                        {trialInfo.startDate.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Trial End:</span>
                      <span className="text-sm text-gray-600">
                        {trialInfo.endDate.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!hasActiveSubscription && trialInfo && !isTrialExpired && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>{trialProgress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${trialProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Remaining Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActiveSubscription ? (
                <div className="text-center py-8">
                  <div className="text-4xl text-green-500 mb-2">🎉</div>
                  <p className="text-green-600 font-semibold">Subscription Active!</p>
                  <p className="text-gray-500 text-sm">No time restrictions</p>
                </div>
              ) : isTrialExpired ? (
                <div className="text-center py-8">
                  <div className="text-4xl text-red-500 mb-2">⏰</div>
                  <p className="text-red-600 font-semibold">Trial Expired</p>
                  <p className="text-gray-500 text-sm">Please upgrade to continue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl text-blue-500 mb-2">⏳</div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formattedRemainingTime}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{remainingHours}</div>
                      <div className="text-sm text-blue-500">Hours</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{remainingMinutes}</div>
                      <div className="text-sm text-blue-500">Minutes</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={updateTrialInfo}
                className="w-full"
                variant="outline"
              >
                Refresh Trial Info
              </Button>
              
              <Button 
                onClick={activateSubscription}
                className="w-full"
                disabled={hasActiveSubscription}
                variant="outline"
              >
                Activate Subscription (Test)
              </Button>
              
              <Button 
                onClick={resetTrial}
                className="w-full"
                variant="destructive"
              >
                Reset Trial (Test)
              </Button>
            </CardContent>
          </Card>

          {/* Debug Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🐛</span>
                Debug Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Raw Remaining Time:</span>
                  <span className="font-mono">{remainingTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Progress Raw:</span>
                  <span className="font-mono">{trialProgress.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Local Storage Keys:</span>
                  <span className="font-mono text-xs">
                    {Object.keys(localStorage).filter(key => key.includes('meallensai')).join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="mr-4"
          >
            Go Back
          </Button>
          <Button 
            onClick={() => window.location.href = '/payment'}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Go to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrialTest;
