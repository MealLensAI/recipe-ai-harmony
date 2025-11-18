import { useEffect, useMemo, useState } from 'react';
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

const Settings = () => {
  const { toast } = useToast();
  const {
    settings,
    saving,
    updateSettings,
    saveSettings,
    resetToLastSaved,
    hasExistingData
  } = useSicknessSettings();
  const actionsDisabled = saving;
  const { formattedRemainingTime, isTrialExpired, hasActiveSubscription } = useTrial();
  const [isEditing, setIsEditing] = useState(false);

  const displayValue = (value?: string | number, suffix: string = '') => {
    if (value === undefined || value === null || value === '') {
      return 'Not set';
    }
    return `${value}${suffix}`;
  };

  useEffect(() => {
    if (!hasExistingData) {
      setIsEditing(true);
    }
  }, [hasExistingData]);

  const summaryEntries = useMemo(
    () => [
      {
        label: 'Health status',
        value: settings.hasSickness ? 'Has a health condition' : 'No health condition recorded'
      },
      {
        label: 'Condition',
        value: settings.hasSickness ? displayValue(settings.sicknessType) : '—'
      },
      { label: 'Goal', value: displayValue(settings.goal) },
      { label: 'Age', value: displayValue(settings.age) },
      { label: 'Gender', value: displayValue(settings.gender, '') },
      { label: 'Height', value: displayValue(settings.height, ' cm') },
      { label: 'Weight', value: displayValue(settings.weight, ' kg') },
      { label: 'Waist', value: displayValue(settings.waist, ' cm') },
      {
        label: 'Activity level',
        value: displayValue(settings.activityLevel ? settings.activityLevel.replace('_', ' ') : '')
      },
      { label: 'Location', value: displayValue(settings.location) }
    ],
    [settings]
  );

  const startEditing = () => {
    resetToLastSaved();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetToLastSaved();
    setIsEditing(false);
  };

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
      if (!settings.waist) missingFields.push('Waist Circumference');
      if (!settings.activityLevel) missingFields.push('Activity Level');
      if (!settings.goal) missingFields.push('Health Goal');
      if (!settings.location) missingFields.push('Location');

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

      if (settings.waist && (settings.waist < 60 || settings.waist > 150)) {
        toast({
          title: "Invalid Waist Circumference",
          description: "Please enter a valid waist circumference between 60 and 150 cm.",
          variant: "destructive"
        });
        return;
      }
    }

    const result = await saveSettings(settings);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: "Your health profile has been saved successfully. Review below or keep editing.",
      });
      setIsEditing(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Removed loading screen - show content immediately

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

        {hasExistingData && !isEditing && (
          <Card className="bg-white/80 border border-orange-100 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Current Health Profile</CardTitle>
                <CardDescription>Information used for medical meal plans</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={startEditing}>
                Edit health profile
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {summaryEntries.map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(isEditing || !hasExistingData) && (
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

                      {/* Waist Circumference */}
                      <div className="space-y-2">
                        <Label htmlFor="waist">Waist Circumference (cm) *</Label>
                        <Input
                          id="waist"
                          type="number"
                          placeholder="e.g., 85"
                          value={settings.waist || ''}
                          onChange={(e) => updateSettings({ waist: parseFloat(e.target.value) || undefined })}
                          min="60"
                          max="150"
                        />
                        <p className="text-xs text-muted-foreground">
                          Measure at navel (belly button) level. Used for WHtR (Waist-to-Height Ratio) calculation.
                        </p>
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

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Nigeria, United States, Canada"
                        value={settings.location || ''}
                        onChange={(e) => updateSettings({ location: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your location helps us provide region-specific food recommendations and nutritional guidelines.
                      </p>
                    </div>
                  </div>
                )}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button
                onClick={handleSave}
                disabled={actionsDisabled}
                className="w-full sm:flex-1"
              >
                {saving ? 'Saving...' : 'Save Health Profile'}
              </Button>
              {hasExistingData && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionsDisabled}
                  className="w-full sm:flex-1"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default Settings; 