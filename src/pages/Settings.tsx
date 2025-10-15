import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrial } from '@/hooks/useTrial';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSicknessSettings } from '@/hooks/useSicknessSettings';
import { api } from '@/lib/api';

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
        description: "Please specify the type of health condition.",
        variant: "destructive"
      });
      return;
    }

    // Validate comprehensive health profile if user has sickness
    if (settings.hasSickness) {
      const missingFields = [];
      if (!settings.age) missingFields.push('Age');
      if (!settings.gender) missingFields.push('Gender');
      if (!settings.height) missingFields.push('Height');
      if (!settings.weight) missingFields.push('Weight');
      if (!settings.activityLevel) missingFields.push('Activity Level');
      if (!settings.goal) missingFields.push('Health Goal');

      if (missingFields.length > 0) {
        toast({
          title: "Incomplete Profile",
          description: `Please provide: ${missingFields.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // Validate ranges
      if (settings.age && (settings.age < 10 || settings.age > 120)) {
        toast({
          title: "Invalid Age",
          description: "Please enter a valid age between 10 and 120.",
          variant: "destructive"
        });
        return;
      }

      if (settings.height && (settings.height < 50 || settings.height > 250)) {
        toast({
          title: "Invalid Height",
          description: "Please enter a valid height between 50 and 250 cm.",
          variant: "destructive"
        });
        return;
      }

      if (settings.weight && (settings.weight < 20 || settings.weight > 300)) {
        toast({
          title: "Invalid Weight",
          description: "Please enter a valid weight between 20 and 300 kg.",
          variant: "destructive"
        });
        return;
      }
    }

    const result = await saveSettings(settings);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: "Your health profile has been saved successfully.",
      });
      // After saving, take user back to the Meal Planner where these settings apply
      try { navigate('/planner'); } catch { }
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
            <p className="mt-2 text-sm text-gray-600">
              Heads up: The health preferences you set here are used only to customize your <span className="font-medium"> AI Meal Plan</span> for chronic disease conditions. They won’t impact other features like ingredeint detection or food detection.
            </p>
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
                      <Label htmlFor="sickness-yes">Yes, I have a health condition</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="sickness-no" />
                      <Label htmlFor="sickness-no">No, I don't have any health condition</Label>
                    </div>
                  </RadioGroup>
                </div>

                {settings.hasSickness && (
                  <div className="space-y-6 border-t pt-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Complete Your Health Profile</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This information will be used by our medical AI to create personalized, doctor-approved meal plans for your condition.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Age */}
                      <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="e.g., 35"
                          value={settings.age || ''}
                          onChange={(e) => updateSettings({ age: parseInt(e.target.value) || undefined })}
                          min="10"
                          max="120"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                          value={settings.gender || ''}
                          onValueChange={(value: 'male' | 'female' | 'other') => updateSettings({ gender: value })}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Height */}
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm) *</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="e.g., 175"
                          value={settings.height || ''}
                          onChange={(e) => updateSettings({ height: parseFloat(e.target.value) || undefined })}
                          min="50"
                          max="250"
                        />
                      </div>

                      {/* Weight */}
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="e.g., 70"
                          value={settings.weight || ''}
                          onChange={(e) => updateSettings({ weight: parseFloat(e.target.value) || undefined })}
                          min="20"
                          max="300"
                        />
                      </div>
                    </div>

                    {/* Activity Level */}
                    <div className="space-y-2">
                      <Label htmlFor="activity-level">Activity Level *</Label>
                      <Select
                        value={settings.activityLevel || ''}
                        onValueChange={(value: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') => updateSettings({ activityLevel: value })}
                      >
                        <SelectTrigger id="activity-level">
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                          <SelectItem value="light">Light (exercise 1-3 times/week)</SelectItem>
                          <SelectItem value="moderate">Moderate (exercise 3-5 times/week)</SelectItem>
                          <SelectItem value="active">Active (exercise 6-7 times/week)</SelectItem>
                          <SelectItem value="very_active">Very Active (intense exercise daily)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Health Condition */}
                    <div className="space-y-2">
                      <Label htmlFor="sickness-type">Health Condition *</Label>
                      <Input
                        id="sickness-type"
                        placeholder="e.g., diabetes, hypertension, celiac disease"
                        value={settings.sicknessType}
                        onChange={(e) => handleSicknessTypeChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Common conditions: diabetes, hypertension, heart disease, celiac disease, IBS, PCOS, etc.
                      </p>
                    </div>

                    {/* Goal */}
                    <div className="space-y-2">
                      <Label htmlFor="goal">Health Goal *</Label>
                      <Select
                        value={settings.goal || ''}
                        onValueChange={(value: 'heal' | 'maintain' | 'lose_weight' | 'gain_weight' | 'improve_fitness') => updateSettings({ goal: value })}
                      >
                        <SelectTrigger id="goal">
                          <SelectValue placeholder="Select your health goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heal">Heal & Manage Condition</SelectItem>
                          <SelectItem value="maintain">Maintain Current Health</SelectItem>
                          <SelectItem value="lose_weight">Lose Weight</SelectItem>
                          <SelectItem value="gain_weight">Gain Weight</SelectItem>
                          <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save Health Profile'}
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