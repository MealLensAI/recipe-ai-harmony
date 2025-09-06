import React, { useEffect, useState } from 'react';
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
  const { formattedRemainingTime, isTrialExpired, hasActiveSubscription } = useTrial();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [changing, setChanging] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getUserProfile();
        const p: any = (res as any).profile || (res as any).data || (res as any).profile_data;
        if (res.status === 'success' && p) {
          setEmail(p.email || '');
        }
      } catch { }
    })();
  }, []);

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

  const handlePasswordChange = async () => {
    if (!password || password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setChanging(true);
    try {
      const res = await api.updatePassword(password);
      if (res.status === 'success') {
        toast({ title: 'Password Updated', description: 'Your password has been updated successfully.' });
        setPassword('');
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to update password.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update password.', variant: 'destructive' });
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
          {!hasActiveSubscription && (
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isTrialExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
              <Clock className="h-3 w-3" />
              {isTrialExpired ? 'Trial expired' : `Trial: ${formattedRemainingTime}`}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>View your email and update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium">Email</Label>
              <Input value={email} disabled className="mt-2" />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-base font-medium">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
              />
              <Button onClick={handlePasswordChange} disabled={changing || password.length < 6} className="mt-3 w-full">
                {changing ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Information</CardTitle>
            <CardDescription>
              This information helps us provide personalized meal recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 