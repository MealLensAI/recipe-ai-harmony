import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Switch component (create if not exists)
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
      checked ? 'bg-orange-500' : 'bg-slate-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { Clock, Plus, Trash2, Save } from 'lucide-react'

interface TimeWindow {
  days: number[]
  start_time: string
  end_time: string
}

interface TimeRestrictionsData {
  enabled: boolean
  timezone: string
  windows: TimeWindow[]
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

interface TimeRestrictionsSettingsProps {
  enterpriseId: string
}

export function TimeRestrictionsSettings({ enterpriseId }: TimeRestrictionsSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<TimeRestrictionsData>({
    enabled: false,
    timezone: 'UTC',
    windows: []
  })

  useEffect(() => {
    loadTimeRestrictions()
  }, [enterpriseId])

  async function loadTimeRestrictions() {
    if (!enterpriseId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res: any = await api.getEnterpriseTimeRestrictions(enterpriseId)
      if (res.success && res.time_restrictions) {
        setData({
          enabled: res.time_restrictions.enabled || false,
          timezone: res.time_restrictions.timezone || 'UTC',
          windows: res.time_restrictions.windows || []
        })
      }
    } catch (error: any) {
      // Only show error for actual errors, not 404s (which just mean no settings yet)
      if (error?.status !== 404) {
        toast({
          title: 'Unable to load settings',
          description: 'Please try again later or contact support if the issue persists.',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveTimeRestrictions() {
    if (!enterpriseId) {
      toast({
        title: 'No organization selected',
        description: 'Please select an organization first.',
        variant: 'destructive'
      })
      return
    }
    setSaving(true)
    try {
      const res: any = await api.updateEnterpriseTimeRestrictions(enterpriseId, data)
      if (res.success) {
        toast({
          title: 'Success',
          description: 'Time restrictions updated successfully'
        })
      } else {
        throw new Error(res.message || 'Failed to update time restrictions')
      }
    } catch (error: any) {
      toast({
        title: 'Unable to save settings',
        description: 'Please try again later or contact support if the issue persists.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  function addTimeWindow() {
    setData(prev => ({
      ...prev,
      windows: [...prev.windows, { days: [], start_time: '09:00', end_time: '17:00' }]
    }))
  }

  function removeTimeWindow(index: number) {
    setData(prev => ({
      ...prev,
      windows: prev.windows.filter((_, i) => i !== index)
    }))
  }

  function updateTimeWindow(index: number, field: keyof TimeWindow, value: any) {
    setData(prev => ({
      ...prev,
      windows: prev.windows.map((window, i) => 
        i === index ? { ...window, [field]: value } : window
      )
    }))
  }

  function toggleDay(windowIndex: number, day: number) {
    setData(prev => ({
      ...prev,
      windows: prev.windows.map((window, i) => {
        if (i === windowIndex) {
          const days = window.days.includes(day)
            ? window.days.filter(d => d !== day)
            : [...window.days, day].sort()
          return { ...window, days }
        }
        return window
      })
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Restrictions</CardTitle>
          <CardDescription>Configure allowed usage hours for your organization</CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Restrictions
        </CardTitle>
        <CardDescription>
          Set allowed usage hours for your organization members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
          <div>
            <Label className="text-base font-semibold">Enable Time Restrictions</Label>
            <p className="text-sm text-slate-500 mt-1">
              Restrict when users can access the app
            </p>
          </div>
          <Switch
            checked={data.enabled}
            onCheckedChange={(checked) => setData(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        {data.enabled && (
          <>
            {/* Timezone Selection */}
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={data.timezone}
                onValueChange={(value) => setData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                All time windows will be evaluated in this timezone
              </p>
            </div>

            {/* Time Windows */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Allowed Time Windows</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeWindow}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Window
                </Button>
              </div>

              {data.windows.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">No time windows configured</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Add a time window to restrict access
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.windows.map((window, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Time Window {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeWindow(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Days Selection */}
                      <div className="space-y-2">
                        <Label>Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(index, day.value)}
                              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                window.days.includes(day.value)
                                  ? 'bg-orange-500 text-white border-orange-500'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {day.label.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                        {window.days.length === 0 && (
                          <p className="text-xs text-red-600">Please select at least one day</p>
                        )}
                      </div>

                      {/* Time Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={window.start_time}
                            onChange={(e) => updateTimeWindow(index, 'start_time', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={window.end_time}
                            onChange={(e) => updateTimeWindow(index, 'end_time', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={saveTimeRestrictions}
            disabled={saving || (data.enabled && data.windows.some(w => w.days.length === 0))}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Time Restrictions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

