import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrial } from '@/hooks/useTrial';
import { Clock, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSicknessSettings } from '@/hooks/useSicknessSettings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Swal from 'sweetalert2';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    settings,
    loading,
    updateSettings,
    saveSettings,
    error,
    reloadSettings
  } = useSicknessSettings();

  const { formattedRemainingTime, isTrialExpired, hasActiveSubscription } = useTrial();

  const [localLoading, setLocalLoading] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [showSavedData, setShowSavedData] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check if user has saved data on initial load only - if yes, collapse form and show table
  useEffect(() => {
    // Only run this check once when settings are first loaded
    if (!hasInitialized && !loading) {
      setHasInitialized(true);
      if (settings.hasSickness && settings.age && settings.gender && settings.sicknessType) {
        // User has complete health information, show table view
        setIsFormExpanded(false);
        setShowSavedData(true);
      }
    }
  }, [loading, hasInitialized, settings.hasSickness, settings.age, settings.gender, settings.sicknessType]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Unable to load health settings',
        description: error,
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  // Only disable button when an explicit save is in-flight
  const isActuallyLoading = localLoading;

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
    setLocalLoading(true);

    // Validate if user chooses "yes"
    if (settings.hasSickness) {
      if (!settings.sicknessType?.trim()) {
        setLocalLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Please specify the type of health condition.',
          confirmButtonColor: '#f97316'
        });
        return;
      }

      // Required fields
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
        setLocalLoading(false);
        Swal.fire({
          icon: 'warning',
          title: 'Incomplete Profile',
          text: `Please provide: ${missingFields.join(', ')}`,
          confirmButtonColor: '#f97316'
        });
        return;
      }

      // Range validations
      if (settings.age && (settings.age < 10 || settings.age > 120)) {
        setLocalLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Age',
          text: 'Enter a valid age between 10 and 120.',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      if (settings.height && (settings.height < 50 || settings.height > 250)) {
        setLocalLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Height',
          text: 'Height must be between 50 and 250 cm.',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      if (settings.weight && (settings.weight < 20 || settings.weight > 300)) {
        setLocalLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Weight',
          text: 'Weight must be between 20 and 300 kg.',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      if (settings.waist && (settings.waist < 60 || settings.waist > 150)) {
        setLocalLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Waist',
          text: 'Waist circumference must be 60–150 cm.',
          confirmButtonColor: '#f97316'
        });
        return;
      }
    }

    try {
      const result = await saveSettings(settings);

      if (result.success) {
        // Collapse form and show saved data
        setIsFormExpanded(false);
        setShowSavedData(true);
        
        Swal.fire({
          icon: 'success',
          title: 'Health Information Saved!',
          html: settings.hasSickness
            ? 'Your health information was saved successfully and has been added to your history.<br><br><small>You can view your history by clicking the "View History" button below or going to the History page.</small>'
            : 'Your preference has been saved successfully.',
          confirmButtonColor: '#f97316',
          timer: 3500,
          showConfirmButton: true
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save health information. Try again.',
          confirmButtonColor: '#f97316'
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save health information. Try again.',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setLocalLoading(false);
    }
  }; // ✅ FIXED — handleSave is now properly closed

  // ---------------------------------------------
  // RETURN SECTION (WAS BROKEN BEFORE — NOW FIXED)
  // ---------------------------------------------

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Health Information</h1>
          <p className="text-muted-foreground mt-2">
            Manage your health information and preferences
          </p>

          {error && (
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reloadSettings}
                disabled={loading}
              >
                Retry
              </Button>
            </div>
          )}

          {!hasActiveSubscription && (
            <div
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                isTrialExpired
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-orange-50 border-orange-200 text-orange-700'
              }`}
            >
              <Clock className="h-3 w-3" />
              {isTrialExpired ? 'Trial expired' : `Trial: ${formattedRemainingTime}`}
            </div>
          )}
        </div>

        <Card>
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
              <CardDescription>
                This information helps us provide personalized medical meal recommendations
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* YES / NO QUESTION */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Do you have any health conditions or sickness?
                </Label>

                {/* FIXED — removed global disabled */}
                <RadioGroup
                  value={settings.hasSickness ? 'yes' : 'no'}
                  onValueChange={handleSicknessChange}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="yes" id="sickness-yes" />
                    <Label htmlFor="sickness-yes" className="cursor-pointer">
                      Yes, I have a health condition
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="no" id="sickness-no" />
                    <Label htmlFor="sickness-no" className="cursor-pointer">
                      No, I don't have any health condition
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* SAVED DATA TABLE - Show when form is collapsed */}
              {settings.hasSickness && !isFormExpanded && showSavedData && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Saved Health Information</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/history')}
                        className="flex items-center gap-2"
                      >
                        <History className="h-4 w-4" />
                        View History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFormExpanded(true)}
                        className="flex items-center gap-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Edit Information
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Field</TableHead>
                          <TableHead className="font-semibold">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Age</TableCell>
                          <TableCell>{settings.age || 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Gender</TableCell>
                          <TableCell className="capitalize">{settings.gender || 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Height</TableCell>
                          <TableCell>{settings.height ? `${settings.height} cm` : 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Weight</TableCell>
                          <TableCell>{settings.weight ? `${settings.weight} kg` : 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Waist Circumference</TableCell>
                          <TableCell>{settings.waist ? `${settings.waist} cm` : 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Activity Level</TableCell>
                          <TableCell className="capitalize">{settings.activityLevel?.replace('_', ' ') || 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Health Condition</TableCell>
                          <TableCell className="font-semibold text-blue-600">{settings.sicknessType || 'Not specified'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Health Goal</TableCell>
                          <TableCell className="capitalize">{settings.goal?.replace('_', ' ') || 'Not set'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Location</TableCell>
                          <TableCell>{settings.location || 'Not set'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* CONDITIONAL FORM - Show when expanded */}
              {settings.hasSickness && isFormExpanded && (
                <div className="space-y-6 border-t pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Health Information Details</h3>
                    {showSavedData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFormExpanded(false)}
                        className="flex items-center gap-2"
                      >
                        <ChevronUp className="h-4 w-4" />
                        Collapse
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Age */}
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={settings.age || ''}
                        onChange={(e) =>
                          updateSettings({ age: parseInt(e.target.value) || undefined })
                        }
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select
                        value={settings.gender || ''}
                        onValueChange={(value) => updateSettings({ gender: value })}
                      >
                        <SelectTrigger>
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
                      <Label>Height (cm) *</Label>
                      <Input
                        type="number"
                        value={settings.height || ''}
                        onChange={(e) =>
                          updateSettings({ height: parseFloat(e.target.value) || undefined })
                        }
                      />
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                      <Label>Weight (kg) *</Label>
                      <Input
                        type="number"
                        value={settings.weight || ''}
                        onChange={(e) =>
                          updateSettings({ weight: parseFloat(e.target.value) || undefined })
                        }
                      />
                    </div>

                    {/* Waist */}
                    <div className="space-y-2">
                      <Label>Waist Circumference (cm) *</Label>
                      <Input
                        type="number"
                        value={settings.waist || ''}
                        onChange={(e) =>
                          updateSettings({ waist: parseFloat(e.target.value) || undefined })
                        }
                      />
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-2">
                    <Label>Activity Level *</Label>
                    <Select
                      value={settings.activityLevel || ''}
                      onValueChange={(value) => updateSettings({ activityLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="very_active">Very Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sickness Type */}
                  <div className="space-y-2">
                    <Label>Health Condition *</Label>
                    <Input
                      value={settings.sicknessType}
                      onChange={(e) => handleSicknessTypeChange(e.target.value)}
                    />
                  </div>

                  {/* Goal */}
                  <div className="space-y-2">
                    <Label>Health Goal *</Label>
                    <Select
                      value={settings.goal || ''}
                      onValueChange={(value) => updateSettings({ goal: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heal">Heal & Manage Condition</SelectItem>
                        <SelectItem value="maintain">Maintain Health</SelectItem>
                        <SelectItem value="lose_weight">Lose Weight</SelectItem>
                        <SelectItem value="gain_weight">Gain Weight</SelectItem>
                        <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input
                      value={settings.location || ''}
                      onChange={(e) => updateSettings({ location: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isActuallyLoading}
                  className="w-full"
                >
                  {isActuallyLoading ? 'Saving...' : 'Save Health Information'}
                </Button>
              </div>
            </CardContent>
          </Card>

      </div>
    </div>
  );
};

export default Settings;
