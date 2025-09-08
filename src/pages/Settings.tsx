import React, { useState } from 'react';
import { useTrial } from '@/hooks/useTrial';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useSicknessSettings } from '@/hooks/useSicknessSettings';
import { api } from '@/lib/api';

const Settings = () => {
  const { toast } = useToast();
  const { settings, loading, updateSettings, saveSettings } = useSicknessSettings();
  const { formattedRemainingTime, isTrialExpired, hasActiveSubscription, isLoading } = useTrial();

  // Profile info & password change state
  const [email, setEmail] = useState<string>(() => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const u = JSON.parse(userData);
        return u?.email || '';
      }
    } catch { }
    return '';
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const handleSicknessChange = (value: string) => {
    const hasSickness = value === 'yes';
    updateSettings({
      hasSickness,
      sicknessType: hasSickness ? settings.sicknessType : ''
    });
  };

  const handleSicknessTypeChange = (value: string) => {
    updateSettings({ sicknessType: value });
  };

  const handleSave = async () => {
    // Validate if sickness type is provided when user has sickness
    if (settings.hasSickness && !settings.sicknessType.trim()) {
      toast({
        title: "Error",
        description: "Please specify the type of sickness when you have a sickness.",
        variant: "destructive"
      });
      return;
    }

    const result = await saveSettings(settings);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: "Your sickness settings have been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Fill all password fields.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    try {
      setChanging(true);
      const res: any = await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.status === 'success') {
        toast({ title: 'Password Updated', description: 'Please sign in again.' });
        // Proactively clear session to avoid stale gating
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('supabase_session_id');
        localStorage.removeItem('supabase_user_id');
        localStorage.removeItem('meallensai_user_access_status');
        localStorage.removeItem('meallensai_trial_start');
        localStorage.removeItem('meallensai_subscription_status');
        localStorage.removeItem('meallensai_subscription_expires_at');
        window.location.href = '/login';
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to update password.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to update password.', variant: 'destructive' });
    } finally {
      setChanging(false);
    }
  };

  // Full-page skeleton while either trial/subscription or sickness settings are loading
  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-gray-100 border-gray-200 animate-pulse w-40"></div>
          </div>

          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-72 bg-gray-200 rounded mt-2 animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-gray-300" />
                  <div className="h-4 w-56 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
              <div className="h-10 w-full bg-gray-300 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
          {!hasActiveSubscription && (
            isLoading ? (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full border bg-gray-100 border-gray-200 animate-pulse">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                <div className="h-3 w-28 rounded bg-gray-300" />
              </div>
            ) : (
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isTrialExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                <Clock className="h-3 w-3" />
                {isTrialExpired ? 'Trial expired' : `Trial: ${formattedRemainingTime}`}
              </div>
            )
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Health Information</CardTitle>
            <CardDescription>
              This information helps us provide personalized meal recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-gray-300" />
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-gray-300" />
                    <div className="h-4 w-56 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-10 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-full bg-gray-300 rounded" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Do you have any health conditions or sickness?
                  </Label>
                  <RadioGroup
                    value={settings.hasSickness ? 'yes' : 'no'}
                    onValueChange={handleSicknessChange}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="sickness-yes" />
                      <Label htmlFor="sickness-yes">Yes, I have a sickness</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="sickness-no" />
                      <Label htmlFor="sickness-no">No, I don't have any sickness</Label>
                    </div>
                  </RadioGroup>
                </div>

                {settings.hasSickness && (
                  <div className="space-y-4">
                    <Label htmlFor="sickness-type" className="text-base font-medium">
                      What type of sickness do you have?
                    </Label>
                    <Input
                      id="sickness-type"
                      placeholder="e.g., diabetes, hypertension, celiac disease, etc."
                      value={settings.sicknessType}
                      onChange={(e) => handleSicknessTypeChange(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      This information will be used to provide you with appropriate meal recommendations.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full"
                >
                  Save Settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 